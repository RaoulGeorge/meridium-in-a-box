define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        RoleEvents = require('./role-events'),
        DialogBox = require('system/ui/dialog-box'),
        DialogViewModel = require('./role-users-dialog-view-model'),
        UserAdapter = require('../../adapters/user-adapter'),
        view = require('text!../views/role-users.html');

    require('ui/elements/list-group/view-model');

    function RoleUsersViewModel(kom, applicationEvents, securityService, roleEvents) {
        base.call(this, view);
        var self = this;
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = roleEvents;
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.selectedRole = this.kom.observable();
        this.users = this.kom.observableArray([]);
        this.listControl = null;
        this.canDelete = null;
    }

    var base = Object.inherit(KnockoutViewModel, RoleUsersViewModel);
    RoleUsersViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, RoleEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    RoleUsersViewModel.prototype.load = function vm_ViewModel_load(routeArgs) {
        var self = this,
            dfd = new $.Deferred();

        clearIsDirty(this);
        this.selectedRole(null);

        return dfd.promise();
    };

    RoleUsersViewModel.prototype.activate = function vm_activate() {
        this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
        this.events.roleSelected.add(this.onRoleSelected, this);
        this.isDirty.subscribe(isDirtyChanged.bind(null, this));
    };

    RoleUsersViewModel.prototype.attach = function vm_attach(region) {
        base.prototype.attach.call(this, region);
        this.region = region;
        this.listControl = this.region.$element.find('mi-list-group')[0];
        Element.upgrade(this.listControl);
        this.listControl.loader = loadUsers.bind(null, this);
    };

    RoleUsersViewModel.prototype.detach = function vm_detach(region) {
        base.prototype.detach.call(this, region);
    };

    RoleUsersViewModel.prototype.deactivate = function vm_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.events.roleSelected.remove(this);
    };

    RoleUsersViewModel.prototype.unload = function vm_unload() {
        this.kom.disposeObservables();
    };


    /////////////////////
    // Behavior
    /////////////////////

    RoleUsersViewModel.prototype.translate = function vm_translate(key) {
        return this.translator.translate(key);
    };

    RoleUsersViewModel.prototype.getRole = function vm_getRole() {
        this.selectedRole().users(UserAdapter.toDTOArray(this.users()));
        return this.selectedRole();
    };

    RoleUsersViewModel.prototype.onRoleSelected = function vm_onRoleSelected(selectedRole) {
        this.selectedRole(selectedRole);
        this.users(UserAdapter.toModelObjectArray(selectedRole.users()));
        if (!this.users()) {
            this.users([]);
        }
        this.listControl.reload();
        clearIsDirty(this);
    };

    RoleUsersViewModel.prototype.onDeleteClick = function vm_onDeleteClick(data, event) {
        var vm = ko.contextFor(event.target).$root;
        promptDelete(vm, confirmDelete_done.bind(null, vm));
    };

    RoleUsersViewModel.prototype.onAdd = function vm_onAdd(data, event) {
        var dialogvm = Object.resolve(DialogViewModel);
        var self = this;

        // The dialog has an array of dtos.  Send an array of keys to it.
        var dtos = [];
        if (this.users && this.users()) {
            for (var i = 0; i < this.users().length; i++) {
                dtos.push({ key: this.users()[i].key });
            }
        }
        dialogvm.currentUsers(dtos);

        var options = {
            buttons: [
                        { name: this.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                        { name: this.translate('UPDATE'), value: 'save', cssClass: 'btn-primary' }
            ],
            closeOnReject: true
        };
        var dialog = new DialogBox(dialogvm, this.translate('ASSIGN_USERS'), options);
        dialog.show()
            .done(function (btnIndex, btnValue, data) {
                if (btnValue === 'save') {
                    dialog_done(self, data);
                }
            }
        );
    };

    RoleUsersViewModel.prototype.onSelectAllClick = function vm_onSelectAllClick(data, event) {
        var i;
        // It's not actually a checkbox, gotta do the work yourself.
        if (event.target.classList.contains('clicked')) {
            event.target.classList.remove('clicked');
            for (i = 0; i < this.users().length; i++) {
                this.users()[i].isSelected(false);
            }
            this.listControl.selectedItems = [];
        }
        else {
            event.target.classList.add('clicked');
            for (i = 0; i < this.users().length; i++) {
                this.users()[i].isSelected(true);
            }
            this.listControl.selectedItems = this.users();
        }
    };

    RoleUsersViewModel.prototype.onSelected = function vm_onSelected(data, event) {
        var key, vm, user;

        if (!event.target.value) {
            return;
        }
        key = event.target.value.key;
        vm = ko.contextFor(event.target).$root;
        user = _.find(vm.users(), function (item) {
            return item.key === key;
        });
        if (!user) {
            return;
        }
        user.isSelected(!user.isSelected());
    };

    RoleUsersViewModel.prototype.hasChanges = function vm_hasChanges() {
        return this.isDirty();
    };

    RoleUsersViewModel.prototype.clearDirty = function vm_clearDirty() {
        clearIsDirty(this);
    };

    //////////////////////
    // Implementation
    //////////////////////

    function isDirtyChanged(self, newValue) {
        self.events.isRoleDirty.raise(newValue);
    }

    function clearIsDirty(self) {
        self.kom.tracker.markCurrentStateAsClean();
    }

    function createHash(self) {
        if (!self.selectedRole() || !self.users()) {
            return;
        }
        return JSON.stringify(UserAdapter.toDTOArray(self.users()));
    }

    function handleAjaxRequestError(self, response, dfd) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
        if (dfd) {
            dfd.reject();
        }
    }

    function loadUsers(self, page, pageSize) {
        var dfd = $.Deferred();

        if (self.selectedRole()) {
            sortByCaption(self.users());
            dfd.resolve(UserAdapter.toDTOArray(self.users()));
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    }

    function canDelete_read(self) {
        if (!self.users || !self.users()) {
            return false;
        }
        for (var i = 0; i < self.users().length; i++) {
            if (self.users()[i].isSelected()) {
                return true;
            }
        }
        return false;
    }

    function dialog_done(self, dtos) {
        // If you don't need to be here, don't be.
        if (!dtos || dtos.length === 0) {
            return;
        }
        // Load the results of the dialog.
        dtos.forEach(function (item) {
            self.users.push(UserAdapter.toModelObject(item));
        });
        self.listControl.reload();
    }

    function promptDelete(self, doneCallback) {
        var msg = self.translate('SEC_USERS_CONFIRM_DELETE_CURRENT_GROUP'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function confirmDelete_done(self, clickedButtonIndex) {
        if (clickedButtonIndex !== 0) {
            return;
        }
        for (var i = 0; i < self.users().length; i++) {
            if (self.users()[i].isSelected() === false) {
                continue;
            }
            self.users.splice(i, 1);
            i--;
        }
        self.listControl.reload();
    }

    function sortByCaption(models) {
        return models.sort(function (x, y) {
            var xcap = x.fullDisplayName().toLowerCase();
            var ycap = y.fullDisplayName().toLowerCase();
            if (xcap < ycap) {
                return -1;
            } else if (xcap > ycap) {
                return 1;
            }
            return;
        });
    }

    return RoleUsersViewModel;
});
