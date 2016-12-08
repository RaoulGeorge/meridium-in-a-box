define(function(require, exports, module) {
    'use strict';

    var mx = require('system/mithril/mithril-extensions');

    function CollapsibleViewModel(attrs, children) {
        this.isExpanded = true;
        this.title = '';
        this.expandedWidth = 0;
        this.collapsedWidth = 0;
        this.onchange = null;
        this.children = null;
        this.isTitleActive = false;
        this.ontitleclick = null;

        this.setState(attrs, children);
    }

    CollapsibleViewModel.prototype.setState = function (attrs, children) {
        this.isExpanded = attrs.isExpanded;
        this.title = attrs.title;
        this.expandedWidth = attrs.expandedWidth;
        this.collapsedWidth = attrs.collapsedWidth;
        this.onchange = attrs.onchange;
        this.children = children;
        this.isTitleActive = attrs.isTitleActive;
        this.ontitleclick = attrs.ontitleclick;
    };

    CollapsibleViewModel.prototype.collapse = function () {
        this.isExpanded = false;
        onChange(this);
    };

    function onChange(self) {
        if (self.onchange) {
            self.onchange(mx.event(self));
        }
    }

    CollapsibleViewModel.prototype.expand = function () {
        this.isExpanded = true;
        onChange(this);
    };

    CollapsibleViewModel.prototype.getWidth = function () {
        return this.isExpanded ? this.expandedWidth : this.collapsedWidth;
    };

    CollapsibleViewModel.prototype.titleClicked = function () {
        onTitleClicked(this);
    };

    function onTitleClicked (self) {
        if(self.ontitleclick) {
            self.ontitleclick(mx.event(self));
        }
    }

    return CollapsibleViewModel;
});