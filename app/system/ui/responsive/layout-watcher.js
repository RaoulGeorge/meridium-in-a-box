define(function (require) {
    'use strict';

    var enquire = require('enquire'),
        Event = require('system/lang/event'),
        LayoutHandler = require('./layout-handler');

    var mediaQueries = {
        phone: '(max-width: 599px)',
        smallTablet: '(min-width: 600px) and (max-width: 767px)',
        tablet: '(min-width: 768px) and (max-width: 1023px)',
        desktop: '(min-width: 1024px)',
        hd: '(min-width: 1280px) and (min-device-aspect-ratio: 16/9)'
    };

    function LayoutWatcher() {
        this.currentLayout = null;
        this.layoutChanged = Object.resolve(Event);
        this.phone = new LayoutHandler('phone', this);
        this.smallTablet = new LayoutHandler('smallTablet', this);
        this.tablet = new LayoutHandler('tablet', this);
        this.desktop = new LayoutHandler('desktop', this);
        this.hd = new LayoutHandler('hd', this);
    }

    LayoutWatcher.prototype.init = function responsiveLayout_init() {
        enquire.register(mediaQueries.phone, this.phone);
        enquire.register(mediaQueries.smallTablet, this.smallTablet);
        enquire.register(mediaQueries.tablet, this.tablet);
        enquire.register(mediaQueries.desktop, this.desktop);
        enquire.register(mediaQueries.hd, this.hd);
    };

    LayoutWatcher.prototype.dispose = function responsiveLayout_dispose() {
        enquire.unregister(mediaQueries.tablet, this.tablet);
        enquire.unregister(mediaQueries.desktop, this.desktop);
        this.tablet.dispose();
        this.desktop.dispose();
    };

    LayoutWatcher.prototype.changeLayout = function (newLayout) {
        var oldLayout = this.currentLayout;
        this.currentLayout = newLayout;
        this.layoutChanged.raise(this, this.currentLayout, oldLayout);
    };

    return LayoutWatcher;
});