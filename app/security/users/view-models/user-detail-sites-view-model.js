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
        UserEvents = require('./user-events'),
        DialogBox = require('system/ui/dialog-box'),
        DialogViewModel = require('./user-detail-sites-dialog-view-model'),
        UserSiteDTO = require('../../services/usersite-dto'),
        UserSiteAdapter = require('../../adapters/usersite-adapter'),
        view = require('text!../views/user-detail-sites.html');

    function UserDetailSitesViewModel(kom, applicationEvents, securityService,userEvents) {
        base.call(this, view);
        var self = this;
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.service = securityService;
        this.events = userEvents;
        this.selectedUser = this.kom.observable();
        this.userSites = this.kom.observableArray([]);

        // knockout observables
        this.canDelete = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserDetailSitesViewModel);
    UserDetailSitesViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService,UserEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    UserDetailSitesViewModel.prototype.load = function vm_load(routeArgs) {
        var self = this,
            dfd = new $.Deferred();

        clearIsDirty(this);
        this.selectedUser(null);

        return dfd.promise();
    };

    UserDetailSitesViewModel.prototype.activate = function vm_activate() {
        this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
        this.events.userSelected.add(this.selectUser, this);
        this.events.defaultSiteChanged.add(this.defaultSiteChanged, this);
        this.isDirty.subscribe(isDirtyChanged.bind(null, this));
    };

    UserDetailSitesViewModel.prototype.attach = function vm_attach(region) {
        base.prototype.attach.call(this, region);
        this.region = region;
    };

    UserDetailSitesViewModel.prototype.detach = function vm_detach(region) {
        base.prototype.detach.call(this, region);
    };

    UserDetailSitesViewModel.prototype.deactivate = function vm_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.events.userSelected.remove(this);
        this.events.defaultSiteChanged.remove(this);
    };

    UserDetailSitesViewModel.prototype.unload = function vm_unload() {
        this.kom.disposeObservables();
    };

    /////////////////////
    // Behavior
    /////////////////////

    UserDetailSitesViewModel.prototype.onDeleteClick = function onDeleteClick(data, event) {
        var vm = ko.contextFor(event.target).$root, i = 0;

        for (i = 0; i < vm.userSites().length; i++) {
            if (vm.userSites()[i].selected()) {
                if (vm.userSites()[i].defaultSite()) {
                    MessageBox.showOk(vm.translate('CANNOT_DELETE_DEFAULT'), vm.translate('DELETE_ERROR'));
                    return;
                }
            }
        }

        promptDeleteSites(vm, confirmDeleteSites_done.bind(null, vm));
    };

    UserDetailSitesViewModel.prototype.onSelectAllClick = function onSelectAllClick(data, event) {
        // If all are selected, de-select all.  If at least one is not selected, select all.
        var allSelected = true, i = 0;
        for (i = 0; i < this.userSites().length; i++) {
            if (!this.userSites()[i].selected()) {
                allSelected = false;
                break;
            }
        }
        for (i = 0; i < this.userSites().length; i++) {
            this.userSites()[i].selected(!allSelected);
        }
    };

    UserDetailSitesViewModel.prototype.onSelectClick = function onSelectClick(data, event) {
        if (data.selected()) {
            data.selected(false);
        }
        else {
            data.selected(true);
        }
    };

    UserDetailSitesViewModel.prototype.onViewOnlyClick = function onViewOnlyClick(data, event) {
        if (data.viewOnly()) {
            data.viewOnly(false);
        }
        else {
            data.viewOnly(true);
        }
    };

    UserDetailSitesViewModel.prototype.onDefaultSiteClick = function onDefaultSiteClick(data, event) {
        var vm;

        // Do the manual bind, due to an image checkbox.
        if (data.defaultSite()) {
            data.defaultSite(false);
        }
        else {
            data.defaultSite(true);
        }

        vm = ko.contextFor(event.target).$root;

        // If the user picked a default site, turn any others off.
        if (data.defaultSite()) {
            for (var i = 0; i < vm.userSites().length; i++) {
                // Skip the one just checked.
                if (vm.userSites()[i].siteKey() === data.siteKey()) {
                    continue;
                }
                vm.userSites()[i].defaultSite(false);
            }
        }

        notifyUserDetail(vm);
    };

    UserDetailSitesViewModel.prototype.getUser = function getUser() {
        return this.selectedUser();
    };

    UserDetailSitesViewModel.prototype.onAddClick = function onAddClick(data, event) {
        var dialogvm = Object.resolve(DialogViewModel);
        var self = this;

        // The dialog has an array of Site dtos.  Send an array of site keys to it.
        var dtos = [];
        if (this.userSites && this.userSites()) {
            for (var i = 0; i < this.userSites().length; i++) {
                dtos.push({ key: this.userSites()[i].siteKey() });
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
        var dialog = new DialogBox(dialogvm, this.translate('SEC_USERS_ASSIGN_SITES'), options);
        dialog.show()
            .done(function (btnIndex, btnValue, data) {
                if (btnValue === 'save') {
                    dialog_done(self, data);
                }
            }
        );
    };

   UserDetailSitesViewModel.prototype.translate = function translate(key) {
        return this.translator.translate(key);
    };

    UserDetailSitesViewModel.prototype.hasChanges = function hasChanges() {
        return this.isDirty();
    };

    UserDetailSitesViewModel.prototype.clearDirty = function clearDirty() {
        clearIsDirty(this);
    };

    UserDetailSitesViewModel.prototype.getUserSites = function getUserSites() {
        return UserSiteAdapter.toDTOArray(this.userSites());
    };

    UserDetailSitesViewModel.prototype.selectUser = function selectUser(selectedUser) {
        this.selectedUser(selectedUser);
        this.userSites(UserSiteAdapter.toModelArray(selectedUser.sites()));
        if (this.selectedUser().key !=='0') {
            this.kom.tracker.markCurrentStateAsClean();
        }

        if (this.selectedUser().defaultSiteKey()) {
            this.defaultSiteChanged(this.selectedUser().defaultSiteKey());
        }
    };

    UserDetailSitesViewModel.prototype.defaultSiteChanged = function defaultSiteChanged(defaultSiteKey) {
        for (var i = 0; i < this.userSites().length; i++) {
            if (this.userSites()[i].siteKey() === defaultSiteKey) {
                this.userSites()[i].defaultSite(true);
            }
            else {
                this.userSites()[i].defaultSite(false);
            }
        }
    };

    UserDetailSitesViewModel.prototype.noneSiteSelected = function defaultSiteChanged(noneSiteSelected) {
        if (!this.userSites || this.userSites().length === 0) {
            return;
        }
        for (var i = 0; i < this.userSites().length; i++) {
            this.userSites()[i].defaultSite(false);
        }
    };

    //////////////////////
    // Implementation
    //////////////////////

    function isDirtyChanged(self, newValue) {
        self.events.isUserDirty.raise(newValue);
    }

    function dialog_done(self, dtos) {
        var startingEmpty = false;

        // If you don't need to be here, don't be.
        if (!dtos || dtos.length === 0) {
            return;
        }

        // If you're starting empty, you'll be defaulting the first one in a bit.
        if (!self.userSites || self.userSites().length === 0) {
            startingEmpty = true;
        }

        // Load the results of the dialog.
        dtos.forEach(function (item) {
            var userSiteDTO = new UserSiteDTO({ userKey: self.selectedUser().key, siteKey: item.key, siteName: item.name, viewOnly: item.viewOnly });
            self.userSites.push(UserSiteAdapter.toModel(userSiteDTO));
        });

        // If you started emtpy, default the first one.
        if (startingEmpty) {
            self.userSites()[0].defaultSite(true);
        }

        notifyUserDetail(self);
    }

    function clearIsDirty(self) {
        self.kom.tracker.markCurrentStateAsClean();
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

    function promptDeleteSites(self, doneCallback) {
        var msg = self.translate('SEC_USERS_CONFIRM_DELETE_CURRENT_SITE'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function confirmDeleteSites_done(self, clickedButtonIndex) {
        if (clickedButtonIndex !== 0) {
            return;
        }
        for (var i = 0; i < self.userSites().length; i++) {
            if (self.userSites()[i].selected() === false) {
                continue;
            }
            self.userSites.splice(i, 1);
            i--;
        }
        notifyUserDetail(self);
    }

    function canDelete_read(self) {
        if (!self.userSites || !self.userSites()) {
            return false;
        }
        for (var i = 0; i < self.userSites().length; i++) {
            if (self.userSites()[i].selected()) {
                return true;
            }
        }
        return false;
    }

    // The event must be raised from three places in this vm.  Centralize the logic
    // that must happend BEFORE the event is raised.
    function notifyUserDetail(self) {
        var noDefault = true;

        // Verify if you have a default site already set.
        for (var i = 0; i < self.userSites().length; i++) {
            if (self.userSites()[i].defaultSite()) {
                noDefault = false;
                break;
            }
        }

        // If you DON'T have a default site, set it to the first one in the array.
        if (noDefault && self.userSites().length) {
            self.userSites()[0].defaultSite(true);
        }

        // Let UserDetail vm know there's been a change.
        self.events.userSitesChanged.raise(self.userSites());
    }

    function createHash(self) {
        if (!self.selectedUser() || !self.userSites()) {
            return;
        }
        var hashObject = UserSiteAdapter.toDTOArray(self.userSites());
        return JSON.stringify(UserSiteAdapter.toDTOArray(self.userSites()));
    }

    return UserDetailSitesViewModel;
});
