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
        DialogViewModel = require('./role-groups-dialog-view-model'),
        GroupAdapter = require('../../adapters/group-adapter'),
        view = require('text!../views/role-groups.html');

    require('ui/elements/list-group/view-model');

    function RoleGroupsViewModel(kom, applicationEvents, securityService, roleEvents) {
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
        this.groups = this.kom.observableArray([]);
        this.listControl = null;
        this.canDelete = null;
    }

    var base = Object.inherit(KnockoutViewModel, RoleGroupsViewModel);
    RoleGroupsViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, RoleEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    RoleGroupsViewModel.prototype.load = function vm_load(routeArgs) {
        var self = this,
            dfd = new $.Deferred();

        clearIsDirty(this);
        this.selectedRole(null);

        return dfd.promise();
    };

    RoleGroupsViewModel.prototype.activate = function vm_activate() {
        this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
        this.events.roleSelected.add(this.onRoleSelected, this);
        this.isDirty.subscribe(isDirtyChanged.bind(null, this));
    };

    RoleGroupsViewModel.prototype.attach = function vm_attach(region) {
        base.prototype.attach.call(this, region);
        this.region = region;
        this.listControl = this.region.$element.find('mi-list-group')[0];
        Element.upgrade(this.listControl);
        this.listControl.loader = loadGroups.bind(null, this);
    };

    RoleGroupsViewModel.prototype.detach = function vm_detach(region) {
        base.prototype.detach.call(this, region);
    };

    RoleGroupsViewModel.prototype.deactivate = function vm_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.events.roleSelected.remove(this);
    };

    RoleGroupsViewModel.prototype.unload = function vm_unload() {
        this.kom.disposeObservables();
    };


    /////////////////////
    // Behavior
    /////////////////////

    RoleGroupsViewModel.prototype.translate = function vm_translate(key) {
        return this.translator.translate(key);
    };

    RoleGroupsViewModel.prototype.getRole = function vm_getRole() {
        this.selectedRole().groups(GroupAdapter.toDTOArray(this.groups()));
        return this.selectedRole();
    };

    RoleGroupsViewModel.prototype.onRoleSelected = function vm_onRoleSelected(selectedRole) {
        this.selectedRole(selectedRole);
        this.groups(GroupAdapter.toModelObjectArray(selectedRole.groups()));
        if (!this.groups()) {
            this.groups([]);
        }
        this.listControl.reload();
        clearIsDirty(this);
    };

    RoleGroupsViewModel.prototype.onDeleteClick = function vm_onDeleteClick(data, event) {
        var vm = ko.contextFor(event.target).$root;
        promptDelete(vm, confirmDelete_done.bind(null, vm));
    };

    RoleGroupsViewModel.prototype.onAdd = function vm_onAdd(data, event) {
        var dialogvm = Object.resolve(DialogViewModel);
        var self = this;

        // The dialog has an array of dtos.  Send an array of keys to it.
        var dtos = [];
        if (this.groups && this.groups()) {
            for (var i = 0; i < this.groups().length; i++) {
                dtos.push({ key: this.groups()[i].key });
            }
        }
        dialogvm.currentGroups(dtos);

        var options = {
            buttons: [
                        { name: this.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                        { name: this.translate('UPDATE'), value: 'save', cssClass: 'btn-primary' }
            ],
            closeOnReject: true
        };
        var dialog = new DialogBox(dialogvm, this.translate('SEC_USERS_ASSIGN_GROUPS'), options);
        dialog.show()
            .done(function (btnIndex, btnValue, data) {
                if (btnValue === 'save') {
                    dialog_done(self, data);
                }
            }
        );
    };

    RoleGroupsViewModel.prototype.onSelectAllClick = function vm_onSelectAllClick(data, event) {
        var i;
        // It's not actually a checkbox, gotta do the work yourself.
        if (event.target.classList.contains('clicked')) {
            event.target.classList.remove('clicked');
            for (i = 0; i < this.groups().length; i++) {
                this.groups()[i].isSelected(false);
            }
            this.listControl.selectedItems = [];
        }
        else {
            event.target.classList.add('clicked');
            for (i = 0; i < this.groups().length; i++) {
                this.groups()[i].isSelected(true);
            }
            this.listControl.selectedItems = this.groups();
        }
    };

    RoleGroupsViewModel.prototype.onSelected = function vm_onSelected(data, event) {
        var key, vm, group;

        if (!event.target.value) {
            return;
        }
        key = event.target.value.key;
        vm = ko.contextFor(event.target).$root;
        group = _.find(vm.groups(), function (item) {
            return item.key === key;
        });
        if (!group) {
            return;
        }
        group.isSelected(!group.isSelected());
    };

    RoleGroupsViewModel.prototype.hasChanges = function vm_hasChanges() {
        return this.isDirty();
    };

    RoleGroupsViewModel.prototype.clearDirty = function vm_clearDirty() {
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
        if (!self.selectedRole() || !self.groups()) {
            return;
        }
        return JSON.stringify(GroupAdapter.toDTOArray(self.groups()));
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

    function loadGroups(self, page, pageSize) {
        var dfd = $.Deferred();

        if (self.selectedRole()) {
            sortByCaption(self.groups());
            dfd.resolve(GroupAdapter.toDTOArray(self.groups()));
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    }

    function canDelete_read(self) {
        if (!self.groups || !self.groups()) {
            return false;
        }
        for (var i = 0; i < self.groups().length; i++) {
            if (self.groups()[i].isSelected()) {
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
            self.groups.push(GroupAdapter.toModelObject(item));
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
        for (var i = 0; i < self.groups().length; i++) {
            if (self.groups()[i].isSelected() === false) {
                continue;
            }
            self.groups.splice(i, 1);
            i--;
        }
        self.listControl.reload();
    }

    function sortByCaption(models) {
        return models.sort(function (x, y) {
            var xcap = x.caption().toLowerCase();
            var ycap = y.caption().toLowerCase();
            if (xcap < ycap) {
                return -1;
            } else if (xcap > ycap) {
                return 1;
            }
            return;
        });
    }

    return RoleGroupsViewModel;
});
