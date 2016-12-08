import * as $ from 'jquery';
import * as ko from 'knockout';
import {resolve} from 'system/lang/object';

class List {
    /// <summary>
    ///     Finds the index of the first match according to the criteria. If no matches are
    ///     &#10;   found the return value will be -1.
    /// </summary>
    /// <param name="array" type="array">
    ///     The array to search
    /// </param>
    /// <param name="Criteria" type="function">
    ///     A function and has the following parameters:
    ///     &#10;    value: The value of the array element being evaluated.
    ///     &#10;    index: The index within the array of the element being evaluated.
    /// </param>
    /// <returns type="number" />
    public static indexOf(array: any[], criteria: Function): number {
        let result = -1;

        //  The value must be an array.
        if ($.isArray(array) === false) {
            return result;
        }

        $.each(array, function (index: number, value: any): boolean | void {
            if (criteria(value, index) === true) {
                result = index;
                return false; // breaks the each
            }
        });
        return result;
    };

    /// <summary>
    ///     Sorts the array in place and returns the array.
    /// </summary>
    /// <param name="array" type="array">
    ///     The array to sort
    /// </param>
    /// <param name="direction" type="bool">
    ///     true = ascending, false = descending.
    /// </param>
    /// <param name="property" type="string">
    ///     null: compares the array elements themselves.  Assigning a property will sort
    ///     &#10;     based on the property defined.
    /// </param>
    /// <param name="type" type="string">
    ///     null: does a typeof operation on the values to determine the sort type.
    ///     &#10;     This values supports any value from typeof or 'datetime' to sort times.  There is
    ///     &#10;     special handling for 'boolean', 'number', and 'datetime'.  All other types are
    ///     &#10;     sorted as strings.
    /// </param>
    /// <returns type="array" />
    public static sort(array: any[], direction: boolean, property: string, type: string): void {
        function compareBoolean(valA: boolean, valB: boolean): number {
            return ((valA && valB) || (!valA && !valB)) ? 0 : valA ? 1 : -1;
        }

        function compareDateTime(valA: Date, valB: Date): number {
            return (valA === valB) ? 0 : ((valA < valB) ? -1 : 1);
        }

        function compareDefault(valA: any, valB: any): number {
            const stringA = valA.toString().toLocaleLowerCase();
            const stringB = valB.toString().toLocaleLowerCase();
            return (stringA === stringB) ? 0 : ((stringA < stringB) ? -1 : 1);
        }

        function doSort(a: any, b: any): number {
            const valA = ko.utils.unwrapObservable(property ? a[property] : a);
            const valB = ko.utils.unwrapObservable(property ? b[property] : b);

            type = type || typeof valA;

            let result;

            switch (type) {
                case 'boolean':
                    result = compareBoolean(valA, valB);
                    break;
                case 'number':
                    result = valA - valB;
                    break;
                case 'datetime':
                    result = compareDateTime(valA, valB);
                    break;
                default:
                    result = compareDefault(valA, valB);
                    break;
            }
            if (!direction) {
                result = 0 - result;
            }

            return result;
        }

        array.sort(doSort);
    };

    /// <summary>
    ///     Changes all values in a given array, from index 0 to count-1, to a specific value.
    /// </summary>
    /// <param name="array" type="array">
    ///     The array to fill
    /// </param>
    /// <param name="count" type="number">
    ///     The maximum index in array to replace.
    /// </param>
    /// <param name="value" type="any">
    ///     Value to replace each element in array with.
    /// </param>
    /// <returns type="array" />
    public static fillArray(array: any[], count: number, value: any): any[] {
        while (count--) {
            array[count] = value;
        }
        return array;
    };

    public items: any[];

    constructor(items: any[] = []) {
        this.items = items;
    }

    public count(): number {
        return this.items.length;
    }

    public add(item: any): void {
        this.items[this.count()] = item;
    }

    public item(index: number): any {
        if (index < 0) {
            index += this.count();
        }
        return this.items[index];
    }

    public clear(): void {
        this.items.length = 0;
    }

    public indexOf(item: any): number {
        return this.items.indexOf(item);
    }

    public contains(item: any): boolean {
        return this.indexOf(item) !== -1;
    }

    public addRange(items: any[]): void {
        items.forEach(this.add, this);
    }

    public forEach(callback: Function, context?: any): void {
        for (let i = 0; i !== this.count() ; i++) {
            callback.call(context, this.item(i), i, this);
        }
    }

    public map(callback: Function, context?: any): List {
        const result = resolve(this.constructor);
        for (let i = 0; i !== this.count() ; i++) {
            result.add(callback.call(context, this.item(i), i, this));
        }
        return result;
    };

    public take(count: number): List {
        let values;
        if (count >= 0) {
            values = this.items.slice(0, count);
        } else {
            values = this.items.slice(count);
        }
        return resolve(this.constructor, values);
    };

    public shift(): any {
        return this.items.shift();
    }

    public pop(): any {
        return this.items.pop();
    };

    public moveToEnd(item: any): void {
        this.remove(item);
        this.add(item);
    };

    public remove(item: any): void {
        const index = this.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    };

    /// <summary>
    ///     Creates an object that stores all of the field metadata for a node
    ///     &#10;    and allows the user to index the metadata using the field ID.
    /// </summary>
    /// <param name="array" type="array">
    ///     The array to index
    /// </param>
    /// <param name="key" type="string">
    ///     the property name from the array elements to use as the key for the
    ///     resulting hash.
    /// </param>
    /// <returns type="associative array" />
    public createArrayIndex(array: any[], key: string): {} {
        const index = {};
        if (array) {
            for (let i = 0; i < array.length; i++) {
                index[array[i][key]] = array[i];
            }
        }
        return index;
    };
}

export = List;
