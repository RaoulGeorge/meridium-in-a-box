define(function defineDashboadController(require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var DashboardService = require('dashboard/services/dashboard-service'),
        DashboardContainerAdapter = require('dashboard/adapters/dashboard-container-adapter'),
        ApplicationContext = require('application/application-context'),
        Translator = require('system/globalization/translator'),
        MessageBox = require('system/ui/message-box'),
        Event = require('system/lang/event'),
        Property = require('system/lang/property'),
        ErrorNotificationHandler = require('logging/error-notification-handler'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        Assert = require('mi-assert');

    function DashboardController() {
        var dashboardService = Object.resolve(DashboardService);
        Property.readWrite(this, 'dashboard', null);
        Property.readOnly(this, 'dashboardService', dashboardService);
        Property.readOnly(this, 'inEditMode', false);
        Property.readOnly(this, 'throttledSave', _.debounce(dashboardService.save.bind(dashboardService), 300));
        Property.readOnly(this, 'dashboardChanged', Object.resolve(Event));
        Property.readOnly(this, 'editModeChanged', Object.resolve(Event));
        Property.readOnly(this, 'widgetAdded', Object.resolve(Event));
        Property.readOnly(this, 'widgetRemoved', Object.resolve(Event));
        Property.readOnly(this, 'widgetHidden', Object.resolve(Event));
        Property.readOnly(this, 'widgetUnhidden', Object.resolve(Event));

        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
    }

    DashboardController.prototype.getCurrentDashboard = function () {
        try {
            return getDashboard(this);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function getDashboard(self) {
        assertThis(self);
        return self.dashboard;
    }

    function errorHandler(self, e) {
        logger.error(e.stack);
        self.errorNotificationHandler.addError({
            errorMessage: e.message,
            errorDetail: e.stack
        });
    }

    DashboardController.prototype.setCurrentDashboard = function (dashboard) {
        try {
            trySetCurrentDashboard(this, dashboard);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function trySetCurrentDashboard(self, dashboard) {
        Assert.ok(dashboard);
        disposeDashboard(self);
        setDashboard(self, dashboard);
        getDashboard(self).saveRequested.add(save, null, self);
        getDashboard(self).widgetRemoved.add(dashboard_widgetRemoved, null, self);
        getDashboard(self).widgetHidden.add(dashboard_widgetHidden, null, self);
        raiseDashboardChanged(self);
    }

    function disposeDashboard(self) {
        assertThis(self);
        if (getDashboard(self)) {
            getDashboard(self).saveRequested.remove(self);
            getDashboard(self).dispose();
        }
    }

    function setDashboard(self, value) {
        assertThis(self);
        Assert.ok(value);
        self.dashboard = value;
    }

    function dashboard_widgetRemoved(self, sender, widget) {
        assertThis(self);
        Assert.assert(sender === getDashboard(self));
        Assert.ok(widget);
        raiseWidgetRemoved(self, widget);
        save(self);
    }

    function raiseWidgetRemoved(self, widget) {
        assertThis(self);
        self.widgetRemoved.raise(self, widget);
    }

    function save(self) {
        assertThis(self);
        var dto = DashboardContainerAdapter.toDTO(getDashboard(self));
        throttledSave(self, dto);
    }

    function throttledSave(self, dto) {
        assertThis(self);
        Assert.ok(dto);
        self.throttledSave(dto);
    }

    function dashboard_widgetHidden(self, sender, widget) {
        assertThis(self);
        Assert.assert(sender === getDashboard(self));
        Assert.ok(widget);
        raiseWidgetHidden(self, widget);
        save(self);
    }

    function raiseWidgetHidden(self, widget) {
        assertThis(self);
        self.widgetHidden.raise(self, widget);
    }

    function raiseDashboardChanged(self) {
        assertThis(self);
        self.dashboardChanged.raise(self, getDashboard(self));
    }

    DashboardController.prototype.loadDashboard = function loadDashboard(key, path) {
        try {
            tryLoadDashboard(this, key, path);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function tryLoadDashboard(self, key, path) {
        if (key) {
            loadDashboardByKey(self, key);
        } else if (path) {
            loadDashboardByPath(self, path);
        }
    }

    function loadDashboardByKey(self, key) {
        assertThis(self);
        Assert.ok(key);
        getDashboardService(self).getDashboardByKey(key)
            .done(getDashboard_done.bind(null, self))
            .fail(getDashboard_fail.bind(null, self));
    }

    function getDashboardService(self) {
        assertThis(self);
        return self.dashboardService;
    }

    function getDashboard_done(self, dto) {
        assertThis(self);
        Assert.ok(dto);
        self.setCurrentDashboard(DashboardContainerAdapter.toModel(dto));
    }

    function getDashboard_fail(self, request, response) {
        assertThis(self);
        Assert.ok(request, 'request');
        Assert.ok(response, 'response');
        response.status >= 500 ? fail_meridium(self, request, response): fail_iis(request, response);
    }

    function fail_meridium(self, request, response) {
        var exception, message, error,
            translator = Object.resolve(Translator),
            CATALOG_EXCEPTION = 'Meridium.Core.Exceptions.CatalogException',
            CATALOG_ITEM_NOT_FOUND = translator.translate('CANNOT_FIND_CATALOG_ITEM'),
            DASHBOARD_PARSE_ERROR = translator.translate('DASHBOARD_PARSE_ERROR'),
            DASHBOARD_NOT_FOUND = translator.translate('CANNOT_FIND_DASHBOARD');

        try {
            exception = JSON.parse(response.responseText);
        } catch (e) {
            exception = DASHBOARD_NOT_FOUND;
        }

        if (exception.exceptionType === CATALOG_EXCEPTION && exception.exceptionMessage === CATALOG_ITEM_NOT_FOUND) {
            notifyDashboardNotFound(request);
            return;
        } else if (exception.exceptionType === CATALOG_EXCEPTION && exception.exceptionMessage === DASHBOARD_PARSE_ERROR) {
            notifyDashboardParseError(request);
            return;
        } else if (exception.exceptionMessage) {
            message = response.statusText + ': ' + exception.exceptionMessage;
            error = new Error(message);
            error.stack = error.stack ? error.stack + '' : '';
            if (exception.stackTrace) {
                error.stack = error.stack + '\n\nFrom Server: ' +
                    exception.exceptionMessage + '\n' + exception.stackTrace;
            }
        } else {
            error = new Error(exception);
        }
        throw error;
    }

    function notifyDashboardNotFound(request) {
        var id,
            translator = Object.resolve(Translator),
            message = translator.translate('CANNOT_FIND_DASHBOARD');
        if (request.url.indexOf('?path=') !== -1) {
            id = request.url.split('?path=')[1];
        } else {
            id = _.last(request.url.split('/'));
        }
        MessageBox.showOk(id, message);
    }

    function notifyDashboardParseError() {
        var translator = Object.resolve(Translator),
            message = translator.translate('DASHBOARD_PARSE_ERROR');
        MessageBox.showOk(message, translator.translate('ERROR'));
    }

    function fail_iis(request, response) {
        var message, error;
        if (response.status === 404) {
            notifyDashboard404();
        } else {
            message = request.url + ' ' + response.statusText;
            error = new Error(message + ' (' + status + ')');
            throw error;
        }
    }

    function notifyDashboard404() {
        var translator = Object.resolve(Translator),
            message = translator.translate('DASHBOARD_LOAD_ERROR');
        if (!ApplicationContext.connectionStatus.connected) {
            message += ' - ' + translator.translate('OFFLINE');
        }
        MessageBox.showOk(message, translator.translate('ERROR'));
    }

    function loadDashboardByPath(self, path) {
        assertThis(self);
        Assert.ok(path);
        getDashboardService(self).getDashboardByPath(path)
            .done(getDashboard_done.bind(null, self))
            .fail(getDashboard_fail.bind(null, self));
    }

    DashboardController.prototype.toggleEditMode = function () {
        try {
            tryToggleEditMode(this);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function tryToggleEditMode(self) {
        if (self.inEditMode) {
            save(self);
        }
        setInEditMode(self, !self.inEditMode);
        raiseEditModeChanged(self);
    }

    function setInEditMode(self, value) {
        assertThis(self);
        Assert.isBoolean(value);
        Property.set(self, 'inEditMode', value);
    }

    function raiseEditModeChanged(self) {
        assertThis(self);
        self.editModeChanged.raise(self, self.inEditMode);
    }

    DashboardController.prototype.addWidget = function (widget) {
        try {
            tryAddWidget(this, widget);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function tryAddWidget(self, widget) {
        Assert.ok(widget);
        getDashboard(self).addWidget(widget);
        raiseWidgetAdded(self, widget);
    }

    function raiseWidgetAdded(self, widget) {
        assertThis(self);
        self.widgetAdded.raise(self, widget);
    }

    DashboardController.prototype.showWidget = function (widget) {
        try {
            tryShowWidget(this, widget);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function tryShowWidget(self, widget){
        Assert.ok(widget);
        getDashboard(self).showWidget(widget);
        raiseWidgetUnhidden(self, widget);
    }

    function raiseWidgetUnhidden(self, widget) {
        assertThis(self);
        self.widgetUnhidden.raise(self, widget);
    }

    DashboardController.prototype.removeWidgetWithoutPrompt = function (widget) {
        try {
            getDashboard(this).removeWidgetWithoutPrompt(widget);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    DashboardController.prototype.loadState = function (state, key, path) {
        try {
            tryLoadState(this, state, key, path);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function tryLoadState(self, state, key, path) {
        if (state && state.dashboard) {
            self.setCurrentDashboard(state.dashboard);
        } else {
            self.loadDashboard(key, path);
        }

        if (state && state.inEditMode && !shouldLoadInEditMode(self)) {
            setInEditMode(self, state.inEditMode);
            raiseEditModeChanged(self);
        }
    }

    function shouldLoadInEditMode(self) {
        return (dashboardIsNotReadOnly(self) && dashboardHasNoContent(self)) ||
                (dashboardIsNotReadOnly(self) && dashboardHasNoVisibleContent(self));
    }

    function dashboardIsNotReadOnly(self) {
        return !getDashboard(self).readOnly();
    }

    function dashboardHasNoContent(self) {
        return getDashboard(self).content().length === 0;
    }

    function dashboardHasNoVisibleContent(self) {
        return getDashboard(self).visibleContent().length === 0;
    }

    DashboardController.prototype.saveState = function () {
        try {
            return trySaveState(this);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function trySaveState(self) {
        if (self.inEditMode) {
            save(self);
        }

        return {
            dashboard: getDashboard(self),
            inEditMode: self.inEditMode
        };
    }

    DashboardController.prototype.setHomePage = function () {
        try {
            trySetHomePage(this);
        } catch (e) {
            errorHandler(this, e);
        }
    };

    function trySetHomePage(self) {
        var translator = Object.resolve(Translator),
            message = translator.translate('HOME_PAGE_CONFIRMATION'),
            title = translator.translate('SET_AS_HOME_PAGE');
        MessageBox.showYesNo(message, title)
            .done(setHomePage_done.bind(null, self));
    }

    function setHomePage_done(self, cancelled) {
        if (!cancelled) {
            self.dashboardService.setHomePage(getDashboard(self).path());
        }
    }

    function assertThis(self) {
        Assert.instanceOf(self, DashboardController);
    }

    return DashboardController;
});
