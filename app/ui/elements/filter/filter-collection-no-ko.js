define(function (require) {
    'use strict';

    var filterGroup = require('./filter-group-no-ko');

    function FilterCollection() {
        this.filterGroups = [];
    }

    FilterCollection.prototype.populateGroups = function (filterOptions) {
        var i,
            group;
        for (i = 0; i < filterOptions.filteroptions.length; i++) {
            group = new filterGroup(filterOptions.filteroptions[i]);
            this.filterGroups.push(group);
        }
    };

    FilterCollection.prototype.clear = function () {
        this.filterGroups = [];
    };

    return FilterCollection;
});