define(function (require) {
    'use strict';

    var $ = require('jquery');

    var AjaxClient = require('system/http/ajax-client'),
        AjaxRequest = require('system/http/ajax-request'),
        EmailSettingsDTO = require('./email-settings-dto'),
        EMAILPPREF_API_URL = 'meridium/api/core/preference/',
        EMAIL_URL = 'meridium/api/core/email/settings';

    function EmailSettingsService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    EmailSettingsService.dependsOn = [AjaxClient];

    EmailSettingsService.prototype.getSettings = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(EMAIL_URL).done(function (data) {
            dfd.resolve(new EmailSettingsDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    EmailSettingsService.prototype.saveSettings = function (setting) {
        var dfd = $.Deferred();
        this.ajaxClient.put(EMAIL_URL, setting).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
        //this.ajaxClient.put(EMAILPPREF_API_URL, setting).fail(function (response) {
        //    if (response.statusText !== 'OK') {
        //        dfd.reject(response);
        //    } else {
        //        dfd.resolve();
        //    }
        //});
        //return dfd.promise();
    };

    return EmailSettingsService;
});