define(function(require, exports, module) {
    'use strict';

    var m = require('mithril'),
        R = require('ramda');

    function ToolbarView(vm, attrs, children) {
        vm.setState(attrs, children);

        //console.log(vm.getVisibleChildren());

        return m('div.toolbar-component', {
            config: configuration(vm)
        }, vm.getVisibleChildren());
    }

    var configuration = R.curry(function configuration(vm, element) {
        vm.updateWidth(element.clientWidth);
    });

    return ToolbarView;
});