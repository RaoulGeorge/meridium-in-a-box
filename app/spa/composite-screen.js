define(function () {
    'use strict';

    function CompositeScreen() {
    }

    CompositeScreen.prototype.activate = function conductor_activate() {
        //  do nothing, override to implement functionality
    };

    CompositeScreen.prototype.deactivate = function conductor_deactivate() {
        //  do nothing, override to implement functionality
    };

    CompositeScreen.prototype.canUnload = function conductor_canUnload() {
        //  do nothing, override to implement functionality
    };

    CompositeScreen.prototype.attach = function conductor_attach() {
        //  do nothing, override to implement functionality
    };

    CompositeScreen.prototype.detach = function conductor_detach() {
        //  do nothing, override to implement functionality
    };

    return CompositeScreen;
});