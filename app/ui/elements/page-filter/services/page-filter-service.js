define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ApplicationContext = require('application/application-context'),
        AjaxClient = require('system/http/ajax-client'),
        Assert = require('mi-assert');

    var PAGE_FILTER_PREFERENCE = 3,
        USER_PREFERENCE_URL = 'meridium/api/core/userpref/';

    function PageFilterService() {
        this.ajaxClient = Object.resolve(AjaxClient);
    }

    PageFilterService.prototype.save = function save(id, value) {
        Assert.ok(id, 'id');
        Assert.ok(value, 'value');
        var dfd = $.Deferred();
        this.ajaxClient.post(url('set'), dto(id, value))
            .done(save_done.bind(null, this, dfd))
            .fail(save_fail.bind(null, this, dfd));
        return dfd.promise();
    };

    function url(service) {
        Assert.ok(service);
        return USER_PREFERENCE_URL + service;
    }

    function dto(id, value) {
        Assert.ok(id, 'id');
        Assert.ok(value, 'value');
        return {
            userKey: userKey(),
            prefType: PAGE_FILTER_PREFERENCE,
            name: prefName(id),
            value: JSON.stringify(value)
        };
    }

    function userKey() {
        Assert.ok(ApplicationContext.user);
        return ApplicationContext.user.key;
    }

    function prefName(id) {
        Assert.ok(id, 'id');
        return 'page-filter/' + id;
    }

    function save_done(self, dfd) {
        assertThis(self);
        dfd.resolve();
    }

    function save_fail(self, dfd, response) {
        assertThis(self);
        dfd.reject(response);
    }

    PageFilterService.prototype.get = function get(id) {
        Assert.ok(id, 'id');
        var dfd = $.Deferred();
        this.ajaxClient.get(url('get/' + userKey() + '/' + PAGE_FILTER_PREFERENCE + '?name=' + prefName(id)))
            .done(get_done.bind(null, this, dfd))
            .fail(get_fail.bind(null, this, dfd));
        return dfd.promise();
    };

    function get_done(self, dfd, data) {
        assertThis(self);
        if (data && data.value) {
            dfd.resolve(JSON.parse(data.value));
        } else {
            dfd.resolve(null);
        }
    }

    function get_fail(self, dfd, response) {
        assertThis(self);
        dfd.reject(response);
    }

    function assertThis(self) {
        Assert.instanceOf(self, PageFilterService);
    }

    return PageFilterService;
});