define(function(require) {
    'use strict';

    var _ = require('lodash'),
        $ = require('jquery'),
        Router = require('spa/router');

    function ActionRouteScreen(routeConfig) {
        this.routeConfig = routeConfig;
    }

    ActionRouteScreen.prototype.execute = function(config) {
        var dfd = $.Deferred(),
            url = config.routeInfo.arguments.url,
            query = config.query;

        activate(this);
        resolveSubRoute(this, url, query);
        this.subRouter.matchedRoute.add(matchedRouteHandler.bind(null, config, dfd));

        return dfd;
    };

    function matchedRouteHandler(config, dfd, subrouteInfo) {
        config.query = subrouteInfo.arguments.positional;
        config.routeArgs = subrouteInfo.arguments.named;
        subrouteInfo.screen.execute(config).done(subrouteExecute_done.bind(null, dfd));
    }

    function subrouteExecute_done(dfd, options) {
        dfd.resolve(options);
    }

    function activate(self) {
        self.routeArgs = _.toArray(arguments);
        self.subRouter = Object.resolve(Router);
        self.subRouter.routerConfig = self.routeConfig;
        self.subRouter.activate();
    }

    function resolveSubRoute(self, url, query) {
        if (self.subRouter) {
            if (query) {
                self.subRouter.resolve(url, query);
            } else {
                self.subRouter.resolve(url);
            }
        }
    }

    return ActionRouteScreen;
});