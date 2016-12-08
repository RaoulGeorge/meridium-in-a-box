define(function (require) {
    'use strict';

    var R = require('ramda'),
        Formatter = require('system/text/formatter'),
        mx = require('system/mithril/mithril-extensions'),
        h = require('system/mithril/html-tags'),
        b = require('system/mithril/bootstrap-tags');

    function PageFilterView(vm, attrs, children) {
        vm.setState(attrs, children);
        var filter = vm.filter(),
            assetName = vm.assetName(),
            formatter = Object.resolve(Formatter);

        return h.div({ className: 'mi-page-filter' }, [
            h.div({ className: 'page-filter-root' }, [
                header(filter, assetName, [
                    h.div([
                        mx.iif(vm.filter, editButton.bind(null, vm)),
                        h.h1({title: vm.caption()}, formatter.abbreviate(vm.caption(), 70))
                    ]),
                    mx.exists(assetName, h.h2)
                ], vm),
                content(vm.getChildren())
            ])
        ]);
    }

    function header(filter, assetName, children, vm) {
        return h.header({ class: headerClass(filter, assetName)}, children);
    }

    function headerClass(filter, assetName) {
        if (!filter) {
            return 'no-filter';
        } else if (assetName) {
            return 'asset';
        } else {
            return 'no-asset';
        }
    }

    function editButton(vm) {
        return b.iconButton({
            title: vm.translate('EDIT_FILTERS'),
            onclick: vm.editFilters.bind(vm)
        }, [
            h.icon('.icon-collection-filter')
        ]);
    }

    function content(children) {
        return h.div({ style: 'height: calc(100% - 72px);' }, children);
    }

    return PageFilterView;
});