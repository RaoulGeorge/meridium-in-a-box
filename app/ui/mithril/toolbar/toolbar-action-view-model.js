define(function(require) {
    'use strict';

    var R = require('ramda');

    var BUTTON_WIDTH = 90,
        BUTTON_MARGIN = 3;

    function ToolbarActionViewModel(attrs) {
        this.onclick = null;
        this.caption = '';
        this.disabled = false;
        this.icon = '';
        this.setState(attrs);
    }

    ToolbarActionViewModel.WIDTH = BUTTON_WIDTH + BUTTON_MARGIN;

    ToolbarActionViewModel.prototype.setState = function (attrs) {
        this.onclick = attrs.onclick || R.identity;
        this.caption = attrs.caption || '';
        this.disabled = attrs.disabled || false;
        this.icon = attrs.icon || '';
    };

    return ToolbarActionViewModel;
});