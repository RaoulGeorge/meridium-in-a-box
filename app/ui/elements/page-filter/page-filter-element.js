define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        m = require('mithril'),
        PageFilterViewModel = require('./view-models/page-filter-view-model'),
        PageFilterView = require('./views/page-filter-view');
    var PageFilterElement = {};

    PageFilterElement.prototype = Object.create(HTMLElement.prototype);

    PageFilterElement.prototype.createdCallback = function createdCallback() {
        this.private = {
            vm: Object.resolve(PageFilterViewModel),
            view: PageFilterView,
            root: null
        };

        Object.defineProperty(this, 'filterId', { get: filterId_get.bind(null, this) });
        Object.defineProperty(this, 'caption', { get: caption_get.bind(null, this) });
        Object.defineProperty(this, 'filter', { get: filter_get.bind(null, this) });
    };

    function filterId_get(self) {
        assertThis(self);
        return vm(self).id();
    }

    function vm(self) {
        assertThis(self);
        return self.private.vm;
    }

    function caption_get(self) {
        assertThis(self);
        return vm(self).caption();
    }

    function filter_get(self) {
        assertThis(self);
        return vm(self).filter();
    }

    PageFilterElement.prototype.attachedCallback = function attachedCallback() {
        vm(this).id(this.getAttribute('filter-id'));
        vm(this).caption(this.getAttribute('caption'));
        vm(this).filter(this.getAttribute('filter'));
        addRoot(this);
    };

    function addRoot(self) {
        assertThis(self);
        var rootElement = Element.build('div', null, ['page-filter-root']);
        self.insertBefore(rootElement, self.firstChild);
        root(self, rootElement);
    }

    function root(self, value) {
        assertThis(self);
        if (value !== undefined) {
            self.private.root = value;
        }
        return self.private.root;
    }

    PageFilterElement.prototype.detachedCallback = function attachedCallback() {
        removeRoot(this);
    };

    function removeRoot(self) {
        assertThis(self);
        var rootElement = root(self);
        m.mount(rootElement, null);
        rootElement.parentNode.removeChild(rootElement);
    }

    PageFilterElement.prototype.attributeChangedCallback = function attributeChangedCallback(attrName, oldValue, newValue) {
        Object.tryMethod(this, attrName.replace('-', '_') + '_changed', oldValue, newValue);
    };

    PageFilterElement.prototype.filter_id_changed = function filterIdChanged(oldValue, newValue) {
        vm(this).id(newValue);
        m.redraw();
    };

    PageFilterElement.prototype.caption_changed = function captionChanged(oldValue, newValue) {
        vm(this).caption(newValue);
        m.redraw();
    };

    PageFilterElement.prototype.filter_changed = function filter_changed(oldValue, newValue) {
        vm(this).filter(newValue);
        m.redraw();
    };

    PageFilterElement.prototype.loadState = function init(data) {
        vm(this).loadState(data);
        m.mount(root(this), { controller: controller.bind(null, this), view: view(this) });
    };

    function controller(self) {
        assertThis(self);
        return vm(self);
    }

    function view(self) {
        assertThis(self);
        return self.private.view;
    }

    PageFilterElement.prototype.saveState = function saveState() {
        return vm(this).saveState();
    };

    PageFilterElement.prototype.reload = function getState() {
        vm(this).reload();
    };

    PageFilterElement.prototype.connect = function connect(connection) {
        vm(this).addConnection(connection);
    };

    PageFilterElement.prototype.disconnect = function disconnect(connection) {
        vm(this).removeConnection(connection);
    };

    PageFilterElement.prototype.loadWithoutFilter = function reload() {
        vm(this).loadWithoutFilter();
    };

    PageFilterElement.prototype.editFilters = function reload() {
        vm(this).editFilters();
    };

    PageFilterElement.prototype.clearFilter = function () {
        vm(this).filter(null);
        vm(this).values(null);
        vm(this).preferenceLoaded(false);
        m.redraw();
    };

    function assertThis(self) {
        Assert.instanceOf(self, HTMLElement, 'self');
        Assert.isNotUndefined(self.private.vm, 'self.vm');
        Assert.isNotUndefined(self.private.view, 'self.view');
        Assert.isNotUndefined(self.private.root, 'self.root');
    }

    Element.registerElement('mi-page-filter', { prototype: PageFilterElement.prototype });
    return PageFilterElement;
});
