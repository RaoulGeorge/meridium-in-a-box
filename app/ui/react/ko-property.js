define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout');

    if (!ko.bindingHandlers.koproperty) {
        ko.bindingHandlers.koproperty = {
            init: function (element, valueAccessor) {
                var propertyValue;
                _.each(valueAccessor(), function (binding, propertyName) {
                    propertyValue = ko.unwrap(binding);
                    element[propertyName] = propertyValue;
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