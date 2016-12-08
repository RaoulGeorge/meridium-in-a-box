define(function(require) {
    'use strict';

    var PageFilterViewModel = require('./page-filter/page-filter-view-model'),
        PageFilterView = require('./page-filter/page-filter-view');

    return { controller: PageFilterViewModel, view: PageFilterView };
});