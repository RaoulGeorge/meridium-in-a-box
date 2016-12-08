define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ko = require('knockout'),
        interact = require('interact');

    ko.bindingHandlers['mi-range-slider-point-drag'] = {
        'init': function(element, valueAccessor) {
            var options = valueAccessor();

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (interact.isSet(element)) {
                    interact(element)
                        .off('dragstart', options.ondragstart || $.noop)
                        .off('dragmove', options.onmove || $.noop)
                        .off('dragend', options.ondragend || $.noop)
                        .draggable(false)
                        .unset();
                }
            });
        },
        'update': function (element, valueAccessor) {
            var options = valueAccessor();
            
            interact(element)
                .draggable(true)
                .on('dragstart', options.ondragstart || $.noop)
                .on('dragmove', options.onmove || $.noop)
                .on('dragend', options.ondragend || $.noop);    
        }
    };
});