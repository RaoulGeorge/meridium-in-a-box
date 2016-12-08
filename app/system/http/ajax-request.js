define(function (require) {
    'use strict';

    var _ = require('lodash');

    var AjaxClient = require('system/http/ajax-client'),
        Assert = require('mi-assert');

    function AjaxRequest(method, url, data, options) {
        this.ajaxClient = Object.resolve(AjaxClient);
        this.method = method;
        this.url = url;
        this.data = data || null;
        this.options = options || null;
    }

    AjaxRequest.get = function (url, options) {
        return new AjaxRequest('get', url, null, options);
    };

    AjaxRequest.post = function (url, data, options) {
        return new AjaxRequest('post', url, data, options);
    };

    AjaxRequest.put = function (url, data, options) {
        return new AjaxRequest('put', url, data, options);
    };

    AjaxRequest.delete = function (url, options) {
        return new AjaxRequest('delete', url, null, options);
    };

    AjaxRequest.prototype.send = function send(dfd) {
        var xhr;
        if (this.method === 'get') {
            xhr = this.ajaxClient.get(this.url, this.options);
        } else if (this.method === 'post') {
            xhr = this.ajaxClient.post(this.url, this.data, this.options);
        } else if (this.method === 'put') {
            xhr = this.ajaxClient.put(this.url, this.data, this.options);
        } else if (this.method === 'delete') {
            xhr = this.ajaxClient.delete(this.url, this.options);
        } else {
            throw 'Unknown request method: ' + this.method;
        }

        if (dfd) {
            xhr.fail(this.onFail(dfd));
        }

        return xhr;
    };

    AjaxRequest.prototype.onFail = function onFail(dfd) {
        Assert.isObject(dfd, 'dfd');
        return fail.bind(null, dfd, this);
    };

    function fail(dfd, request, response) {
        Assert.isObject(dfd, 'dfd');
        Assert.instanceOf(request, AjaxRequest, 'request');
        Assert.isObject(response, 'response');
        if (_.isFunction(dfd.promise)) {
            // jQuery Deferred
            dfd.reject(request, response);
        } else {
            // ES6 Promise
            dfd.reject({
                request: request,
                response: response
            });
        }
    }

    return AjaxRequest;
});
