define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function LayoutHandler(name, watcher) {
        this.name = name;
        this.watcher = watcher;
        this.started = Object.resolve(Event);
        this.stopped = Object.resolve(Event);
    }

    LayoutHandler.prototype.match = function () {
        this.watcher.changeLayout(this.name);
        this.started.raise(this.watcher);
    };

    LayoutHandler.prototype.unmatch = function () {
        this.stopped.raise(this.watcher);
    };

    LayoutHandler.prototype.dispose = function () {
        this.started.remove();
        this.stopped.remove();
    };

    return LayoutHandler;
});