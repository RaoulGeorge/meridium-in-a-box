define(function defineDashboardElement(require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var DashboardController = require('./dashboard-controller'),
        HaltBindings = require('system/knockout/bindings/halt-bindings'),
        GridLayoutElement = require('ui/elements/grid-layout/grid-layout-element'),
        GridLayoutCollectionElement = require('ui/elements/grid-layout/grid-layout-collection-element'),
        GridLayoutItemElement = require('ui/elements/grid-layout/grid-layout-item-element'),
        WidgetElement = require('./widget-element'),
        WidgetControlPanelComponent = require('./widget-control-panel-component'),
        ErrorNotificationHandler = require('logging/error-notification-handler'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        Translator = require('system/globalization/translator'),
        Assert = require('mi-assert');
    var BaseDashboardElement = { prototype: {}  },
        DashboardElement = {},
        DashboardEditorElement = {};

    BaseDashboardElement.prototype.createdCallback = function createdCallback() {
        this.private = {
            controller: Object.resolve(DashboardController),
            widgetControlPanel: Object.resolve(WidgetControlPanelComponent),
            key: null,
            _path: null,
            gridLayoutCollection: null,
            controlPanel: null
        };
        this.translator = Object.resolve(Translator);

        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
    };

    BaseDashboardElement.prototype.attachedCallback = function attachedCallback() {
        try{
            try_attachedCallback(this);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function try_attachedCallback(self) {
        listenToController(self);
        listenToWidgetControlPanel(self);
        setKey(self, self.getAttribute('key'));
        setPath(self, self.getAttribute('path'));
    }

    function listenToController(self) {
        assertThis(self);
        var controller = getController(self);
        controller.dashboardChanged.add(controller_dashboardChanged.bind(null, self), self);
        controller.editModeChanged.add(controller_editModeChanged.bind(null, self), self);
        controller.widgetAdded.add(controller_widgetAdded.bind(null, self), self);
        controller.widgetRemoved.add(controller_widgetRemoved.bind(null, self), self);
        controller.widgetHidden.add(controller_widgetHidden.bind(null, self), self);
        controller.widgetUnhidden.add(controller_widgetUnhidden.bind(null, self), self);
    }

    function getController(self) {
        assertThis(self);
        return self.private.controller;
    }

    function controller_dashboardChanged(self, controller, dashboard) {
        assertThis(self);
        Assert.ok(dashboard);
        var haltBindings;
        Element.clearDom(self);
        haltBindings = HaltBindings.createElement(self);
        appendDashboardControlPanel(self, haltBindings);
        appendDashboard(self, haltBindings);
        _.defer(function () {
            editEmptyDashboardInEditor(self);
            Element.raiseEvent(self, 'dashboard-changed', { dashboard: dashboard });
        });
    }

    function editEmptyDashboardInEditor(self) {
        var inEditor = isDashboardEditor(self),
            isEditable = !getDashboard(self).readOnly(),
            isEmpty = getVisibleDashboardContent(self).length === 0,
            notInEditMode = !getController(self).inEditMode;
        if (inEditor && isEditable && isEmpty && notInEditMode) {
            getController(self).toggleEditMode();
        }
    }

    function isDashboardEditor(self) {
        return self.tagName === 'MI-DASHBOARD-EDITOR';
    }

    function appendDashboardControlPanel(self, parent) {
        assertThis(self);
        if (showToolbar(self)) {
            setDashboardControlPanel(self, Element.build('div', parent, ['dashboard-control-panel', 'page-filter-tools']));
            appendSetHomeButton(self);
            if (showEditModeButton(self)) {
                appendDivider(self);
                appendEditModeButton(self);
            }
        }
    }

    function showToolbar(self) {
        return self.getAttribute('toolbar') !== null;
    }

    function setDashboardControlPanel(self, value) {
        assertThis(self);
        Assert.instanceOf(value, HTMLElement);
        self.private.controlPanel = value;
    }

    function appendSetHomeButton(self) {
        var button = Element.build('button', getDashboardControlPanel(self), ['btn', 'btn-icon', 'edit']);
        button.addEventListener('click', setHomeButton_clicked.bind(null, self));
        Element.build('span', button, ['icon-dashboard'], {
            title: self.translateText('SET_AS_HOME_PAGE')
        });
        Element.build('span', button, ['set-home-text'], {
            title: self.translateText('SET_AS_HOME_PAGE')
        }, self.translateText('SET_AS_HOME_PAGE'));
    }

    function getDashboardControlPanel(self) {
        assertThis(self);
        return self.private.controlPanel;
    }

    function setHomeButton_clicked(self) {
        getController(self).setHomePage();
    }

    function showEditModeButton(self) {
        return !getController(self).dashboard.readOnly();
    }

    function appendDivider(self) {
        Element.build('div', getDashboardControlPanel(self), ['divider'], {}, '\u00a0');
    }

    function appendEditModeButton(self) {
        var editButton = Element.build('button', getDashboardControlPanel(self), ['btn', 'btn-icon', 'edit']);
        editButton.addEventListener('click', editButton_clicked.bind(null, self));
        Element.build('span', editButton, ['icon-edit', 'edit-dashboard-icon'], {
            title: self.translateText('EDIT_MODE')
        });
        Element.build('span', editButton, ['edit-mode-text'], {
            title: self.translateText('EDIT_MODE')
        }, self.translateText('EDIT_MODE'));
    }

    function editButton_clicked(self) {
        assertThis(self);
        getController(self).toggleEditMode();
    }

    function appendDashboard(self, haltBindings) {
        var content = appendContent(self, haltBindings),
            gridLayout = GridLayoutElement.create(content);
        Element.upgrade(gridLayout);
        setGridLayoutCollection(self, GridLayoutCollectionElement.create(gridLayout, 4, 8, 12, 24, 24));
        Element.upgrade(getGridLayoutCollection(self));
        appendWidgets(self);
        appendWidgetControlPanel(self, gridLayout);
        getDashboard(self).screenAttached();
    }

    function appendContent(self, parent) {
        assertThis(self);
        return Element.build('div', parent, ['dashboard-content']);
    }

    function setGridLayoutCollection(self, value) {
        assertThis(self);
        Assert.instanceOf(value, HTMLElement);
        self.private.gridLayoutCollection = value;
    }

    function getGridLayoutCollection(self) {
        assertThis(self);
        return self.private.gridLayoutCollection;
    }

    function appendWidgets(self) {
        assertThis(self);
        getVisibleDashboardContent(self).forEach(appendWidget.bind(null, self));
    }

    function getVisibleDashboardContent(self) {
        assertThis(self);
        return getDashboard(self).visibleContent();
    }

    function getDashboard(self) {
        assertThis(self);
        return getController(self).getCurrentDashboard();
    }

    function appendWidget(self, widget) {
        assertThis(self);
        Assert.ok(widget);
        var widgetElement,
            gridLayoutItem = createGridLayoutItem(self, widget);
        widgetElement = WidgetElement.create(gridLayoutItem, widget);
        Element.upgrade(widgetElement);
        return gridLayoutItem;
    }

    function createGridLayoutItem(self, widget) {
        assertThis(self);
        Assert.ok(widget);
        var parent = getGridLayoutCollection(self),
            widgetLayout = getDashboardLayout(self)[widget.uniqueID()] || {},
            element = GridLayoutItemElement.create(parent, widget.minWidth, widget.minHeight, widgetLayout);
        Element.upgrade(element);
        return element;
    }

    function getDashboardLayout(self) {
        assertThis(self);
        return getDashboard(self).layout();
    }

    function appendWidgetControlPanel(self, parent) {
        assertThis(self);
        Assert.instanceOf(parent, HTMLElement, 'parent');
        var element = Element.build('div', parent, ['widget-control-panel-container']);
        getWidgetControlPanel(self).bindToElement(element);
        getWidgetControlPanel(self).init(getDashboard(self));
    }

    function getWidgetControlPanel(self) {
        assertThis(self);
        return self.private.widgetControlPanel;
    }

    function getDashboardContent(self) {
        assertThis(self);
        return getDashboard(self).content();
    }

    function controller_editModeChanged(self, controller, inEditMode) {
        assertThis(self);
        Assert.isBoolean(inEditMode);
        if (getDashboardControlPanel(self)) {
            var editButton = getDashboardControlPanel(self).querySelector('button.edit');
            var editIcon = getDashboardControlPanel(self).querySelector('span.edit-dashboard-icon');
            if (inEditMode) {
                self.classList.add('in-edit-mode');
                editButton.classList.add('active');
            } else {
                self.classList.remove('in-edit-mode');
                editButton.classList.remove('active');
            }
            getGridLayoutCollection(self).toggleEditMode();
            Element.raiseEvent(self, 'edit-mode-changed', {
                dashboard: getController(self).getCurrentDashboard(),
                inEditMode: inEditMode
            });
        }
    }

    function controller_widgetAdded(self, sender, widget) {
        assertThis(self);
        Assert.ok(widget);
        var element = appendWidget(self, widget);
        _.defer(editNewWidget.bind(null, self, element, widget));
    }

    function editNewWidget(self, element, widget) {
        assertThis(self);
        Assert.ok(element, 'element');
        Assert.ok(widget, 'widget');
        widget.edit()
            .done(removeWidgetIfEditCanceled.bind(null, self, widget));
    }

    function removeWidgetIfEditCanceled(self, widget, cancelled) {
        assertThis(self);
        Assert.ok(widget);
        if (cancelled) {
            getController(self).removeWidgetWithoutPrompt(widget);
        }
    }

    function controller_widgetRemoved(self, sender, widget) {
        assertThis(self);
        Assert.instanceOf(sender, DashboardController);
        Assert.ok(widget);
        removeWidgetElement(self, widget);
    }

    function removeWidgetElement(self, widget) {
        assertThis(self);
        Assert.ok(widget);
        var gridItemElement, gridCollectionElement,
            widgetElement = findWidgetElement(self, widget);
        if (widgetElement) {
            gridItemElement = widgetElement.parentNode;
            gridCollectionElement = gridItemElement.parentNode;
            gridCollectionElement.removeChild(gridItemElement);
            getWidgetControlPanel(self).__private__.viewModel.updateNumberOfWidgets();
        }
    }

    function findWidgetElement(self, widget) {
        var elements = self.querySelectorAll('mi-widget');
        return _.find(elements, function (value) {
            return value.value === widget;
        });
    }

    function controller_widgetHidden(self, sender, widget) {
        assertThis(self);
        Assert.instanceOf(sender, DashboardController);
        Assert.ok(widget);
        removeWidgetElement(self, widget);
    }

    function controller_widgetUnhidden(self, sender, widget) {
        assertThis(self);
        Assert.ok(widget);
        appendWidget(self, widget);
    }

    function listenToWidgetControlPanel(self) {
        var widgetControlPanel = getWidgetControlPanel(self);
        assertThis(self);
        widgetControlPanel.widgetAdded.add(widgetControlPanel_widgetAdded.bind(null, self));
        widgetControlPanel.widgetUnhidden.add(widgetControlPanel_widgetUnhidden.bind(null, self));
    }

    function widgetControlPanel_widgetAdded(self, sender, widget) {
        assertThis(self);
        Assert.ok(widget);
        getController(self).addWidget(widget);
    }

    function widgetControlPanel_widgetUnhidden(self, sender, widget) {
        assertThis(self);
        Assert.ok(widget);
        getController(self).showWidget(widget);
    }

    function setKey(self, value) {
        assertThis(self);
        Assert.assert(_.isString(value) || value === null);
        self.private.key = value;
    }

    function setPath(self, value) {
        assertThis(self);
        Assert.assert(_.isString(value) || value === null);
        self.private._path = value;
    }

    BaseDashboardElement.prototype.detachedCallback = function detachedCallback() {
        try {
            try_detachedCallback(this);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function try_detachedCallback(self) {
        stopListeningToController(self);
        stopListeningToWidgetControlPanel(self);
        getWidgetControlPanel(self).dispose();
    }

    function stopListeningToController(self) {
        assertThis(self);
        var controller = getController(self);
        controller.dashboardChanged.remove(self);
        controller.editModeChanged.remove(self);
        controller.widgetAdded.remove(self);
        controller.widgetRemoved.remove(self);
        controller.widgetHidden.remove(self);
        controller.widgetUnhidden.remove(self);
    }

    function stopListeningToWidgetControlPanel(self) {
        assertThis(self);
        getWidgetControlPanel(self).widgetAdded.remove(self);
    }

    BaseDashboardElement.prototype.attributeChangedCallback = function attributeChangedCallback(attrName, oldValue, newValue) {
        try {
            Object.tryMethod(this, attrName + 'Changed', oldValue, newValue);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    BaseDashboardElement.prototype.keyChanged = function keyChanged(oldValue, newValue) {
        try {
            try_keyChanged(this, oldValue, newValue);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function try_keyChanged(self, oldValue, newValue) {
        setKey(self, newValue);
        setPath(self, null);
    }

    BaseDashboardElement.prototype.pathChanged = function pathChanged(oldValue, newValue) {
        try {
            try_pathChanged(this, oldValue, newValue);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function try_pathChanged(self, oldValue, newValue) {
        setKey(self, null);
        setPath(self, newValue);
    }

    BaseDashboardElement.prototype.refreshAll = function () {
        var dashboardWidgets = this.private.controller.dashboard.content();

        for(var i = 0; i < dashboardWidgets.length; i++) {
            if(!isWidgetHidden(dashboardWidgets[i])) {
                dashboardWidgets[i].refresh();
            }
        }
    };

    function isWidgetHidden(widget) {
        var layout = widget.widget.dashboard().layout()[widget.uniqueID()];

        if (!layout) {
            return false;
        }

        return layout.hidden;
    }

    BaseDashboardElement.prototype.redrawAll = function () {
        if (this.private.controller.dashboard) {
            var dashboardWidgets = this.private.controller.dashboard.content();

            for (var i = 0; i < dashboardWidgets.length; i++) {
                if (!isWidgetHidden(dashboardWidgets[i])) {
                    dashboardWidgets[i].redraw();
                }
            }
        }
    };

    BaseDashboardElement.prototype.loadState = function loadState(state) {
        try {
            getController(this).loadState(state, getKey(this), getPath(this));
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function getKey(self) {
        assertThis(self);
        return self.private.key;
    }

    function getPath(self) {
        assertThis(self);
        return self.private._path;
    }

    BaseDashboardElement.prototype.saveState = function saveState() {
        try {
            return getController(this).saveState();
        } catch (e) {
            errorHandler(this, e);
        }
    };

    BaseDashboardElement.prototype.translateText = function translateText(key) {
        try {
            return this.translator.translate(key);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function assertThis(self) {
        Assert.instanceOf(self, HTMLElement, 'self');
        Assert.instanceOf(self.private.controller, DashboardController, 'self.private.controller');
    }

    function errorHandler(self, e) {
        logger.error(e.stack);
        self.errorNotificationHandler.addError({
            errorMessage: e.message,
            errorDetail: e.stack
        });
    }

    function extendBaseDashboardElement() {
        var proto = Object.create(HTMLElement.prototype);
        return _.extend(proto, BaseDashboardElement.prototype);
    }

    DashboardElement.prototype = extendBaseDashboardElement();
    DashboardEditorElement.prototype = extendBaseDashboardElement();
    Element.registerElement('mi-dashboard', {prototype: DashboardElement.prototype});
    Element.registerElement('mi-dashboard-editor', {prototype: DashboardEditorElement.prototype});
    return DashboardElement;
});
