define(function(require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        ActionRouteClose = require('spa/action-routes/action-route-close'),
        BusyIndicator = require('system/ui/busy-indicator'),
        ActionRouterUrlRemover = require('spa/action-routes/action-route-url-remover'),
        ApplicationEvents = require('application/application-events');

    function ActionRouteOpener() {

    }

    ActionRouteOpener.prototype.open = function(event, routeInfo) {
        openActionRoute(event, routeInfo);
    };

    function openActionRoute(event, routeInfo) {
        var busyIndicator = new BusyIndicator('loading-extra-large'),
            actionRouteClose = new ActionRouteClose(busyIndicator),
            queryObject = routeInfo.arguments.positional,
            routeArgs = routeInfo.arguments.named,
            config = {};

        config.query = queryObject;
        config.routeArgs = routeArgs;
        config.routeInfo = routeInfo;

        busyIndicator.attachTo(document.querySelector('#shell'));
        busyIndicator.show();
        actionRouteClose.handleBusyIndicatorClose();

        routeInfo.screen.execute(config).done(actionRouteExecute_done.bind(null, busyIndicator))
                                        .fail(actionRouteExecute_fail.bind(null, busyIndicator));

        ActionRouterUrlRemover.remove(event.config.url, routeInfo);
    }

    function actionRouteExecute_done(busyIndicator, options) {
        if (options && options.route) {
            navigateToRoute(options.route);
        }

        busyIndicator.hide();
    }

    function navigateToRoute(route) {
        var applicationEvents = Object.resolve(ApplicationEvents),
            navigationOptions = {
                tab: true
            };

        applicationEvents.navigate.raise(route, navigationOptions);
    }

    function actionRouteExecute_fail(busyIndicator) {
        busyIndicator.hide();
    }

    return ActionRouteOpener;
});