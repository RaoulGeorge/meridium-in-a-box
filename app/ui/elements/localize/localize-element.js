define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        m = require('mithril'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        LocalizeViewModel = require('./view-models/localize-view-model'),
        LocalizeView = require('./views/localize-view');
    var LocalizeElement = {};

    LocalizeElement.prototype = Object.create(HTMLElement.prototype);

    LocalizeElement.prototype.createdCallback = function createdCallback() {
        // private members
        this._root = Object.prop(null);
        this._vm = Object.prop(null);

        // public members
        this.value = null;
    };

    LocalizeElement.prototype.attachedCallback = function attachedCallback() {
        try {
            initVm(this);
            initRoot(this);
            attachToRoot(this);
        } catch (error) {
            handleError(error);
        }
    };

    function initVm(self) {
        assertThis(self);
        self._vm(Object.resolve(LocalizeViewModel));
        self._vm().type(self.getAttribute('type') || '');
        self._vm().phrase(self.getAttribute('phrase') || '');
        self._vm().key(self.getAttribute('key') || '');
        self._vm().context(self.getAttribute('context') || '');
        self._vm().dialogClosed.add(vm_dialogClosed, self, self);
    }

    function vm_dialogClosed(self, sender, result) {
        try {
            assertThis(self);
            Assert.ok(sender, 'sender');
            Assert.ok(result, 'result');
            Assert.stringNotEmpty(result.phrase, 'result.phrase');
            tryChangeValue(self, result.phrase);
        } catch (error) {
            handleError(error);
        }
    }

    function tryChangeValue(self, value) {
        assertThis(self);
        Assert.stringNotEmpty(value, 'value');
        if (changed(self, value)) {
            self.value = value;
            onChange(self);
        }
    }

    function changed(self, value) {
        assertThis(self);
        Assert.stringNotEmpty(value, 'value');
        return self.value !== value;
    }

    function onChange(self) {
        assertThis(self);
        Element.raiseEvent(self, 'change', { value: self.value });
    }

    function initRoot(self) {
        assertThis(self);
        var root = self.querySelector('.localize-root');
        if (!root) {
            root = Element.build('div', self, ['localize-root']);
        }
        self._root(root);
    }

    function attachToRoot(self) {
        assertThis(self);
        assertRoot(self._root());
        assertVm(self._vm());
        m.mount(self._root(), { controller: self._vm, view: LocalizeView });
    }

    LocalizeElement.prototype.detachedCallback = function attachedCallback() {
        try {
            detachFromRoot(this);
            disposeRoot(this);
            disposeVm(this);
        } catch (error) {
            handleError(error);
        }
    };

    function detachFromRoot(self) {
        assertThis(self);
        assertRoot(self._root());
        m.mount(self._root(), null);
    }

    function disposeRoot(self) {
        assertThis(self);
        assertRoot(self._root());
        self.removeChild(self._root());
        self._root(null);
    }

    function disposeVm(self) {
        assertThis(self);
        assertVm(self._vm());
        self._vm().dialogClosed.remove(self);
        self._vm().dispose();
        self._vm(null);
    }

    LocalizeElement.prototype.attributeChangedCallback = function attributeChangedCallback(attrName, oldValue, newValue) {
        try {
            tryUpdateVm(this, attrName, newValue);
        } catch (error) {
            handleError(error);
        }
    };

    function tryUpdateVm(self, propertyName, value) {
        assertThis(self);
        if (!self._vm()) { return; }
        assertVm(self._vm());
        var property = self._vm()[propertyName];
        if (property) {
            property(value || '');
            m.redraw();
        }
    }

    function assertThis(self) {
        Assert.instanceOf(self, HTMLElement, 'self');
        Assert.isFunction(self._root, 'self._root');
        Assert.isFunction(self._vm, 'self._vm');
    }

    function assertVm(vm) {
        Assert.instanceOf(vm, LocalizeViewModel, 'self._vm()');
    }

    function assertRoot(root) {
        Assert.instanceOf(root, HTMLElement, 'self._root()');
    }

    function handleError(error) {
        logger.error(error.stack);
        throw error;
    }

    Element.registerElement('mi-localize', { prototype: LocalizeElement.prototype });
    return LocalizeElement;
});