define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        Device = require('system/hardware/device');

    var DESKTOP_PIXEL_RATIO = 1,
        PARTIAL_SUPPORT_MINIMUM = 767,
        FULL_SUPPORT_DESKTOP_MINIMUM = 1000,
        FULL_SUPPORT_MOBILE_MINIMUM = 1920;

    function ScreenSize() {
        this.__private__ = {
            device: Object.resolve(Device)
        };
    }

    ScreenSize.prototype.isTooSmallForAllPages = function () {
        return getInnerWidth(this) < PARTIAL_SUPPORT_MINIMUM;
    };

    function getDeviceInnerWidth(self) {
        return getDevice(self).deviceInnerWidth();
    }

    function getDevice(self) {
        assertThis(self);
        return self.__private__.device;
    }

    ScreenSize.prototype.isTooSmallForSomePages = function () {
        if (isDesktop(this)) {
            return isDesktopTooSmallForSomePages(this);
        } else {
            return isMobileTooSmallForSomePages(this);
        }
    };

    function isDesktop(self) {
        return getPixelRatio(self) <= DESKTOP_PIXEL_RATIO;
    }

    function getPixelRatio(self) {
        return getDevice(self).pixelRatio();
    }

    function isDesktopTooSmallForSomePages(self) {
        return getInnerWidth(self) < FULL_SUPPORT_DESKTOP_MINIMUM;
    }

    function getInnerWidth(self) {
        return getDevice(self).innerWidth();
    }

    function isMobileTooSmallForSomePages(self) {
        return getDeviceInnerWidth(self) < FULL_SUPPORT_MOBILE_MINIMUM;
    }

    ScreenSize.prototype.toString = function () {
        var properties = JSON.stringify({
            pixelRatio: getPixelRatio(this),
            deviceInnerWidth: getDeviceInnerWidth(this)
        });
        return "ScreenSize " + properties;
    };

    function assertThis(self) {
        Assert.instanceOf(self, ScreenSize, 'self');
        Assert.instanceOf(self.__private__.device, Device, 'self.__private__.device');
    }

    return ScreenSize;
});