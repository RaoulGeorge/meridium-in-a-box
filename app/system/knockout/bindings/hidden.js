define(function (require) {
    'use strict';

    var ko = require('knockout');

    ko.bindingHandlers.hidden = {
        update: function (element, valueAccessor) {
            var hide = ko.unwrap(valueAccessor());
            var isCurrentlyHidden = element.style.display === 'none';
            if (hide) {
                if (!isCurrentlyHidden) { element.style.display = 'none'; }
            } else {
                if (isCurrentlyHidden) { element.style.display = ''; }
            }
        }
    };
});