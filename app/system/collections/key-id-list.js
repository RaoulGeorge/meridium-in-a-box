define(function (require) {
    'use strict';

    var _ = require('lodash');

    function KeyIdList(items) {
        this.items = items;
    }

    KeyIdList.prototype.findByKey = function (key) {
        return _.find(this.items, { key: key }) || null;
    };

    KeyIdList.prototype.findById = function (id) {
        return _.find(this.items, { id: id }) || null;
    };

    return KeyIdList;
});