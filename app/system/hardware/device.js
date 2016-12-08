/* global define */
define(function(require){
    "use strict";

    var Detect = require('detect');

    function Device(userAgent) {
        this.userAgent = userAgent || navigator.userAgent;
        this.parsedUserAgent = Detect.parse(this.userAgent);
    }

    Device.prototype.isMobile = function () {
        return this.isAndroid() ||
               this.isBlackBerry() ||
               this.isIOS() ||
               this.isOpera() ||
               this.isWindowsMobile() ||
               this.isWinRT();
    };

    Device.prototype.isMobileApp = function() {
        return (typeof cordova !== 'undefined');
    };

    Device.prototype.isWindows81 = function() {
        return (/Windows NT 6.3/i).test(this.userAgent);
    };

    Device.prototype.isWindowsApp = function() {
        return window.MSApp;
    };

    Device.prototype.isAndroid = function () {
        return (/Android/i).test(this.userAgent);
    };

    Device.prototype.isBlackBerry = function () {
        return (/BlackBerry/i).test(this.userAgent);
    };

    Device.prototype.isIOS = function () {
        return (/iPhone|iPad|iPod/i).test(this.userAgent);
    };

    Device.prototype.isOpera = function () {
        return (/Opera Mini/i).test(this.userAgent);
    };

    Device.prototype.isWindowsMobile = function () {
        return (/IEMobile/i).test(this.userAgent);
    };

    Device.prototype.isWinRT = function () {
        return (/MSAppHost/i).test(this.userAgent);
    };

    Device.prototype.isIE = function () {
        return /Trident/i.test(this.userAgent) && !/MSIE/i.test(this.userAgent);
    };

    Device.prototype.isEdge = function () {
        return /EDGE/i.test(this.userAgent);
    };

    Device.prototype.isChromeOnAndroid = function () {
        if(canReadBrowserAndOS(this)) {
            return this.parsedUserAgent.browser.family.toUpperCase() === 'CHROME' &&
                   this.parsedUserAgent.os.family.toUpperCase() === 'ANDROID';
        } else {
            return false;
        }
    };

    function canReadBrowserAndOS(self) {
        return !!(self.parsedUserAgent.browser.family && self.parsedUserAgent.os.family);
    }

    Device.prototype.innerWidth = function () {
        return window.innerWidth;
    };

    Device.prototype.outerWidth = function () {
        return window.outerWidth;
    };

    Device.prototype.screenWidth = function () {
        return window.screen.width;
    };

    Device.prototype.innerHeight = function () {
        return window.innerHeight;
    };

    Device.prototype.pixelRatio = function () {
        return window.devicePixelRatio;
    };

    Device.prototype.deviceInnerWidth = function () {
        return roundUp(this.innerWidth() * this.pixelRatio());
    };

    function roundUp(value) {
        return Math.ceil(value);
    }

    Device.prototype.deviceOuterWidth = function () {
        return roundUp(this.outerWidth() * this.pixelRatio());
    };

    Device.prototype.deviceScreenWidth = function () {
        return roundUp(this.screenWidth() * this.pixelRatio());
    };

    return Device;
});
