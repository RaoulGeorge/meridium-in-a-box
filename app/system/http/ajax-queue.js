define(function (require) {
    'use strict';

    var $ = require('jquery');


    var AjaxClient = require('./ajax-client');

    function AjaxQueue() {
        this.items = [];
        this.client = Object.resolve(AjaxClient);
        this.running = false;
    }

    AjaxQueue.prototype.get = function (url, options) {
        return enqueue(this, 'get', url, options);
    };

    AjaxQueue.prototype.post = function (url, data, options) {
        return enqueue(this, 'post', url, options, data);
    };

    AjaxQueue.prototype.put = function (url, data, options) {
        return enqueue(this, 'put', url, options, data);
    };

    AjaxQueue.prototype.delete = function (url, options) {
        return enqueue(this, 'delete', url, options);
    };

    function enqueue(self, method, url, options, data) {
        var dfd = $.Deferred();
        self.items.push(newEntry(dfd, method, url, options, data));
        if (!self.running) {
            dequeue(self);
        }
        return dfd.promise();
    }

    function dequeue(self) {
        var entry = self.items.shift();
        if (entry) {
            self.running = true;
            request(self, entry);
        } else {
            self.running = false;
        }
    }

    function request(self, entry) {
        var dfd;
        if (entry.method === 'get') {
            dfd = self.client.get(entry.url, entry.options);
        } else if (entry.method === 'post') {
            dfd = self.client.post(entry.url, entry.data, entry.options);
        } else if (entry.method === 'put') {
            dfd = self.client.put(entry.url, entry.data, entry.options);
        } else if (entry.method === 'delete') {
            dfd = self.client.delete(entry.url, entry.options);
        } else {
            dfd = $.Deferred();
            dfd.resolve();
        }

        dfd
            .done(function () {
                entry.dfd.resolve.apply(entry.dfd, arguments);
            })
            .fail(function (data) {
                entry.dfd.reject(data);
            })
            .always(function () {
                dequeue(self);
            });
    }

    function newEntry(dfd, method, url, options, data) {
        return { dfd: dfd, method: method, url: url, options: options, data: data };
    }

    return AjaxQueue;
});
