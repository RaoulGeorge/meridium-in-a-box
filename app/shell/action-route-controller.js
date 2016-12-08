define(function(require) {
    'use strict';

    var Router = require('spa/router'),
        RouterConfig = require('text!config/action-routes-config.json');

    var routerConfigObject = JSON.parse(RouterConfig);

    function ActionRouteController(router, routerConfig) {
        this.router = router;
        this.router.routerConfig = routerConfig;
    }

    ActionRouteController.prototype.open = function(routes) {
        addIsActionRouteProperty(this);
        this.router.activate();

        for (var i = 0; i < routes.actionRoutes.length; i++) {
            this.router.resolve(routes.actionRoutes[i], routes.query);
        }
    };

    function addIsActionRouteProperty(self) {
        for (var i = 0; i < self.router.routerConfig.length; i++) {
            self.router.routerConfig[i].isActionRoute = true;
        }
    }

    return ActionRouteController;
});