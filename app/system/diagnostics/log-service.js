var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "lodash", "jquery", "system/lang/object", "system/lang/ioc", "system/data/document-storage", "system/data/client-preferences", "./log-message", "./logger"], function (require, exports, _, $, object_1, ioc_1, DocumentStorage, ClientPreferences, LogMessage, Logger) {
    "use strict";
    var defaultConfig = { id: 'log_config', level: Logger.levels.error, size: 1000 };
    var LogService = (function () {
        function LogService() {
            this.clientPreferences = object_1.resolve(ClientPreferences);
            this.logStorage = new DocumentStorage('log');
            this.messages = [];
        }
        LogService.prototype.initializeLogConfig = function (dfd) {
            if (dfd === void 0) { dfd = $.Deferred(); }
            getConfig(this).done(getConfig_done.bind(null, this, dfd));
            return dfd.promise();
        };
        LogService.prototype.trimLog = function () {
            while (this.messages.length > defaultConfig.size) {
                this.messages.shift();
            }
            return $.Deferred().resolve().promise();
        };
        LogService.prototype.saveConfig = function (config) {
            config = _.extend({}, defaultConfig, config);
            return this.clientPreferences.savePreference(defaultConfig.id, config);
        };
        LogService.prototype.saveMessage = function (message) {
            var dfd = $.Deferred();
            this.messages.push(message.toJson());
            this.trimLog();
            this.logStorage.setItem('messages', this.messages)
                .done(dfd.resolve.bind(dfd))
                .fail(fail);
        };
        LogService.prototype.getAllMessages = function () {
            var messages;
            var dfd = $.Deferred();
            try {
                messages = this.messages.slice(0);
                messages.reverse();
                messages = LogMessage.fromJsonCollection(messages || []);
                dfd.resolve(messages);
            }
            catch (error) {
                fail(dfd, error);
            }
            return dfd.promise();
        };
        LogService.prototype.clearLog = function () {
            this.messages = [];
            return this.logStorage.setItem('messages', this.messages);
        };
        return LogService;
    }());
    LogService = __decorate([
        ioc_1.singleton
    ], LogService);
    function getConfig(logService) {
        return logService.clientPreferences.retrievePreferences(defaultConfig.id);
    }
    function getConfig_done(logService, dfd, config) {
        if (config) {
            initializeMessages(logService)
                .done(dfd.resolve.bind(dfd, config));
        }
        else {
            logService.saveConfig(defaultConfig)
                .done(saveConfig_done.bind(null, logService, dfd, defaultConfig));
        }
    }
    function saveConfig_done(logService, dfd, config) {
        initializeMessages(logService)
            .done(dfd.resolve.bind(dfd, config));
    }
    function initializeMessages(logService) {
        return logService.logStorage.getItem('messages')
            .done(function (messages) {
            if (messages) {
                logService.messages = messages;
            }
        })
            .fail(console.error);
    }
    function fail(dfd, error) {
        console.error(error);
        dfd.reject(error);
    }
    return LogService;
});
