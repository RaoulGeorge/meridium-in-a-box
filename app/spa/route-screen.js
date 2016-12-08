define(function (require) {
    'use strict';
    var Region = require('spa/region'),
        Router = require('spa/router');

    function RouteScreen(routeConfig, contentSelector) {
        this.routeConfig = routeConfig;
        this.contentSelector = contentSelector;
        this.contentRegion = new Region();
        this.subRouter = null;
    }

    RouteScreen.prototype.activate = function () {
        this.subRouter = Object.resolve(Router);
        this.subRouter.routerConfig = this.routeConfig;
        this.subRouter.matchedRoute.add(this.route, this);
        this.subRouter.activate();
    };

    RouteScreen.prototype.attach = function (region) {
        this.contentRegion.setElement(region.$element.find(this.contentSelector));
    };

    RouteScreen.prototype.route = function (routeInfo) {
        this.changeScreen(routeInfo.screen, this.contentRegion, routeInfo.arguments);
    };

    RouteScreen.prototype.deactivate = function () {
        this.subRouter.matchedRoute.removeAll();
        this.subRouter.deactivate();
        this.subRouter = null;
    };

    return RouteScreen;
});