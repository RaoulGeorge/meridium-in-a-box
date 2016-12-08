define(function (require) {
    'use strict';

    var AjaxClient = require('system/http/ajax-client');

    var BASE_URL = 'meridium/api/core/utility/';

    function ApplicationService () {
        this.ajaxClient = Object.resolve(AjaxClient);
    }

    ApplicationService.prototype.ping = function () {
        return this.ajaxClient.get(BASE_URL + 'ping');
    };

    ApplicationService.prototype.unauthorizedping = function () {
        return this.ajaxClient.get(BASE_URL + 'unauthorizedping', { headers: {} });
    };

    ApplicationService.prototype.checksession = function (sessionid) {
        return this.ajaxClient.get(BASE_URL + 'checksession/' + sessionid);
    };

    return ApplicationService;
});
