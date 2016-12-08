define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationContext = require('application/application-context'),
        BrowserSniffer = require('system/hardware/browser-sniffer/browser-sniffer');

    function SupportedBrowserTask() {
        Assert.implementsInterface(this, ITask, 'this');
    }

    SupportedBrowserTask.prototype.execute = function () {
        var browserSniffer = new BrowserSniffer(navigator.userAgent);

        if (!browserSniffer.isSupportedPlatform()) {
            ApplicationContext.isSupportedBrowser = false;
        }
    };

    return SupportedBrowserTask;
});