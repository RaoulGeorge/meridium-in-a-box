define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Assert = require('mi-assert'),
        IRouter = require('./i-router'),
        Event = require('system/lang/event'),
        ActionRouteOpener = require('spa/action-routes/action-route-opener'),
        RouteParser = require('spa/route-parser');

    var BAD_ROUTE_MODULE = 'status-pages/url-not-supported/url-not-supported-view-model';

    function Router(routerConfig) {
        this.routerConfig = routerConfig || {};
        this.routeParser = new RouteParser();
        this.matchedRoute = new Event();
        this.loadModuleDeferred = null;
        this.matchedRouteQueue = [];
        Assert.implementsInterface(this, IRouter);
    }

    Router.prototype.activate = function () {
        this.routeParser.load(this.routerConfig);
        this.routeParser.routeMatched.add(this.routeMatchedHandler, this);
        this.routeParser.badRoute.add(this.badRouteHandler, this);
    };

    Router.prototype.resolve = function (url, query) {
        if (query) {
            this.routeParser.dispatch(url, query);
        } else {
            this.routeParser.dispatch(url);
        }
    };

    Router.prototype.deactivate = function () {
        this.routeParser.routeMatched.remove();
        this.routeParser.badRoute.remove();
    };

    Router.prototype.routeMatchedHandler = function (event) {
        addToQueue(this, event);
        processQueue(this);
    };

    function addToQueue (self, event) {
        self.matchedRouteQueue[self.matchedRouteQueue.length] = event;
    }

    function popAndClearQueue (self) {
        var item;
        if (self.matchedRouteQueue.length > 0) {
            item = self.matchedRouteQueue[self.matchedRouteQueue.length - 1];
        }
        self.matchedRouteQueue = [];
        return item;
    }

    function processQueue(self) {
        var next;
        if (!self.loadModuleDeferred) {
            next = popAndClearQueue(self);
            if (next) {
                self.loadModule(next.module)
                    .done(self.raiseMatchedRoute.bind(self, next));
            }
        }
    }

    Router.prototype.raiseMatchedRoute = function (event, module) {
        var routeInfo = {};
        routeInfo.arguments = event.arguments;
        routeInfo.screen = this.createScreenInstance(event, module);
        routeInfo.conn = this.createConnectionInstance(event, module);
        this.matchedRoute.raise(routeInfo);
        this.loadModuleDeferred = null;

        if (event.config && event.config.isActionRoute) {
            var actionRouteOpener = new ActionRouteOpener();

            actionRouteOpener.open(event, routeInfo);
        }

        processQueue(this);
    };

    Router.prototype.createScreenInstance = function (event, module) {
        return Object.resolve(module);
    };

    Router.prototype.createConnectionInstance = function (event, module) {
        return Object.resolve(module);
    };

    Router.prototype.badRouteHandler = function () {
        this.routeMatchedHandler(buildBadRouteEvent());
    };

    function buildBadRouteEvent() {
        return {
            arguments: { named: null, positional: [], url: '', icon: '' },
            module: BAD_ROUTE_MODULE
        };
    }

    Router.prototype.loadModule = function (module) {
        this.loadModuleDeferred = $.Deferred();
        require([module], onRequireSuccess.bind(null, this), onRequireFail.bind(null, this));
        return this.loadModuleDeferred.promise();
    };

    function onRequireSuccess(self, module) {
        self.loadModuleDeferred.resolve(module);
    }

    function onRequireFail(self, err) {
        console.error(err);
        require([BAD_ROUTE_MODULE], onRequireSuccess.bind(null, self));
    }

    return Router;
});
