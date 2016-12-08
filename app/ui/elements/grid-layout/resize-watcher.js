define(function defineResizeWatcher(require) {
    'use strict';

    var $ = require('jquery');


    var Size = require('./size'),
        IntervalTimer = require('system/lang/interval-timer'),
        Event = require('system/lang/event'),
        Assert = require('mi-assert');

    var INTERVAL = 300;

    function ResizeWatcher() {
        this.sizeChanged = new Event();
        this.size = new Size(0, 0);
        this.newSize = new Size(0, 0);
        this.element = null;
        this.$element = null;
        this.timer = Object.resolve(IntervalTimer, INTERVAL);
    }

    ResizeWatcher.prototype.watch = function watch(element) {
        Assert.instanceOf(element, HTMLElement);
        this.element = element;
        this.$element = $(element);
        this.size.update(this.$element.width(), this.$element.height());
        startListening(this);
    };

    ResizeWatcher.prototype.timerElapsed = function timerElapsed() {
        var newSize = calculateSize(this, this.element),
            sizeChanged = !this.size.equals(newSize);
        if (sizeChanged) {
            this.size.update(newSize.width, newSize.height);
            raiseSizeChanged(this);
        }
    };

    ResizeWatcher.prototype.stop = function stop() {
        this.element = null;
        this.$element = null;
        this.size.update(0, 0);
        stopListening(this);
    };

    function startListening(self) {
        Assert.instanceOf(self, ResizeWatcher);
        self.timer.elapsed.add(self.timerElapsed, self);
        self.timer.start();
    }

    function stopListening(self) {
        Assert.instanceOf(self, ResizeWatcher);
        self.timer.stop();
        self.timer.elapsed.remove(self);
    }

    function calculateSize(self, element) {
        Assert.instanceOf(self, ResizeWatcher);
        Assert.instanceOf(element, HTMLElement);
        self.newSize.update(self.$element.width(), self.$element.height());
        return self.newSize;
    }

    function raiseSizeChanged(self) {
        Assert.instanceOf(self, ResizeWatcher);
        self.sizeChanged.raise(self, self.size.height, self.size.width);
    }

    return ResizeWatcher;
});
