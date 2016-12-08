define(function (require) {
    'use strict';

    var ApplicationEvents = require('./application-events'),
        ErrorNotificationHandler = require('logging/error-notification-handler'),
        ErrorAccumulator = require('system/error-accumulator/error-accumulator-view-model');

    function ApplicationErrorHandler() {
        this.appEvents = Object.resolve(ApplicationEvents);
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
        this.errorAccumulator = Object.resolve(ErrorAccumulator);
    }
    ApplicationErrorHandler.singleton = true;

    ApplicationErrorHandler.prototype.load = function () {
        this.appEvents.errorOccured.add(error_occured.bind(null, this), this);
        this.appEvents.errorUnhandled.add(error_occured.bind(null, this), this);
        this.appEvents.sessionExpired.add(sessionExpired.bind(null, this), this);
    };

    ApplicationErrorHandler.prototype.unload = function () {
        this.appEvents.errorOccured.remove(this);
        this.appEvents.errorUnhandled.remove(this);
        this.appEvents.sessionExpired.remove(this);
    };

    function error_occured(self, eventCaller, errorMessage) {
        var log = {
            'errorCode': errorMessage.code,
            'errorMessage': errorMessage.message,
            'errorDetail': errorMessage.detail
        };
        self.errorNotificationHandler.addError(log);
        self.errorAccumulator.registerError(log);
    }

    function sessionExpired(self) {
        if (self.errorAccumulator) {
            self.errorAccumulator.closePopup();
        }        
    }

    return ApplicationErrorHandler;
});