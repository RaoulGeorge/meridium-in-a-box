/// <reference path="~/apps/lib/require.js" />
/* global InvalidStateError */
define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        ApplicationContext = require('application/application-context'),
        StorageContext = require('system/data/storage-context'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id);

    function Storage() {
        this.db = null;
        this._dbName = '';
        this.transaction = null;
        this._request = null;
        this.session = null;
        this.storageContext = null;
    }

    Storage.factory = function storage_factory(applicationContext) {
        var storage = new Storage();
        storage.session = (applicationContext || ApplicationContext).session;
        storage.storageContext = StorageContext.factory();
        return storage;
    };

    Storage.fromUser = function (user) {
        var session = $.extend({}, ApplicationContext.session, { userId: user });
        return Storage.factory({ session: session });
    };

    Storage.prototype.open = function storage_open() {
        var dfd = new $.Deferred();

        this._request = window.indexedDB.open(this.dbName(), this.storageContext.version);
        this._request.onsuccess = setDB_onsuccess.bind(null, this, dfd);
        this._request.onerror = errorFunc.bind(null, this);
        this._request.onupgradeneeded = this.storageContext.upgradeNeeded.bind(this.storageContext);
        this._request.onblocked = blocked.bind(null, dfd);
        return dfd.promise();
    };

    function blocked(dfd) {
        dfd.reject();
    }

    function setDB_onsuccess(self, dfd) {
        try {
            self.db = self._request.result;
        }
        catch (e) {
            if (!(e instanceof InvalidStateError)) {
                throw e;
            }
        }
        finally {
            dfd.resolve();
        }
    }

    function errorFunc(self, event) {
        logger.error(event);
        self.close();
    }

    Storage.prototype.dbName = function storage_dbName() {
        if (this._dbName === '') {
            this._dbName = (this.session.apiServer + this.session.datasourceId + this.session.userId) + '_meridium_idb';
        }
        return this._dbName;
    };

    Storage.prototype.close = function storage_close() {
        if (this.db !== null && this.db.close !== undefined) {
            this.db.close();
            this.db = null;
            this.transaction = null;
        }
    };

    Storage.prototype.startTransaction = function storage_startTransaction(objectStoreList, access) {
        this.transaction = this.db.transaction(objectStoreList, access || 'readonly');
    };

    Storage.prototype.objectStore = function storage_objectStore(objectStore) {
        return this.transaction.objectStore(objectStore);
    };

    Storage.prototype.get = function storage_get(objectStore, value, index) {
        var dfd = $.Deferred();
        this.startTransaction(objectStore);
        var store = this.objectStore(objectStore);
        if ((index || '') !== '') {
            store = store.index(index);
        }
        var get;
        if (value === null || value === undefined) {
            get = store.get();
        } else {
            get = store.get(value);
        }
        registerRequestCallbacks(get, dfd);
        return dfd.promise();
    };

    function dfdReject(dfd, event) {
        logger.error(event.message);
        dfd.reject(event.message);
    }

    function dfdResolve_result(dfd, event) {
        if (event) {
            dfd.resolve(event.target.result);
        } else {
            dfd.resolve();
        }
    }

    Storage.prototype.cursor = function storage_cursor(objectStore, value, index) {
        this.startTransaction(objectStore);
        var store = this.objectStore(objectStore);
        if ((index || '') !== '') {
            store = store.index(index);
        }
        if (value === null || value === undefined) {
            return store.openCursor();
        } else {
            return store.openCursor(value);
        }
    };

    Storage.prototype.getAll = function storage_getAll(objectStore, value, index) {
        var dfd = $.Deferred();
        var cursor = this.cursor(objectStore, value, index);
        var result = [];
        cursor.onsuccess = getAll_onsuccess.bind(null, dfd, result);
        cursor.onerror = dfdReject.bind(null, dfd);
        return dfd.promise();
    };

    function getAll_onsuccess(dfd, result, event) {
        var cursor = event.target.result;
        if (cursor) {
            result.push({ key: cursor.primaryKey, value: cursor.value });
            cursor.continue();
        } else {
            dfd.resolve(result);
        }
    }

    Storage.prototype.keyCursor = function storage_keyCursor(objectStore, value, index) {
        this.startTransaction(objectStore);
        var store = this.objectStore(objectStore);
        store = store.index(index);
        if (value === null || value === undefined) {
            return store.openKeyCursor();
        }
        return store.openKeyCursor(value);
    };

    Storage.prototype.getAllKeys = function storage_getAllKeys(objectStore, value, index) {
        var dfd = $.Deferred();
        var cursor = this.keyCursor(objectStore, value, index);
        var result = [];
        cursor.onsuccess = getAllKeys_onsuccess.bind(null, dfd, result);
        cursor.onerror = dfdReject.bind(null, dfd);
        return dfd.promise();
    };

    function getAllKeys_onsuccess(dfd, result, event) {
        var cursor = event.target.result;
        if (cursor) {
            result.push(cursor.primaryKey);
            cursor.continue();
        } else {
            dfd.resolve(result);
        }
    }

    Storage.prototype.put = function storage_put(objectStore, doc, key) {
        var dfd = $.Deferred();
        this.startTransaction(objectStore, 'readwrite');
        var store = this.objectStore(objectStore);
        var request;
        if (key === null || key === undefined) {
            request = store.put(doc);
        } else {
            request = store.put(doc, key);
        }
        registerRequestCallbacks(request, dfd);
        return dfd.promise();
    };

    Storage.prototype.insert = function storage_insert(objectStore, doc) {
        var dfd = $.Deferred();
        this.startTransaction(objectStore, 'readwrite');
        var store = this.objectStore(objectStore);
        var request = store.add(doc);
        registerRequestCallbacks(request, dfd);
        return dfd.promise();
    };

    Storage.prototype.delete = function storage_delete(objectStore, key) {
        var dfd = $.Deferred();
        this.startTransaction(objectStore, 'readwrite');
        var store = this.objectStore(objectStore);
        var request = store.delete(key);
        request.onsuccess = dfdResolve_result.bind(null, dfd);
        request.onerror = dfdReject.bind(null, dfd);
        return dfd.promise();
    };

    Storage.prototype.deleteAll = function storage_deleteAll(objectStore, keys) {
        var dfd = $.Deferred();
        var self = this;
        var deletes = [];

        keys.forEach(function (key) { deletes.push(self.delete(objectStore, key)); });
        $.when.apply($, deletes)
            .done(dfdResolve_result.bind(null, dfd))
            .fail(dfdReject.bind(null, dfd));

        return dfd.promise();
    };

    Storage.prototype.deleteRange = function storage_deleteAll(objectStore, range, index) {
        var dfd = $.Deferred();
        var self = this;
        this.getAllKeys(objectStore, range, index)
            .done(function (keys) {
                self.deleteAll(objectStore, keys)
                    .done(function () {
                        dfd.resolve(keys);
                    })
                    .fail(dfd.reject.bind(dfd));
            })
            .fail(dfd.reject.bind(dfd));
        return dfd.promise();
    };

    Storage.prototype.clear = function storage_clear(objectStore) {
        var dfd = $.Deferred();
        this.startTransaction(objectStore, 'readwrite');
        var store = this.objectStore(objectStore);
        var request = store.clear();
        registerRequestCallbacks(request, dfd);
        return dfd.promise();
    };

    function registerRequestCallbacks(request, dfd) {
        request.onsuccess = dfdResolve_result.bind(null, dfd);
        request.onerror = dfdReject.bind(null, dfd);
    }

    return Storage;
});
