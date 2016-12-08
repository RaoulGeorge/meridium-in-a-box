define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        IFrameDialog = require('./ui/iframe-dialog/iframe-dialog-view-model'),
        DialogViewModel = require('system/ui/dialog-view-model');
    var appEvents = require('application/application-events');
    var jQuery = require('jquery');

    function IFrameActionRoute() {
        this.appEvents = Object.resolve(appEvents);
        this.navigate = this.appEvents.navigate;
    }

    IFrameActionRoute.dependsOn = [];

    IFrameActionRoute.prototype.execute = function (config) {
        var dfd = $.Deferred();
        this.showInputDialog(config.query[0].url);
        dfd.resolve();

        return dfd;
    };

    IFrameActionRoute.prototype.showInputDialog = function showInputDialog(url) {
        var self = this;
        var iframeDialog = Object.resolve(IFrameDialog, url);
        var dialog = new DialogViewModel(iframeDialog, '', { height: '90%', width: '90%', closeIcon: true });
        dialog.show();
    };

    return IFrameActionRoute;
});