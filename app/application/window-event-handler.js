define(function (require, exports, module) {
    'use strict';

    var LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ApplicationEvents = require('./application-events'),
        ErrorMessage = require('system/error/error-message');

    var UNHANDLED_ERROR_CODE = 'UH-1';

    function WindowEventHandler() {
        this.appEvents = Object.resolve(ApplicationEvents);
    }
    WindowEventHandler.singleton = true;

    WindowEventHandler.prototype.load = function () {
        window.addEventListener('unload', this);
        window.addEventListener('click', this);
        window.addEventListener('resize', this);
        handleErrorEvents(this);
    };

    WindowEventHandler.prototype.unload = function () {
        window.removeEventListener('unload', this);
        window.removeEventListener('click', this);
        window.removeEventListener('resize', this);
    };

    WindowEventHandler.prototype.handleEvent = function (e) {
        if (e.type === 'unload') {
            window_unloaded(this);
        } else if (e.type === 'click') {
            window_clicked(this);
        } else if (e.type === 'resize') {
            window_resize(this);
        }
    };

    function handleErrorEvents(self, code, message, detail) {
        var UNHANDLED_ERROR_CODE = 'UH-1';
        //calling window.addEventListener for error is not possible for our purposes
        //window.onerror must be explicitly set due to windows development contraints
        window.onerror = function (message, url) {
            error_unhandled(self, UNHANDLED_ERROR_CODE, message, url);
            return (typeof window.MSApp !== "undefined");
        };
    }

    function window_unloaded(self) {
        self.appEvents.windowUnloaded.raise(self);
    }

    function window_clicked(self) {
        self.appEvents.windowClicked.raise(self);
    }

    function window_resize(self) {
        self.appEvents.windowResized.raise(self);
    }

    function error_unhandled(self, code, message, detail) {
        var errorMessage;

        if (detail) {
            errorMessage = new ErrorMessage(code, message, detail);
        } else {
            errorMessage = new ErrorMessage(code, message);
        }

        self.appEvents.errorUnhandled.raise(self, errorMessage);
        LogManager.pushContext('error_unhandled');
        logger.error('Unhandled Error:', errorMessage);
        LogManager.popContext();
    }

    return WindowEventHandler;
});