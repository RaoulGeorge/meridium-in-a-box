define(function(require) {
    'use strict';

    var localforage = require('localforage');

    var OFFLINE_STORAGE_TABLE = 'meridium-offline';

    function OfflineLoginConfig() {
        //do nothing
    }

    OfflineLoginConfig.prototype.setupOfflineStorageTables = function() {
        configureStorage();
    };

    function configureStorage() {
        var config = {
            name: OFFLINE_STORAGE_TABLE
        };

        localforage.config(config);
    }

    return OfflineLoginConfig;
});