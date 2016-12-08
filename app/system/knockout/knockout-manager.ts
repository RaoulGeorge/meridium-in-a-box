import * as _ from 'lodash';
import * as ko from 'knockout';

import List = require('system/collections/list');
import ObservableList = require('system/collections/observable-list');
import ChangeTracker = require('./change-tracker');

class KnockoutManager {
    public observables: List;
    public computeds: List;
    public subscriptions: List;
    public tracker: ChangeTracker;
    public isDirty: ko.Computed<boolean>;

    constructor(hashCallback: Function = _.noop) {
        this.observables = new List();
        this.computeds = new List();
        this.subscriptions = new List();
        this.tracker = new ChangeTracker(this, hashCallback);
        this.isDirty = this.tracker.isDirty;
    }

    public observable<T>(): ko.Observable<T>;
    public observable<T>(initialValue: T): ko.Observable<T>;
    public observable(): ko.Observable<any> {
        const observable = ko.observable.apply(null, Array.prototype.splice.call(arguments, 0));
        this.observables.add(observable);
        return observable;
    }

    public observableArray<T>(): ko.ObservableArray<T>;
    public observableArray<T>(initialValue: T[]): ko.ObservableArray<T>;
    public observableArray(): ko.ObservableArray<any> {
        const observable = ko.observableArray.apply(null, Array.prototype.splice.call(arguments, 0));
        this.observables.add(observable);
        return observable;
    }

    public observableList(items: any[]): ObservableList {
        const observable = new ObservableList(items);
        this.observables.add(observable);
        return observable;
    }

    public computed<T>(evaluator: ko.ComputedReadFunction<T>): ko.Computed<T>;
    public computed<T>(evaluator: ko.ComputedReadFunction<T>, evaluatorTarget: any): ko.Computed<T>;
    public computed<T>(evaluator: ko.ComputedReadFunction<T>, evaluatorTarget: any,
                       options: ko.ComputedOptions<T>): ko.Computed<T>;
    public computed<T>(options: ko.ComputedOptions<T>): ko.Computed<T> {
        const computed = ko.computed.apply(null, Array.prototype.splice.call(arguments, 0));
        this.computeds.add(computed);
        return computed;
    }

    public pureComputed<T>(evaluator: ko.ComputedReadFunction<T>): ko.PureComputed<T>;
    public pureComputed<T>(evaluator: ko.ComputedReadFunction<T>, evaluatorTarget: any): ko.PureComputed<T>;
    public pureComputed<T>(evaluator: ko.ComputedReadFunction<T>, evaluatorTarget: any,
                           options: ko.ComputedOptions<T>): ko.PureComputed<T>;
    public pureComputed<T>(options: ko.ComputedOptions<T>): ko.PureComputed<T> {
        const computed = ko.pureComputed.apply(null, Array.prototype.splice.call(arguments, 0));
        this.computeds.add(computed);
        return computed;
    }

    public subscribe<T>(observable: ko.Subscribable<T>,
                        callback: ko.SubscriptionCallback<T>,
                        context?: any, event?: any): ko.subscription<T> {
        const subscription = observable.subscribe(callback, context, event);
        this.subscriptions.add(subscription);
        return subscription;
    }

    public dispose(): void {
        this.disposeSubscriptions();
        this.disposeComputeds();
        this.disposeObservables();
        this.tracker.dispose();
    }

    public disposeSubscriptions(): void {
        this.subscriptions.forEach(function (subscription: { dispose: () => void }): void {
            subscription.dispose();
        });
        this.subscriptions.clear();
    }

    public disposeComputeds(): void {
        this.computeds.forEach(function (computed: { dispose: () => void }): void {
            computed.dispose();
        });
        this.computeds.clear();
    };

    public disposeObservables(): void {
        this.observables.forEach(function (observable: { dispose?: () => void, (value: null): void }): void {
            if (observable.dispose) {
                observable.dispose();
            } else {
                observable(null);
            }
        });
        this.observables.clear();
    };

    public createHash(): any[] {
        return this.observables.items.map((observable: Function) => observable());
    };
}

export = KnockoutManager;
