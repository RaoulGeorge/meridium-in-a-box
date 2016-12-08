define(function (require) {
    'use strict';

    var m = require('mithril'),
        R = require('ramda');

    function TabGroupView(vm, attrs, tabs) {
        vm.setState(attrs, tabs);
        return render(vm);
    }

    function render(vm) {
        return m('div.tab-group.block-group.tab-group-default', content(vm));
    }

    function content(vm) {
        return vm.tabs.map(tab.bind(null, vm));
    }

    function tab(vm, tab) {
        return tab.visible ? m('div.tab-group-item.block' + vm.getTabWidth() + (tab.tabClass ? '.' + tab.tabClass : '') + (tab.selected ? '.active' : ''), { onclick: vm.select.bind(vm, vm, tab) }, [
            m('div.tblInnerDiv', [
                m('table.tbl', [
                    m('tbody', [
                        m('tr', [
                            m('td.tdtxtright', [
                                m('span.number', tab.number)]),
                            m('td.tdtxtleft', [
                                m('span.text', tab.title)
                            ])
                        ])
                    ])
                ])
            ])
        ]) : '';
    }

    return TabGroupView;
});