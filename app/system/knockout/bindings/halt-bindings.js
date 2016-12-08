define(function (require) {
    'use strict';
    var ko = require('knockout');

    if (!ko.bindingHandlers['halt-bindings']) {
        ko.bindingHandlers['halt-bindings'] = {
            init: function () {
                return { controlsDescendantBindings: true };
            }
        };
    }

    function createElement(parent) {
        return Element.build('div', parent, null, {
            'data-bind': 'halt-bindings: true'
        });
    }

    return {
        createElement: createElement
    };
});