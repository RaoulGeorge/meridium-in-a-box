define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        CatalogPathResolver = require('spa/action-routes/routes/catalog-path/catalog-path-resolver');

    function CatalogPathActionRoute() {

    }

    CatalogPathActionRoute.prototype.execute = function (config) {
        var dfd = $.Deferred(),
            catalogPath = config.query[0].path,
            catalogActionRoute = new CatalogPathResolver();

        catalogActionRoute.getRoute(catalogPath).done(getRoute_done.bind(null, dfd));

        return dfd;
    };

    function getRoute_done(dfd, routeString) {
        var actionRouteOptions = {};

        actionRouteOptions.route = routeString;

        dfd.resolve(actionRouteOptions);
    }

    return CatalogPathActionRoute;
});