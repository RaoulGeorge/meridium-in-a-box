define(function (require) {
    'use strict';
    var ko = require('knockout'),
        FilterItem = require('./filter-item'),
        Event = require('system/lang/event');


    function FilterGroup(options) {
        options = options || null;

        this.caption = options.caption;
        this.type = ko.observable(options.type);
        this.options = ko.observableArray();

        this.valueChanged = new Event();
        
        for (var i = 0; i < options.options.length; i++) {
            this.options.push(new FilterItem(options.options[i].option, this.caption));
            this.options()[i].valueChanged.add(_valueChanged.bind(null, this));
        }
    }

    function _valueChanged(self, newVal, text, value) {
        self.valueChanged.raise(self.caption, text, newVal, value);
    }

    return FilterGroup;
});