define(function () {
    "use strict";

    function Screen() {
        Object.abstractClass(this, Screen);
    }

    Screen.prototype.activate = function screen_activate() {
        //  do nothing, override to implement functionality
    };

    Screen.prototype.attach = function screen_attach() {
        Object.abstractMethod('attach');
    };

    Screen.prototype.detach = function screen_detach() {
        //  do nothing, override to implement functionality
    };

    Screen.prototype.deactivate = function screen_deactivate() {
        //  do nothing, override to implement functionality
    };

    Screen.prototype.canUnload = function screen_canUnload() {
        //  do nothing, override to implement functionality
    };

    return Screen;
});
