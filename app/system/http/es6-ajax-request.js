define(function (require) {
    'use strict';
    
    var AjaxRequest = require('./ajax-request'),
        Promise = require('bluebird');

    function Es6AjaxRequest(method, url, data, options) {
        base.call(this, method, url, data, options);
        this.xhr = null;
    }
    var base = Object.inherit(AjaxRequest, Es6AjaxRequest);

    Es6AjaxRequest.get = function (url, options) {
        return new Es6AjaxRequest('get', url, null, options);
    };

    Es6AjaxRequest.post = function (url, data, options) {
        return new Es6AjaxRequest('post', url, data, options);
    };

    Es6AjaxRequest.put = function (url, data, options) {
        return new Es6AjaxRequest('put', url, data, options);
    };

    Es6AjaxRequest.delete = function (url, options) {
        return new Es6AjaxRequest('delete', url, null, options);
    };

    Es6AjaxRequest.prototype.send = function () {
        this.xhr = base.prototype.send.call(this);
        return Promise.resolve(this.xhr)
            .catch(onError.bind(null, this));
    };

    function onError(self, response) {
        return {
            request: self,
            response: response
        };
    }
    
    return Es6AjaxRequest;
});