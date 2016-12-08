define(function (require) {
    'use strict';

    var UrlManager = require('spa/url-manager'),
        MultiRouteStrategy = require('spa/multi-route-strategy'),
        Router = require('spa/router'),
        OfflineAccess = require('spa/offline-access');

    UrlManager.singleton = true;
    UrlManager.factory = function () {
        var MAXIMUM_ROUTES = 8,
            STATIC_ROUTES = 2,
            REMOVE_QUERY_STRING = true,
            routeStrategy = new MultiRouteStrategy(MAXIMUM_ROUTES, STATIC_ROUTES, REMOVE_QUERY_STRING);
        return new UrlManager(window, routeStrategy);
    };

    Router.factory = function () {
        return Object.resolve(OfflineAccess);
    };

});