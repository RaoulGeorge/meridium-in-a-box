define(function (require) {
    'use strict';

    var _ = require('lodash');
    var KnockoutViewModel = require('./knockout-view-model'),
        Conductor = require('spa/conductor'),
        Region = require('spa/region'),
        Router = require('spa/router');

    function KnockoutRouteScreen(view, routeConfig, contentSelector, conductor) {
        base.call(this, view);
        this.routeConfig = routeConfig;
        this.contentSelector = contentSelector;
        this.conductor = conductor || Object.resolve(Conductor);
        this.contentRegion = new Region();
        this.subRouter = null;
        this.url = undefined;
        this.routeArgs = [];
    }

    var base = Object.inherit(KnockoutViewModel, KnockoutRouteScreen);

    KnockoutRouteScreen.prototype.canReuse = function knockoutRouteScreen_canReuse() {
        return true;
    };

    KnockoutRouteScreen.prototype.reuse = function knockoutRouteScreen_reuse(region, url) {
        var routeArgs = _.rest(arguments, 2);
        this.resolveSubRoute(url, routeArgs);
    };

    KnockoutRouteScreen.prototype.activate = function knockoutRouteScreen_activate() {
        this.routeArgs = _.toArray(arguments);
        this.subRouter = Object.resolve(Router);
        this.subRouter.routerConfig = this.routeConfig;
        this.subRouter.matchedRoute.add(this.route, this);
        this.subRouter.activate();
    };

    KnockoutRouteScreen.prototype.attach = function knockoutRouteScreen_attach(region) {
        base.prototype.attach.call(this, region);
        this.contentRegion.setElement(region.$element.find(this.contentSelector));
    };

    KnockoutRouteScreen.prototype.route = function knockoutRouteScreen_route(routeInfo) {
        this.conductor.changeScreen(routeInfo.screen, this.contentRegion, routeInfo.arguments);
    };

    KnockoutRouteScreen.prototype.resolveSubRoute = function knockoutRouteScreen_resolveSubRoute(url, routeArgs) {
        var lastArg = _.last(routeArgs),
            hasQueryString = lastArg && lastArg.__isQueryString__;
        if (this.url === url && !hasQueryString) {
            this.conductor.showScreen(this.contentRegion, url);
            return;
        }

        if (this.subRouter) {
            this.url = url;
            if (hasQueryString) {
                this.subRouter.resolve(url, lastArg);
            } else {
                this.subRouter.resolve(url);
            }
        }
    };

    KnockoutRouteScreen.prototype.detach = function KnockoutRouteScreen_detach() {
        base.prototype.detach.apply(this, arguments);
        this.conductor.hideScreen(this.contentRegion);
    };

    KnockoutRouteScreen.prototype.deactivate = function knockoutRouteScreen_deactivate() {
        if (this.subRouter) {
            this.subRouter.matchedRoute.remove();
            this.subRouter.deactivate();
        }
    };

    KnockoutRouteScreen.prototype.canUnload = function knockoutRouteScreen_canUnload() {
        return this.conductor.canUnloadScreen(this.contentRegion.screen);
    };

    KnockoutRouteScreen.prototype.isDirty = function () {
        if (this.contentRegion && this.contentRegion.screen && this.contentRegion.screen.isDirty) {
            return this.contentRegion.screen.isDirty();
        } else {
            return false;
        }
    };

    KnockoutRouteScreen.prototype.unload = function knockoutRouteScreen_unload() {
        if (this.conductor.clearScreen) {
            this.conductor.clearScreen(this.contentRegion);
        }
        this.url = undefined;
    };

    return KnockoutRouteScreen;
});
