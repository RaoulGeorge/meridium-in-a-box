define(function(require, exports, module) {
    'use strict';

    var m = require('mithril');

    function ToolbarActionView(vm, attrs) {
        vm.setState(attrs);
        return m('button.btn', {
            disabled: vm.disabled,
            title: vm.caption,
            onclick: vm.onclick
        }, [
            m('i', { className: vm.icon}),
            m('label', vm.caption)
        ]);
    }

    return ToolbarActionView;
});