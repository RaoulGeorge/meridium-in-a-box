define(["require", "exports", "jquery", "knockout", "system/lang/object"], function (require, exports, $, ko, object_1) {
    "use strict";
    var List = (function () {
        function List(items) {
            if (items === void 0) { items = []; }
            this.items = items;
        }
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
        List.indexOf = function (array, criteria) {
            var result = -1;
            //  The value must be an array.
            if ($.isArray(array) === false) {
                return result;
            }
            $.each(array, function (index, value) {
                if (criteria(value, index) === true) {
                    result = index;
                    return false; // breaks the each
                }
            });
            return result;
        };
        ;
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
        List.sort = function (array, direction, property, type) {
            function compareBoolean(valA, valB) {
                return ((valA && valB) || (!valA && !valB)) ? 0 : valA ? 1 : -1;
            }
            function compareDateTime(valA, valB) {
                return (valA === valB) ? 0 : ((valA < valB) ? -1 : 1);
            }
            function compareDefault(valA, valB) {
                var stringA = valA.toString().toLocaleLowerCase();
                var stringB = valB.toString().toLocaleLowerCase();
                return (stringA === stringB) ? 0 : ((stringA < stringB) ? -1 : 1);
            }
            function doSort(a, b) {
                var valA = ko.utils.unwrapObservable(property ? a[property] : a);
                var valB = ko.utils.unwrapObservable(property ? b[property] : b);
                type = type || typeof valA;
                var result;
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
        ;
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
        List.fillArray = function (array, count, value) {
            while (count--) {
                array[count] = value;
            }
            return array;
        };
        ;
        List.prototype.count = function () {
            return this.items.length;
        };
        List.prototype.add = function (item) {
            this.items[this.count()] = item;
        };
        List.prototype.item = function (index) {
            if (index < 0) {
                index += this.count();
            }
            return this.items[index];
        };
        List.prototype.clear = function () {
            this.items.length = 0;
        };
        List.prototype.indexOf = function (item) {
            return this.items.indexOf(item);
        };
        List.prototype.contains = function (item) {
            return this.indexOf(item) !== -1;
        };
        List.prototype.addRange = function (items) {
            items.forEach(this.add, this);
        };
        List.prototype.forEach = function (callback, context) {
            for (var i = 0; i !== this.count(); i++) {
                callback.call(context, this.item(i), i, this);
            }
        };
        List.prototype.map = function (callback, context) {
            var result = object_1.resolve(this.constructor);
            for (var i = 0; i !== this.count(); i++) {
                result.add(callback.call(context, this.item(i), i, this));
            }
            return result;
        };
        ;
        List.prototype.take = function (count) {
            var values;
            if (count >= 0) {
                values = this.items.slice(0, count);
            }
            else {
                values = this.items.slice(count);
            }
            return object_1.resolve(this.constructor, values);
        };
        ;
        List.prototype.shift = function () {
            return this.items.shift();
        };
        List.prototype.pop = function () {
            return this.items.pop();
        };
        ;
        List.prototype.moveToEnd = function (item) {
            this.remove(item);
            this.add(item);
        };
        ;
        List.prototype.remove = function (item) {
            var index = this.indexOf(item);
            if (index !== -1) {
                this.items.splice(index, 1);
            }
        };
        ;
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
        List.prototype.createArrayIndex = function (array, key) {
            var index = {};
            if (array) {
                for (var i = 0; i < array.length; i++) {
                    index[array[i][key]] = array[i];
                }
            }
            return index;
        };
        ;
        return List;
    }());
    return List;
});
