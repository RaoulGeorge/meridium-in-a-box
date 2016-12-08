define(function(require) {
    'use strict';

    var $ = require('jquery'),
        m = require('mithril');

    require('ui/elements/tree/view-model');

    function TreeView(vm, attrs, children) {
        vm.setState(attrs, children);
        return m('mi-tree[key="id"]', {
            selector: vm.selector,
            multiselect: vm.multiselect,
            description: vm.description,
            'has-children': vm.hasChildren,
            page: vm.page,
            'page-size': vm.pageSize,
            'scroll-percent': vm.scrollPercent,
            'root-name': vm.rootName,
            'custom-filter': vm.customFilter,
            'custom-search': vm.customSearch,
            'allow-add': vm.allowAdd,
            config: configureTree.bind(null, vm)
        });
    }

    function configureTree(vm, element, isInitialized, context) {
        context.retain = true;
        if (isInitialized) {
            updateTree(element, context, vm);
        } else {
            initializeTree(element, context, vm);
        }
    }

    function updateTree(element, context, vm) {
        setDomEvents(element, context, vm);
    }

    function setDomEvents(element, context, vm) {
        addDomEvent(element, context, 'add-item', vm.onadd);
    }

    function addDomEvent(element, context, event, callback) {
        if (context[event]) {
            element.removeEventListener(event, context[event]);
        }
        context[event] = callback;
        element.addEventListener(event, context[event]);
    }

    function initializeTree(element, context, vm) {
        element.setAttribute('key', vm.key);
        context.onunload = dispose.bind(null, element, context);
        initElement(element, vm);
        initElementState(element, vm);
        updateTree(element, context, vm);
        vm.onLoad(element);
    }

    function initElement(element, vm) {
        Element.upgrade(element);
        element.loader = loader.bind(null, { vm: vm, element: element });
    }

    function initElementState(element, vm) {
        var state = { value: {} };
        if (vm.root) {
            state.value = vm.root;
        } else {
            state.value[vm.description] = vm.rootName;
        }
        element.loadState(state);
    }

    function dispose(element, context) {
        removeDomEvent(element, context, 'add-item');
        element.loader = function () {
            var dfd = $.Deferred();
            dfd.resolve();
            return dfd.promise();
        };
    }

    function removeDomEvent(element, context, event) {
        element.removeEventListener(event, context[event]);
        context[event] = null;
    }

    function loader(tree, index, page, pageSize) {
        return tree.vm.onchange(createLoaderEventArgs(tree.element, index, page, pageSize));
    }

    function createLoaderEventArgs(element, index, page, pageSize) {
        return {
            index: index,
            page: page,
            pageSize: pageSize,
            value: element.value
        };
    }

    return TreeView;
});