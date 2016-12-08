define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutRouteScreen = require('spa/ko/knockout-route-screen'),
        view = require('text!../views/security-shell.html'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        Event = require('system/lang/event'),
        Translator = require('system/globalization/translator');

    var BAD_ROUTE_MODULE = '#access-denied';

    function SecurityShellViewModel(applicationEvents) {
        var routes = [
                { url: 'manager', module: 'security/users/view-models/users-view-model' },
                { url: 'manager/user', module: 'security/users/view-models/users-view-model' },
                { url: 'manager/group', module: 'security/groups/view-models/groups-view-model' },
                { url: 'manager/group/@entityKey', module: 'security/view-models/group-view-model' },
                { url: 'manager/role', module: 'security/roles/view-models/role-view-model' },
                { url: 'manager/password', module: 'security/view-models/password-policy-view-model' },
                { url: 'manager/fmlypriv', module: 'security/permissions/view-models/permissions-view-model' },
                { url: 'manager/ldap', module: 'security/view-models/ldap-sync-view-model' },
                { url: 'manager/site', module: 'security/view-models/site-view-model' },
                { url: 'manager/userdefaults', module: 'security/view-models/user-defaults-view-model' },
                { url: 'account/@', module: 'security/view-models/login-view-model' }
        ];

        base.call(this, view, routes, 'div.security-content');

        this.titleChanged = applicationEvents.titleChanged;
        this.translator = Object.resolve(Translator);
        this.appEvents=applicationEvents;
        this.menuItems = ko.observableArray([
            {
                caption: ko.observable(this.translate('USERS')),
                href: ko.observable('#security/manager/user'),
                url: 'manager/user',
                tabName: this.translate('SEC_USER_MANAGER'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('GROUPS')),
                href: ko.observable('#security/manager/group'),
                url: 'manager/group',
                tabName: this.translate('SEC_GROUP_MANAGER'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('ROLES')),
                href: ko.observable('#security/manager/role'),
                url: 'manager/role',
                tabName: this.translate('SEC_ROLE_MANAGER'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('SEC_SHELL_PWD_POLICY')),
                href: ko.observable('#security/manager/password'),
                url: 'manager/password',
                tabName: this.translate('SEC_PASSWORD_MANAGER'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('SITES')),
                href: ko.observable('#security/manager/site'),
                url: 'manager/site',
                tabName: this.translate('SITES'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('DATA_PERMISSIONS')),
                href: ko.observable('#security/manager/fmlypriv'),
                url: 'manager/fmlypriv',
                tabName: this.translate('DATA_PERMISSIONS'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('LDAP')),
                href: ko.observable('#security/manager/ldap'),
                url: 'manager/ldap',
                tabName: this.translate('SEC_LDAP_MANAGER'),
                isActive: ko.observable(false)
            },
            {
                caption: ko.observable(this.translate('USER_DEFAULTS')),
                href: ko.observable('#security/manager/userdefaults'),
                url: 'manager/userdefaults',
                tabName: this.translate('USER_DEFAULTS'),
                isActive: ko.observable(false)
            }
         ]);

        this.user=ApplicationContext.user;
        this.badRoute = new Event();
    }

    var base = Object.inherit(KnockoutRouteScreen, SecurityShellViewModel);

    SecurityShellViewModel.dependsOn = [ApplicationEvents];

    SecurityShellViewModel.prototype.open = function shellViewModel_open() {
        this.titleChanged.raise(this.translate('SEC_SHELL_SECURITY_MGR'), this);
    };

    SecurityShellViewModel.prototype.activate = function shellViewModel_activate() {
        base.prototype.activate.call(this);
    };

    SecurityShellViewModel.prototype.canReuse = function securityShellViewModel_canReuse() {
        return true;
    };

    SecurityShellViewModel.prototype.reuse = function securityShellViewModel_reuse(region, url) {
        if (canAccessRoute(this,url)) {
            this.resolveSubRoute(url);
            this.setActiveMenuItem(url);
        } else {
            this.appEvents.navigate.raise('#access-denied', { replace: true });
        }
    };

    SecurityShellViewModel.prototype.attach = function attach(region, url) {
        base.prototype.attach.call(this, region);
        if (canAccessRoute(this,url)) {
            this.resolveSubRoute(url);
            this.setActiveMenuItem(url);
        } else {
            this.appEvents.navigate.raise('#access-denied', { replace: true });
        }
    };

    SecurityShellViewModel.prototype.deactivate = function () {
        base.prototype.deactivate.call(this);
    };

    SecurityShellViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    SecurityShellViewModel.prototype.setActiveMenuItem =
        function securityShellViewModel_setActiveMenuItem(url) {
            var i = 0,
                activeIndex = 0,
                activeItem,
                menu = this.menuItems();
            if (!url || !menu) {
                return;
            }

            // Deactivate all items and find active index.
            for (i = 0; i < menu.length; i++) {
                menu[i].isActive(false);
                if (url.substr(url.indexOf('/'), menu[i].url.length) === menu[i].url.substr(menu[i].url.indexOf('/'),menu[i].url.length)) {
                    activeIndex = i;
                }
            }

            activeItem = menu[activeIndex];
            // Set the active item.
            if (activeItem) {
                activeItem.isActive(true);
            }

            if (activeItem.tabName) {
                this.titleChanged.raise(activeItem.tabName, this);
            }
        };

    function canAccessRoute(self,url) {
        // Check to see if they are accessing security manager pages, they have the rights to
        if (url==='manager/user' || url==='manager/group' || url==='manager/role' || url==='manager/password' ||
           url === 'manager/ldap' || url === 'manager/fmlypriv' || url === 'manager/site' || url === 'securitymanager' || url === 'manager/userdefaults') {
            if (self.user.isSuperUser) {
                return true;
            }
            if (self.user.groups === undefined || self.user.groups === null) {
                return false;
            }
            console.log(url);
            console.log(self.user.groups);
            for (var i = 0; i < self.user.groups.length; i++) {
                if (url!=='manager/site' && url!=='manager/fmlypriv') {
                    if (self.user.groups[i].id === 'MI APMNow Admin') {
                        return false;
                    }
                }
                if (self.user.groups[i].id === 'MI Security Role') {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    return SecurityShellViewModel;
});