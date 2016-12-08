define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ko = require('knockout'),
        view = require('text!./views/leftnav.html'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        LoginViewModel = require('security/view-models/login-view-model'),
        DialogBox = require('system/ui/dialog-box'),
        DialogScreen = require('./hyperlink-utility-view-model'),
        LeftNavSecurity = require('./left-nav-security');

    function LeftNavViewModel(applicationEvents) {
        base.call(this, view);
        this.applicationEvents = applicationEvents;
        this.translator = Object.resolve(Translator);
        this.isRiskMenuVisible = ko.observable(false);
        this.isStrategyMenuVisible = ko.observable(false);
        this.isPerformanceMenuVisible = ko.observable(false);
        this.isAdminMenuVisible = ko.observable(false);
        this.isToolsMenuVisible = ko.observable(false);
        this.isAnalyticsMenuVisible = ko.observable(false);
        this.isOperationalToolsMenuVisible = ko.observable(false);
        this.isHomeView = ko.observable(false);
        this.dialogScreen = null;
        this.security = null;
    }

    var base = Object.inherit(KnockoutViewModel, LeftNavViewModel);
    LeftNavViewModel.dependsOn = [ApplicationEvents];
    LeftNavViewModel.singleton = true;

    LeftNavViewModel.prototype.handleFullMenu = function (isHomeRoute) {
        this.isHomeView(isHomeRoute);       
    };

    LeftNavViewModel.prototype.attach = function leftNavViewModel_attach(region) {
        this.security = Object.resolve(LeftNavSecurity);
        base.prototype.attach.call(this, region);
        this.region = region;
        preventMenuClose();
        this.applicationEvents.windowClicked.add(closeOnOutsideClick, null, this);
    };

    LeftNavViewModel.prototype.detach = function leftNavViewModel_detach(region) {
        base.prototype.detach.call(this, region);
        this.applicationEvents.windowClicked.remove(this);
    };

    LeftNavViewModel.prototype.toggleMenu = function (appName) {
        if (appName === 'risk') {
            toggleRiskMenu(this);
        } else if (appName === 'strategy') {
            toggleStrategyMenu(this);
        } else if (appName === 'performance') {
            togglePerformanceMenu(this);
        } else if (appName === 'admin') {
            toggleAdminMenu(this);
        } else if (appName === 'tools') {
            toggleToolsMenu(this);
        } else if (appName === 'analytics') {
            toggleAnalyticsMenu(this);
        }
        else if (appName === 'operations') {
            toggleOperationalToolsMenu(this);
        }
    };

    LeftNavViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    LeftNavViewModel.prototype.signOut = function () {
        var login = Object.resolve(LoginViewModel);
        login.logout(true);
    };

    LeftNavViewModel.prototype.navigateTo = function (url) {
        this.applicationEvents.navigate.raise(url, { tab: true });
    };

    LeftNavViewModel.prototype.hyperlinkUtility = function () {
        if (this.dialogScreen === null) {
            this.dialogScreen = Object.resolve(DialogScreen);
        }
        var dialogOptions = {
            buttons: [
                { name: this.translator.translate('CLOSE'), value: 'cancel', cssClass: 'btn-default' }
            ],
            closeOnReject: true
        };
        var dialog = new DialogBox(this.dialogScreen, this.translator.translate('HYPERLINK_UTIL_TITLE'), dialogOptions);
        dialog.show();
    };

    function toggleRiskMenu(self) {
        self.isRiskMenuVisible(!self.isRiskMenuVisible());
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(false);
        calculateOffset(self, '.apps-list');
    }

    function toggleStrategyMenu(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(!self.isStrategyMenuVisible());
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(false);
        calculateOffset(self, '.apps-list.strat-list');

    }

    function togglePerformanceMenu(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(!self.isPerformanceMenuVisible());
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(false);
        calculateOffset(self, '.apps-list.performance-list');
    }

    function toggleAdminMenu(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(!self.isAdminMenuVisible());
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(false);
        calculateOffset(self, '.apps-list.admin-list');
    }

    function toggleToolsMenu(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(!self.isToolsMenuVisible());
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(false);
        calculateOffset(self, '.apps-list.tools-list');
    }

    function toggleAnalyticsMenu(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(!self.isAnalyticsMenuVisible());
        self.isOperationalToolsMenuVisible(false);
        calculateOffset(self, '.apps-list.analytics-list');
    }
    function toggleOperationalToolsMenu(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(!self.isOperationalToolsMenuVisible());
        calculateOffset(self, '.apps-list.operation-list');
    }


    function calculateOffset(self, appListContainerName) {
        if (!self.region) {
            return;
        }
        var appListContainer = self.region.$element.find(appListContainerName);
        var bottom = $(window).height() - $(appListContainerName).offset().top;
        var statusBarHeight = 25;
        var statusBarPadding = 20;
        var topNavHeight = 55;
        var menuContainerHeight = bottom - statusBarHeight - statusBarPadding;
        var marginTop;
        if ($(window).height() - $(appListContainer).offset().top - topNavHeight < $(appListContainer).height()) {
            //for floating menu down to upwards
            if ($(appListContainer).offset().top > $(appListContainer).find('.left-subnav').height()) {
                marginTop = $(appListContainer).offset().top - $(appListContainer).find('.left-subnav').height() + 12;
                $(appListContainer).css('margin-top', marginTop);
            }
            else {
                //for floating menu up to downwards
                marginTop = parseInt($(appListContainer).css('margin-top').replace('px', ''));
                $(appListContainer).find('.left-subnav').css('max-height', menuContainerHeight + marginTop);
                $(appListContainer).find('.left-subnav').css('overflow-y', 'auto');
                $(appListContainer).find('.left-subnav').css('overflow-x', 'hidden');
                $(appListContainer).css('margin-top', '0px');
            }
        }

    }

    function closeAllMenus(self) {
        self.isRiskMenuVisible(false);
        self.isStrategyMenuVisible(false);
        self.isPerformanceMenuVisible(false);
        self.isAdminMenuVisible(false);
        self.isToolsMenuVisible(false);
        self.isAnalyticsMenuVisible(false);
        self.isOperationalToolsMenuVisible(false);
    }

    function preventMenuClose() {
        $('.left-nav-main-menu').click(stopPropagation);
    }

    function stopPropagation(e) {
        e.stopPropagation();
    }

    function closeOnOutsideClick(self) {
        closeAllMenus(self);
    }

    return LeftNavViewModel;
});
