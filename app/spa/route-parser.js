define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');


    var Event = require('system/lang/event'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id);

    var MATCH_PARAMETERS_REGEX = /\*|@\w*/g,
        ROUTE_REGEX = /^$/,
        NAMED_PARAMETER_REGEX = /@\w+/g,
        OPTIONAL_PARAMETER_REGEX = /@/g,
        SPLAT_REGEX = /\/\*/g,
        LEADING_AND_TRAILING_SLASH_REGEX = /^\/|\/$/g;

    var NAMED_PARAMETER_REPLACE = '([^/]*)',
        OPTIONAL_PARAMETER_REPLACE = '?(.*)',
        SPLAT_REPLACE = '\/?(.*)';

    function RouteParser() {
        this.routes = [];
        this.routeMatched = new Event();
        this.badRoute = new Event();
    }

    RouteParser.prototype.dispatch = function (url, query) {
        if (logger.isTraceEnabled()) { logger.trace('dispatch url ', url); }
        var match = this.match(url);
        if (match === undefined) {
            logger.warn('unmatched url ', url);
            this.badRoute.raise({ url: url });
            return;
        }
        var values = this.parse(url, match, query);
        this.routeMatched.raise({ module: match.module, arguments: values, config: copyRouteConfig(match) });
    };

    function copyRouteConfig(routeConfig) {
        var copy = $.extend({}, routeConfig);
        if (copy.matches) { delete copy.matches; }
        if (copy.regExp) { delete copy.regExp; }
        return copy;
    }

    RouteParser.prototype.load = function (config) {
        this.routes = config;
        if (logger.isTraceEnabled()) { logger.trace('configure Routes'); }
        this.routes.forEach(RouteParser.configureRoute);
    };

    RouteParser.configureRoute = function (route) {
        var regex, match,
            matchParameters = MATCH_PARAMETERS_REGEX;

        route.matches = [];
        if ((route.url || '') === '') {
            route.regExp = ROUTE_REGEX;
            return route;
        }

        regex = '^' + route.url
            .replace(NAMED_PARAMETER_REGEX, NAMED_PARAMETER_REPLACE) //Match named parameters
            .replace(OPTIONAL_PARAMETER_REGEX, OPTIONAL_PARAMETER_REPLACE) //Match optional paramters
            .replace(SPLAT_REGEX, SPLAT_REPLACE) + '$'; //splat
        route.regExp = new RegExp(regex, 'i');

        if (logger.isTraceEnabled()) { logger.trace('url: ', route.url, ' regex: ', regex); }

        match = matchParameters.exec(route.url);
        while (match !== null) {
            route.matches.push(match[0]);
            match = matchParameters.exec(route.url);
        }
        return route;
    };

    RouteParser.prototype.match = function (url) {
        url = url.replace(LEADING_AND_TRAILING_SLASH_REGEX, '');
        for (var index = 0; index < this.routes.length; index++) {
            this.routes[index].regExp.lastIndex = 0;
            if (this.routes[index].regExp.test(url)) {
                if (logger.isTraceEnabled()) { logger.trace('route match ', url, ' matched ', this.routes[index]); }
                return this.routes[index];
            }
        }
    };

    RouteParser.prototype.parse = function (url, route, query) {
        var match, index,
            values = {
                named: null,
                positional: [],
                url: '',
                icon: ''
            };

        if (logger.isTraceEnabled()) { logger.trace('parse values'); }
        //url = url.replace(/^\/|\/$/g, '');
        url = url.replace(LEADING_AND_TRAILING_SLASH_REGEX, '');
        route.regExp.lastIndex = 0;
        match = route.regExp.exec(url);
        if (match !== null) {
            for (index = 1; index < match.length; index++) {
                pushValues(values, match[index], route.matches[index - 1]);
            }
        }
        if (query) {
            values.positional.push(query);
        }
        values.icon = route.icon;
        if (logger.isTraceEnabled()) { logger.trace('parsed values: ', values); }
        return values;
    };

    function pushValues(values, match, matchType) {
        if (logger.isTraceEnabled()) { logger.trace(match, matchType); }
        if (matchType === undefined || match === undefined) {
            return;
        }
        if (matchType === '*') {
            values.url = match;
            return;
        }
        if (matchType === '@') {
            var items = match.split('/');
            if (items[items.length - 1] === '') {
                items.pop();
            }
            Array.prototype.push.apply(values.positional, items);
            return;
        }
        if (values.named === null) {
            values.named = {};
        }
        values.named[matchType.substring(1)] = match;
    }

    return RouteParser;
});