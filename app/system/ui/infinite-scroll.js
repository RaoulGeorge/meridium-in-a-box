define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function InfiniteScroll(triggerPercent) {
        base.call(this);
        this.$region = null;
        this.paused = false;
        this.percentage = triggerPercent || 0.75;
    }

    var base = Object.inherit(Event, InfiniteScroll);

    InfiniteScroll.prototype.add = function infinteScroll_add() {
        var region = Array.prototype.splice.call(arguments, 2, 1)[0],
            selector = Array.prototype.splice.call(arguments, 2, 1)[0];

        this.$region = region.$element.find(selector);
        base.prototype.add.apply(this, arguments);
        this.$region.on('scroll', this, regionScrolled);
    };

    InfiniteScroll.prototype.remove = function infiniteScroll_remove() {
        this.$region.off('scroll', regionScrolled);
        base.prototype.remove.apply(this, arguments);
    };

    InfiniteScroll.prototype.pause = function infiniteScroll_pause() {
        this.paused = true;
    };

    InfiniteScroll.prototype.resume = function infiniteScroll_resume() {
        this.paused = false;
    };

    InfiniteScroll.prototype.scrollTop = function infiniteScroll_scrollTop(top) {
        if (this.$region) {
            this.$region.scrollTop(top || 0);
        }
    };

    function regionScrolled(event) {
        var scrollRegion = event.target,
            self = event.data;

        if (self.paused) { return; }

        if (((scrollRegion.offsetHeight + scrollRegion.scrollTop) / scrollRegion.scrollHeight) >= self.percentage) {
            self.pause();
            base.prototype.raise.call(self, self.resume.bind(self));
        }
    }

    return InfiniteScroll;

});
