define(function(require) {
    'use strict';

    var CollapsibleViewModel = require('./collapsible/collapsible-view-model'),
        CollapsibleView = require('./collapsible/collapsible-view');

    return { controller: CollapsibleViewModel, view: CollapsibleView };
});