define(function(require) {
    'use strict';

    var GraphViewModel = require('./graph/graph-view-model'),
        GraphView = require('./graph/graph-view');

    return {
        controller: GraphViewModel,
        view: GraphView
    };
});