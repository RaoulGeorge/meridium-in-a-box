define(function () {
    'use strict';

    function TempStorage(storage) {
        this.storage = storage;
    }

    TempStorage.prototype.getItem = function (item) {
        if (!this.storage) {return null; }

        var storageItem = this.storage.getItem(item);

        this.storage.removeItem(item);

        return storageItem;
    };

    TempStorage.prototype.setItem = function (item, value) {
        if (!this.storage) { return null; }

        this.storage.setItem(item, value);
    };

    TempStorage.prototype.removeItem = function (item) {
        if (!this.storage) { return null; }

        this.storage.removeItem(item);
    };

    return TempStorage;
});