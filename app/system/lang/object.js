define(["require", "exports", "lodash", "jquery", "bluebird"], function (require, exports, _, $, Promise) {
    "use strict";
    function inherit(base, inherited) {
        __extends(inherited, base);
        return base;
    }
    function construct(ctor) {
        return new (Function.prototype.bind.apply(ctor, arguments))();
    }
    function resolve(ctor) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (hasSingletonInstance(ctor)) {
            return getSingletonInstance(ctor);
        }
        var instance;
        if (hasFactory(ctor)) {
            instance = executeFactory(ctor);
        }
        else {
            var dependencies = getDependencies(ctor);
            var args = _.map(dependencies, function (dependency) { return resolve(dependency); });
            args.unshift(ctor);
            args = args.concat(params);
            instance = construct.apply(null, args);
        }
        if (isSingleton(ctor)) {
            setSingletonInstance(ctor, instance);
        }
        return instance;
    }
    function hasSingletonInstance(ctor) {
        return ctor['singleton'] && ctor['instance'];
    }
    function getSingletonInstance(ctor) {
        return ctor['instance'];
    }
    function hasFactory(ctor) {
        return ctor['factory'] && _.isFunction(ctor['factory']);
    }
    function executeFactory(ctor) {
        return getFactory(ctor)();
    }
    function getFactory(ctor) {
        return ctor['factory'];
    }
    function getDependencies(ctor) {
        return ctor['dependsOn'] || [];
    }
    function isSingleton(ctor) {
        return !!ctor['singleton'];
    }
    function setSingletonInstance(ctor, instance) {
        ctor['instance'] = instance;
    }
    /// <summary>
    ///     Creates an enum object that can be accessed as either an indexed array
    ///     or as an associative array.
    /// </summary>
    /// <param name="values" type="object">
    ///     An object containing all enum values and their display text such as
    ///     { red: 'Red', blue: 'Blue', lightBlue: 'Light Blue' }
    /// </param>
    /// <returns>The enumeration object.</returns>
    function createEnum(values, startIndex) {
        var enumeration = [];
        var i = 0;
        startIndex = startIndex || 0;
        for (i = 0; i < startIndex; i++) {
            // create empty vals to fill the beginning of the array.
            enumeration.push({});
        }
        _.each(values, function (value, key) {
            var enumVal = {
                id: i,
                name: key,
                text: value,
                toString: function () {
                    return value;
                }
            };
            enumeration[key] = enumVal;
            enumeration.push(enumVal);
            i++;
        });
        enumeration['parse'] = function (val) {
            if (!isNaN(val)) {
                return enumeration[val];
            }
            else {
                var enumValue_1 = undefined;
                _.each(enumeration, function (value) {
                    if (val === value) {
                        enumValue_1 = val;
                    }
                });
                if (!enumValue_1) {
                    _.each(values, function (value, key) {
                        if (val === value || val === key) {
                            enumValue_1 = enumeration[key];
                        }
                    });
                }
                return enumValue_1;
            }
        };
        enumeration['getDisplayText'] = function (val) {
            var enumVal = enumeration['parse'](val);
            if (enumVal) {
                return enumVal.text;
            }
            else {
                return '';
            }
        };
        if (Object.freeze) {
            Object.freeze(enumeration);
        }
        return enumeration;
    }
    function tryMethod(context, methodName) {
        var addl = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            addl[_i - 2] = arguments[_i];
        }
        var args = Array.prototype.slice.call(arguments, 2);
        if (!respondsTo(context, methodName)) {
            return undefined;
        }
        return context[methodName].apply(context, args);
    }
    function use(object, callback) {
        callback(object);
        tryMethod(object, 'dispose');
    }
    function respondsTo(context, methods, throwOnUndefined) {
        if (throwOnUndefined === void 0) { throwOnUndefined = false; }
        if (!_.isArray(methods)) {
            methods = [methods];
        }
        for (var i = 0; i < methods.length; i++) {
            if (!_.isFunction(context[methods[i]])) {
                if (throwOnUndefined) {
                    throw ('Required method ' + methods[i] + ' is not defined');
                }
                return false;
            }
        }
        return true;
    }
    function method(context, methodName) {
        var f = context[methodName];
        if (!f) {
            return undefined;
        }
        if (!_.isFunction(f)) {
            return undefined;
        }
        return f.bind(context);
    }
    function trySet(context, propertyName, value) {
        if (context[propertyName]) {
            context[propertyName] = value;
            return true;
        }
        else {
            return false;
        }
    }
    function removeProperty(context, propertyName) {
        var value;
        if (context[propertyName]) {
            value = context[propertyName];
            delete context[propertyName];
        }
        return value;
    }
    function defaultValue(value, dValue) {
        /// <summary>
        ///     Allows you to specify a default for an optional value. Differs
        ///     from using the double pipe (||) since it does not use a true/false
        ///     evaluation to test for existence. If value is null or undefined it
        ///     returns the default value, otherwise it returns the original value.
        /// </summary>
        /// <param name="value" type="any">
        ///     The optional value
        /// </param>
        /// <param name="dValue" type="any">
        ///     The default value to use if value is null or undefined
        /// </param>
        /// <returns>
        ///     If value is null or undefined then return defaultValue,
        ///     otherwise return value
        /// </returns>
        if (value === null) {
            return dValue;
        }
        if (value === undefined) {
            return dValue;
        }
        return value;
    }
    function prop(store) {
        var f = function () {
            if (arguments.length) {
                store = arguments[0];
            }
            return store;
        };
        f['prop'] = function () {
            return store;
        };
        return f;
    }
    var AbstractClassError = (function () {
        function AbstractClassError(message) {
            if (message === void 0) { message = ''; }
            this.message = message;
            this.name = 'AbstractClassError';
        }
        return AbstractClassError;
    }());
    var AbstractMethodError = (function () {
        function AbstractMethodError(message) {
            if (message === void 0) { message = ''; }
            this.message = message;
            this.name = 'AbstractMethodError';
        }
        return AbstractMethodError;
    }());
    function abstractClass(instance, ctor) {
        if (instance.constructor === ctor) {
            throw new AbstractClassError('Cannot create an instance of abstract class ' + (ctor['name'] || ''));
        }
    }
    function abstractMethod(name) {
        throw new AbstractMethodError('Cannot execute abstract method ' + name + ', must be overridden');
    }
    function requireModules(modules) {
        return new Promise(fetchModules.bind(null, modules));
    }
    function fetchModules(modules, resolve, reject) {
        require(modules, resolveArguments.bind(null, resolve), rejectArguments.bind(null, reject));
    }
    function rejectArguments(reject, error) {
        reject(error);
        throw new Error(error);
    }
    function resolveArguments(resolve) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        resolve(args);
    }
    var members = {
        construct: construct,
        resolve: resolve,
        inherit: inherit,
        createEnum: createEnum,
        use: use,
        tryMethod: tryMethod,
        respondsTo: respondsTo,
        method: method,
        trySet: trySet,
        removeProperty: removeProperty,
        defaultValue: defaultValue,
        prop: prop,
        AbstractClassError: AbstractClassError,
        AbstractMethodError: AbstractMethodError,
        abstractClass: abstractClass,
        abstractMethod: abstractMethod,
        require: requireModules
    };
    $.extend(Object, members);
    return members;
});
