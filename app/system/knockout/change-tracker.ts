import * as _ from 'lodash';
import * as ko from 'knockout';

class ChangeTracker {
    public hashFunction: Function;
    public objectToTrack: any;
    public lastCleanState: ko.Observable<any | null>;
    public isDirty: ko.Computed<boolean>;

    constructor(objectToTrack: any, hashFunction: Function = ko.toJSON, defaultToDirty: boolean = false) {
        this.hashFunction = hashFunction;
        this.objectToTrack = objectToTrack;

        this.lastCleanState = ko.observable();
        if (!defaultToDirty) {
            this.lastCleanState(executeHashFunction(this));
        }

        this.isDirty = ko.computed<boolean>(isDirty_read.bind(null, this));
    }

    public markCurrentStateAsClean(): void {
        this.lastCleanState(executeHashFunction(this));
    }

    public dispose(): void {
        this.isDirty.dispose();
        this.lastCleanState(null);
    };
}

function isDirty_read(changeTracker: ChangeTracker): boolean {
    return executeHashFunction(changeTracker) !== changeTracker.lastCleanState();
}

function executeHashFunction(changeTracker: ChangeTracker): number | string {
    const hash = changeTracker.hashFunction.apply(changeTracker.objectToTrack);
    if (_.isObject(hash)) {
        return JSON.stringify(hash);
    } else { // must already be a number or a string...
        return hash;
    }
}

export = ChangeTracker;
