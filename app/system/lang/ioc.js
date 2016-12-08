define(["require", "exports"], function (require, exports) {
    "use strict";
    function dependsOn() {
        var dependencies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            dependencies[_i] = arguments[_i];
        }
        return function (target) {
            target['dependsOn'] = dependencies;
        };
    }
    exports.dependsOn = dependsOn;
    function singleton(target) {
        target['singleton'] = true;
    }
    exports.singleton = singleton;
    function factory(factory) {
        return function (target) {
            target['factory'] = factory;
        };
    }
    exports.factory = factory;
});
