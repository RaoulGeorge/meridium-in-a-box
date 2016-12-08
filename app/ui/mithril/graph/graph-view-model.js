define(function(require) {
    'use strict';

    function GraphViewModel(attrs) {
        this.path = '';
        this.hideToolbar = false;
        this.setState(attrs);
    }

    GraphViewModel.prototype.setState = function (attrs) {
        this.path = attrs.path;
        this.hideToolbar = attrs.hideToolbar;
        this.hideTitle = attrs.hideTitle;
    };

    return GraphViewModel;
});