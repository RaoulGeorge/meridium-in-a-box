define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var ApplicationEvents = require('application/application-events'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ajaxOptions = {
            contentType: 'application/json',
            dataType: 'json',
            cache: true,
            timeout: 0
        },
        connectionOptions = {
            useSecureConnection: location.protocol === 'https:',
            server: null
        };

    require('./binary-transport');

    function AjaxClient(appEvents) {
        this.appEvents = appEvents;
    }
    AjaxClient.dependsOn = [ApplicationEvents];

    AjaxClient.useSecureConnection = function (value) {
        connectionOptions.useSecureConnection = value;
        logger.info('connectionOptions.useSecureConnection', value);
    };

    AjaxClient.setServer = function (value) {
        AjaxClient.useSecureConnection(isSecureConnection(value));
        value = stripProtocol(value);
        value = stripSlashes(value);
        connectionOptions.server = value;
        logger.info('connectionOptions.server', value);
    };

    function isSecureConnection(value) {
        if (hasProtocol(value)) {
            return hasHttps(value);
        } else {
            return isHttpUrl();
        }
    }

    function hasProtocol(value) {
        if (!value) { return false; }
        return hasHttp(value) || hasHttps(value);
    }

    function hasHttp(value) {
        return value.toLowerCase().indexOf('http://') > -1;
    }

    function hasHttps(value) {
        return value.toLowerCase().indexOf('https://') > -1;
    }

    function stripProtocol(value) {
        if (!value) { return value; }
        return value.toLowerCase().replace('https://', '').replace('http://', '');
    }

    function stripSlashes(value) {
        if (!value) { return value; }
        return value.toString().replace(/\//g, '');
    }

    function isHttpUrl() {
        return location.protocol === 'https:';
    }

    AjaxClient.server = function () {
        return connectionOptions.server;
    };

    AjaxClient.secureConnection = function () {
        return connectionOptions.useSecureConnection;
    };

    AjaxClient.addHeader = function (name, value) {
        var header = {};
        header[name] = value;
        ajaxOptions.headers = ajaxOptions.headers || {};
        $.extend(ajaxOptions.headers, header);
        logger.info('adding to ajaxOptions.headers', name, value);
    };

    AjaxClient.clearHeaders = function () {
        ajaxOptions.headers = undefined;
        logger.info('ajaxOptions.headers cleared');
    };

    AjaxClient.headers = function () {
        return $.extend({}, ajaxOptions.headers);
    };

    AjaxClient.prototype.url = function (url) {
        return baseUrl(this) + format(url);
    };

    AjaxClient.prototype.get = function (url, options) {
        var getOptions = $.extend({}, ajaxOptions, {
            url: baseUrl(this) + format(url),
            type: 'GET'
        });
        logger.info('ajax GET', getOptions.url);
        return ajax(getOptions, options);
    };

    AjaxClient.prototype.getBinary = function (url, options) {
        var getOptions = $.extend({}, ajaxOptions, {
            url: baseUrl(this) + format(url),
            type: 'GET',
            dataType: 'binary',
            processData: false
        });
        delete getOptions.contentType;
        logger.info('ajax binary GET', getOptions.url);
        return ajax(getOptions, options);
    };

    AjaxClient.prototype.post = function (url, data, options) {
        logger.info('ajax POST', data, options);
        var postOptions = $.extend({}, ajaxOptions, {
            url: baseUrl(this) + format(url),
            type: 'POST',
            data: _.isObject(data) ? JSON.stringify(data) : data
        });
        return ajax(postOptions, options);
    };

    AjaxClient.prototype.put = function (url, data, options) {
        logger.info('ajax PUT', data, options);
        var postOptions = $.extend({}, ajaxOptions, {
            url: baseUrl(this) + format(url),
            type: 'PUT',
            data: _.isObject(data) ? JSON.stringify(data) : data
        });

        return ajax(postOptions, options);
    };

    AjaxClient.prototype.delete = function (url, options) {
        var deleteOptions = $.extend({}, ajaxOptions, {
            url: baseUrl(this) + format(url),
            type: 'DELETE'
        });
        logger.info('ajax DELETE', deleteOptions.url);
        return ajax(deleteOptions, options);
    };

    AjaxClient.prototype.protocol = function () {
        return connectionOptions.useSecureConnection ? 'https' : 'http';
    };

    AjaxClient.promise = function AjaxClient_promise(deferred, jqXHR) {
        /// <summary>
        /// Use this method to create a promise from a deferred that can still be used to access limitted
        /// funcitonality on the ajax request's jqXHR object such as abort.
        /// </summary>
        var promise = deferred.promise();
        promise.request = { abort: jqXHR.abort };
        return promise;
    };

    AjaxClient.prototype.baseUrl = function () {
        return baseUrl(this);
    };

    function ajax(verbOptions, callOptions) {
        return $.ajax($.extend({}, verbOptions, callOptions));
    }

    function baseUrl(self) {
        return connectionOptions.server ? self.protocol() + '://' + connectionOptions.server + '/' : '';
    }

    function format(url) {
        if (url && url.toString().charAt(0) === '/') { url = url.toString().substring().slice(1); }
        return url;
    }

    return AjaxClient;
});
