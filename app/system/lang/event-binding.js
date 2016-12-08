define(["require", "exports"], function (require, exports) {
    "use strict";
    var EventBinding = (function () {
        function EventBinding(handler, context, args) {
            if (args === void 0) { args = []; }
            this.handler = handler;
            this.context = context;
            this.args = args;
        }
        EventBinding.prototype.execute = function (args) {
            if (args === void 0) { args = []; }
            args = this.args.concat(args);
            this.handler.apply(this.context, args);
        };
        EventBinding.prototype.dispose = function () {
            this.handler = null;
            this.context = null;
            this.args = null;
        };
        ;
        return EventBinding;
    }());
    exports.EventBinding = EventBinding;
});
