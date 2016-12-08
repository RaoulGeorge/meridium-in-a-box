define(function (require) {
    'use strict';

    var $ = require('jquery');


    function PageFilterRemote() {
        this.pageFilter = null;
    }

    PageFilterRemote.prototype.connect = function connect(element) {
        this.pageFilter = findPageFilter(element);
    };

    function findPageFilter(element) {
        var results;
        results = $(element).closest('mi-page-filter').get(0) || null;
        if (results === null) {
            return $(element).closest('mi-et-page-filter').get(0) || null;
        }
        return results;
    }

    PageFilterRemote.prototype.isConnected = function isConnected() {
        return this.pageFilter !== null;
    };

    return PageFilterRemote;
});