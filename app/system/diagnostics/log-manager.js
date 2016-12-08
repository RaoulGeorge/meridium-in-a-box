define(["require", "exports", "lodash", "system/lang/object", "./logger", "./log-service", "system/lang/event"], function (require, exports, _, object_1, Logger, LogService, Event) {
    "use strict";
    var LogManager = (function () {
        function LogManager() {
            this.defaultLevel = Logger.levels.error;
            this.level = this.defaultLevel;
            this.loggers = {};
            this.nestedContexts = [];
            this.messageCache = [];
            this.messageLogged = new Event();
            this.messageLogged.add(this.cacheMessage, this);
        }
        LogManager.prototype.cacheMessage = function (sender, message) {
            message.context = this.currentContext();
            this.messageCache.push(message);
        };
        LogManager.prototype.initialize = function () {
            var logService = object_1.resolve(LogService);
            logService.trimLog();
            return logService.initializeLogConfig()
                .done(initializeLogConfig_done.bind(null, this))
                .fail(initializeLogConfig_fail);
        };
        LogManager.prototype.saveConfig = function () {
            var logService = object_1.resolve(LogService);
            return logService.saveConfig()
                .fail(initializeLogConfig_fail);
        };
        LogManager.prototype.getLogger = function (id) {
            var logger = this.loggers[id];
            if (!logger) {
                logger = new Logger(id, this.messageLogged, this.level);
                this.loggers[id] = logger;
            }
            return logger;
        };
        LogManager.prototype.setLevel = function (level) {
            this.level = level;
            _.each(this.loggers, function (logger) { return logger.level = level; });
        };
        LogManager.prototype.pushContext = function (context) {
            this.nestedContexts.push(toString(context));
        };
        LogManager.prototype.popContext = function () {
            this.nestedContexts.pop();
        };
        LogManager.prototype.currentContext = function () {
            return this.nestedContexts[this.nestedContexts.length - 1];
        };
        return LogManager;
    }());
    function initializeLogConfig_done(logManager, config) {
        logManager.setLevel(Logger.levels[config.level]);
        clearMessageCache(logManager);
        logManager.messageLogged.add(function (sender, message) {
            message.context = logManager.currentContext();
            saveMessage(logManager, message);
        }, logManager);
    }
    function initializeLogConfig_fail(response) {
        console.error(response);
    }
    function clearMessageCache(logManager) {
        logManager.messageLogged.remove(logManager.cacheMessage, logManager);
        _.each(logManager.messageCache, saveMessage.bind(null, logManager));
    }
    function saveMessage(logManager, message) {
        var logService = object_1.resolve(LogService);
        logService.saveMessage(message);
    }
    function toString(o) {
        if (_.isObject(o)) {
            return JSON.stringify(o);
        }
        else {
            return o.toString();
        }
    }
    return new LogManager();
});
