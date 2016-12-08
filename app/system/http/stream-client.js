define(function (require) {
    'use strict';

    var oboe = require('oboe'),
        AjaxClient = require('system/http/ajax-client');

    function StreamClient() {
        this.ajaxclient = Object.resolve(AjaxClient);
    }

    StreamClient.prototype.get = function (url) {
        var formattedUrl = this.ajaxclient.baseUrl() + format(url);
        var oboePromise = oboe({
            method:'GET',
            url:formattedUrl,
            body:null,
            headers:AjaxClient.headers()
        });
        return oboePromise;
    };

    StreamClient.prototype.post = function (url, body) {
        var formattedUrl = this.ajaxclient.baseUrl() + format(url);
        var oboePromise = oboe({
            method:'POST',
            url:formattedUrl,
            body:body,
            headers:AjaxClient.headers()
        });
        return oboePromise;
    };

    function format(url) {
        if (url && url.toString().charAt(0) === '/') { url = url.toString().substring().slice(1); }
        return url;
    }

    return StreamClient;
});
