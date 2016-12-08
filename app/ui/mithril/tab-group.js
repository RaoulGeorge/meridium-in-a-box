define(function (require) {
    'use strict';

    var TabGroupViewModel = require('./tab-group/tab-group-view-model'),
        TabGroupView = require('./tab-group/tab-group-view');

    return { controller: TabGroupViewModel, view: TabGroupView };
});