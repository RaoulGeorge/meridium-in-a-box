define(function (require) {
    'use strict';

    var $ = require('jquery'),
        m = require('mithril'),
        h = require('system/mithril/html-tags');

    require('ui/elements/list-group/view-model');

    // View Model ------------------------------------------------------------------------------------------------------
    function List2ViewModel(attrs, children) {
        this.selector = 'toggle',
        this.multiselect = true;
        this.key = 'key';
        this.description = 'PopulateHTML';
        this.useHTML = 'use-html';
        this.page = 1;
        this.pageSize = 25;
        this.scrollPercent = 0.75;
        this.customSearch = true;
        this.allowAdd = false;
        this.onchange = null;
        this.loader = null;
        this.searchCallback = null;
        this.setState(attrs, children);
    }

    List2ViewModel.prototype.setState = function (attrs, children) {
        this.selector = attrs.selector || 'toggle';
        this.multiselect = attrs.multiselect || true;
        this.key = attrs.key || this.key;
        this.description = attrs.description || this.description;
        this.useHTML = attrs.useHTML || this.useHTML;
        this.page = attrs.page || this.page;
        this.pageSize = attrs.pageSize || this.pageSize;
        this.scrollPercent = attrs.scrollPercent || this.scrollPercent;
        this.customSearch = attrs.customSearch || true;
        this.allowAdd = attrs.allowAdd || false;
        this.onchange = attrs.onchange;
        this.loader = attrs.loader;
        this.searchCallback = attrs.searchCallback;
        this.children = children;
    };

    // View ------------------------------------------------------------------------------------------------------------
    function view(vm, attrs, children) {
        vm.setState(attrs, children);
        return list(vm, [
            children
        ]);
    }

    function list(vm, children) {
        return m('mi-list-group[idx="2"]', {
            description: vm.description,
            'use-html': vm.useHTML,
            key: vm.key,
            selector: 'toggle',
            multiselect: vm.multiselect,
            page: vm.page,
            'page-size': vm.pageSize,
            'scroll-percent': vm.scrollPercent,
            'allow-add': vm.allowAdd,
            'custom-search': vm.customSearch,
            config: configureList2.bind(null, vm)
        }, children);
    }

    function configureList2(vm, element, isInitialized, context) {
        if (!isInitialized) {
            initializeList(element, context, vm);
        }
    }

    function initializeList(element, context, vm) {
        context.onunload = dispose.bind(null, element);
        initElement(element, vm);       
    }

    function initElement(element, vm) {
        Element.upgrade(element);
        element.loader = vm.loader;
        element.onchange = vm.onchange;
        //element.searchCallback = vm.searchCallback;
        element.searchCallback = searchCallback.bind(null, { vm: vm, element: element });
    }

    function searchCallback(list, searchterm, page, pageSize) {
        return list.vm.searchCallback({
            element: list,
            term: searchterm,
            page: page,
            pageSize: pageSize
        });
    }

    function dispose(element) {
        element.loader = function () {
            var dfd = $.Deferred();
            dfd.resolve();
            return dfd.promise();
        };
    }

    return { controller: List2ViewModel, view: view };
});