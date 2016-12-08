define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../services/security-service'),
        SiteDTO = require('../services/site-dto'),
        UserSiteDTO = require('../services/usersite-dto'),
        Region = require('spa/region'),
        SiteModel = require('../model/site-model'),
        SiteAdapter = require('../adapters/site-adapter'),
        UserSiteAdapter = require('../adapters/usersite-adapter'),
        UserAdapter = require('../adapters/user-adapter'),
        DialogBox = require('system/ui/dialog-box'),
        DialogViewModel = require('./site-user-popover-view-model'),
        view = require('text!../views/site.html'),
        UnsavedChangesMessageBox = require('system/ui/unsaved-changes-message-box');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');
    require('ui/elements/tab-group/view-model');
    require('ui/elements/tab-group-item/view-model');
    require('spa/ko/extenders/confirmable');

    function SiteViewModel(kom, applicationEvents, securityService) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        // Reference to the panel control containing site list.
        this.siteList = null;
        this.userSites = null;

        // knockout observables
        this.selectedSite = null;
        this.isLoading = null;
        this.canSave = null;
        this.canDelete = null;
        this.canDeleteUser = null;
        this.canAdd = null;
    }

    var base = Object.inherit(KnockoutViewModel, SiteViewModel);
    SiteViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService];

    ///////////////////
    // Lifecycle
    ///////////////////

    SiteViewModel.prototype.load =
        function siteViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            this.selectedSite = this.kom.observable();
            this.isLoading = this.kom.observable();
            this.selected = this.kom.observableArray();
            clearIsDirty(this);
            return dfd.promise();
        };

    SiteViewModel.prototype.unload =
        function siteViewModel_unload() {
            this.kom.disposeObservables();
        };

    SiteViewModel.prototype.canUnload =
        function siteViewModel_canUnload() {
            var dfd = $.Deferred();

            if (this.isDirty()) {
                promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
            } else {
                dfd.resolve();
            }

            return dfd.promise();
        };

    SiteViewModel.prototype.activate =
        function siteViewModel_activate() {
            this.userSites = this.kom.observableArray([]);

            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.canDeleteUser = this.kom.pureComputed(canDeleteUser_read.bind(null, this));
            this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/Sites.htm';

        };

    SiteViewModel.prototype.deactivate =
        function siteViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
        };

    SiteViewModel.prototype.attach =
        function siteViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            var self=this;
            this.region = region;

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

            var $siteList = this.region.$element.find('mi-panel');
            this.siteList = $siteList.get(0);
            Element.upgrade(this.siteList);
            this.siteList.loader = loadSites.bind(null, this);
        };

    SiteViewModel.prototype.detach =
        function siteViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    ///////////////////////////////////////////////////////////////////////////
    // Site Behavior
    ///////////////////////////////////////////////////////////////////////////

    SiteViewModel.prototype.onSelectClick = function onSelectClick(data, event) {
        if (data.selected()) {
            data.selected(false);
        }
        else {
            data.selected(true);
        }
    };

    SiteViewModel.prototype.onSelectAllClick = function onSelectAllClick(data, event) {
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

    SiteViewModel.prototype.onDeleteClick = function onDeleteClick(data, event) {
        var vm = ko.contextFor(event.target).$root;
        promptDeleteSites(vm, confirmDeleteSites_done.bind(null, vm));
    };

    function promptDeleteSites(self, doneCallback) {
        var msg = self.translate('SEC_SITES_CONFIRM_DELETE_CURRENT_USER'),
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
    }

    SiteViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('CONFIGURATION_MANAGER'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    SiteViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
        var value = data.value,
            i,
            index;

        //this.region.$element.find('.breadcrumb-notification-area').html('<kbd>' + JSON.stringify(data) + '</kbd>');

        for (i = 0; i < this.breadcrumb.items.length; i++) {
            if (this.breadcrumb.items[i].value === value) {
                index = i + 1;
                break;
            }
        }
        this.breadcrumbData.splice(index, this.breadcrumbData.length - index);
        this.breadcrumb.items = this.breadcrumbData;
        if (data.value === '1') {
            this.applicationEvents.navigate.raise('admin-menu/data-configuration');
        }
    };

    SiteViewModel.prototype.save =
        function siteViewModel_save() {
            var self = this;
            var site = SiteAdapter.toDTO(this.selectedSite());
            site.users = UserSiteAdapter.toDTOArray(this.userSites());

            this.isLoading(true);

            if (site.key === '0') {
                this.securityService.postSite(site)
                    .done(postSite_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            } else {
                this.securityService.putSite(site)
                    .done(putSite_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            }
        };

    SiteViewModel.prototype.delete =
        function siteViewModel_delete(data, event) {
            promptDeleteSite(this, confirmDelete_done.bind(null, this));
        };

    SiteViewModel.prototype.onSelectSite =
        function siteViewModel_onSiteSelect(data, event) {
            var dfd = $.Deferred();

            if (!event.originalEvent.newValue) {
               return true;
            }

            var siteKey = event.originalEvent.newValue.key;
            var self = this;
            if (!this.isDirty()) {
                onSelectSite_done(this, siteKey);
                return true;
            }
           promptLoseNavChanges(this, confirmNavigate_done.bind(null, this, dfd,event.originalEvent.newValue));
           return dfd.promise();
        };

    SiteViewModel.prototype.onAddSite =
        function siteViewModel_onSite(data, event) {
            if (this.isDirty()) {
                var msg = this.translate('SEC_SITE_UNSAVED_CHANGES') + '\n' +
                    this.translate('ARE_YOU_SURE_CONTINUE'),
                    title = this.translate('CONFIRM_NAVIGATION');
                MessageBox.showYesNo(msg, title)
                    .done(promptLoseNewChanges.bind(null, this));
            }
            else {
                promptLoseNewChanges(this, 0);
            }
        };

    SiteViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    ///////////////////////////////////////////////////////////////////////////
    // User behavior
    ///////////////////////////////////////////////////////////////////////////

    SiteViewModel.prototype.onAddClick = function onAddClick(data, event) {
        var dialogvm = Object.resolve(DialogViewModel);
        var self = this;

        // The dialog has an array of Site dtos.  Send an array of site keys to it.
        var dtos = [];
        if (this.userSites && this.userSites()) {
            for (var i = 0; i < this.userSites().length; i++) {
                dtos.push({ key: this.userSites()[i].userKey() });
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

    //////////////////////
    // Implementation
    //////////////////////

    function promptLoseNewChanges(self, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            // De-select the current entry, if any, in the list.  Create a new
            // SiteDTO but DON'T add it to the list.  Persistence will do that...
            self.siteList.value = null;
            self.selectedSite(SiteAdapter.toModel(constructNewSite(self)));
            self.userSites(UserSiteAdapter.toModelArray());
        }
    }

    function confirmNavigate_done(self, dfd, site, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            onSelectSite_done(self, site.key);
            clearIsDirty(self);
            self.siteList.value=site;
            dfd.resolve(true);
        } else {
            event.preventDefault();
            dfd.resolve(false);
        }
    }

    function promptLoseNavChanges(self, doneCallback) {
        var msg = self.translate('SEC_SITE_UNSAVED_CHANGES') + '\n' +
            self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function onSelectSite_done(self, siteKey) {
        if (siteKey !== '0') {
            self.isLoading(true);
            self.securityService.getSite(siteKey)
                .done(getSite_done.bind(null, self))
                .fail(handleAjaxRequestError.bind(null, self));

        } else {
            self.selectedSite(SiteAdapter.toModel(constructNewSite(self)));
        }
    }

    function loadSites(self) {
        var dfd = $.Deferred();

        self.securityService.getSites()
            .done(getSites_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self, dfd));

        return dfd.promise();
    }

    function loadUsers(self) {
        var dfd = $.Deferred();
        if (self.selectedSite()) {
            dfd.resolve(sortBy(self.selectedSite().users()));
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    }

    function getSites_done(self, dfd, dtos) {
        if (self.selectedSite()) {
            self.siteList.value = SiteAdapter.toDTO(self.selectedSite());
        }
        else {
            if (dtos && dtos.length > 0) {
                if (!self.selectedSite()) {
                    self.siteList.value = dtos[0];
                }
            }
        }
        dfd.resolve(dtos);
    }

    function getSite_done(self, dto) {
        self.selectedSite(SiteAdapter.toModel(dto));
        self.userSites(UserSiteAdapter.toModelArray(dto.users));
        //self.userList.reload();
        self.selected([]);
        clearIsDirty(self);
        self.isLoading(false);
    }

    function postSite_done(self, dto) {
        self.selectedSite(SiteAdapter.toModel(dto));
        self.userSites(UserSiteAdapter.toModelArray(dto.users));
        clearIsDirty(self);
        self.siteList.reload();
        self.siteList.value = dto;
        //self.userList.reload();
        self.isLoading(false);
    }

    function putSite_done(self) {
        clearIsDirty(self);
        //self.siteList.reload();
        //self.siteList.value = SiteAdapter.toDTO(self.selectedSite());
        //self.userSites(UserSiteAdapter.toModelArray(self.selectedSite()).users);
        //self.userList.reload();
        self.isLoading(false);
    }

    function deleteSite_done(self) {
        self.selectedSite(null);
        deleteSelectedListGroupItem(self);
        self.selected([]);
        clearIsDirty(self);
        self.isLoading(false);
    }

    function deleteSelectedListGroupItem(self) {
        var listGroup = self.siteList.listGroup,
            items = listGroup.items,
            currentItemIdx;

        // Delete the currently selected item from the array.
        currentItemIdx = items.indexOf(listGroup.value);
        items.splice(currentItemIdx, 1);

        // Forces the DOM to reload
        listGroup.items = items;
    }

    function sortBy(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'userName'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property]().toLowerCase();
    }

    function dialog_done(self, dto) {
        dto.forEach(function (item) {
            var userSiteDTO = new UserSiteDTO({ userKey: item.key, siteKey: self.selectedSite().key(), userName: item.fullDisplayName, viewOnly: item.viewOnly });
            self.userSites.push(UserSiteAdapter.toModel(userSiteDTO));
        });
    }

    function confirmDelete_done(self, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            self.isLoading(true);
            self.securityService.deleteSite(self.selectedSite().key())
                .done(deleteSite_done.bind(null, self))
                .fail(handleAjaxRequestError.bind(null, self));
        }
    }

    function constructNewSite(self) {
        var newId = self.translate('SEC_SITE_NEW_SITE');
        return new SiteDTO({ name: newId, key: '0' });
    }

    function canSave_read(self) {
        return (self.isDirty() && self.selectedSite() && !self.isLoading());
    }

    function canDelete_read(self) {
        return self.selectedSite().key() > '0' && !self.isLoading();
    }

    function canDeleteUser_read(self) {
        if (!self.onSelectSite || !self.userSites()) {
            return;
        }
        for (var i = 0; i < self.userSites().length; i++) {
            if (self.userSites()[i].selected()) {
                return true;
            }
        }
        return false;
    }

    function canAdd_read(self) {
        if (self.selectedSite()) {
            return self.selectedSite().key() !== '0';
        }
        return true;
    }

    function promptLoseChanges(self, doneCallback) {
        var msg = self.translate('SEC_SITE_UNSAVED_CHANGES') +
                  '  ' +
                  self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function promptDeleteSite(self, doneCallback) {
        var msg = self.translate('SEC_SITE_CONFIRM_DELETE_CURRENT'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function confirmTabUnload_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    }

    function clearIsDirty(self) {
        self.kom.tracker.markCurrentStateAsClean();
    }

    function handleAjaxRequestError(self, response, dfd) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);

        self.applicationEvents.errorOccured.raise(self, errorMessage);
        self.isLoading(false);

        if (dfd) {
            dfd.reject();
        }
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedSite()) {
            hashObject = {
                name: '',
                key: '',
                userKeys: []
            };
            return JSON.stringify(hashObject);
        }
        var userSiteDTOs = UserSiteAdapter.toDTOArray(self.userSites());

        hashObject = {
            name: self.selectedSite().name(),
            key: self.selectedSite().key(),
            userKeys: userSiteDTOs
        };
        return JSON.stringify(hashObject);
    }

    return SiteViewModel;
});
