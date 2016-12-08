define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ko = require('knockout');

    function setVisibility(element, valueAccessor) {
        var hidden = ko.unwrap(valueAccessor());
        $(element).css('visibility', hidden ? 'hidden' : 'visible');
    }

    ko.bindingHandlers.visibilityHidden = { init: setVisibility, update: setVisibility };
});