define(function(require) {
    'use strict';

    var ToolbarViewModel = require('./toolbar/toolbar-view-model'),
        ToolbarView = require('./toolbar/toolbar-view');

    return { controller: ToolbarViewModel, view: ToolbarView };
});