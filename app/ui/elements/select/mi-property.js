define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        DOM_DATA_KEY = 'property-changed-event-handlers';

    var optionsCount = 1;
    if (!ko.bindingHandlers.miproperty) {
        ko.bindingHandlers.miproperty = {
            init: function (element, valueAccessor) {
                var eventHandler,
                    $element = $(element),
                    eventHandlersToSave = {}, valueAccrList = getFormattedProperties(valueAccessor());
                _.each(valueAccrList, function (binding, propertyName) {
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
                var propertyValue, valueAccrList = getFormattedProperties(valueAccessor());

                switchUpdatingProperties(element, false);

                _.each(valueAccrList, function (binding, propertyName) {
                    propertyValue = ko.unwrap(binding);
                    //element[propertyName] = propertyValue;
                    //console.log('prop', propertyName, propertyValue);
                   
                    //$(element).attr('data-'+ (propertyName.toLowerCase()), propertyValue);
                    if ((typeof propertyValue === 'object' && !_.isEqual($(element).data(propertyName.toLowerCase()), propertyValue)) || propertyValue === '') {                    
                        $(element).data(propertyName.toLowerCase(), propertyValue);
                        //console.log($(element).data(propertyName.toLowerCase()))
                        $(element).attr('data-' + (propertyName.toLowerCase()), optionsCount);
                        optionsCount++;

                    } else {
                        $(element).data(propertyName.toLowerCase(), propertyValue);
                        //console.log($(element).data(propertyName.toLowerCase()))
                        $(element).attr('data-' + (propertyName.toLowerCase()), propertyValue);
                    }
                });

                switchUpdatingProperties(element, true);
               
            }
        };

        var switchUpdatingProperties = function (element, state) {
            if ($(element).find('.mi-select-container')[0]) {
                var data = ko.contextFor($(element).find('.mi-select-container')[0]).$data;
                data.propertiesUpdateDone ? data.propertiesUpdateDone(state) : '';
            }
        };


        var getFormattedProperties = function (properties) {
            var updatedProps = {}, order = ['addCaption', 'multiple', 'editable','value', 'selectedOptions', 'optionsCaption', 'optionsText', 'optionsValue', 'optionsGroup', 'disabled', 'required', 'options'];

            for (var i = 0; i < order.length; i++) {
                if (properties[order[i]] !== undefined) {
                    updatedProps[order[i]] = properties[order[i]];
                }
            }
            return updatedProps;
        };
    }
});