define(function(require, exports, module) {
    'use strict';

    var m = require('mithril');

    require('ui/elements/chart/chart-view-model');

    function GraphView(vm, attrs) {
        vm.setState(attrs);
        return m('mi-chart', {
            'hide-toolbar': vm.hideToolbar,
            config: configure.bind(null, vm)
        });
    }

    function configure(vm, element, isInitialized, context) {
        if (isInitialized) {
            update(element, context, vm);
        } else {
            initialize(element, context, vm);
        }
    }

    function update(element, context, vm) {
        // nothing yet
    }

    function initialize(element, context, vm) {
        context.onunload = dispose.bind(null, element);
        initElement(element);
        element.load({
            catalogPath: vm.path,
            delegateLoadToFilter: false
        });
        update(element, context, vm);
    }

    function dispose(element) {

    }

    function initElement(element) {
        Element.upgrade(element);
    }

    return GraphView;
});