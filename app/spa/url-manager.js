define(function (require) {
    'use strict';

    var _ = require('lodash');
    var Promise = require('bluebird');
    var Event = require('system/lang/event');

    var HASH_CHANGE_EVENT = 'hashchange',
        HASH_PATTERN = /^#/;

    function UrlManager(eventSource, strategy) {
        this.eventSource = eventSource;
        this.location = this.eventSource.location;
        this.strategy = strategy;
        this.routesChanged = new Event();
        this.routeInfo = null;
    }

    UrlManager.prototype.activate = function () {
        listenToHashChange(this);
        this.handleEvent();
    };

    function listenToHashChange(self) {
        self.eventSource.addEventListener(HASH_CHANGE_EVENT, self);
    }

    UrlManager.prototype.handleEvent = function (e) {
        var routeInfo = this.parse(this.location.hash.replace(HASH_PATTERN, ''));
        if (this.strategy.removeQueryString && routeInfo.query) {
            return this.overrideHash(routeInfo.routes, routeInfo.active)
                .then(updateRouteInfo.bind(null, this, routeInfo));
        }
        updateRouteInfo(this, routeInfo);
    };

    UrlManager.prototype.parse = function (url) {
        return this.strategy.parse(url);
    };

    function updateRouteInfo(self, routeInfo) {
        self.routeInfo = routeInfo;
        self.onRoutesChanged();
    }

    UrlManager.prototype.overrideHash = function (routes, activeRoute, queryString) {
        var self = this;
        return new Promise(function (resolve) {
            stopListeningToHashChange(self);
            self.location.replace(self.strategy.getHash(routes, activeRoute, queryString));
            _.defer(resumeListeningToHashChange.bind(null, self, resolve));
        });
    };

    function stopListeningToHashChange(self) {
        self.eventSource.removeEventListener(HASH_CHANGE_EVENT, self);
    }

    function resumeListeningToHashChange(self, resolve) {
        listenToHashChange(self);
        resolve();
    }

    UrlManager.prototype.onRoutesChanged = function (routeInfo) {
        routeInfo = routeInfo || this.routeInfo;
        this.routesChanged.raise(routeInfo);
    };

    UrlManager.prototype.setHash = function (routes, activeRoute, queryString) {
        this.location.hash = this.strategy.getHash(routes, activeRoute, queryString);
    };

    UrlManager.prototype.replaceHash = function (routes, activeRoute, queryString) {
        var url = this.strategy.getHash(routes, activeRoute, queryString);
        this.location.replace(url);
    };

    UrlManager.prototype.refresh = function () {
        var routeInfo = _.cloneDeep(this.routeInfo);
        routeInfo.routes[routeInfo.active] = 'empty-page';
        this.onRoutesChanged(routeInfo);
        this.onRoutesChanged();
    };

    return UrlManager;
});
