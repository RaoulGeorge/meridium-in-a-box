define(function(require) {
    'use strict';

    var mx = require('system/mithril/mithril-extensions'),
        R = require('ramda');

    // View Model ------------------------------------------------------------------------------------------------------
    function TreeViewModel(attrs, children) {
        this.selector = 'none';
        this.multiselect = false;
        this.key = 'enitityKey';
        this.description = 'description';
        this.hasChildren = 'hasChildren';
        this.page = 1;
        this.pageSize = 25;
        this.scrollPercent = 0.75;
        this.root = null;
        this.rootName = 'Home';
        this.customFilter = false;
        this.customSearch = false;
        this.allowAdd = false;

        this.tree = null;

        this.onadd = null;
        this.onchange = null;
        this.onload = null;
        this.children = [];
        this.setState(attrs, children);
    }

    TreeViewModel.prototype.setState = function (attrs, children) {
        this.selector = attrs.selector || this.selector;
        this.multiselect = attrs.multiselect || false;
        this.key = attrs.key || this.key;
        this.description = attrs.description || this.description;
        this.hasChildren = attrs.hasChildren || this.hasChildren;
        this.page = attrs.page || this.page;
        this.pageSize = attrs.pageSize || this.pageSize;
        this.scrollPercent = attrs.scrollPercent || this.scrollPercent;
        this.root = attrs.root || this.root;
        this.rootName = attrs.rootName || this.rootName;
        this.customFilter = attrs.customFilter || false;
        this.customSearch = attrs.customSearch || false;
        this.allowAdd = attrs.allowAdd || false;


        this.onadd = attrs.onadd || R.identity;
        this.onchange = attrs.onchange;
        this.onload = attrs.onload || null;
        this.children = children || this.children;
    };

    TreeViewModel.prototype.onLoad = function (tree) {
        this.tree = tree;
        if (this.onload) {
            this.onload(R.assoc('tree', tree, mx.event(this)));
        }
    };

    return TreeViewModel;
});