define(function (require) {
    'use strict';

    var TreeViewModel = require('./tree/tree-view-model'),
        TreeView = require('./tree/tree-view');

    return {
        controller: TreeViewModel,
        view: TreeView
    };
});
