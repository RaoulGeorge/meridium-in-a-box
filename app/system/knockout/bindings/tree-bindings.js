define(function(require) {
    'use strict';
    var ko = require('knockout');

    function attachHandler(ele, ev, handler, viewModel) {
        if (ele.addEventListener) {
            ele.addEventListener(ev, handler.bind(viewModel));
        }
    }

    function koAttachHandler(ev, element, valueAccessor, allBindings, viewModel, bindingContext) {
        var ele = element,
            handler = ko.unwrap(valueAccessor());
        attachHandler(ele, ev, handler, bindingContext.$data);
    }

    if (!ko.bindingHandlers['searchCallback']) {
        ko.bindingHandlers['searchCallback'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                element.searchCallback = ko.unwrap(valueAccessor()).bind(bindingContext.$data);
            }
        };
    }
    if (!ko.bindingHandlers['search-selected']) {
        ko.bindingHandlers['search-selected'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                koAttachHandler('search-selected', element, valueAccessor, allBindings, viewModel, bindingContext);
            }
        };
    }

    if (!ko.bindingHandlers['filter-closed']) {
        ko.bindingHandlers['filter-closed'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                koAttachHandler('filter-closed', element, valueAccessor, allBindings, viewModel, bindingContext);
            }
        };
    }
    if (!ko.bindingHandlers['selected']) {
        ko.bindingHandlers['selected'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                koAttachHandler('selected', element, valueAccessor, allBindings, viewModel, bindingContext);
            }
        };
    }
    if (!ko.bindingHandlers['navigating']) {
        ko.bindingHandlers['navigating'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                koAttachHandler('navigating', element, valueAccessor, allBindings, viewModel, bindingContext);
            }
        };
    }

    if (!ko.bindingHandlers['navigated']) {
        ko.bindingHandlers['navigated'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                koAttachHandler('navigated', element, valueAccessor, allBindings, viewModel, bindingContext);
            }
        };
    }

    if (!ko.bindingHandlers['loader']) {
        ko.bindingHandlers['loader'] = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                element.loader = ko.unwrap(valueAccessor()).bind(bindingContext.$data);
            }
        };
    }
});