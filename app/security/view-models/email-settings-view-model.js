define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        EmailSettingService = require('../services/email-settings-service'),
        Region = require('spa/region'),
        OperationsManagerEvents = require('operations-manager/operations-manager-events'),
        EmailSettinsgDTO = require('../services/email-settings-dto'),
        EmailSettingsModel = require('../model/email-settings-model'),
        EmailSettingsAdapter=require('../adapters/email-settings-adapter'),
        view = require('text!../views/email-settings.html');
    
        require('system/lang/object');
        require('system/lang/string');



        function EmailSettingsViewModel(kom, applicationEvents, emailSettingService) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = emailSettingService;
        this.translator = Object.resolve(Translator);
        this.region = null;

        this.emailSettings = null;
        this.canSeeEmailHost = null;
       
        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.titleChanged = Object.resolve(OperationsManagerEvents).titleChanged;
        this.isLoading = null;
        this.canSave = null;
       
    }

    var base = Object.inherit(KnockoutViewModel, EmailSettingsViewModel);
    EmailSettingsViewModel.dependsOn = [KnockoutManager, ApplicationEvents, EmailSettingService, Region];

    ///////////////////
    // Lifecycle
    ///////////////////

    EmailSettingsViewModel.prototype.open =
        function viewModel_open() {
            this.titleChanged.raise(this.translator.translate('EMAIL_SETTINGS'));
        };

    EmailSettingsViewModel.prototype.load =
        function viewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.emailSettings=this.kom.observable();
            this.isLoading = this.kom.observable();

            // Clear isDirty().
            clearIsDirty(this);
            
            loadSettings(self);
            return dfd.promise();
        };

    EmailSettingsViewModel.prototype.activate =
        function viewModel_activate() {

            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canSeeEmailHost = this.kom.pureComputed(canSeeEmailHost_read.bind(null, this));

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/Operations/Content/EmailSettings.htm';
        };

    EmailSettingsViewModel.prototype.attach =
        function viewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);
        };

    EmailSettingsViewModel.prototype.detach =
        function viewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    EmailSettingsViewModel.prototype.canUnload =
        function viewModel_canUnload() {
            var dfd = $.Deferred();

            if (this.isDirty()) {
                // Prompt the user to lose changes.
                promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
            } else {
                dfd.resolve();
            }

            return dfd.promise();
        };

    EmailSettingsViewModel.prototype.deactivate =
        function viewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
        };

    EmailSettingsViewModel.prototype.unload =
        function viewModel_unload() {
            this.kom.disposeObservables();
        };


    /////////////////////
    // Behavior
    /////////////////////

    EmailSettingsViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('OPERATIONS_MANAGER'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    EmailSettingsViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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
            this.applicationEvents.navigate.raise('admin-menu/operations-manager');
        }
    };

    EmailSettingsViewModel.prototype.save =
        function viewModel_save() {

            this.service.saveSettings(EmailSettingsAdapter.toDTO(this.emailSettings())).done(clearIsDirty(this)).fail(handleAjaxRequestError.bind(null, this));

            //var pref,prefDone;
            //console.log(EmailSettingsAdapter.toDTO(this.emailSettings()));
            //this.isLoading(true);
            //pref = {
            //    category: 'MI_EMAIL',
            //    name: 'Email_Config',
            //    preferencetype:1,
            //    value: EmailSettingsAdapter.toDTO(this.emailSettings())
            //};
            //
            //
            //console.log(pref);
            //prefDone = this.service.saveSettings(pref)
            //    .fail(handleAjaxRequestError.bind(null, this));
            //
            //this.isLoading(false);
            //$.when(prefDone)
            //    .done(clearIsDirty(this));
        };

    EmailSettingsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    //////////////////////
    // Implementation
    //////////////////////
   
    // loading the control functions
    function loadSettings(self) {
        var dfd = $.Deferred();

        self.service.getSettings()
            .done(getSettings_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self, dfd));

        return dfd.promise();
    }

    function getSettings_done(self, dfd, settings) {
        self.emailSettings(EmailSettingsAdapter.toModelObject(settings));
        clearIsDirty(self);
        dfd.resolve();
    }

    // end loading the control functions
    

    function canSave_read(self) {
        return (self.isDirty() && !self.isLoading());
    }
       

    function canSeeEmailHost_read(self) {
        return (!self.isLoading() && !self.emailSettings().useDropFolder());
    }

    function promptLoseChanges(self, doneCallback) {
        var msg = self.translate('CONFIRM_LOSE_DOMAIN_CHANGES_MSG') +
                  '  ' +
                  self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

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

    function confirmPanelNavigation_done(self, event, clickedButtonIndex) {
        //if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
        //    clearIsDirty(self);
        //    self.domainViewModel.clearDirty();
        //    if (event.target.value) {
        //        if (event.target.value.key === '0') {
        //            deleteSelectedListGroupItem(self);
        //        }
        //        event.target.value = event.originalEvent.newValue;
        //    }
        //}
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

        if (!self.emailSettings()) {
            return;
        }

        hashObject = {
            useDropFolder: self.emailSettings().useDropFolder(),
            specificFolder: self.emailSettings().specificFolder(),
            emailHost:self.emailSettings().emailHost(),
            defaultForm:self.emailSettings().defaultFrom()
        };
        return JSON.stringify(hashObject);
    }

    return EmailSettingsViewModel;
});
