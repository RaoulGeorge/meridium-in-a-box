define(function () {
    'use strict';

    function AjaxError(response, request) {
        this.response = response;
        this.request = request;
    }

    AjaxError.prototype.toError = function toError() {
        if (this.response.status) {
            return isMeridium(this) ? toMeridiumError(this) : toIISError(this);
        } else {
            return new Error(this.response);
        }
    };

    function isMeridium(self) {
        return self.response.status >= 500;
    }

    function toMeridiumError(self) {
        var exception, message, error;
        exception = JSON.parse(self.response.responseText);
        if (exception.exceptionMessage) {
            message = exception.exceptionMessage;
            error = new Error(message);
            if (exception.exceptionType) {
                error.name = exception.exceptionType;
            }
            error.stack = error.stack ? error.stack + '' : '';
            if (exception.stackTrace) {
                error.stack = error.stack + '\n\nFrom Server: ' +
                    exception.exceptionMessage + '\n' + exception.stackTrace;
            }
        } else {
            error = new Error(exception);
        }
        return error;
    }

    function toIISError(self) {
        var message = self.response.statusText;
        if (self.request) {
            message = self.request.url + ' ' + message;
        }
        return new Error(message + ' (' + self.response.status + ')');
    }

    return AjaxError;
});