define(function(require) {
    'use strict';

    var m = require('mithril'),
        R = require('ramda');

    function CollapsibleView(vm, attrs, children) {
        vm.setState(attrs, children);
        return render(vm);
    }

    function render(vm) {
        return m('div.mi-collapsible', style(vm), content(vm));
    }

    function style(vm) {
        return { style: 'width: ' + vm.getWidth().toString() };
    }

    function expanded(vm) {
        return m('section.expanded.active.border-right', [
            collapseButton(vm),
            expandedTitle(vm),
            expandedContent(vm)
        ]);
    }

    function collapseButton(vm) {
        return m('i.icon-collapse', {
            onclick: vm.collapse.bind(vm)
        });
    }

    function expandedTitle(vm) {
        if (vm.title) {
            return m('div.list-group-item.title', {
                className: vm.isTitleActive ? 'active' : null,
                onclick: vm.titleClicked.bind(vm)
            }, [
                m('span', vm.title)
            ]);
        }
        return '';
    }

    function expandedContent(vm) {
        return m('div.content', vm.children);
    }

    function collapsed(vm) {
        return m('section.collapsed.active', [
            expandButton(vm),
            collapsedTitle(vm)
        ]);
    }

    function expandButton(vm) {
        return m('i.icon-expand', {
            onclick: vm.expand.bind(vm)
        });
    }

    function collapsedTitle(vm) {
        return m('.block-group',
            m('.verticle-block-group',
                m('span.title.collapsed-title', vm.title)));
    }

    var content = R.ifElse(R.prop('isExpanded'), expanded, collapsed);

    return CollapsibleView;
});