define(function(require) {
    'use strict';

    var $ = require('jquery');

    var HTTP = 'http://',
        HTTPS = 'https://',
        FILE_NAME = '/meridium/index.html';

    function ConnectionChecker() {
        //do nothing
    }

    ConnectionChecker.prototype.checkConnection = function(apiServer) {
        var prefix = HTTP,
            url,
            options;

        if (apiServer && hasHttps(apiServer)) {
            prefix = HTTPS;
            apiServer = stripProtocol(apiServer);
        }

        url = prefix + apiServer + FILE_NAME;

        options = {
            url: url
        };

        return $.ajax(options);
    };

    function hasHttps(value) {
        return value.toLowerCase().indexOf(HTTPS) > -1;
    }

    function stripProtocol(value) {
        if (!value) {
            return value;
        }

        return value.toLowerCase().replace(HTTPS, '').replace(HTTP, '');
    }

    return ConnectionChecker;
});