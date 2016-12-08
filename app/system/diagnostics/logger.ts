import * as _ from 'lodash';
import LogMessage = require('./log-message');

const levelOrdinals = { trace: 5, debug: 4, info: 3, warn: 2, error: 1, fatal: 0 };

class Logger {
    public static levels: any = {
        trace: 'trace',
        debug: 'debug',
        info: 'info',
        warn: 'warn',
        error: 'error',
        fatal: 'fatal'
    };

    public id: string;
    public messageLogged: any;
    public level: string;

    constructor(id: string, messageLogged: any, level: string) {
        this.id = id;
        this.messageLogged = messageLogged;
        this.level = level;
    }

    public log(level: string, ...args: any[]): void {
        log(this, level, args);
    }

    public trace(...args: any[]): void {
        log(this, Logger.levels.trace, args);
    }

    public debug(...args: any[]): void {
        log(this, Logger.levels.debug, args);
    }

    public info(...args: any[]): void {
        log(this, Logger.levels.info, args);
    }

    public warn(...args: any[]): void {
        log(this, Logger.levels.warn, args);
    }

    public error(...args: any[]): void {
        log(this, Logger.levels.error, args);
    }

    public fatal(...args: any[]): void {
        log(this, Logger.levels.fatal, args);
    }

    public isTraceEnabled(): boolean {
        return isEnabled(this, Logger.levels.trace);
    }

    public isDebugEnabled(): boolean {
        return isEnabled(this, Logger.levels.debug);
    }

    public isInfoEnabled(): boolean {
        return isEnabled(this, Logger.levels.info);
    }

    public isWarnEnabled(): boolean {
        return isEnabled(this, Logger.levels.warn);
    }

    public isErrorEnabled(): boolean {
        return isEnabled(this, Logger.levels.error);
    }

    public isFatalEnabled(): boolean {
        return isEnabled(this, Logger.levels.fatal);
    }
}

function log(logger: Logger, level: string, texts: any[]): void {
    if (!isEnabled(logger, level)) { return; }
    const message = new LogMessage(level, logger.id, toString(texts).join(' '));
    logger.messageLogged.raise(logger, message);
}

function isEnabled(logger: Logger, level: string): boolean {
    return levelOrdinals[level] <= levelOrdinals[logger.level];
}

function toString(texts: any[]): string[] {
    return _.map(texts, function (text: any): string {
        if (_.isObject(text)) {
            return JSON.stringify(text);
        } else {
            if (_.isNull(text)) { return ''; }
            else if (_.isUndefined(text)) { return ''; }
            else { return text.toString(); }
        }
    });
}

export = Logger;
