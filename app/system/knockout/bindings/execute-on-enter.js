define(function(require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout');

    // This binding, when applied to a text input control, will
    // evaluate each keystroke and execute a specified callback
    // when the enter button is pressed. Note that we use the
    // textInput binding rather than the value binding.
    //<input type="text"
    //       data-bind="textInput: newValue,
    //                  executeOnEnter: addValue" />
    ko.bindingHandlers.executeOnEnter = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();
            $(element).keypress(function (event) {
                var keyCode = (event.which ? event.which : event.keyCode);
                if (keyCode === 13) {
                    allBindings.executeOnEnter.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };
});