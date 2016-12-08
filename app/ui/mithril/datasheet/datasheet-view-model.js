define(function(require, exports, module) {
    'use strict';

    var mx = require('system/mithril/mithril-extensions'),
        R = require('ramda');

    // View Model ------------------------------------------------------------------------------------------------------
    function DatasheetViewModel(attrs) {
        this.familyKey = '';
        this.onload = null;
        this.datasheet = null;
        this.setState(attrs);
    }

    DatasheetViewModel.prototype.setState = function (attrs) {
        this.familyKey = attrs.familyKey;
        this.entityObj = attrs.entityObj;
        this.onload = attrs.onload;
    };

    DatasheetViewModel.prototype.onLoad = function (datasheet) {
        this.datasheet = datasheet;
        if (this.onload) {
            this.onload(R.assoc('datasheet', datasheet, mx.event(this)));
        }
    };

    return DatasheetViewModel;
});