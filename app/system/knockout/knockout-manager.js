define(["require", "exports", "lodash", "knockout", "system/collections/list", "system/collections/observable-list", "./change-tracker"], function (require, exports, _, ko, List, ObservableList, ChangeTracker) {
    "use strict";
    var KnockoutManager = (function () {
        function KnockoutManager(hashCallback) {
            if (hashCallback === void 0) { hashCallback = _.noop; }
            this.observables = new List();
            this.computeds = new List();
            this.subscriptions = new List();
            this.tracker = new ChangeTracker(this, hashCallback);
            this.isDirty = this.tracker.isDirty;
        }
        KnockoutManager.prototype.observable = function () {
            var observable = ko.observable.apply(null, Array.prototype.splice.call(arguments, 0));
            this.observables.add(observable);
            return observable;
        };
        KnockoutManager.prototype.observableArray = function () {
            var observable = ko.observableArray.apply(null, Array.prototype.splice.call(arguments, 0));
            this.observables.add(observable);
            return observable;
        };
        KnockoutManager.prototype.observableList = function (items) {
            var observable = new ObservableList(items);
            this.observables.add(observable);
            return observable;
        };
        KnockoutManager.prototype.computed = function (options) {
            var computed = ko.computed.apply(null, Array.prototype.splice.call(arguments, 0));
            this.computeds.add(computed);
            return computed;
        };
        KnockoutManager.prototype.pureComputed = function (options) {
            var computed = ko.pureComputed.apply(null, Array.prototype.splice.call(arguments, 0));
            this.computeds.add(computed);
            return computed;
        };
        KnockoutManager.prototype.subscribe = function (observable, callback, context, event) {
            var subscription = observable.subscribe(callback, context, event);
            this.subscriptions.add(subscription);
            return subscription;
        };
        KnockoutManager.prototype.dispose = function () {
            this.disposeSubscriptions();
            this.disposeComputeds();
            this.disposeObservables();
            this.tracker.dispose();
        };
        KnockoutManager.prototype.disposeSubscriptions = function () {
            this.subscriptions.forEach(function (subscription) {
                subscription.dispose();
            });
            this.subscriptions.clear();
        };
        KnockoutManager.prototype.disposeComputeds = function () {
            this.computeds.forEach(function (computed) {
                computed.dispose();
            });
            this.computeds.clear();
        };
        ;
        KnockoutManager.prototype.disposeObservables = function () {
            this.observables.forEach(function (observable) {
                if (observable.dispose) {
                    observable.dispose();
                }
                else {
                    observable(null);
                }
            });
            this.observables.clear();
        };
        ;
        KnockoutManager.prototype.createHash = function () {
            return this.observables.items.map(function (observable) { return observable(); });
        };
        ;
        return KnockoutManager;
    }());
    return KnockoutManager;
});
