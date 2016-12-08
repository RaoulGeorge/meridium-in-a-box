define(function (require) {
    'use strict';

    var Event = require('./event');

    function IntervalTimer(interval) {
        this.interval = interval;
        this.elapsed = new Event();
        this.onIntervalInstance = null;
        this.id = null;
    }

    IntervalTimer.prototype.start = function timer_start() {
        bindOnInterval(this);
        startTimer(this);
    };

    IntervalTimer.prototype.stop = function timer_stop() {
        unbindOnInterval(this);
        stopTimer(this);
    };

    IntervalTimer.prototype.onInterval = function timer_onInterval() {
        this.elapsed.raise(this);
        startTimer(this);
    };

    function bindOnInterval(self) {
        self.onIntervalInstance = self.onInterval.bind(self);
    }

    function unbindOnInterval(self) {
        self.onIntervalInstance = null;
    }

    function startTimer(self) {
        self.id = setTimeout(self.onIntervalInstance, self.interval);
    }

    function stopTimer(self) {
        if (self.id) {
            clearTimeout(self.id);
            self.id = null;
        }
    }

    return IntervalTimer;
});