import {merge, of} from 'ramda';
import {ElementR} from 'system/react/react-types';

type WithTarget = { target: {} };

export function newEvent(target: {}, detail: any): WithTarget {
    return merge({ target: target }, detail);
}

export function withEventProperty(property: PropertyName, callback: Action1<any>): (object: {}) => void {
    return function (object: {}): void {
        callback(object[property]);
    };
}

export function withTargetProperty(property: PropertyName, callback: Action2<{}, {}>): (object: WithTarget) => void {
    return function (object: WithTarget): void {
        callback(object.target[property], object);
    };
}

interface Mappable<T> {
    length: number;
    map<Toutput>(callback: Mapper<T, Toutput>): Toutput[];
}

export function mapOrDefault<T>(callback: Mapper<T, ElementR>, dflt: Func<ElementR>, items: Mappable<T>): ElementR[] {
    if (items.length) {
        return items.map(callback);
    } else if (dflt) {
        return of(dflt());
    }
    return [];
}

export function elementOrDefault<T>(callback: Func1<T, ElementR>,
                                    dflt: Undefinable<Func<ElementR>>,
                                    item: Nillable<T>): ElementR | string {
    if (item !== null && item !== undefined) {
        return callback(item);
    } else if (dflt) {
        return dflt();
    }
    return '';
}

export function elementOrNothing<T>(callback: Func1<T, ElementR>, item: Nillable<T>): ElementR | string {
    return elementOrDefault(callback, undefined, item);
}