import * as _ from 'lodash';
import {resolve} from 'system/lang/object';

import Logger = require('./logger');
import LogService = require('./log-service');
import LogMessage = require('./log-message');
import Event = require('system/lang/event');

type LogConfig = { level: string, id?: string, size?: number };

class LogManager {
    public defaultLevel: string;
    public level: string;
    public loggers: {};
    public nestedContexts: string[];
    public messageCache: LogMessage[];
    public messageLogged: Event;

    constructor() {
        this.defaultLevel = Logger.levels.error;
        this.level = this.defaultLevel;
        this.loggers = {};
        this.nestedContexts = [];
        this.messageCache = [];
        this.messageLogged = new Event();
        this.messageLogged.add(this.cacheMessage, this);
    }

    public cacheMessage(sender: any, message: LogMessage): void {
        message.context = this.currentContext();
        this.messageCache.push(message);
    }

    public initialize(): JQueryPromise<any> {
        const logService = resolve(LogService);
        logService.trimLog();
        return logService.initializeLogConfig()
            .done(initializeLogConfig_done.bind(null, this))
            .fail(initializeLogConfig_fail);
    }

    public saveConfig(): JQueryPromise<any> {
        const logService = resolve(LogService);
        return logService.saveConfig()
            .fail(initializeLogConfig_fail);
    }

    public getLogger(id: string): Logger {
        let logger = this.loggers[id];
        if (!logger) {
            logger = new Logger(id, this.messageLogged, this.level);
            this.loggers[id] = logger;
        }
        return logger;
    }

    public setLevel(level: string): void {
        this.level = level;
        _.each(this.loggers, (logger: Logger) => logger.level = level);
    }

    public pushContext(context: string): void {
        this.nestedContexts.push(toString(context));
    }

    public popContext(): void {
        this.nestedContexts.pop();
    }

    public currentContext(): string {
        return this.nestedContexts[this.nestedContexts.length - 1];
    }
}

function initializeLogConfig_done(logManager: LogManager, config: LogConfig): void {
    logManager.setLevel(Logger.levels[config.level]);
    clearMessageCache(logManager);
    logManager.messageLogged.add((sender: any, message: LogMessage): void => {
        message.context = logManager.currentContext();
        saveMessage(logManager, message);
    }, logManager);
}

function initializeLogConfig_fail(response: any): void {
    console.error(response);
}

function clearMessageCache(logManager: LogManager): void {
    logManager.messageLogged.remove(logManager.cacheMessage, logManager);
    _.each(logManager.messageCache, saveMessage.bind(null, logManager));
}

function saveMessage(logManager: LogManager, message: LogMessage): void {
    const logService = resolve(LogService);
    logService.saveMessage(message);
}

function toString(o: any): string {
    if (_.isObject(o)) {
        return JSON.stringify(o);
    } else {
        return o.toString();
    }
}

export = new LogManager();
