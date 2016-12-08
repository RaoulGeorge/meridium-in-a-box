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
        view = require('text!../views/password-policy.html'),
        UnsavedChangesMessageBox = require('system/ui/unsaved-changes-message-box');


    function PasswordViewModel(kom, securityService,applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.applicationEvents = applicationEvents;

        this.isDirty = null;
        this.canSave = null;
        this.passwordConfigs = null;
        this.isBoolean = null;
    }

    var base = Object.inherit(KnockoutViewModel, PasswordViewModel);
    PasswordViewModel.dependsOn = [KnockoutManager, SecurityService,ApplicationEvents];

    PasswordViewModel.prototype.load = function passwordViewModel_load() {
        var dfd = new $.Deferred();

        this.passwordConfigs = this.kom.observableArray();
        this.isBoolean = this.kom.observable(false);
        this.isDirty = this.kom.observable(false);

        this.securityService.getPasswordConfigs()
            .done(getPasswordConfigs_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    PasswordViewModel.prototype.activate = function passwordViewModel_activate() {
        ApplicationContext.help.isAdmin = true;
        ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/PasswordPolicy.htm';
    };

    PasswordViewModel.prototype.deactivate = function passwordViewModel_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    PasswordViewModel.prototype.unload = function passwordViewModel_unload() {
        this.kom.disposeObservables();
    };

    PasswordViewModel.prototype.canUnload = function passwordViewModel_canUnload() {
        if (this.isDirty()) {
            return UnsavedChangesMessageBox.show();
        }
        return true;
    };

    PasswordViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

        };

    // Behavior

    PasswordViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    PasswordViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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

    PasswordViewModel.prototype.save = function passwordViewModel_save() {
        var dfd = new $.Deferred();
        this.securityService.putPasswordConfigs(this.passwordConfigs())
            .done(putPasswordConfig_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    PasswordViewModel.prototype.revert = function passwordViewModel_revert(data, event) {
        var dfd = new $.Deferred();

        this.securityService.getPasswordConfigs()
            .done(getPasswordConfigs_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    PasswordViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    PasswordViewModel.prototype.valueChanged = function passwordViewModel_valueChanged() {
        this.isDirty(true);
    };

    // Implementation
    function putPasswordConfig_done(self, dfd) {
        self.isDirty(false);
        dfd.resolve();
    }

    function getPasswordConfigs_done(self, dfd, data) {
        self.passwordConfigs(data);
        self.isDirty(false);
        dfd.resolve();
    }

    function handleErrorMsg(self, response) {
        MessageBox.showOk(response.statusText);
    }

    return PasswordViewModel;
});
