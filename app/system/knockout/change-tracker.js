define(["require", "exports", "lodash", "knockout"], function (require, exports, _, ko) {
    "use strict";
    var ChangeTracker = (function () {
        function ChangeTracker(objectToTrack, hashFunction, defaultToDirty) {
            if (hashFunction === void 0) { hashFunction = ko.toJSON; }
            if (defaultToDirty === void 0) { defaultToDirty = false; }
            this.hashFunction = hashFunction;
            this.objectToTrack = objectToTrack;
            this.lastCleanState = ko.observable();
            if (!defaultToDirty) {
                this.lastCleanState(executeHashFunction(this));
            }
            this.isDirty = ko.computed(isDirty_read.bind(null, this));
        }
        ChangeTracker.prototype.markCurrentStateAsClean = function () {
            this.lastCleanState(executeHashFunction(this));
        };
        ChangeTracker.prototype.dispose = function () {
            this.isDirty.dispose();
            this.lastCleanState(null);
        };
        ;
        return ChangeTracker;
    }());
    function isDirty_read(changeTracker) {
        return executeHashFunction(changeTracker) !== changeTracker.lastCleanState();
    }
    function executeHashFunction(changeTracker) {
        var hash = changeTracker.hashFunction.apply(changeTracker.objectToTrack);
        if (_.isObject(hash)) {
            return JSON.stringify(hash);
        }
        else {
            return hash;
        }
    }
    return ChangeTracker;
});
