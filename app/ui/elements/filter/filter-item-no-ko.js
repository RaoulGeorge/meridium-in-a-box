define(function (require) {
    'use strict';

    function FilterItem(options, caption) {
        options = options || null;
        this.caption = caption;
        this.value = options.value;
        this.text = options.text;
        this.isSelected = options.isSelected;
    }

    return FilterItem;
});