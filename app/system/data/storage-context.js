define(function (require) {
    'use strict';

    var storageConfig = require('text!config/storage-config.json');

    function StorageContext() {
        this.dbConfig = null;
        this.version = 0;
    }

    StorageContext.factory = function upgradeStorage_factory(config) {
        var storageContext = new StorageContext();
        storageContext.dbConfig = JSON.parse(config || storageConfig);
        var outOfOrder = storageContext.dbConfig.filter(function (version, i) { return version.version !== i + 1; });
        if (outOfOrder.length > 0) {
            throw 'IndexedDB versions definitions are out of order';
        }
        storageContext.version = storageContext.dbConfig[storageContext.dbConfig.length - 1].version;

        return storageContext;
    };

    StorageContext.prototype.upgradeNeeded = function upgradeStorage_upgradeNeeded(event) {
        this.dbConfig
            .filter(filterByVersionNumber.bind(null, event))
            .forEach(upgradeDatabase.bind(null, event));
    };

    function filterByVersionNumber(event, versionInfo) {
        return event.oldVersion === 9223372036854776000 || event.oldVersion < versionInfo.version;        
    }

    function upgradeDatabase(event, versionInfo) {
        if (versionInfo.objectStores) {
            versionInfo.objectStores.forEach(modifyObjectStore.bind(null, event));
        }

        if (versionInfo.indexes) {
            versionInfo.indexes.forEach(modifyIndex.bind(null, event));
        }
    }

    function modifyObjectStore(event, objectStore) {
        if (objectStore.action === 'add') {
            event.target.result.createObjectStore(objectStore.name, objectStore.options);
        } else {
            event.target.result.removeObjectStore(objectStore.name);
        }
    }

    function modifyIndex(event, index) {
        var objectStore = event.target.transaction.objectStore(index.objectStore);
        if (index.action === 'add') {
            objectStore.createIndex(index.name, index.keyPath, index.options);
        } else {
            objectStore.deleteIndex(index.name);
        }
    }

    return StorageContext;
});
