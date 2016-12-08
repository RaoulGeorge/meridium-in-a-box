define(function defineMiAssert(require) {
    'use strict';

    function AssertionError(message) {
        this.name = 'AssertionError';
        this.message = message || '';
    }

    AssertionError.prototype = new Error();
    AssertionError.prototype.constructor = AssertionError;

    function defaultName(name) {
        return name || 'value';
    }

    function valueString(object) {
        return object ? object.toString() : object;
    }

    function classString(type) {
        if (type) {
            if (type.name) {
                return type.name;
            } else {
                return type;
            }
        } else {
            return type;
        }
    }

    function typeString(object) {
        if (object) {
            if (object.constructor && object.constructor.name) {
                return object.constructor.name;
            } else if (object.__proto__ && object.__proto__.constructor && object.__proto__.constructor.name) {
                return object.__proto__.constructor.name;
            } else {
                return object;
            }
        } else {
            return object;
        }
    }

    function assert(expression, message) {
        if (unless(expression)) {
            fail(message);
        }
    }

    function unless(expression) {
        return !expression;
    }

    function fail(message) {
        if (console.error) { console.error(message); }
        throw new AssertionError(message);
    }

    function ok(object, name) {
        if (unless(object)) {
            fail('expected ' + defaultName(name) + ' to be truthy, was ' + valueString(object));
        }
    }

    function notOk(object, name) {
        if (unless(!object)) {
            fail('expected ' + defaultName(name) + ' to be falsy, was ' + valueString(object));
        }
    }

    function isNull(object, name) {
        if (unless(object === null)) {
            fail('expected ' + defaultName(name) + ' to be null, was ' + valueString(object));
        }
    }

    function isNotNull(object, name) {
        if (unless(object !== null)) {
            fail('expected ' + defaultName(name) + ' to not be null, was ' + valueString(object));
        }
    }

    function isUndefined(object, name) {
        if (unless(object === undefined)) {
            fail('expected ' + defaultName(name) + ' to be undefined, was ' + valueString(object));
        }
    }

    function isNotUndefined(object, name) {
        if (unless(object !== undefined)) {
            fail('expected ' + defaultName(name) + ' to be defined, was ' + valueString(object));
        }
    }

    function isFunction(object, name) {
        if (unless(_.isFunction(object))) {
            fail('expected ' + defaultName(name) + ' to be a function, was ' + valueString(object));
        }
    }

    function isObject(object, name) {
        if (unless(_.isObject(object))) {
            fail('expected ' + defaultName(name) + ' to be an object, was ' + valueString(object));
        }
    }

    function isArray(object, name) {
        if (unless(_.isArray(object))) {
            fail('expected ' + defaultName(name) + ' to be an array, was ' + valueString(object));
        }
    }

    function isString(object, name) {
        if (unless(_.isString(object))) {
            fail('expected ' + defaultName(name) + ' to be a string, was ' + valueString(object));
        }
    }

    function isNumber(object, name) {
        if (unless(_.isNumber(object))) {
            fail('expected ' + defaultName(name) + ' to be a number, was ' + valueString(object));
        }
        if (unless(!_.isNaN(object))) {
            fail('expected ' + defaultName(name) + ' to be a number, was ' + valueString(object));
        }
    }

    function isBoolean(object, name) {
        if (unless(_.isBoolean(object))) {
            fail('expected ' + defaultName(name) + ' to be a boolean, was ' + valueString(object));
        }
    }

    function instanceOf(object, type, name) {
        if (unless(object instanceof type)) {
            fail('expected ' + defaultName(name) + ' to be of type ' +
                type.prototype.constructor.name || type.prototype.constructor +
                ', was ' + typeString(object));
        }
    }

    function isDeferred(object, name) {
        var IS_OBJECT =  _.isObject(object),
            HAS_ALWAYS = _.isFunction(object.always),
            HAS_DONE = _.isFunction(object.done),
            HAS_FAIL = _.isFunction(object.fail),
            HAS_PROMISE = _.isFunction(object.promise),
            HAS_RESOLVE = _.isFunction(object.resolve),
            HAS_REJECT = _.isFunction(object.reject);
        if (!(IS_OBJECT && HAS_ALWAYS && HAS_DONE && HAS_FAIL && HAS_PROMISE && HAS_RESOLVE && HAS_REJECT)) {
            assert(false, 'expected ' + defaultName(name) + ' to be a Deferred, was ' + valueString(object));
        }
    }

    function stringNotEmpty(object, name) {
        isString(object, name);
        if (unless(object.length > 0)) {
            fail('expected ' + defaultName(name) + ' to not empty');
        }
    }

    function implementsInterface(object, intf, name) {
        var expression = object;
        assertInterface(intf);
        if (!expression) {
            try {
                intf.implementedBy(object)
            } catch (message) {
                assert(false, 'expected ' + defaultName(name) + ' to implement interface ' + intf.name + ': ' + message);
            }
        }
    }

    function assertInterface(intf) {
        if (unless(!_.isUndefined(intf.name))) {
            fail('expected ' + typeString(intf) + ' to be an Interface');
        }
        if (unless(_.isFunction(intf.implementedBy))) {
            fail('expected ' + typeString(intf) + ' to be an Interface');
        }
    }

    return {
        enabled: true,
        AssertionError: AssertionError,
        assert: assert,
        ok: ok,
        notOk: notOk,
        isNull: isNull,
        isNotNull: isNotNull,
        isUndefined: isUndefined,
        isNotUndefined: isNotUndefined,
        isFunction: isFunction,
        isObject: isObject,
        isArray: isArray,
        isString: isString,
        isNumber: isNumber,
        isBoolean: isBoolean,
        instanceOf: instanceOf,
        isDeferred: isDeferred,
        stringNotEmpty: stringNotEmpty,
        implementsInterface: implementsInterface,
        assertInterface: assertInterface
    };
});