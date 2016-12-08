define(function (require) {
    'use strict';
    var ko = require('knockout'),
        Event = require('system/lang/event');


    function FilterItem(options, caption) {
        options = options || null;
        this.caption = caption;
        this.value = ko.observable(options.value);
        this.text = ko.observable(options.text);
        this.isSelected = ko.observable(options.isSelected);

        this.isSelected.subscribe(isSelected_change.bind(null, this));

        this.valueChanged = new Event();

    }

    function isSelected_change(self, val) {
        self.valueChanged.raise(val, self.text(), self.value());
    }

    return FilterItem;
});