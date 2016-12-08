/// <amd-dependency path="localforage" />
define(["require", "exports", "jquery", "config/storage-config", "localforage"], function (require, exports, $, StorageConfig) {
    "use strict";
    var LocalForage = require('localforage');
    var DocumentStorage = (function () {
        function DocumentStorage(prefix) {
            var config = $.extend({}, StorageConfig.documentStorage(), { storeName: 'data' });
            this.prefix = prefix + '__';
            this.instance = LocalForage.createInstance(config);
        }
        DocumentStorage.prototype.getItem = function (key) {
            var dfd = $.Deferred();
            this.instance.getItem(this.prefix + key)
                .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
            return dfd.promise();
        };
        DocumentStorage.prototype.setItem = function (key, value) {
            var dfd = $.Deferred();
            this.instance.setItem(this.prefix + key, value)
                .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
            return dfd.promise();
        };
        DocumentStorage.prototype.removeItem = function (key) {
            var dfd = $.Deferred();
            this.instance.removeItem(this.prefix + key)
                .then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
            return dfd.promise();
        };
        return DocumentStorage;
    }());
    return DocumentStorage;
});
