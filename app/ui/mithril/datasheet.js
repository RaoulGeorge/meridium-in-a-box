define(function(require) {
    'use strict';

    var DatasheetViewModel = require('./datasheet/datasheet-view-model'),
        DatasheetView = require('./datasheet/datasheet-view');

    return {
        controller: DatasheetViewModel,
        view: DatasheetView
    };
});