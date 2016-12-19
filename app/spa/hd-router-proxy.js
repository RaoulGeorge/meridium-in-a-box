define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        IRouter = require('./i-router'),
        Router = require('./router'),
        ScreenSize = require('ui/screen-size');

    var INVALID_SCREEN_SIZE_MODULE = 'status-pages/invalid-screen-size/invalid-screen-size-view-model';

    /*
     *  Enforces minimum screen size limits on routes
     */
    function HdRouterProxy(routerConfig) {
        base.call(this, routerConfig);
        this.__private__ = {
            screenSize: Object.resolve(ScreenSize)
        };
        Assert.implementsInterface(this, IRouter, 'this');
        assertThis(this);
    }
    var base = Object.inherit(Router, HdRouterProxy);

    HdRouterProxy.prototype.routeMatchedHandler = function (event) {
        assertThis(this);
        assertRouteMatchedEvent(event);
        event = validateScreenSize(this, event);
        base.prototype.routeMatchedHandler.call(this, event);
    };

    function validateScreenSize(self, event) {
        logScreenSize(self);
        if (isScreenTooSmallForAllPages(self)) {
            event = handleScreenIsTooSmallForAllPages(event);
        } else if (isScreenTooSmallForSomePages(self)) {
            event = handleScreenIsTooSmallForSomePages(event);
        }
        return event;
    }

    function logScreenSize(self) {
        logger.trace(getScreenSize(self).toString());
    }

    function getScreenSize(self) {
        assertThis(self);
        return self.__private__.screenSize;
    }

    function isScreenTooSmallForAllPages(self) {
        return getScreenSize(self).isTooSmallForAllPages();
    }

    function handleScreenIsTooSmallForAllPages(event) {
        if (isTinyScreenAllowed(event)) { return event; }
        logger.info('screen is too small for any page, setting module to ', INVALID_SCREEN_SIZE_MODULE);
        return disableModuleDueToScreenSize(event);
    }

    function disableModuleDueToScreenSize(event) {
        assertRouteMatchedEvent(event);
        logger.info('screen is too small for', event.config.url, 'setting module to ', INVALID_SCREEN_SIZE_MODULE);
        event.module = INVALID_SCREEN_SIZE_MODULE;
        assertRouteMatchedEvent(event);
        return event;
    }

    function isScreenTooSmallForSomePages(self) {
        return getScreenSize(self).isTooSmallForSomePages();
    }

    function handleScreenIsTooSmallForSomePages(event) {
        if (isSmallScreenAllowed(event)) { return event; }
        return disableModuleDueToScreenSize(event);
    }

    function isSmallScreenAllowed(event) {
        assertRouteMatchedEvent(event);
        return event;
    }

    function isTinyScreenAllowed(event) {
        assertRouteMatchedEvent(event);
        return !!event.config['allow-tiny-screen'];
    }

    HdRouterProxy.prototype.createScreenInstance = function (event, module) {
        var screen = base.prototype.createScreenInstance.call(this, event, module);
        if (isInvalidScreenSizeModule(event)) {
            screen.isSmallScreenAllowed = isSmallScreenAllowed(event);
            screen.usingInvalidScreenSizeRoute = moduleMatchesConfig(event);
        }
        return screen;
    };

    function isInvalidScreenSizeModule(event) {
        return event.module === INVALID_SCREEN_SIZE_MODULE;
    }

    function moduleMatchesConfig(event) {
        return event.module === event.config.module;
    }

    function assertThis(self) {
        if (Assert.enabled) {
            Assert.instanceOf(self, HdRouterProxy, 'self');
            Assert.instanceOf(self.__private__.screenSize, ScreenSize, 'self.__private__.screenSize');
        }
    }

    function assertRouteMatchedEvent(event) {
        if (Assert.enabled) {
            Assert.ok(event, 'event');
            Assert.stringNotEmpty(event.module, 'event.module');
        }
    }

    return HdRouterProxy;
});
