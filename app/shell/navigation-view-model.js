define(function (require) {
    'use strict';

    var $ = require('jquery'),
        R = require('ramda'),
        m = require('mithril'),
        deparam = require('jquery-deparam'),
        Translator = require('system/globalization/translator'),
        UrlManager = require('spa/url-manager'),
        TabBarViewModel = require('./tab-bar-view-model'),
        TabBarView = require('./views/tab-bar-view'),
        LeftnavViewModel = require('./leftnav-view-model'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        ActionRouteController = require('shell/action-route-controller'),
        Router = require('spa/router'),
        ScreenSize = require('ui/screen-size'),
        ActionRouteConfig = require('text!config/action-routes-config.json'),
        UnsavedMessageBox = require('system/ui/unsaved-changes-message-box');

    function NavigationViewModel(urlManager, appEvents, translator, tabBarVM, LeftNavVM) {
        this.urlManager = urlManager;
        this.appEvents = appEvents;
        this.translator = translator;
        this.__private__ = {
            doNavigation: true,
            tabBarVM: tabBarVM,
            leftNavVM: LeftNavVM,
            screenSize: Object.resolve(ScreenSize)
        };
    }

    NavigationViewModel.dependsOn = [UrlManager, ApplicationEvents, Translator, TabBarViewModel, LeftnavViewModel];
    NavigationViewModel.singleton = true;

    NavigationViewModel.prototype.attach = function (region) {
        getVm(this).attach();
        debugger
        m.mount(region.element, { controller: R.partial(getVm, [this]), view: TabBarView });
        this.urlManager.routesChanged.add(locationChanged, this, this);
        this.urlManager.activate();
        this.appEvents.navigate.add(appEventNavigate, this, this);
        this.appEvents.signout.add(signout, this, this);
    };

    function getVm (self) {
        return self.__private__.tabBarVM;
    }

    function getLeftNavVM(self) {
        return self.__private__.leftNavVM;
    }

    function locationChanged(self, routes) {

        if (routes.actionRoutes) {
            var router = new Router(),
                actionRouteController = new ActionRouteController(router, JSON.parse(ActionRouteConfig));

            actionRouteController.open(routes);
        }

        getVm(self).setActiveTabIndex(routes.active);
        if (checkForDefaultTabs(self, routes)) {
            if (!getDoNavigation(self)) {
                setDoNavigation(self, true);
                getVm(self).updateHrefs(routes.routes);
            } else {
                resetApplicationHelpContext();
                getVm(self).updateTabs(routes.routes, routes.query);
            }
        }
    }

    function isHomeRoute() {
        return R.isEmpty(ApplicationContext.navigation.activeRoute);
    }

    function getScreenSize(self) {
        return self.__private__.screenSize;
    }

    function getDoNavigation (self) {
        return self.__private__.doNavigation;
    }

    function setDoNavigation (self, value) {
        self.__private__.doNavigation = value;
    }

    function checkForDefaultTabs (self, routes) {
        var route, queryString;

        /*if (isScreenTooSmallForAllPages(self)) {
            if (routes.routes.length === 1 && routes.routes[0]==='') {
                routes = { routes: ['rounds/dashboard/user'] };
                replaceHash(self, routes, routes.routes[0], '');
            }
            return true;
        }*/

        /*if (routes.routes.length === 1) {
            route = routes.routes[0];
            routes.query = routes.query || {};
            delete routes.query.__isQueryString__;
            queryString = $.param(routes.query);
            routes = { routes: ['home', 'assets/hierarchy'] };
            if (route !== '') {
                routes.routes[2] = route;
            }
            replaceHash(self, routes, route, queryString);
            return false;
        }*/
        routes.routes[0] = ApplicationContext.homeRoute;
        return true;
    }

    function isScreenTooSmallForAllPages(self) {
        return getScreenSize(self).isTooSmallForAllPages();
    }

    function replaceHash(self, routes, route, queryString) {
        self.urlManager.replaceHash(routes.routes, route === '' ? 0: 2, queryString);
    }

    function resetApplicationHelpContext() {
        ApplicationContext.help.helpContext = '';
        ApplicationContext.help.isAdmin = false;
    }

    function appEventNavigate(self, url, options) {
        if (shouldOpenInExistingTab(options)) {
            openInExistingTab(self, url, options);
        } else {
            openInNewTab(self, url, options);
        }
    }

    function shouldOpenInExistingTab(options) {
        var isActionRoute = (options && options.isActionRoute),
            hasTabOption = (options && options.tab);

        return !isActionRoute && !hasTabOption;
    }

    function openInExistingTab(self, url, options) {
        getVm(self).canUnloadActiveTab(R.partial(navigate, [self, url, options]));
    }

    function openInNewTab(self, url, options) {
        if (options && options.isActionRoute) {
            openActionRoute(self, url);
        } else {
            navigate(self, url, options);
        }
    }

    function navigate(self, url, options) {
        var urlParts = url.split('?'),
            queryString = urlParts.length > 0 ? urlParts[1] : '',
            urls = getVm(self).getHrefs(),
            settings = { tab: false, background: false, replace: false, navigate: true },
            index = getVm(self).getActiveTabIndex(),
            activeTab;

        settings = R.merge(settings, options);
        url = urlParts.length > 0 ? urlParts[0] : url;
        url = url.replace(/^#/, '');
        if (settings.tab) {
            index = urls.length;
        }
        urls[index] = url;
        setDoNavigation(self, settings.navigate);
        activeTab = settings.background ? getVm(self).getActiveTabIndex() : index;       
        if (settings.replace) {
            self.urlManager.replaceHash(urls, activeTab, queryString);
        } else {
            self.urlManager.setHash(urls, activeTab, queryString);
        }
        return false;
    }

    function signout (self, e) {
        if (getVm(self).hasDirtyTab()) {
            e.promise = $.Deferred();
            UnsavedMessageBox.show()
                .fail(e.promise.reject.bind(e.promise))
                .done(signOutDirty.bind(null, self, e.promise));
        }
    }

    function signOutDirty (self, promise) {
        getVm(self).clearTabs();
        promise.resolve();
    }

    NavigationViewModel.prototype.openTab = function navigationViewModel_openTab(isActionRoute, url) {
        if (isActionRoute) {
            openActionRoute(this, url, getQueryString(url));
        } else {
            var urls, index,
                urlParts = url.split('?'),
                queryString = urlParts.length > 0 ? urlParts[1] : '';

            url = urlParts.length > 0 ? urlParts[0] : url;
            urls = getVm(this).getHrefs();
            urls[urls.length] = url.replace(/^#/, '');
            index = urls.length - 1;          
            this.urlManager.setHash(urls, index, queryString);
        }
    };

    NavigationViewModel.prototype.changeTab = function (isActionRoute, href) {
        if(isActionRoute) {
            openActionRoute(this, href, getQueryString(href));
        } else {
            if (getVm(this).isActiveTabHrefSame(href)) {
                return;
            }
            getVm(this).canUnloadActiveTab(R.partial(navigate, [this, href]));
        }
    };

    function getQueryString(url){
        var urlParts = url.split('?'),
            queryString = urlParts.length > 0 ? urlParts[1] : '';

        return queryString;
    }

    function openActionRoute(self, url, queryString) {
        var routes = {},
            router = new Router(),
            actionRouteController = new ActionRouteController(router, JSON.parse(ActionRouteConfig));

        routes.query = parseQueryString(url);
        url = url.split('?')[0];
        routes.actionRoutes = [];
        routes.actionRoutes.push(url);

        actionRouteController.open(routes);
    }

    function parseQueryString(url) {
        var sections = url.split('?'),
            queryString = sections.length > 0 ? sections[1] : null,
            query = queryString ? deparam(queryString) : null;

        return query;
    }

    NavigationViewModel.prototype.WindowBeforeUnload = function () {
        return getVm(this).hasDirtyTab() ? this.translator.translate('UNSAVED_CHANGES_MESSAGE') : undefined;
    };

    return NavigationViewModel;
});
