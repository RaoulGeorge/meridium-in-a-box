define(function (require) {
    'use strict';

    var $ = require('jquery');

    var _ = require('lodash');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ko = require('knockout'),
        DatasourceService = require('security/services/datasource-service'),
        HostAdapter = require('../adapters/hostnames-adapter'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        HostDTO = require('security/services/host-dto'),
        ErrorMessage = require('system/error/error-message'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        OperationsManagerEvents = require('operations-manager/operations-manager-events'),
        MessageBox = require('system/ui/message-box'),
        view = require('text!../views/hostnames.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');

    function HostnamesViewModel(kom, datasourceService, applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.translator = Object.resolve(Translator);
        this.datasourceService = datasourceService;
        this.applicationEvents = applicationEvents;

        // observables
        this.hosts =null;
        this.isLoading = null;
        this.selectedHost = null;
        this.isNew = null;

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        this.titleChanged = Object.resolve(OperationsManagerEvents).titleChanged;
        // Reference to the panel control containing role list.
        this.panel = null;
        this.$panelControl = null;
    }

    var base = Object.inherit(KnockoutViewModel, HostnamesViewModel);
    HostnamesViewModel.dependsOn = [KnockoutManager, DatasourceService, ApplicationEvents];

    HostnamesViewModel.prototype.open =
        function viewModel_open() {
            this.titleChanged.raise(this.translator.translate('HOSTNAMES'));
        };

    HostnamesViewModel.prototype.load = function datasourceViewModel_load() {
        var dfd = new $.Deferred();

        this.hosts=this.kom.observable();
        this.datasources = this.kom.observableArray();
        this.isLoading = this.kom.observable();
        this.apiServer = this.kom.observable(location.host);
        this.isNew = this.kom.observable(true);
        this.selectedHost = this.kom.observable(HostAdapter.toModelObject(new HostDTO()));
        this.canSave = null;
        this.canDelete = null;
        this.canAdd = null;
        this.skipSelectingCheck = false;
        clearIsDirty(this);

        return dfd.promise();
    };


    HostnamesViewModel.prototype.activate = function datasourceViewModel_activate() {
        this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
        this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
        this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));
    };

    HostnamesViewModel.prototype.deactivate = function datasourceViewModel_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    HostnamesViewModel.prototype.unload = function datasourceViewModel_deactivate() {
            this.kom.disposeObservables();
    };

    HostnamesViewModel.prototype.canUnload =
        function roleViewModel_canUnload() {
            var dfd = $.Deferred();
            // If we return false, it should prevent the app from navigating away
            // from the current URL.  This should work for navigation triggered by the
            // app OR by the browser (i.e. refresh, back, forward browser buttons).
            if (this.isDirty() || this.groupViewModel.isDirty() || this.userViewModel.isDirty()) {
                // Prompt the user to lose changes.
                promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
            } else {
                dfd.resolve();
            }

            return dfd.promise();
        };

    HostnamesViewModel.prototype.canUnload = function canUnload() {
        var dfd = $.Deferred();
        // If we return false, it should prevent the app from navigating away
        // from the current URL.  This should work for navigation triggered by the
        // app OR by the browser (i.e. refresh, back, forward browser buttons).
        if (this.isDirty()) {
            // Prompt the user to lose changes.
            promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    };

    HostnamesViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
            base.prototype.attach.apply(this, arguments);

            this.$panelControl = this.region.$element.find('mi-panel');
            this.panel = this.$panelControl.get(0);
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.panel);
            }
            // **************
            // Must do this here, or IE will blow up when you switch tabs with a dirty record.  Called Selcting when coming back to tab.
            // don't bind this event in knockout.
            // ******************
            this.$panelControl.on('selecting', onHostSelecting.bind(null, this));
            // Wire up the web component loaders for data loading.
            this.panel.loader = loadHost.bind(null, this);
        };

    HostnamesViewModel.prototype.detach =
        function roleViewModel_detach(region) {
            base.prototype.detach.call(this, region);

        };
    // Behavior
    HostnamesViewModel.prototype.save =
        function roleViewModel_save() {
            var host;
            var self = this;
            host = HostAdapter.toDTO(this.selectedHost());


            if (this.selectedHost().id()==='') {
                MessageBox.showOk(this.translate("HOSTNAMESE_ENTER_HOST_ID"),this.translate("HOSTNAMES"));
                return;
            }
            if (this.selectedHost().name()==='') {
                MessageBox.showOk(this.translate("HOSTNAMESE_ENTER_HOST_NAME"),this.translate("HOSTNAMES"));
                return;
            }

            this.selectedHost().name(this.selectedHost().name().trim());
            this.selectedHost().idpUrl(this.selectedHost().idpUrl().trim());

            this.isLoading(true);

            this.datasourceService.putHost(host)
                .done(putHost_done.bind(null, this))
                .fail(handleAjaxRequestError.bind(null, this));
        };

    function canSave_read(self) {
       return self.isDirty() && self.selectedHost && !self.isLoading();
    }

    function canDelete_read(self) {
       return self.selectedHost && !self.isLoading();
    }

    function onHostSelecting(self, event) {


        // IE sometimes fires this event with undefined.
        // If dirty, confirm navigation, first.
        if (self.isDirty()  && !self.skipSelectingCheck) {
            event.preventDefault();
            promptLoseChanges(self, confirmPanelNavigation_done.bind(null, self, event));
            return false;
        }
        return true;
    }

    HostnamesViewModel.prototype.onHostSelected =
        function roleViewModel_onRoleSelected(data, event) {
            // IE sometimes fires this event with undefined.
            if (!this.skipSelectingCheck) {
                if (event.target.value) {
                    this.selectedHost(event.target.value);
                    if (this.selectedHost().id()!=='0') {
                        clearIsDirty(this);
                    }
                }
            }
            this.skipSelectingCheck = false;
        };

    HostnamesViewModel.prototype.onHostAdding =
        function roleViewModel_onRoleAdding(data, event) {
            // Create a new HostDTO.
            var newHost = HostAdapter.toModelObject(constructNewHost(this));

            // Add the DTO to the panel / list.
            var panelItems = this.panel.listGroup.items;
            panelItems.push(newHost);
            this.panel.listGroup.items = sortByName(panelItems);
            // Select the newly added item from the panel / list.
            this.panel.value = newHost;
            this.selectedHost(newHost);
        };

    function canAdd_read(self) {

        return !self.isDirty();
    }

    function sortByName(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'name'));
    }

    function sortByCaseInsensitive(property, item) {
        if (!item[property]()) {
            return '';
        }
        return item[property]().toLowerCase();
    }

    function loadHost(self) {
        var dfd = $.Deferred();

        self.datasourceService.getFilteredHost(self.apiServer())
            .done(get_done.bind(null, self, dfd))
            .fail(handleErrorMsg.bind(null, self));

        return dfd.promise();
    }


    HostnamesViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    // Implementation

    function putHost_done(self) {
        clearIsDirty(self);
        updateListGroup(self);
        self.isLoading(false);
    }

    function updateListGroup(self) {
        var hostModel = self.selectedHost(),
            listGroup = self.panel.listGroup,
            items = listGroup.items,
            currentItem;

        // Get the currently selected value in the list.
        // This should be the item we just saved.
        currentItem = _.find(items, listGroup.value);

        // Update the properties of the selected role value in the list.
        currentItem.id(hostModel.id());
        currentItem.name(hostModel.name());
        currentItem.idpUrl(hostModel.idpUrl());
        currentItem.ssoAuthEnabled(hostModel.ssoAuthEnabled());

        // Forces the DOM to reload.
        listGroup.items = sortByName(items);
        // Reselect the current item.
        self.skipSelectingCheck = true;
        listGroup.value = currentItem;
    }

    function constructNewHost(self) {
        return new HostDTO({ name: self.apiServer(), id:'0', idpUrl:'urn:componentspace:MvcExampleIdentityProvider' });
    }

    function get_done(self, dfd, data) {
        if (data.length===1 && !data[0].name) {
            self.selectedHost(null);
            clearIsDirty(self);
            dfd.resolve([]);
            return;
        }
        self.hosts(sortByName(HostAdapter.toModelObjectArray(data)));
        dfd.resolve(self.hosts());
        if (self.selectedHost()) {
            if (self.selectedHost().id() === '') {
                if (self.hosts().length > 0) {
                    self.panel.value=self.hosts()[0];
                    self.selectedHost(self.hosts()[0]);
                } else {
                    self.skipSelectingCheck = true;
                    var panelItems = self.panel.listGroup.items;
                    var newHost = self.selectedHost();
                    panelItems.push(newHost);
                    self.panel.listGroup.items = sortByName(panelItems);
                    ////
                    ////        // Select the newly added item from the panel / list.
                    self.panel.value = newHost;
                }
            } else {
            //        if (self.isDirty() || self.groupViewModel.hasChanges() || self.userViewModel.hasChanges()) {
            //            self.skipSelectingCheck = true;
            //        }
                    self.panel.value = self.selectedHost();
             }
        } else {
            if (self.hosts().length > 0) {
                self.panel.value=self.hosts()[0];
                self.selectedHost(self.hosts()[0]);
            }
        }
    }

    HostnamesViewModel.prototype.delete =
        function roleViewModel_delete(data, event) {
            promptDeleteHost(this, confirmDelete_done.bind(null, this));
        };


    function handleErrorMsg(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    function deleteHost_done(self) {
        self.selectedHost(null);
        deleteSelectedListGroupItem(self);
        clearIsDirty(self);
        self.isLoading(false);
    }

    function confirmDelete_done(self, clickedButtonIndex) {

        if (clickedButtonIndex === 0) {
            self.isLoading(true);
            self.datasourceService.deleteHost(self.selectedHost().id())
                .done(deleteHost_done.bind(null, self))
                .fail(handleAjaxRequestError.bind(null, self));
        }
    }

    function deleteSelectedListGroupItem(self) {
        var listGroup = self.panel.listGroup,
            items = listGroup.items,
            currentItemIdx;

        // Delete the currently selected item from the array.
        currentItemIdx = items.indexOf(listGroup.value);
        items.splice(currentItemIdx, 1);

        // Forces the DOM to reloadf
        listGroup.items = items;
    }

    function promptDeleteHost(self, doneCallback) {
        var msg = self.translate('HOSTNAMES_CONFIRM_DELETE_CURRENT'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    //Promtps
    function confirmPanelNavigation_done(self, event, clickedButtonIndex) {
        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            clearIsDirty(self);
        }
    }

    function promptLoseChanges(self, doneCallback) {
        var msg = self.translate('HOSTNAMES_UNSAVED_CHANGES') +
                '  ' +
                self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }



    // end prompts

    // misc
    function confirmTabUnload_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    }

    function clearIsDirty(self) {
        // Clear isDirty().
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

        if (!self.selectedHost()) {
            return;
        }

        hashObject = {
            id: self.selectedHost().id(),
            name: self.selectedHost().name(),
            idpUrl: self.selectedHost().idpUrl(),
            ssoAuthEnabled: self.selectedHost().ssoAuthEnabled()
        };
        return JSON.stringify(hashObject);
    }

    return HostnamesViewModel;
});
