define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        Assert = require('mi-assert'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        IRouter = require('./i-router'),
        Router = require('./router'),
        HdRouterProxy = require('spa/hd-router-proxy'),
        ApplicationContext = require('application/application-context'),
        _private = require('system/lang/private');

    var NOT_AVAILABLE_OFFLINE_MODULE = 'status-pages/not-available-offline/feature-not-available-view-model';

    function OfflineAccess(routerConfig) {
        base.call(this, routerConfig);
        _private(this).isOffline = !ApplicationContext.connectionStatus.connected;
        Assert.implementsInterface(this, IRouter, 'this');
        assertThis(this);
    }
    var base = Object.inherit(HdRouterProxy, OfflineAccess);

    OfflineAccess.prototype.routeMatchedHandler = function (event) {
        assertThis(this);
        assertRouteMatchedEvent(event);
        event = validateConnectionStatus(this, event);
        base.prototype.routeMatchedHandler.call(this, event);
    };

    function validateConnectionStatus(self, event) {
        logConnectionStatus(self);
        if (!getIsOffline(self)) { return event; }
        event = handleIsOffline(event);
        return event;
    }

    function logConnectionStatus(self) {
        logger.trace(getIsOffline(self).toString());
    }

    function getIsOffline(self) {
        assertThis(self);
        return _private(self).isOffline ? _private(self).isOffline : false;
    }

    function disableModuleAsOffline(event) {
        assertRouteMatchedEvent(event);
        logger.info('Page ', event.config.url, ' is not available offline; setting module to ', NOT_AVAILABLE_OFFLINE_MODULE);
        event.module = NOT_AVAILABLE_OFFLINE_MODULE;
        assertRouteMatchedEvent(event);
        return event;
    }

    function handleIsOffline(event) {
        if (isAvailableOffline(event)) { return event; }
        return disableModuleAsOffline(event);
    }

    function isAvailableOffline(event) {
        assertRouteMatchedEvent(event);
        return !!event.config['available-offline'];
    }

    OfflineAccess.prototype.createScreenInstance = function (event, module) {
        return base.prototype.createScreenInstance.call(this, event, module);
    };

    OfflineAccess.prototype.createConnectionInstance = function (event, module) {
        var conn = base.prototype.createConnectionInstance.call(this, event, module);
        if (isAccessibleOfflineModule(event)) {
            conn.isAvailableOffline = isAvailableOffline(event);
            conn.usingPageOfflineRoute = moduleMatchesConfig(event);
        }
        return conn;
    };

    function isAccessibleOfflineModule(event) {
        return event.module === NOT_AVAILABLE_OFFLINE_MODULE;
    }

    function moduleMatchesConfig(event) {
        return event.module === event.config.module;
    }

    function assertThis(self) {
        if (Assert.enabled) {
            Assert.instanceOf(self, OfflineAccess, 'self');
            Assert.isBoolean(_private(self).isOffline, '_private(self).isOffline');
        }
    }

    function assertRouteMatchedEvent(event) {
        if (Assert.enabled) {
            Assert.ok(event, 'event');
            Assert.stringNotEmpty(event.module, 'event.module');
        }
    }

    return OfflineAccess;
});