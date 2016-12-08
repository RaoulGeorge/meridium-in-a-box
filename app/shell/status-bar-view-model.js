define(function (require) {
    'use strict';
    var ApplicationContext = require('application/application-context'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        Translator = require('system/globalization/translator'),
        Device = require('system/hardware/device'),
        ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/status-bar.html');

    function StatusBarViewModel() {
        base.call(this, view);
        this.applicationEvents = Object.resolve(ApplicationEvents);
        this.device = new Device();
        this.translator = Object.resolve(Translator);
        this.platformUnsupportedCaption = ko.observable('');
        this.showOfflineStatus = ko.observable(false);
    }

    var base = Object.inherit(KnockoutViewModel, StatusBarViewModel);

    StatusBarViewModel.prototype.open = function () {
        if (this.device.isMobileApp()) {
            checkInitialConnectionStatus(this);
            listenToConnectionStatus(this);
        }
    };

    function checkInitialConnectionStatus(self) {
        self.setOfflineIndicator(self, null, ApplicationContext.connectionStatus);
    }

    function listenToConnectionStatus(self) {
        self.applicationEvents.connectionChanged.add(self.setOfflineIndicator.bind(null, self));
    }

    StatusBarViewModel.prototype.version = function () {
        return window.appInfo.version;
    };

    StatusBarViewModel.prototype.host = function () {
        return this.session().apiServer;
    };

    StatusBarViewModel.prototype.user = function () {
        return ApplicationContext.user;
    };

    StatusBarViewModel.prototype.session = function () {
        return ApplicationContext.session;
    };

    StatusBarViewModel.prototype.isSupportedBrowser = function () {
        return ApplicationContext.isSupportedBrowser;
    };

    StatusBarViewModel.prototype.setOfflineIndicator = function (self, handler, connectionStatus) {
        self.showOfflineStatus(!connectionStatus.connected);
    };

    StatusBarViewModel.prototype.getOfflineCaption = function () {
        return this.translator.translate('OFFLINE');
    };

    StatusBarViewModel.prototype.getPlatformUnsupportedCaption = function () {
        setPlatformUnsupportedCaption(this);

        return this.platformUnsupportedCaption();
    };

    function setPlatformUnsupportedCaption(self){
        var caption;

        if (self.device.isMobileApp()) {
            caption = self.translator.translate('OS_NOT_SUPPORTED');
        } else{
            caption = self.translator.translate('BROWSER_NOT_SUPPORTED');
        }

        self.platformUnsupportedCaption(caption);
    }

    return StatusBarViewModel;
});