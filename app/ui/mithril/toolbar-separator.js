define(function(require) {
    'use strict';

    var m = require('mithril');

    var SEPARATOR_WIDTH = 11,
        SEPARATOR_MARGIN = 5;

    function ToolbarSeparatorViewModel() {
        // do nothing
    }

    ToolbarSeparatorViewModel.WIDTH = SEPARATOR_WIDTH + SEPARATOR_MARGIN;

    function ToolbarSeparatorView() {
        return m('button.btn.separator', {
            disabled: true
        });
    }

    return { controller: ToolbarSeparatorViewModel,  view: ToolbarSeparatorView };
});