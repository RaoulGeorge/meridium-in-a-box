import * as _ from 'lodash';
import * as $ from 'jquery';
import * as Promise from 'bluebird';

declare const __extends: Function;

function inherit(base: Function, inherited: Function): Function {
    __extends(inherited, base);
    return base;
}

function construct(ctor: Function): any {
    return new (Function.prototype.bind.apply(ctor, arguments))();
}

function resolve(ctor: Function, ...params: any[]): any {
    if (hasSingletonInstance(ctor)) { return getSingletonInstance(ctor); }

    let instance;
    if (hasFactory(ctor)) {
        instance = executeFactory(ctor);
    } else {
        const dependencies = getDependencies(ctor);
        let args = _.map(dependencies, (dependency: Function) => resolve(dependency));
        args.unshift(ctor);
        args = args.concat(params);
        instance = construct.apply(null, args);
    }

    if (isSingleton(ctor)) {
        setSingletonInstance(ctor, instance);
    }
    return instance;
}

function hasSingletonInstance(ctor: Function): boolean {
    return ctor['singleton'] && ctor['instance'];
}

function getSingletonInstance(ctor: Function): any {
    return ctor['instance'];
}

function hasFactory(ctor: Function): boolean {
    return ctor['factory'] && _.isFunction(ctor['factory']);
}

function executeFactory(ctor: Function): any {
    return getFactory(ctor)();
}

function getFactory(ctor: Function): Function {
    return ctor['factory'];
}

function getDependencies(ctor: Function): Function[] {
    return ctor['dependsOn'] || [];
}

function isSingleton(ctor: Function): boolean {
    return !!ctor['singleton'];
}

function setSingletonInstance(ctor: Function, instance: any): void {
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
function createEnum(values: {}, startIndex: number): any {
    const enumeration: any[] = [];
    let i = 0;
    startIndex = startIndex || 0;

    for (i = 0; i < startIndex; i++) {
        // create empty vals to fill the beginning of the array.
        enumeration.push({});
    }

    _.each(values, function (value: any, key: string): void {
        const enumVal = {
            id: i,
            name: key,
            text: value,
            toString: function (): string {
                return value;
            }
        };
        enumeration[key] = enumVal;
        enumeration.push(enumVal);
        i++;
    });

    enumeration['parse'] = function (val: any): any {
        if (!isNaN(val)) {
            return enumeration[val];
        } else {
            let enumValue = undefined;

            _.each(enumeration, function (value: any): void {
                if (val === value) {
                    enumValue = val;
                }
            });

            if (!enumValue) {
                _.each(values, function (value: any, key: string): void {
                    if (val === value || val === key) {
                        enumValue = enumeration[key];
                    }
                });
            }
            return enumValue;
        }
    };

    enumeration['getDisplayText'] = function (val: any): string {
        const enumVal = enumeration['parse'](val);
        if (enumVal) {
            return enumVal.text;
        } else {
            return '';
        }
    };

    if (Object.freeze) {
        Object.freeze(enumeration);
    }
    return enumeration;
}

function tryMethod(context: any, methodName: string, ...addl: any[]): any {
    const args = Array.prototype.slice.call(arguments, 2);
    if (!respondsTo(context, methodName)) {
        return undefined;
    }
    return context[methodName].apply(context, args);
}

function use(object: any, callback: Function): void {
    callback(object);
    tryMethod(object, 'dispose');
}

function respondsTo(context: any, methods: string | string[], throwOnUndefined: boolean = false): boolean {
    if (!_.isArray(methods)) {
        methods = [methods];
    }

    for (let i = 0; i < methods.length; i++) {
        if (!_.isFunction(context[methods[i]])) {
            if (throwOnUndefined) {
                throw ('Required method ' + methods[i] + ' is not defined');
            }
            return false;
        }
    }

    return true;
}

function method(context: any, methodName: string): any {
    const f = context[methodName];
    if (!f) {
        return undefined;
    }
    if (!_.isFunction(f)) {
        return undefined;
    }
    return f.bind(context);
}

function trySet(context: any, propertyName: string, value: any): boolean {
    if (context[propertyName]) {
        context[propertyName] = value;
        return true;
    } else {
        return false;
    }
}

function removeProperty(context: any, propertyName: string): any {
    let value;
    if (context[propertyName]) {
        value = context[propertyName];
        delete context[propertyName];
    }
    return value;
}

function defaultValue(value: any, dValue: any): any {
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
    if (value === null) { return dValue; }
    if (value === undefined) { return dValue; }
    return value;
}

function prop(store: any): Function {
    const f = function(): any {
        if (arguments.length) { store = arguments[0]; }
        return store;
    };

    f['prop'] = function(): any {
        return store;
    };

    return f;
}

class AbstractClassError {
    public name: string = 'AbstractClassError';
    constructor(public message:string = '') {}
}

class AbstractMethodError {
    public name:string = 'AbstractMethodError';
    constructor(public message:string = '') {}
}

function abstractClass(instance: any, ctor: Constructor): void {
    if (instance.constructor === ctor) {
        throw new AbstractClassError('Cannot create an instance of abstract class ' + (ctor['name'] || ''));
    }
}

function abstractMethod(name: MethodName): never {
    throw new AbstractMethodError('Cannot execute abstract method ' + name + ', must be overridden');
}

function requireModules(modules: string[]): Promise<any[]> {
    return new Promise<any[]>(fetchModules.bind(null, modules));
}

function fetchModules(modules: string[], resolve: Function, reject: Function): void {
    require(modules, resolveArguments.bind(null, resolve), rejectArguments.bind(null, reject));
}

function rejectArguments(reject: Function, error: any): Error {
    reject(error);
    throw new Error(error);
}

function resolveArguments(resolve: Function, ...args: any[]): void {
    resolve(args);
}

const members = {
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

export = members;
