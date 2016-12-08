define(function (require, exports, module) {
    'use strict';

    var ApplicationContext = require('application/application-context'),
        SavedSession = require('security/model/saved-session'),
        AjaxClient = require('system/http/ajax-client'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        SecurityService = require('security/services/security-service'),
        WindowEventHandler = require('application/window-event-handler'),
        ApplicationErrorHandler = require('application/application-error-handler'),
        MessageBox = require('system/ui/message-box'),
        Translator = require('system/globalization/translator'),
        ApplicationEvents = require('application/application-events'),
        _ = require('lodash'),
        Promise = require('bluebird');

    function LoginManager () {
        this.securityService = Object.resolve(SecurityService);
        this.windowEventHandler = Object.resolve(WindowEventHandler);
        this.applicationErrorHandler = Object.resolve(ApplicationErrorHandler);
    }

    LoginManager.prototype.overrideApiServer = function (session, apiServer) {
        if (apiServer) {
            session.apiServer = apiServer;
        }
        return session;
    };

    LoginManager.prototype.setContextSession = function (session) {
        ApplicationContext.session = session;
        ApplicationContext.sessionStatus.isActive = true;
        var appEvents = Object.resolve(ApplicationEvents);
        appEvents.sessionChanged.raise(this, ApplicationContext.sessionStatus);
    };

    LoginManager.prototype.saveSession = function (session) {
        SavedSession.saveSession(session);
    };

    LoginManager.prototype.setSessionCookie = function (session) {
        document.cookie = 'MeridiumToken=' + session.id;
    };

    LoginManager.prototype.registerAjaxClientWithSession = function (session) {
        AjaxClient.setServer(session.apiServer);
        AjaxClient.addHeader('MeridiumToken', session.id);
    };

    LoginManager.prototype.setLocalStorageUserDataSourceApiServer = function (session, apiServer) {
        SavedSession.saveUserId(session.userId);
        SavedSession.saveDatasource(session.datasourceId);
        if (apiServer) {
            SavedSession.saveApiServer(apiServer);
        }
    };

    LoginManager.prototype.getUser = function () {
        return Promise.resolve(this.securityService.getSessionUser());
    };

    LoginManager.prototype.getSites = function (self) {
        return Promise.resolve(self.securityService.getSites());
    };

    LoginManager.prototype.onFailedUserLoad = function () {
        logSessionEnd();
        SavedSession.deleteSession();
        clearAjaxHeaders();
        asyncReloadPage();
    };

    function logSessionEnd() {
        var session = JSON.parse(SavedSession.getSession());
        logger.info('Logged out session', session);
    }

    function clearAjaxHeaders() {
        AjaxClient.clearHeaders();
    }

    function asyncReloadPage() {
        _.delay(reloadPage, 0);
    }

    function reloadPage() {
        window.location.reload();
    }

    LoginManager.prototype.setContextUser = function (user) {
        ApplicationContext.user = user;
        return user;
    };

    LoginManager.prototype.registerAjaxClientWithUser = function () {
        var session = ApplicationContext.session,
            user = ApplicationContext.user;
        AjaxClient.addHeader('MeridiumToken', session.id + ';' + user.timezoneId);
    };

    LoginManager.prototype.onFailedSitesLoad = function () {
        var translator = Object.resolve(Translator),
            message = translator.translate('INTERNAL_ERROR_FAILED_TO_LOAD_SITES'),
            title = translator.translate('FAILED_TO_LOAD_SITES');
        MessageBox.showOk(message, title);
        return Promise.resolve();
    };

    LoginManager.prototype.setSitesCount = function (sites) {
        ApplicationContext.dbSiteCount = sites.length;
        return sites.length;
    };

    LoginManager.prototype.saveUserCulture = function (session) {
        SavedSession.saveUserCulture(session);
    };

    LoginManager.prototype.login = function (datasource, userid, password) {
        return Promise.resolve(this.securityService.login(datasource, userid, password));
    };

    LoginManager.prototype.checkIfPasswordHasToChange = function (user) {
        var translator = Object.resolve(Translator),
            message = translator.translate('PASSWORD_HAS_TO_CHANGE'),
            title = translator.translate('NEW_PASSWORD_IS_REQUIRED');
        if (user.mustChangePassword === true) {
            MessageBox.showOk(message, title).done(forceReload.bind(null, this));
            return Promise.reject();
        }
        return Promise.resolve(user);
    };

    function forceReload (self) {
        self.windowEventHandler.unload();
        self.applicationErrorHandler.unload();
        window.location.reload();
    }

    return LoginManager;
});
