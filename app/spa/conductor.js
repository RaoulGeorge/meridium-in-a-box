var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "jquery", "system/lang/ioc", "system/diagnostics/log-manager", "application/application-events", "system/error/error-message", "system/globalization/translator"], function (require, exports, $, ioc_1, logManager, ApplicationEvents, ErrorMessage, Translator) {
    "use strict";
    var logger = logManager.getLogger('spa/conductor');
    var ERROR_CODE = 'FND1';
    var ERROR_MESSAGE = 'PAGE_NOT_LOADED';
    var Conductor = (function () {
        function Conductor(applicationEvents, translator) {
            this.errorOccured = applicationEvents.errorOccured;
            this.translator = translator;
        }
        Conductor.prototype.activateScreen = function (screen, args) {
            try {
                return tryActivateScreen(this, screen, args);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.createArgumentArray = function (routeArgs, argArray) {
            if (argArray === void 0) { argArray = []; }
            if (logger.isTraceEnabled()) {
                logger.trace('create argument array');
            }
            if (!routeArgs) {
                return argArray;
            }
            if (routeArgs.named) {
                argArray.push(routeArgs.named);
            }
            Array.prototype.push.apply(argArray, routeArgs.positional);
            return argArray;
        };
        Conductor.prototype.reuseScreen = function (screen, region, args) {
            try {
                return tryReuseScreen(this, screen, region, args);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.deactivateScreen = function (screen) {
            try {
                tryDeactivateScreen(screen);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.canUnloadScreen = function (screen) {
            try {
                return tryCanUnloadScreen(screen);
            }
            catch (e) {
                raisePageLoadError(this, e);
                return false;
            }
        };
        Conductor.prototype.attachScreen = function (screen, region, url) {
            try {
                tryAttachScreen(screen, region, url);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.detachScreen = function (region) {
            try {
                tryDetachScreen(region);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.canReuseScreen = function (previousScreen, screen, routeArgs) {
            try {
                return tryCanReuseScreen(this, previousScreen, screen, routeArgs);
            }
            catch (e) {
                raisePageLoadError(this, e);
                return false;
            }
        };
        Conductor.prototype.openScreen = function (screen, args) {
            try {
                tryOpenScreen(this, screen, args);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.loadScreen = function (screen, args) {
            try {
                tryLoadScreen(this, screen, args);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.closeScreen = function (screen) {
            try {
                tryCloseScreen(screen);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.unloadScreen = function (screen) {
            try {
                tryUnloadScreen(screen);
            }
            catch (e) {
                raisePageLoadError(this, e);
            }
        };
        Conductor.prototype.changeScreen = function (screen, region, args, options) {
            if (args === void 0) { args = {}; }
            var previousScreen = region.screen;
            var settings = { isClosing: true, checkForReuse: true, checkForUnload: false };
            logManager.pushContext(typeString(screen) + ' from ' + typeString(previousScreen));
            $.extend(settings, options);
            if (settings.checkForReuse && this.canReuseScreen(previousScreen, screen, args)) {
                if (logger.isDebugEnabled()) {
                    logger.debug('Reusing previous screen.');
                }
                this.reuseScreen(previousScreen, region, args);
                return;
            }
            this.openScreen(screen, args);
            this.loadScreen(screen, args);
            this.deactivateScreen(previousScreen);
            this.activateScreen(screen, args);
            this.detachScreen(region);
            this.attachScreen(screen, region, args.url);
            if (settings.isClosing && screen !== previousScreen) {
                if (logger.isDebugEnabled()) {
                    logger.debug('closing previous screen.');
                }
                this.unloadScreen(previousScreen);
                this.closeScreen(previousScreen);
            }
            logManager.popContext();
        };
        Conductor.prototype.hideScreen = function (region) {
            this.deactivateScreen(region.screen);
            this.detachScreen(region);
        };
        Conductor.prototype.clearScreen = function (region) {
            this.changeScreen(null, region);
            region.screen = null;
        };
        ;
        Conductor.prototype.showScreen = function (region, url) {
            this.activateScreen(region.screen);
            this.attachScreen(region.screen, region, url);
        };
        ;
        return Conductor;
    }());
    Conductor = __decorate([
        ioc_1.dependsOn(ApplicationEvents, Translator)
    ], Conductor);
    function tryActivateScreen(conductor, screen, args) {
        if (logger.isTraceEnabled()) {
            logger.trace('activating screen');
        }
        if (screen && screen.isActive) {
            return;
        }
        if (screen) {
            screen.isActive = true;
            if (screen.activate) {
                var argArray = conductor.createArgumentArray(args);
                return screen.activate.apply(screen, argArray);
            }
        }
    }
    function raisePageLoadError(conductor, e) {
        var detail;
        var stack;
        if (e && e.message) {
            detail = e.message;
        }
        else if (e instanceof Object) {
            detail = JSON.stringify(e);
        }
        else {
            detail = e;
        }
        if (e.stack) {
            stack = e.stack;
        }
        else {
            stack = new Error().stack;
        }
        var errorText = conductor.translator.translate(ERROR_MESSAGE);
        var errorMessage = new ErrorMessage(ERROR_CODE, errorText, detail + '\n' + stack);
        conductor.errorOccured.raise(conductor, errorMessage);
    }
    function tryReuseScreen(conductor, screen, region, args) {
        if (logger.isTraceEnabled()) {
            logger.trace('reuse screen');
        }
        if (screen.reuse) {
            var argArray = conductor.createArgumentArray(args, [region, args.url]);
            return screen.reuse.apply(screen, argArray);
        }
    }
    function tryDeactivateScreen(screen) {
        if (logger.isTraceEnabled()) {
            logger.trace('deactivating screen');
        }
        if (screen && !screen.isActive) {
            return;
        }
        if (screen) {
            screen.isActive = false;
            if (screen.deactivate) {
                screen.deactivate();
            }
        }
    }
    function tryCanUnloadScreen(screen) {
        if (logger.isTraceEnabled()) {
            logger.trace('can deactivate screen');
        }
        if (screen && screen.canUnload) {
            return screen.canUnload();
        }
        return true;
    }
    function tryAttachScreen(screen, region, url) {
        if (screen && screen.isAttached === true) {
            return;
        }
        if (logger.isTraceEnabled()) {
            logger.trace('attaching screen');
        }
        if (screen && screen.attach) {
            screen.attach(region, url);
            region.screen = screen;
            screen.isAttached = true;
        }
    }
    function tryDetachScreen(region) {
        if (logger.isTraceEnabled()) {
            logger.trace('detaching screen');
        }
        if (!region || !region.screen) {
            return;
        }
        if (region && region.screen && !region.screen.isAttached) {
            return;
        }
        if (region.screen.detach) {
            region.screen.detach(region);
            region.screen.isAttached = false;
        }
    }
    function tryCanReuseScreen(conductor, previous, screen, args) {
        var result = true;
        if (logger.isTraceEnabled()) {
            logger.trace('can reuse screen: ', typeString(screen));
        }
        if (!screen || !previous || screen.constructor !== previous.constructor) {
            return false;
        }
        if (screen.canReuse) {
            var argArray = conductor.createArgumentArray(args);
            result = screen.canReuse.apply(screen, argArray);
        }
        else if (!screen.reuse) {
            result = false;
        }
        return result !== false;
    }
    function tryOpenScreen(conductor, screen, args) {
        if (logger.isTraceEnabled()) {
            logger.trace('opening screen');
        }
        if (!screen || screen.isOpen) {
            return;
        }
        if (screen.open) {
            var argArray = conductor.createArgumentArray(args);
            argArray[argArray.length] = args.url;
            screen.open.apply(screen, argArray);
        }
        screen.isOpen = true;
    }
    function tryLoadScreen(conductor, screen, args) {
        if (logger.isTraceEnabled()) {
            logger.trace('load screen');
        }
        if (!screen || screen.isLoaded) {
            return;
        }
        if (screen.load) {
            var argArray = conductor.createArgumentArray(args);
            screen.load.apply(screen, argArray);
        }
        screen.isLoaded = true;
    }
    function tryCloseScreen(screen) {
        if (logger.isTraceEnabled()) {
            logger.trace('closing screen');
        }
        if (!screen || !screen.isOpen) {
            return;
        }
        if (screen.close) {
            screen.close();
        }
        screen.isOpen = false;
    }
    function tryUnloadScreen(screen) {
        if (logger.isTraceEnabled()) {
            logger.trace('unload screen');
        }
        if (!screen || !screen.isLoaded) {
            return;
        }
        if (screen.unload) {
            screen.unload();
        }
        screen.isLoaded = false;
    }
    function typeString(object) {
        if (object) {
            if (object.constructor && object.constructor.name) {
                return object.constructor.name;
            }
            else if (object.constructor) {
                return object.constructor;
            }
            else {
                return object.toString();
            }
        }
        else {
            return object;
        }
    }
    return Conductor;
});
