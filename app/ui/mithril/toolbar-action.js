define(function(require) {
    'use strict';

    var ToolbarActionViewModel = require('./toolbar/toolbar-action-view-model'),
        ToolbarActionView = require('./toolbar/toolbar-action-view');

    return { controller: ToolbarActionViewModel, view: ToolbarActionView };
});