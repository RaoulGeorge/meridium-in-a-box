define(function (require) {
    'use strict';
    var deparam = require('jquery-deparam'),
        MessageBox = require('system/ui/message-box'),
        ApplicationContext = require('application/application-context'),
        // DatasheetDialog = require('platform/static-module/load-datasheet-dialog-model'),
        ScreenSize = require('ui/screen-size'),
        Translator = require('system/globalization/translator');

    var QUERY_STRING_DELIMITER = '?',
        ROUTE_DELIMITER = ';rte=',
        ACTION_ROUTE_DELIMITER = ';act=';

    function MultiRouteStrategy(maxRoutes, staticRoutes, removeQueryString) {
        this.maxRoutes = maxRoutes;
        this.staticRoutes = staticRoutes;
        this.removeQueryString = removeQueryString;
        this.screenSize = Object.resolve(ScreenSize);
        this.translator = Object.resolve(Translator);
        this.previousActiveRoute = 0;
    }

    MultiRouteStrategy.prototype.parse = function (url) {
        var routes,
            actionRoutes,
            active = 0,
            sections = url.split(QUERY_STRING_DELIMITER),
            routeSegments = sections.length >= 0 ? sections[0] : null,
            queryString = sections.length > 0 ? sections[1] : null,
            query = queryString ? deparam(queryString) : null,
            actionSegments = routeSegments.split(ACTION_ROUTE_DELIMITER),
            delimitersRegEx = /(;rte=)|(;act=)/igm,
            segments;

        segments = routeSegments.split(delimitersRegEx);

        cleanSegmentsArray(segments);

        if (actionSegments.length > 1) {
            removeActionRoutesFromSegments(segments, actionSegments);
        }

        //Calling datasheet dialog to check and load a datasheet using query param
        // this.getDatasheetDialog(query);
        if (segments.length === 1) {
            routes = [segments[0]];
        } else {
            routes = segments.slice(1);
            active = parseInt(segments[0], 10);
            if (isNaN(active)) { active = 0; }
            active = Math.min(active, routes.length - 1);
        }

        if(actionSegments.length > 1){
            actionRoutes = actionSegments.slice(1);
        }

        if (query) {
            query.__isQueryString__ = true;
        }

        this.previousActiveRoute = active;
        ApplicationContext.navigation.activeRoute = routes[active];
        return { routes: routes, active: active, query: query, actionRoutes: actionRoutes };
    };

    function cleanSegmentsArray(segments) {
        removeFromArray(segments, ROUTE_DELIMITER);
        removeFromArray(segments, ACTION_ROUTE_DELIMITER);
        removeFromArray(segments, undefined);
    }

    function removeActionRoutesFromSegments(segments, actionSegments) { //need to prevent name collision
        var actionSegmentsSliced = actionSegments.slice(1);

        for(var i = 0; i < actionSegmentsSliced.length; i++){
            removeFromArray(segments, actionSegmentsSliced[i]);
        }
    }

    function removeFromArray(segments, search_term) {
        for (var i = segments.length - 1; i >= 0; i--) {
            if (segments[i] === search_term) {
                segments.splice(i, 1);
            }
        }
    }

    MultiRouteStrategy.prototype.getDatasheetDialog = function (query) {
        //Checking wheather a query string contains datasheet-dialog then go ahead and load datasheet dialog
        //This mechanism can load multiple datasheet dialog if needed
        // for (var i in query) {
        //     if (query.hasOwnProperty(i)) {
        //         if (i === 'datasheet-dialog') {
        //             this.datasheetDialog = new DatasheetDialog(query[i]);
        //         }
        //     }
        // }
    };

    MultiRouteStrategy.prototype.getHash = function (routes, activeRoute, queryString) {
        var routeInfo;
        routes = validateRoutes(routes);
        if (routes.length === 0) { return '#'; }
        activeRoute = validateActiveRoute(routes, activeRoute);
        routeInfo = limitNumberOfRoutes(this, routes, activeRoute);

        //Including home route only for large screens
        if (!isTooSmallScreen(this)) {
            routes = forceHomeIfMultiRoute(routeInfo.routes);
        }
        activeRoute = routeInfo.activeRoute;

        if (queryString) {
            queryString = '?' + queryString;
        } else {
            queryString = '';
        }

        this.previousActiveRoute = activeRoute;
        return '#' + activeRoute + ROUTE_DELIMITER + routes.join(ROUTE_DELIMITER) + queryString;
    };

    function isTooSmallScreen(self) {
        return self.screenSize.isTooSmallForAllPages();
    }

    function forceHomeIfMultiRoute(routes) {
        if (routes.length > 1) {
            routes[0] = 'home';
        }
        return routes;
    }

    function validateRoutes(routes) {
        routes = routes || [];
        if (routes instanceof Array) {
            return routes;
        } else {
            return [routes];
        }
    }

    function validateActiveRoute(routes, activeRoute) {
        activeRoute = parseInt(activeRoute, 10) || 0;
        activeRoute = Math.min(activeRoute, routes.length - 1);
        return activeRoute;
    }

    function limitNumberOfRoutes(self, routes, activeRoute) {
        var message, title;
        if (activeRoute > self.maxRoutes + self.staticRoutes - 1) {
            activeRoute = self.previousActiveRoute;
            message = self.translator.translate('TAB_LIMIT_EXCEEDED_MESSAGE');
            title = self.translator.translate('TAB_LIMIT_EXCEEDED');
            routes.pop();
            MessageBox.showOk(message, title);
        }
        return {
            routes: routes,
            activeRoute: activeRoute
        };
    }

    return MultiRouteStrategy;
});