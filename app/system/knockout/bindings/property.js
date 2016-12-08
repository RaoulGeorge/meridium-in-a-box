define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        DOM_DATA_KEY = 'property-changed-event-handlers';

    if (!ko.bindingHandlers.property) {
        ko.bindingHandlers.property = {
            init: function (element, valueAccessor) {
                var eventHandler,
                    $element = $(element),
                    eventHandlersToSave = {};
                _.each(valueAccessor(), function (binding, propertyName) {
                    eventHandler = function (e, value) {
                        var binding = valueAccessor()[propertyName];
                        if (_.isFunction(binding)) {
                            binding(value);
                        }
                    };
                    eventHandlersToSave[propertyName] = eventHandler;
                    $element.on('attributes.' + propertyName + ':changed', eventHandler);
                    $element.on('properties.' + propertyName + ':changed', eventHandler);
                });
                ko.utils.domData.set(element, DOM_DATA_KEY, eventHandlersToSave);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    var eventHandlersToDispose = ko.utils.domData.get(element, DOM_DATA_KEY);
                    _.each(valueAccessor(), function (binding, propertyName) {
                        $element.off('attributes.' + propertyName + ':changed', eventHandlersToDispose[propertyName]);
                        $element.off('properties.' + propertyName + ':changed', eventHandlersToDispose[propertyName]);
                    });
                });
                
            },
            update: function (element, valueAccessor) {
                var propertyValue;
                _.each(valueAccessor(), function (binding, propertyName) {
                    propertyValue = ko.unwrap(binding);
                    element[propertyName] = propertyValue;
                });
            }
        };
    }
});