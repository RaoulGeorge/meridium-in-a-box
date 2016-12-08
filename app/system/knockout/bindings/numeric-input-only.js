define(function(require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout');

    // This binding, when applied to a text input control, will
    // evaluate each keystroke and prevent non-numeric input. Note
    // the use of textInput binding rather than value binding.
    // <input type="text"
    //            class="form-control"
    //            data-bind="textInput: newValue,
    //                       executeOnEnter: addValue,
    //                       numericInputOnly" />
    ko.bindingHandlers.numericInputOnly = {
        init: function (element, valueAccessor) {
            $(element).on("keydown", function (event) {
                // Allow: backspace, delete, tab, escape, and enter
                if (event.keyCode === 46 || event.keyCode === 8 || event.keyCode === 9 || event.keyCode === 27 || event.keyCode === 13 ||
                    // Allow: Ctrl+A
                    (event.keyCode === 65 && event.ctrlKey === true) ||
                    // Allow: . ,
                    (event.keyCode === 188 || event.keyCode === 190 || event.keyCode === 110) ||
                    // Allow: home, end, left, right
                    (event.keyCode >= 35 && event.keyCode <= 39)) {
                    // let it happen, don't do anything
                    return;
                }
                else {
                    // Ensure that it is a number and stop the keypress
                    if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
                        event.preventDefault();
                    }
                }
            });
        }
    };
});