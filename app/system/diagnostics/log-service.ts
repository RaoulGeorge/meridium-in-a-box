import * as _ from 'lodash';
import * as $ from 'jquery';
import {resolve} from 'system/lang/object';
import {singleton} from 'system/lang/ioc';

import DocumentStorage = require('system/data/document-storage');
import ClientPreferences = require('system/data/client-preferences');
import LogMessage = require('./log-message');
import Logger = require('./logger');

const defaultConfig = { id: 'log_config', level: Logger.levels.error, size: 1000 };

@singleton
class LogService {
    public clientPreferences: ClientPreferences;
    public logStorage: DocumentStorage;
    public messages: LogMessage[];

    constructor() {
        this.clientPreferences = resolve(ClientPreferences);
        this.logStorage = new DocumentStorage('log');
        this.messages = [];
    }

    public initializeLogConfig(dfd: JQueryDeferred<any> = $.Deferred()): JQueryPromise<any> {
        getConfig(this).done(getConfig_done.bind(null, this, dfd));
        return dfd.promise();
    }

    public trimLog(): JQueryPromise<any> {
        while(this.messages.length > defaultConfig.size) {
            this.messages.shift();
        }
        return $.Deferred().resolve().promise();
    }

    public saveConfig(config: {}): JQueryPromise<any> {
        config = _.extend({}, defaultConfig, config);
        return this.clientPreferences.savePreference(defaultConfig.id, config);
    }

    public saveMessage(message: LogMessage): void {
        const dfd = $.Deferred();
        this.messages.push(message.toJson());
        this.trimLog();
        this.logStorage.setItem('messages', this.messages)
            .done(dfd.resolve.bind(dfd))
            .fail(fail);
    }

    public getAllMessages(): JQueryPromise<LogMessage[]> {
        let messages: LogMessage[];
        const dfd = $.Deferred();
        try {
            messages = this.messages.slice(0);
            messages.reverse();
            messages = LogMessage.fromJsonCollection(messages || []);
            dfd.resolve(messages);
        } catch(error) {
            fail(dfd, error);
        }
        return dfd.promise();
    }

    public clearLog(): JQueryPromise<any> {
        this.messages = [];
        return this.logStorage.setItem('messages', this.messages);
    }
}

function getConfig(logService: LogService): JQueryPromise<any> {
    return logService.clientPreferences.retrievePreferences(defaultConfig.id);
}

function getConfig_done(logService: LogService, dfd: JQueryDeferred<any>, config: {}): void {
    if (config) {
        initializeMessages(logService)
            .done(dfd.resolve.bind(dfd, config));
    } else {
        logService.saveConfig(defaultConfig)
            .done(saveConfig_done.bind(null, logService, dfd, defaultConfig));
    }
}

function saveConfig_done(logService: LogService, dfd: JQueryDeferred<any>, config: {}): void {
    initializeMessages(logService)
        .done(dfd.resolve.bind(dfd, config));
}

function initializeMessages(logService: LogService): JQueryPromise<any> {
    return logService.logStorage.getItem('messages')
        .done((messages?: any) => {
            if (messages) {
                logService.messages = messages;
            }
        })
        .fail(console.error);
}

function fail(dfd: JQueryDeferred<any>, error: any): void {
    console.error(error);
    dfd.reject(error);
}

export = LogService;
