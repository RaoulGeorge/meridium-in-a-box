define(["require", "exports", "lodash", "./log-message"], function (require, exports, _, LogMessage) {
    "use strict";
    var levelOrdinals = { trace: 5, debug: 4, info: 3, warn: 2, error: 1, fatal: 0 };
    var Logger = (function () {
        function Logger(id, messageLogged, level) {
            this.id = id;
            this.messageLogged = messageLogged;
            this.level = level;
        }
        Logger.prototype.log = function (level) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            log(this, level, args);
        };
        Logger.prototype.trace = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            log(this, Logger.levels.trace, args);
        };
        Logger.prototype.debug = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            log(this, Logger.levels.debug, args);
        };
        Logger.prototype.info = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            log(this, Logger.levels.info, args);
        };
        Logger.prototype.warn = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            log(this, Logger.levels.warn, args);
        };
        Logger.prototype.error = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            log(this, Logger.levels.error, args);
        };
        Logger.prototype.fatal = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            log(this, Logger.levels.fatal, args);
        };
        Logger.prototype.isTraceEnabled = function () {
            return isEnabled(this, Logger.levels.trace);
        };
        Logger.prototype.isDebugEnabled = function () {
            return isEnabled(this, Logger.levels.debug);
        };
        Logger.prototype.isInfoEnabled = function () {
            return isEnabled(this, Logger.levels.info);
        };
        Logger.prototype.isWarnEnabled = function () {
            return isEnabled(this, Logger.levels.warn);
        };
        Logger.prototype.isErrorEnabled = function () {
            return isEnabled(this, Logger.levels.error);
        };
        Logger.prototype.isFatalEnabled = function () {
            return isEnabled(this, Logger.levels.fatal);
        };
        return Logger;
    }());
    Logger.levels = {
        trace: 'trace',
        debug: 'debug',
        info: 'info',
        warn: 'warn',
        error: 'error',
        fatal: 'fatal'
    };
    function log(logger, level, texts) {
        if (!isEnabled(logger, level)) {
            return;
        }
        var message = new LogMessage(level, logger.id, toString(texts).join(' '));
        logger.messageLogged.raise(logger, message);
    }
    function isEnabled(logger, level) {
        return levelOrdinals[level] <= levelOrdinals[logger.level];
    }
    function toString(texts) {
        return _.map(texts, function (text) {
            if (_.isObject(text)) {
                return JSON.stringify(text);
            }
            else {
                if (_.isNull(text)) {
                    return '';
                }
                else if (_.isUndefined(text)) {
                    return '';
                }
                else {
                    return text.toString();
                }
            }
        });
    }
    return Logger;
});
