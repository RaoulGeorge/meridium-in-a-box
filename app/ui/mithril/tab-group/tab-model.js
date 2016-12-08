define(function (require) {
    'use strict';

    var m = require('mithril'),
        R = require('ramda');

    function TabModel(data) {
        data = data || {};
        this.selected = data.selected || false;
        this.title = data.title || '';
        this.number = data.number || '';
        this.value = data.value || '';
        this.onclick = data.onclick || null;
        this.tabClass = data.tabClass || '';
        this.visible = data.visible !== undefined ? data.visible : true;
    }

    return TabModel;
});