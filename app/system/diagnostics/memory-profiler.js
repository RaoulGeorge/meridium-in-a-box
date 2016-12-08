define(function (require) {
    'use strict';

    var BYTES_IN_KILOBYTE = 1024,
        BYTES_IN_MEGABYTE = 1024 * 1024,
        ALERT_SIZE = 128 * BYTES_IN_MEGABYTE,
        WARNING_SIZE = ALERT_SIZE * 0.75,
        INTERVAL = 1 * 60 * 1000;

    function MemoryProfiler() {
        this.previous = 0;
        if (isActive()) {
            watch(this);
        }
    }

    MemoryProfiler.prototype.log = function (module, event) {
        if (!isActive()) { return; }
        var current = getCurrent();
        writeOutput(this, module, event, current);
        this.previous = current;
    };

    function getCurrent() {
        if (window.performance.memory) {
            return window.performance.memory.usedJSHeapSize;
        } else {
            return 0;
        }
    }

    function isActive() {
        return false;
        //return window.performance.memory && window.performance.memory.usedJSHeapSize && window.appInfo.debug && window.appInfo.debug.memory;
    }

    function writeOutput(self, module, event, current) {
        var style = '',
            deltaValue =  delta(self, current);
        if (current >= ALERT_SIZE) {
            style = 'color: red';
        } else if (current >= WARNING_SIZE) {
            style = 'color: orange';
        } else if (deltaValue < 0) {
            style = 'color: blue';
        } else if (deltaValue === 0) {
            style = 'color: green';
        }
        console.log('%c%s - %s [%s, %s]', style, module, event,
            (current / BYTES_IN_MEGABYTE).toFixed(3), (deltaValue / BYTES_IN_KILOBYTE).toFixed(3));
    }

    function watch(self) {
        onInterval(self);
        window.setInterval(onInterval.bind(null, self), INTERVAL);
    }

    function onInterval(self) {
        self.log('MemoryProfiler', 'onInterval');
    }

    function delta(self, current) {
        return current - self.previous;
    }

    return new MemoryProfiler();
});