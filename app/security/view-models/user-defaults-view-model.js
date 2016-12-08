define(function (require) {
    'use strict';

    var $ = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        SecurityService = require('security/services/security-service'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        MessageBox = require('system/ui/message-box'),
        view = require('text!../views/user-defaults.html'),
        UnsavedChangesMessageBox = require('system/ui/unsaved-changes-message-box');


    function UserDefaultsViewModel(kom, securityService, applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.applicationEvents = applicationEvents;

        this.timezones = null;
        this.isDirty = null;
        this.canSave = null;
        this.userDefaults = null;
        this.defaultTimezone = null;
        this.isBoolean = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserDefaultsViewModel);
    UserDefaultsViewModel.dependsOn = [KnockoutManager, SecurityService, ApplicationEvents];

    UserDefaultsViewModel.prototype.load = function timezoneViewModel_load() {
        var dfdTimezones = $.Deferred(), dfdUserDefaults = $.Deferred(), self = this;

        this.userDefaults = this.kom.observableArray();
        this.defaultTimezone = this.kom.observable();
        this.isBoolean = this.kom.observable(false);
        this.isDirty = this.kom.observable(false);
        this.timezones = this.kom.observableArray();

        this.securityService.getTimezones()
            .done(getTimezones_done.bind(null, self, dfdTimezones))
            .fail(handleErrorMsg.bind(null, self));

        this.securityService.getUserDefaults()
            .done(getUserDefaults_done.bind(null, self, dfdUserDefaults))
            .fail(handleErrorMsg.bind(null, self));

        $.when(dfdTimezones, dfdUserDefaults)
            .done(loadObserveables.bind(null, self));

        return dfdTimezones.promise();
    };

    UserDefaultsViewModel.prototype.activate = function timezoneViewModel_activate() {
        ApplicationContext.help.isAdmin = true;
        ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/UserDefaults.htm';
    };

    UserDefaultsViewModel.prototype.deactivate = function timezoneViewModel_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    UserDefaultsViewModel.prototype.unload = function timezoneViewModel_unload() {
        this.kom.disposeObservables();
    };

    UserDefaultsViewModel.prototype.canUnload = function timezoneViewModel_canUnload() {
        if (this.isDirty()) {
            return UnsavedChangesMessageBox.show();
        }
        return true;
    };

    UserDefaultsViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

        };

    // Behavior

    UserDefaultsViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    UserDefaultsViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
        var value = data.value,
            i,
            index;

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

    UserDefaultsViewModel.prototype.save = function timezoneViewModel_save() {
        var dfd = new $.Deferred();
        this.securityService.putUserDefaults(this.userDefaults())
            .done(putUserDefaults_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    UserDefaultsViewModel.prototype.revert = function timezoneViewModel_revert(data, event) {
        var dfd = new $.Deferred();

        this.securityService.getUserDefaults()
            .done(getUserDefaults_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    UserDefaultsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserDefaultsViewModel.prototype.valueChanged = function timezoneViewModel_valueChanged() {
        this.isDirty(true);
    };

    // Implementation
    function putUserDefaults_done(self, dfd) {
        self.isDirty(false);
        dfd.resolve();
    }

    function getUserDefaults_done(self, dfd, data) {
        self.userDefaults(data);
        self.isDirty(false);
        dfd.resolve();
    }

    function getTimezones_done(self, dfd, data) {
        self.timezones(data);
        self.isDirty(false);
        dfd.resolve();
    }

    function loadObserveables(self) {
        var i;

        if (!self.userDefaults || !self.userDefaults()) {
            return;
        }
        for (i = 0; i < self.userDefaults().length; i++) {
            if (self.userDefaults()[i].name === 'DefaultTimezone') {
                self.defaultTimezone(self.userDefaults()[i]);
                break;
            }
        }

        self.isDirty(false);
    }

    function handleErrorMsg(self, response) {
        MessageBox.showOk(response.statusText);
    }

    return UserDefaultsViewModel;
});
