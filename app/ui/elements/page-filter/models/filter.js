define(function (require) {
    'use strict';

    var _ = require('lodash');

    var m = require('mithril');

    function Filter(id, dataType, caption, value, valueCaption) {
        this.id = m.prop(id);
        this.dataType = m.prop(dataType);
        this.caption = m.prop(caption);
        this.value = m.prop(value);
        this.valueCaption = m.prop(valueCaption || value);
    }

    Filter.remove = function remove(filters, filterToRemove) {
        _.remove(filters, function (filter) {
            return filter === filterToRemove;
        });
    };

    Filter.prototype.fullCaption = function fullCaption() {
        return this.caption() + ' = ' + this.valueCaption();
    };

    Filter.prototype.icon = function icon() {
        switch (this.dataType()) {
            case 'A':
                return '.icon-asset-hierarchy';
            default:
                return '.icon-filter';
        }
    };

    return Filter;
});
