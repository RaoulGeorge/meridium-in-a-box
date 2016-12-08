define(function(require, exports, module) {
    'use strict';

    function ActionRouteUrlRemover() {

    }

    ActionRouteUrlRemover.remove = function(actionRouteUrl, routeInfo) {
        var subrouteUrl = routeInfo.arguments.url,
            fullActionRoute = getFullActionRouteUrl(actionRouteUrl, subrouteUrl);

        fullActionRoute = removeParamsFromUrl(fullActionRoute, routeInfo);

        removeFromUrl(fullActionRoute);
    };

    function removeFromUrl(fullActionRoute) {
        window.location.href = window.location.href.replace(fullActionRoute, '');
    }

    function getFullActionRouteUrl(actionRouteUrl, subrouteUrl) {
        var actionRoutePrefix = ';act=',
            fullActionRoute;

        if (!subrouteUrl) {
            fullActionRoute = actionRoutePrefix + actionRouteUrl;
        } else {
            fullActionRoute = actionRoutePrefix + actionRouteUrl + subrouteUrl;
            fullActionRoute = removeSplat(fullActionRoute);
        }

        return fullActionRoute;
    }

    function removeSplat(str) {
        return str.replace('*', '');
    }

    function removeParamsFromUrl(fullActionRoute, routeInfo) {
        var obj = routeInfo.arguments.named;

        for (var name in obj) {
            if (fullActionRoute.indexOf(name) > -1) {
                fullActionRoute = fullActionRoute.replace('@' + name, obj[name]);
            }
        }

        return fullActionRoute;
    }

    return ActionRouteUrlRemover;
});