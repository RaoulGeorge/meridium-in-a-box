/// <amd-dependency path="localforage" />

import * as $ from 'jquery';
import * as Promise from 'bluebird';
import * as StorageConfig from 'config/storage-config';

const LocalForage = require('localforage');

interface LocalForage {
    createInstance(config: any): LocalForage;
    getItem(key: string): Promise<any>;
    setItem(key: string, value: any): Promise<any>;
    removeItem(key: string): Promise<any>;
}

class DocumentStorage {
    public prefix: string;
    public instance: LocalForage;

    constructor(prefix: string) {
        const config = $.extend({}, StorageConfig.documentStorage(), { storeName: 'data' });
        this.prefix = prefix + '__';
        this.instance = LocalForage.createInstance(config);
    }

    public getItem(key: string): JQueryPromise<any> {
        const dfd = $.Deferred();
        this.instance.getItem(this.prefix + key)
            .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
        return dfd.promise();
    }

    public setItem(key: string, value: any): JQueryPromise<any> {
        const dfd = $.Deferred();
        this.instance.setItem(this.prefix + key, value)
            .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
        return dfd.promise();
    }

    public removeItem(key: string): JQueryPromise<any> {
        const dfd = $.Deferred();
        this.instance.removeItem(this.prefix + key)
            .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
        return dfd.promise();
    }
}

export = DocumentStorage;
