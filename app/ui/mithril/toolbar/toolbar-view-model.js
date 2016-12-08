define(function(require) {
    'use strict';

    var m = require('mithril'),
        R = require('ramda');

    function ToolbarViewModel(attrs, children) {
        this.width = window.innerWidth;
        this.children = null;
        this.setState(attrs, children);
    }

    ToolbarViewModel.prototype.setState = function (attrs, children) {
        this.children = children;
    };

    ToolbarViewModel.prototype.getVisibleChildren = function () {
        return R.zipWith(R.identity, this.children, visibleRightEdges(this));
    };

    function visibleRightEdges(self) {
        return R.filter(lessThan(self.width), rightEdges(self.children));
    }

    function lessThan(width) {
        return R.lt(R.__, width);
    }

    ToolbarViewModel.prototype.updateWidth = function (width) {
        if (this.width !== width) {
            setWidth(this, width);
        }
    };

    function setWidth(self, width) {
        self.width = width;
        redrawIfOverlap(self);
    }

    function redrawIfOverlap(self) {
        if (self.width <= requiredWidth(self)) {
            m.redraw();
        }
    }

    function requiredWidth(self) {
        return R.sum(toWidths(self.children));
    }

    var toWidth = R.compose(
        R.defaultTo(0),
        R.path(['controller', 'prototype', 'constructor', 'WIDTH'])
    );

    var toWidths = R.map(toWidth);

    var rightEdges = R.compose(R.tail, R.scan(R.add, 0), toWidths);

    return ToolbarViewModel;
});