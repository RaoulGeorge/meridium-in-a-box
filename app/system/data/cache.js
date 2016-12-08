define(function(require) {
    'use strict';

    var _ = require('lodash');
    var Cache = require('cache');
    require('system/lang/object');

    function _Cache(maxSize, type, namespace, keyPrefix) {
        ///#region documentation
        /// <summary>
        ///     A simple LRU cache to store any JSON data. The data can be 
        ///     stored in memory, sessionStorage, or localStorage. The 
        ///     browser must support (session/local)Storage, no attempt is 
        ///     made to shim in support to older browsers.
        /// </summary>
        /// <param name="maxSize" type="integer">
        ///     The maximum number of items that can be stored in the cache.
        ///     For unlimited items use -1 or any falsy value.
        /// </param>
        /// <param name="type" type="enum">
        ///     One of the DataCache.StorageTypes enum values indicating 
        ///     which data storage engine should be used.
        /// </param>
        /// <param name="namespace" type="string">
        ///     A namespace to differentiate this cache from other local/session storage cached objects.
        ///     Not used for in memory cache. If not provided for local/session storage types, two 
        ///     different DataCache objects could share the same set of values.
        /// </param>
        /// <param name="keyPrefix" type="string">
        ///     A string that will be prepended to the keys for all values stored using setItem, 
        ///     as well as during retrieval using getItem. 
        /// &#10;
        /// &#10;    The original intended use case for this is to supply a version number for the
        /// &#10;    application so any data that should change between versions will no longer
        /// &#10;    be loaded from the cache when the version number changes. The items won't 
        /// &#10;    be automatically removed from the cache when this prefix changes, but they 
        /// &#10;    will be removed as the maxSize is hit or the storage provider (local/session) 
        /// &#10;    runs out of storage space. 
        /// </param>
        ///#endregion
        var storageProvider;

        maxSize = maxSize || -1;
        if (maxSize < -1) {
            maxSize = -1;
        }

        type = type || _Cache.StorageTypes.memory;

        switch (type) {
            case _Cache.StorageTypes.memory:
                storageProvider = new Cache.BasicCacheStorage();
                break;
            case _Cache.StorageTypes.local:
                storageProvider = new Cache.LocalStorageCacheStorage(namespace);
                break;
            case _Cache.StorageTypes.session:
                storageProvider = new Cache.SessionStorageCacheStorage(namespace);
                break;
        }

        /* jshint -W040 */
        this.cache = new Cache(maxSize, false, storageProvider);
        this.keyPrefix = keyPrefix || '';
        /* jshint +W040 */
    }

    _Cache.prototype.getItem = function getItem(key) {
        return this.cache.getItem(this.keyPrefix + key);
    };
    _Cache.prototype.setItem = function setItem(key, value, options) {
        options = options || {};

        switch (options.priority) {
            case _Cache.ItemPriority.low:
                options.priority = _Cache.ItemPriority.LOW;
                break;
            case _Cache.ItemPriority.normal:
                options.priority = _Cache.ItemPriority.NORMAL;
                break;
            case _Cache.ItemPriority.high:
                options.priority = _Cache.ItemPriority.HIGH;
                break;
            default:
                options.priority = _Cache.ItemPriority.NORMAL;
                break;
        }

        this.cache.setItem(this.keyPrefix + key, value, options);
    };
    _Cache.prototype.clear = function clear() {
        this.cache.clear();
    };
    _Cache.prototype.getAllKeys = function getAllKeys() {
        var that = this,
            origKeys = this.cache.getAllKeys(),
            newKeys = [];

        if (!this.keyPrefix) {
            return origKeys;
        }

        _.each(origKeys, function(key) {
            if (key.substr(0, that.keyPrefix.length).toLocaleLowerCase() === that.keyPrefix.toLocaleLowerCase()) {
                newKeys.push(key.substr(that.keyPrefix.length));
            } else {
                newKeys.push(key);
            }
        });

        return newKeys;
    };
    _Cache.prototype.removeItem = function removeItem(key) {
        this.cache.removeItem(this.keyPrefix + key);
    };

    /// Static Properties
    _Cache.StorageTypes = Object.createEnum({
        memory: 'Memory',
        local: 'Local Storage',
        session: 'Session Storage'
    });

    _Cache.ItemPriority = Object.createEnum({
        low: 'Low',
        normal: 'Normal',
        high: 'High'
    });

    return _Cache;
});