/**
 * Created by dpinkerton on 8/29/2016.
 */
define(function (require) {
    'use strict';

    var ko = require('knockout'),
        _ = require('lodash'),
        Hammer = require('hammer'),
        hammerManager = null;

    ko.bindingHandlers['mi-hammer-gesture'] = {
        'init': function(element, valueAccessor) {
            var options = valueAccessor();

            hammerManager = new Hammer(element);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (hammerManager) {
                    hammerManager.off(ko.unwrap(options.events));
                    hammerManager.destroy();
                    hammerManager = null;
                }
            });
        },
        'update': function (element, valueAccessor) {
            var options = valueAccessor(),
                handler = options.callback || _.noop;

            hammerManager = new Hammer(element);
            hammerManager.on(ko.unwrap(options.events), handler);
        }
    };
});