define(function (require) {
    'use strict';

    var FilterItem = require('./filter-item-no-ko');

    function FilterGroup(options) {
        var i;
        options = options || null;

        this.caption = options.caption;
        this.type = options.type;
        this.items = [];
        this.hideCaption = options.hideCaption;

        for (i = 0; i < options.options.length; i++) {
            this.items.push(new FilterItem(options.options[i].option, this.caption));
        }
    }

    return FilterGroup;
});