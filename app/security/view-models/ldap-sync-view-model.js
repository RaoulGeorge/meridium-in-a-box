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
        SecurityService = require('../services/security-service'),
        Region = require('spa/region'),
        DomainViewModel = require('./ldap-domain-view-model'),
        LdapSettingsModel = require('../model/ldap-settings-model'),
        ldapSettingsAdapter = require('../adapters/ldap-settings-adapter'),
        domainAdapter = require('../adapters/domain-adapter'),
        DomainDTO = require('../services/domain-dto'),
        LdapEvents = require('./ldap-events'),
        ScheduleEditorDialog = require('scheduling/schedule-editor-dialog'),
        BASE_URL = '/meridium/api/scheduling/ldap',
        LdapPropertyDTO = require('../services/ldap-property-dto'),
        AjaxClient = require('system/http/ajax-client'),
        view = require('text!../views/ldap-sync.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');
    require('ui/elements/schedule-editor/component');


    function LdapSyncViewModel(kom, applicationEvents, securityService, domainViewModel, domainRegion, ldapEvents, ajaxClient) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.cronExpression = ko.observable('');
        this.domainViewModel = domainViewModel;
        this.domainRegion = domainRegion;
        this.events = ldapEvents;
        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.skipSelectingCheck = false;
        this.runningLdap = null;

        // Reference to the panel control containing role list.
        this.panel = null;
        this.$panelControl = null;

        this.ajaxClient = ajaxClient;
        // knockout observables
        this.ldapSettings = null;
        this.canViewLdapSettings = null;
        this.selectedDomain = null;
        this.isLoading = null;
        this.canSave = null;
        this.canAdd = null;
        this.canSaveSchedule = null;
        this.canDeleteSchedule = null;
        this.scheduleNeedsSaving=null;
        this.canSync = null;
        this.canViewSettings = null;
        this.showLdapScheduler = null;
    }

    var base = Object.inherit(KnockoutViewModel, LdapSyncViewModel);
    LdapSyncViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, DomainViewModel, Region, LdapEvents, AjaxClient];

    ///////////////////
    // Lifecycle
    ///////////////////

    LdapSyncViewModel.prototype.load =
        function viewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.selectedDomain = this.kom.observable();
            this.ldapSettings = this.kom.observable();
            this.isLoading = this.kom.observable();
            this.scheduleNeedsSaving=this.kom.observable(false);
            this.canViewLdapSettings = this.kom.observable(false);
            this.showLdapScheduler = this.kom.observable(false);

            this.runningLdap = this.kom.observable(false);
            // Clear isDirty().
            clearIsDirty(this);

            this.domainViewModel.load(routeArgs);


            this.securityService.getLdapSchedule()
                .done(getLdapSchedule_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self));

            this.securityService.getLdapSettings()
           .done(getLdapSettings_done.bind(null, this, dfd))
           .fail(handleAjaxRequestError.bind(null, self));

            return dfd.promise();
        };

    LdapSyncViewModel.prototype.activate =
        function viewModel_activate() {

            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));
            this.canDeleteSchedule = this.kom.pureComputed(canDeleteSchedule_read.bind(null, this));
            this.canSaveSchedule = this.kom.pureComputed(canSaveSchedule_read.bind(null, this));
            this.canSync = this.kom.pureComputed(canSync_read.bind(null, this));
            this.canViewSettings = this.kom.pureComputed(canViewSettings_read.bind(null, this));
            this.events.folderUpdated.add(this.onFolderUpdated, this);
            this.events.folderDeleted.add(this.onFolderDeleted, this);
           
            // activate group VM
            this.domainViewModel.activate();
        };

    LdapSyncViewModel.prototype.attach =
        function viewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            // Configure the panel control.
            this.$panelControl = this.region.$element.find('mi-panel');
            this.panel = this.$panelControl.get(0);
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.panel);
            }
            // **************
            // Must do this here, or IE will blow up when you switch tabs with a dirty record.  Called Selcting when coming back to tab.
            // don't bind this event in knockout.
            // ******************
            this.$panelControl.on('selecting', onDomainSelecting.bind(null, this));
            // Wire up the web component loaders for data loading.
            this.panel.loader = loadDomains.bind(null, this);

                this.domainRegion.setElement(this.region.$element.find('div.ldap-domain-container'));

                this.domainViewModel.attach(this.domainRegion);



            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);
        };

    LdapSyncViewModel.prototype.detach =
        function viewModel_detach(region) {
            base.prototype.detach.call(this, region);

            this.domainViewModel.detach(this.domainRegion);
            this.domainRegion.clear();
        };

    LdapSyncViewModel.prototype.canUnload =
        function viewModel_canUnload() {
            var dfd = $.Deferred();

            // If we return false, it should prevent the app from navigating away
            // from the current URL.  This should work for navigation triggered by the
            // app OR by the browser (i.e. refresh, back, forward browser buttons).
            if (this.isDirty() || this.domainViewModel.isDirty()) {
                // Prompt the user to lose changes.
                promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
            } else {
                dfd.resolve();
            }

            return dfd.promise();
        };

    LdapSyncViewModel.prototype.deactivate =
        function viewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.domainViewModel.deactivate(this.domainRegion);
        };

    LdapSyncViewModel.prototype.unload =
        function viewModel_unload() {
            this.kom.disposeObservables();
            this.domainViewModel.unload();
        };


    /////////////////////
    // Behavior
    /////////////////////

    LdapSyncViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    LdapSyncViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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
            this.applicationEvents.navigate.raise('admin-menu/security-manager');
        }
    };

    LdapSyncViewModel.prototype.onFolderUpdated =
  function ldapViewModel_onFolderUpdated(data, event) {
      updateListGroup(this, data);
  };

    LdapSyncViewModel.prototype.onFolderDeleted =
function ldapViewModel_onFolderDeleted(data, event) {
    deleteSelectedListGroupItem(this,data);
};

    LdapSyncViewModel.prototype.onViewSettings =
       function viewModel_onViewSettings(data, event) {
           // IE sometimes fires this event with undefined.
           this.canViewLdapSettings(true);
           this.selectedDomain(null);
           this.domainViewModel.updateSelectedDomain(null);
       };

    LdapSyncViewModel.prototype.onDomainSelected =
        function viewModel_onDomainSelected(data, event) {
            // IE sometimes fires this event with undefined.
            if (!this.skipSelectingCheck) {
                if (event.target.value) {
                    var domainKey = event.target.value.key,
                        getDomain;
                    if (domainKey !== '0') {
                        this.isLoading(true);

                        // Load the details for the selected role.
                        getDomain = this.securityService.getDomain(domainKey)
                            .done(getDomain_done.bind(null, this))
                            .fail(handleAjaxRequestError.bind(null, this));

                        $.when(getDomain)
                            .done(domainLoading_done.bind(null, this));
                    } else {
                        getDomain_done(this, constructNewDomain(this));
                    }
                }
            }
            this.skipSelectingCheck = false;
        };

    LdapSyncViewModel.prototype.onDomainAdding =
        function viewModel_onDomainAdding(data, event) {
            var newDomain = constructNewDomain(this);
            addDomain(this,newDomain);
        };

    LdapSyncViewModel.prototype.onLdapSync =
       function viewModel_onLdapSync(data, event) {
           promptRunLdap(this, confirmRunLdap_done.bind(null, this,event));
       };

    LdapSyncViewModel.prototype.scheduleLdapSync =
       function viewModel_onLdapSync(data, event) {
          this.showLdapScheduler(true);
       };

    LdapSyncViewModel.prototype.cancelSchedule =
      function viewModel_onLdapSync(data, event) {
          this.showLdapScheduler(false);
      };

    LdapSyncViewModel.prototype.schedule =
      function viewModel_onLdapSync(data, event) {
          var self=this;
          this.ajaxClient.post(BASE_URL, { "schedule": this.cronExpression() }).done(function (data) {
              self.scheduleNeedsSaving(false);
          });
      };

    LdapSyncViewModel.prototype.unschedule =
  function viewModel_onLdapSync(data, event) {
      confrimUnscheduleLdap(this,unscheduleLdap_done.bind(null,this,event));

  };

    LdapSyncViewModel.prototype.showEditorDialog = function LdapSyncViewModel_showEditorDialog() {
        var self = this;
        var dialog = Object.resolve(ScheduleEditorDialog);
        dialog.show(self.cronExpression()).done(function (newSchedule) {
            self.cronExpression(newSchedule);
            self.scheduleNeedsSaving(true);
        });

    };

    LdapSyncViewModel.prototype.onSettingsSave =
        function viewModel_save() {
            var pref,pref1,prefDone,pref1Done;
            this.isLoading(true);

            pref = {
                category: 'MI_LDAP',
                name: 'LDAPENABLED',
                preferencetype:1,
                value: this.ldapSettings().enableLdapIntegration()

            };

            pref1 = {
                category: 'MI_LDAP',
                name: 'LDAPINFOLOG',
                preferencetype:1,
                value: this.ldapSettings().enableInformationalMessage()

            };

            pref1Done = this.securityService.setLdapPreference(pref1)
                   .fail(handleAjaxRequestError.bind(null, this));

            prefDone = this.securityService.setLdapPreference(pref)
             .fail(handleAjaxRequestError.bind(null, this));

            this.isLoading(false);
            $.when(prefDone, pref1Done)
                .done(clearIsDirty(this));
        };

    LdapSyncViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    //////////////////////
    // Implementation
    //////////////////////

    function addDomain(self,dto) {
        // Add the DTO to the panel / list.
        var panelItems = self.panel.listGroup.items;
        panelItems.push(dto);
        self.panel.listGroup.items = sortBy(panelItems);
        // Select the newly added item from the panel / list.
        self.panel.value = dto;
    }
    function onDomainSelecting(self, event) {
        // If dirty, confirm navigation, first.
        if ((self.isDirty() || self.domainViewModel.isDirty()) && !self.skipSelectingCheck) {
            event.preventDefault();
            promptLoseChanges(self, confirmPanelNavigation_done.bind(null, self, event));
            return false;
        }


        return true;
    }

    // loading the control functions
    function loadDomains(self) {
        var dfd = $.Deferred();

        self.securityService.getDomains()
            .done(getDomains_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self, dfd));

        return dfd.promise();
    }

    function getDomains_done(self, dfd, domains) {
        dfd.resolve(sortBy(domains));
        if (self.selectedDomain()) {
            if (self.selectedDomain().key() === '0') {
                self.skipSelectingCheck = true;
                addDomain(self, domainAdapter.toDTO(self.selectedDomain()));
            } else {
                if (self.domainViewModel.hasChanges()) {
                    self.skipSelectingCheck = true;
                }
                self.panel.value = domainAdapter.toDTO(self.selectedDomain());
            }
        }
    }

    // end loading the control functions

    // sorting functions
    function sortBy(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'domainName'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }
    // end sorting functions

    function getLdapSchedule_done(self, dfd, model) {
        self.cronExpression(model.schedule);
        dfd.resolve();
    }


    function getLdapSettings_done(self, dfd, dto) {
        self.ldapSettings(ldapSettingsAdapter.toModelObject(dto));
        self.canViewLdapSettings(true);
        clearIsDirty(self);
        dfd.resolve();
    }

    function getDomain_done(self, dto) {
        self.selectedDomain(domainAdapter.toModelObject(dto));
        self.canViewLdapSettings(false);
        self.domainRegion.setElement(self.region.$element.find('div.ldap-domain-container'));
        self.domainViewModel.updateSelectedDomain(self.selectedDomain());
        self.domainViewModel.attach(self.domainRegion);
    }

    function domainLoading_done(self) {
        self.isLoading(false);
    }

    function runLdap_done(self) {
        self.runningLdap(false);
    }
    
    function updateListGroup(self,dto) {
        var listGroup = self.panel.listGroup,
            items = listGroup.items,
            currentItem;

        self.selectedDomain(dto);
        // Get the currently selected value in the list.
        // This should be the item we just saved.
        currentItem = _.find(items, listGroup.value);

        // Update the properties of the selected role value in the list.
        currentItem.domainName = self.selectedDomain().domainName();
        currentItem.key = self.selectedDomain().key();

        // Forces the DOM to reload.
        listGroup.items = sortBy(items);

        // Reselect the current item.
        listGroup.value = currentItem;
    }

    function deleteSelectedListGroupItem(self,dto) {
        var domainModel = self.selectedDomain(),
            listGroup = self.panel.listGroup,
            items = listGroup.items,
            currentItemIdx;

        // Delete the currently selected item from the array.
        currentItemIdx = items.indexOf(listGroup.value);
        items.splice(currentItemIdx, 1);

        // Forces the DOM to reloadf
        listGroup.items = items;
    }

  
    function constructNewDomain(self) {
        var newDomain = new DomainDTO(),newldapProps=[],newApmProps=[],i;
        newDomain.key = '0';
        newDomain.allUserFilter = '(&(objectCategory=person)(objectClass=user)(whenChanged>={0}))';
        newDomain.singleUserFilter = '(&(objectCategory=person)(objectClass=user)(sAMAccountName={0}))';
        newDomain.domainGroupFilter = '(&(objectCategory=person)(objectClass=user)(memberOf={0}))';
        newDomain.domainName = '<Domain.com>';
        newDomain.domainCaption = '<Domain>';
        newDomain.domainNetBiosName = '';
        newDomain.rootCaption = 'LDAP://DC=<Domain>;DC=com';
        newDomain.propertyMappings = [];
        newDomain.users = [];
        newDomain.domainPassword = '';
        newDomain.domainUser = '';

        newldapProps=['company','department','givenName','l','mail','postalAddress','postalCode','sn','st','telephoneNumber','title','culture', 'timeZone'];
        newApmProps=['MI_HR_COMPANY_CHR','MI_HR_DEPT_CHR','MI_HR_FIRST_NAME_CHR','MI_HR_CITY_CHR', 'MI_HR_EMAIL_TX','MI_HR_ADDR1_CHR','MI_HR_POSTCODE_CHR',
            'MI_HR_LAST_NAME_CHR','MI_HR_STATE_CHR','MI_HR_PHONE1_CHR','MI_HR_JOB_TITLE_CHR','SEUS_CULTURE_ID','SEUS_TIME_ZONE_CHR'];

        for (i = 0; i < newldapProps.length; i++) { 

            var newProp = new LdapPropertyDTO();
            newProp.key = '0';
            newProp.ldapName = newldapProps[i];
            newProp.apmName = newApmProps[i];
            newDomain.propertyMappings.push(newProp);
        }

        return newDomain;
    }

    function canSave_read(self) {
        return (self.isDirty() && !self.isLoading());
    }

    function canAdd_read(self) {

        if (self.selectedDomain()) {
            return self.selectedDomain().key() !== '0';
        }
        return true;
    }

    function canSaveSchedule_read(self) {

        return self.scheduleNeedsSaving();
    }

    function canDeleteSchedule_read(self) {

        return self.cronExpression();
    }

    function canSync_read(self) {

        return !self.isLoading() && !self.runningLdap();
    }

    function canViewSettings_read(self) {
        return (!self.isLoading() && !self.canViewLdapSettings());
    }



    //Promtps

    function promptRunLdap(self, doneCallback) {
        var msg = self.translate('CONFIRM_RUN_LDAP_MSG'),
                 title = self.translate('CONFIRM_RUN_LDAP_TITLE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function confrimUnscheduleLdap(self, doneCallback) {
        var msg = self.translate('LDAP_CONFIRM_DELETE_SCHEDULE'),
            title = self.translate('LDAP');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function promptLoseChanges(self, doneCallback) {
        var msg = self.translate('CONFIRM_LOSE_DOMAIN_CHANGES_MSG') +
                  '  ' +
                  self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    // end prompts

    // misc
    function confirmRunLdap_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            self.runningLdap(true);
            self.securityService.runLdap()
                .done(runLdap_done.bind(null, self))
                .fail(handleAjaxRequestError.bind(null, self));
        } 
    }

    function unscheduleLdap_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            self.cronExpression(null);
            self.scheduleNeedsSaving(false);
            self.ajaxClient.delete(BASE_URL);
        }
    }



    function confirmTabUnload_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    }

    function confirmPanelNavigation_done(self, event, clickedButtonIndex) {
        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            clearIsDirty(self);
            self.domainViewModel.clearDirty();
            if (event.target.value) {
                if (event.target.value.key === '0') {
                    deleteSelectedListGroupItem(self);
                }
                event.target.value = event.originalEvent.newValue;
            }
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

        if (!self.ldapSettings()) {
            hashObject = {
                enableLdapIntegration: '',
                enableInformationalMessage: ''
            };
            return JSON.stringify(hashObject);
        }

        hashObject = {
            enableLdapIntegration: self.ldapSettings().enableLdapIntegration(),
            enableInformationalMessage: self.ldapSettings().enableInformationalMessage()
        };
        return JSON.stringify(hashObject);
    }

    return LdapSyncViewModel;
});
