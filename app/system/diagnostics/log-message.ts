import * as _ from 'lodash';
import {resolve} from 'system/lang/object';

import Formatter = require('system/text/formatter');

interface Level {
    value: string;
    text: string;
}

class LogMessage {
    public static fromJson(data: any): LogMessage {
        return new LogMessage(data.level, data.source, data.text, data.timestamp, data.context);
    }

    public static fromJsonCollection(collection: any[]): LogMessage[] {
        return _.map(collection, LogMessage.fromJson);
    }

    public timestamp: Date;
    public level: string;
    public source: string;
    public text: string;
    public context: string;

    constructor(level: string, source: string, text: string, timestamp?: number, context: string = '') {
        this.level = level;
        this.source = source;
        this.text = text;
        this.timestamp = timestamp ? new Date(timestamp) : new Date();
        this.context = context;
    }

    public fullSource(): string {
        if (this.context) {
            return this.source + ' [' + this.context + ']';
        } else {
            return this.source;
        }
    }

    public toJson(): any {
        return {
            timestamp: this.timestamp.toISOString(),
            level: this.level,
            source: this.source,
            text: this.text,
            context: this.context
        };
    }

    public getFormattedTimestamp(): string {
        const formatter = resolve(Formatter);
        return formatter.format(this.timestamp, 'f');
    }

    public getLevelCaption(levels: Level[]): string {
        return translateLevel(levels, this.level);
    }
}

function translateLevel(levels: Level[], level: string): string {
    const levelObject = _.find(levels, { value: level });
    if (levelObject) {
        return levelObject.text;
    } else {
        return level;
    }
}

export = LogMessage;
