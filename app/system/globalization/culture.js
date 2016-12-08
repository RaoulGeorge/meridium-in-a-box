define(function (require) {
    'use strict';

    var _ = require('lodash');

    function Culture(id, name) {
        this.id = id;
        this.name = name;
    }

    Culture.fromJson = function fromJson(data) {
        return new Culture(data.id, data.name);
    };

    Culture.fromJsonArray = function fromJsonArray(items) {
        return _.map(items, Culture.fromJson);
    };

    Culture.prototype.toString = function toString() {
        return this.name + ' (' + this.id + ')';
    };

    return Culture;
});