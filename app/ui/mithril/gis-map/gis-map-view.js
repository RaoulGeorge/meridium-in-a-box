define(function(require) {
    'use strict';

    var m = require('mithril');

    function GISMapView(vm, attrs, children) {
        vm.setState(attrs, children);
        return m('div.mi-map', {
            style: { height: '100%', display: 'block' },
            config: configureMap.bind(null, vm)
        });
    }

    function configureMap(vm, element, isInitialized, context) {
        if (isInitialized) {
            updateMap(vm);
        } else {
            initializeMap(element, context, vm);
        }
    }

    function updateMap(vm) {
        if (vm.isFirstDraw()) {
            requestAnimationFrame(vm.updateMap.bind(vm));
        } else {
            vm.updateMap();
        }
    }

    function initializeMap(element, context, vm) {
        context.onunload = vm.dispose.bind(vm);
        vm.attachMapToElement(element);
        updateMap(vm);
    }

    return GISMapView;
});
