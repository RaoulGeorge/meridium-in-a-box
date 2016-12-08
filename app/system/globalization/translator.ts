/// <amd-dependency path="jed" />

import {singleton} from 'system/lang/ioc';

const Jed = require('jed');

interface Jed {
    new (locale: string): Jed;
    translate(key: string): JedRequest;
}

interface JedRequest {
    onDomain(domain: string): void;
    withContext(context: string): void;
    fetch(): string;
}

@singleton
class Translator {
    public jed: Nullable<Jed>;

    constructor() {
        this.jed = null;
    }

    public setLocale(locale: string): void {
        this.jed = new Jed(locale);
    }

    public translate(key: string, domain?: string, context?: string): string {
        if (!key) { return key; }
        if (!this.jed) { return key; }
        const request = this.jed.translate(key);
        if (domain) { request.onDomain(domain); }
        if (context) { request.withContext(context); }
        return request.fetch();
    };
}

export = Translator;
