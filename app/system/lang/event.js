define(["require", "exports", "./event-binding"], function (require, exports, event_binding_1) {
    "use strict";
    var Event = (function () {
        function Event() {
            this.bindings = [];
        }
        Event.prototype.add = function (handler, context) {
            var addl = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                addl[_i - 2] = arguments[_i];
            }
            if (handler === null) {
                throw 'Event handler must not be null';
            }
            if (handler === undefined) {
                throw 'Event handler must not be undefined';
            }
            var args = Array.prototype.slice.call(arguments, 2);
            var binding = new event_binding_1.EventBinding(handler, context, args);
            this.bindings.push(binding);
            return binding;
        };
        ;
        Event.prototype.raise = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var length = this.bindings.length;
            for (var i = 0; i !== length; i++) {
                this.bindings[i].execute(args);
            }
        };
        ;
        Event.prototype.remove = function (handler, context) {
            if (arguments.length > 1) {
                removeByHandlerAndContext(this, handler, context);
            }
            else if (arguments.length > 0) {
                context = handler;
                removeByContext(this, context);
            }
            else {
                removeAll(this);
            }
        };
        ;
        return Event;
    }());
    function removeByHandlerAndContext(event, handler, context) {
        var result = [];
        var length = event.bindings.length;
        for (var i = 0; i !== length; i++) {
            var binding = event.bindings[i];
            if (binding.handler !== handler || binding.context !== context) {
                result.push(binding);
            }
            else {
                binding.dispose();
            }
        }
        event.bindings = result;
    }
    function removeByContext(event, context) {
        var result = [];
        var length = event.bindings.length;
        for (var i = 0; i !== length; i++) {
            var binding = event.bindings[i];
            if (binding.context !== context) {
                result.push(binding);
            }
            else {
                binding.dispose();
            }
        }
        event.bindings = result;
    }
    function removeAll(event) {
        var length = event.bindings.length;
        for (var i = 0; i !== length; i++) {
            event.bindings[i].dispose();
        }
        event.bindings = [];
    }
    return Event;
});
