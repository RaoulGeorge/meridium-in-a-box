define(function defineWidgetElement(require) {
     'use strict';

    var Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        Translator = require('system/globalization/translator'),
        Assert = require('mi-assert');
    var WidgetElement = {};

    WidgetElement.prototype = Object.create(HTMLElement.prototype);

    WidgetElement.create = function create(parent, widget) {
        Assert.instanceOf(parent, HTMLElement);
        Assert.ok(widget, 'widget');
        Assert.ok(widget.uniqueID, 'widget.uniqueID');
        var element = Element.build('mi-widget', parent, null, {
            id: widget.uniqueID(),
            caption: widget.widgetCaption(),
            type: widget.widgetType()
        });
        element.value = widget;
        return element;
    };

    WidgetElement.prototype.createdCallback = function createdCallback() {
        this.attached = false;
        this.conductor = Object.resolve(Conductor);
        this.translator = Object.resolve(Translator);
        this._value = null;
        this.parent_resized = parent_resized.bind(null, this);
        this.parent_changed = parent_changed.bind(null, this);
        this.region = new Region();
        this.nameSubscription = null;
        Element.defineProperty(this, 'value', {
            get: value_read.bind(null, this),
            set: value_write.bind(null, this)
        });
    };

    WidgetElement.prototype.attachedCallback = function attachedCallback() {
        this.attached = true;
        if (this._value) {
            render(this);
        }
    };

    WidgetElement.prototype.detachedCallback = function detachedCallback() {
        stopListeningToParent(this);
        stopListeningToWidget(this);
        this.attached = false;
        this.conductor.changeScreen(null, this.region, {}, { isClosing: false });
    };

    WidgetElement.prototype.attributeChangedCallback = function attributeChangedCallback(attrName, oldValue, newValue) {
        Object.tryMethod(this, attrName + 'Changed', oldValue, newValue);
    };

    function value_read(self) {
        Assert.instanceOf(self, HTMLElement);
        return self._value;
    }

    function value_write(self, widget) {
        Assert.instanceOf(self, HTMLElement);
        self._value = widget;
        if (self._value && self.attached) {
            render(self);
        }
    }

    function parent_resized(self, e) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isObject(e, 'e');
        if (e.detail && e.detail.width && e.detail.height) {
            stopListeningToParentResize(self);
            self.value.resize(e.detail.width, e.detail.height);
            listenToParentResize(self);
        }
    }

    function parent_changed(self, e) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isObject(e, 'e');
        Assert.isObject(e.detail, 'e.detail');
        Assert.isString(e.detail.layout, 'e.detail.layout');
        notifyWidgetLayoutChanged(self, e.detail.layout, e.detail);
    }

    function render(self) {
        Assert.instanceOf(self, HTMLElement);
        var widgetHeader, caption, widgetToolbar;
        Element.clearDom(self);
        widgetHeader = createHeader(self);
        caption = createCaption(widgetHeader, self.getAttribute('caption'));
        widgetToolbar = createToolbar(widgetHeader);
        attachGoToCatalogItem(self, widgetToolbar);
        createRefreshButton(self, widgetToolbar);
        createMenu(self, widgetToolbar);
        createOverlay(self);
        createBody(self);
        listenToParent(self);
        listenToWidget(self, caption);
    }

    function createOverlay(parent) {
        Assert.instanceOf(parent, HTMLElement);
        return Element.build('div', parent, ['widget-overlay']);
    }

    function createHeader(parent) {
        Assert.instanceOf(parent, HTMLElement);
        return Element.build('header', parent, ['block-group']);
    }

    function createCaption(parent, text) {
        Assert.instanceOf(parent, HTMLElement);
        Assert.isString(text);
        return Element.build('div', parent, ['block', 'name', 'grid-layout-draggable'], null, text);
    }

    function createToolbar(parent) {
        Assert.instanceOf(parent, HTMLElement);
        return Element.build('div', parent, ['block', 'toolbar', 'dropdown']);
    }

    function attachGoToCatalogItem(self, parent) {
        var goToButton;
        if (self.value.allowGoTo) {
            goToButton = Element.build('div', parent, ['goto-button'], {
                title: self.translator.translate('OPEN_IN_NEW_TAB')
            });
            Element.build('i', goToButton, ['icon-open-in-new-window']);
            goToButton.addEventListener('click', self.value.goto.bind(self.value, self.parentElement));
        }
    }

    function createRefreshButton(self, parent) {
        var refreshButton;
        if (self.value.allowRefresh) {
            refreshButton = Element.build('div', parent, ['refresh-button'], {
                title: self.translator.translate('REFRESH')
            });
            Element.build('i', refreshButton, ['icon-refresh']);
            refreshButton.addEventListener('click', self.value.refresh.bind(self.value));
        }
    }

    function createMenu(self, parent) {
        Assert.instanceOf(self, HTMLElement, 'self');
        Assert.instanceOf(parent, HTMLElement, 'parent');
        createMenuButton(self, parent);
        createMenuDropdown(self, parent, self.value);
    }

    function createMenuButton(self, parent) {
        Assert.instanceOf(parent, HTMLElement);
        var menuButton = Element.build('button', parent,
            ['btn', 'btn-default', 'btn-icon', 'dropdown-toggle', 'menu-button'], {
            'data-toggle': 'dropdown',
                title: self.translator.translate('EDIT_OPTIONS')
        });
        Element.build('i', menuButton, ['icon-options']);
        return menuButton;
    }

    function createMenuDropdown(self, parent, widget) {
        Assert.instanceOf(self, HTMLElement, 'self');
        Assert.instanceOf(parent, HTMLElement, 'parent');
        Assert.ok(widget);
        var menu = Element.build('ul', parent, ['dropdown-menu', 'dropdown-menu-right'], { role: 'menu' });
        addMenuItem(menu, self.translator.translate('EDIT'), widget.edit.bind(widget));
        addMenuItem(menu, self.translator.translate('HIDE'), widget.hide.bind(widget));
        addMenuItem(menu, self.translator.translate('REMOVE'), widget.remove.bind(widget));
    }

    function addMenuItem(menu, label, action) {
        Assert.instanceOf(menu, HTMLElement);
        Assert.isString(label);
        Assert.isFunction(action);
        var li = Element.build('li', menu),
            a = Element.build('a', li, null, null, label);
        a.addEventListener('click', action);
    }

    function createBody(self) {
        Assert.instanceOf(self, HTMLElement);
        var widgetBody = Element.build('section', self, ['widget-body']);
        self.region.setElement(widgetBody);
        self.conductor.changeScreen(self.value, self.region);

    }

    function listenToParent(self) {
        Assert.instanceOf(self, HTMLElement);
        var parent = self.parentElement,
            parentAttributes = parent.getChangedAttributes();
        listenToParentResize(self);
        parent.addEventListener('change', self.parent_changed);
        notifyWidgetLayoutChanged(self, parentAttributes.layout, parentAttributes);
    }

    function notifyWidgetLayoutChanged(self, layout, parameters) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isString(layout);
        Assert.isObject(parameters);
        var attributes = {
            x: parameters.x,
            y: parameters.y,
            z: parameters.z,
            width: parameters.width,
            height: parameters.height
        };
        self.value.notifyLayoutChanged(layout, attributes);
    }

    function listenToParentResize(self) {
        if (self.parentNode) {
            self.parentNode.addEventListener('element-resized', self.parent_resized);
        }
    }

    function stopListeningToParentResize(self) {
        if (self.parentNode) {
            self.parentNode.removeEventListener('element-resized', self.parent_resized);
        }
    }

    function stopListeningToParent(self) {
        Assert.instanceOf(self, HTMLElement);
        if (self.parentElement) {
            stopListeningToParentResize(self);
            self.parentElement.removeEventListener('change', self.parent_changed);
        }
    }

    function listenToWidget(self, caption) {
        Assert.instanceOf(self, HTMLElement, self);
        Assert.instanceOf(caption, HTMLElement, caption);
        self.value.getNameChanged().add(widget_nameChanged, self, caption);
    }

    function stopListeningToWidget(self) {
        self.value.getNameChanged().remove(self);
    }

    function widget_nameChanged(element, widget, name) {
        element.innerText = name;
    }

    Element.registerElement('mi-widget', { prototype: WidgetElement.prototype });
    return WidgetElement;
});
