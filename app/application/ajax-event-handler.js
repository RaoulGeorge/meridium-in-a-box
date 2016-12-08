define(function (require) {
    'use strict';

    var $ = require('jquery'),
        MessageBox = require('system/ui/message-box'),
        toastr = require('toastr'),
        Translator = require('system/globalization/translator'),
        ApplicationContext = require('application/application-context'),
        ApplicationEvents = require('./application-events'),
        WindowEventHandler = require('./window-event-handler'),
        ApplicationErrorHandler = require('./application-error-handler'),
        ApplicationService = require('application/application-service'),
        LoginManager = require('security/model/login-manager'),
        Device = require('system/hardware/device'),
        OfflineLoginContext = require('security/offline-login/context/offline-login-context');

    var MILISECONDS_IN_SECOND = 1000,
        SECONDS_IN_MINUTE = 60,
        MINUTES_IN_HOUR = 60,
        HOURS_IN_DAY = 24,
        UNAUTHORIZEDPING_URL = 'meridium/api/core/utility/unauthorizedping';

    function AjaxEventHandler() {
        this.appEvents = Object.resolve(ApplicationEvents);
        this.windowEventHandler = Object.resolve(WindowEventHandler);
        this.applicationErrorHandler = Object.resolve(ApplicationErrorHandler);
        this.applicationService = Object.resolve(ApplicationService);
        this.intervalId = null;
        this.loginManager = Object.resolve(LoginManager);
        this.device = Object.resolve(Device);
    }
    AjaxEventHandler.singleton = true;

    AjaxEventHandler.prototype.load = function () {
        $(document).ajaxError(checkSession.bind(null, this));
        $(document).ajaxSuccess(backOnline.bind(null, this));
        $(document).ajaxComplete(updateLastResponse);
    };

    function checkSession(self, e, jqXhr) {
        if (ApplicationContext.sessionStatus.isActive === false) {
            return;
        }
        if (isSessionTimedOut(jqXhr)) {
            if (isOfflineUser(self)) {
                reconnect(self);
                checkIfSessionIsValid(self)
                    .fail(decideLoginStrategy.bind(null, self));
            } else {
                notifySessionTimeout(self);
            }
        } else if (isDisconnected(jqXhr)) {
            startDisconnectedState(self);
        }
    }

    function isSessionTimedOut(jqXhr) {
        return jqXhr.status === 401 && !jqXhr.preventSessionTimeoutDefault;
    }

    function isOfflineUser(self) {
        return self.device.isMobileApp();
    }

    function notifySessionTimeout(self) {
        var translator = Object.resolve(Translator),
            title = translator.translate('SESSION_EXPIRED_TITLE'),
            message = translator.translate('SESSION_EXPIRED_MSG'),
            messageButton = [{ name: translator.translate('LOGIN') }];

        if (ApplicationContext.sessionStatus.isActive === false) {
            return;
        }
        ApplicationContext.sessionStatus.isActive = false;
        self.appEvents.sessionChanged.raise(self, ApplicationContext.sessionStatus);
        self.appEvents.sessionExpired.raise();
        MessageBox.show(message, title, messageButton).done(forceReload.bind(null, self));
    }

    function forceReload (self) {
        self.windowEventHandler.unload();
        self.applicationErrorHandler.unload();
        window.location.reload();
    }

    function isDisconnected(jqXhr) {
        if (jqXhr.status === 500) {
            return false;
        }
        if (jqXhr.status === 0 && jqXhr.statusText === 'abort') {
            return false;
        }
        return jqXhr.getResponseHeader('X-Meridium-Version') === null;
    }

    function startDisconnectedState(self) {
        if (ApplicationContext.connectionStatus.connected) {
            changeConnectionStatus(self);
            watchForReconnect(self);
            notifyConnectionLost(self);
        }
    }

    function changeConnectionStatus(self) {
        ApplicationContext.connectionStatus.connected = !ApplicationContext.connectionStatus.connected;
        ApplicationContext.connectionStatus.lastStatusChange = new Date();
        self.appEvents.connectionChanged.raise(self, ApplicationContext.connectionStatus);
    }

    function watchForReconnect(self) {
        self.intervalId = setInterval(checkConnection.bind(null, self), 60000);
    }

    function notifyConnectionLost() {
        var translator = Object.resolve(Translator);
        toastr.warning(translator.translate('AC_DISCONNECTED'));
    }

    function checkConnection (self) {
        self.applicationService.ping().done(backOnline.bind(null, self));
    }

    function backOnline(self) {
        if (self.intervalId) {
            clearInterval(self.intervalId);
            self.intervalId = null;
        }
        if (!ApplicationContext.connectionStatus.connected) {
            reconnect (self);
            checkIfSessionIsValid(self)
                .fail(decideLoginStrategy.bind(null, self));
        }
    }

    function reconnect (self) {
        var translator = Object.resolve(Translator);
        changeConnectionStatus(self);
        toastr.success(translator.translate('AC_CONNECTED'));
    }

    function decideLoginStrategy(self) {
        ApplicationContext.sessionStatus.isActive = false;
        self.appEvents.sessionChanged.raise(self, ApplicationContext.sessionStatus);
        if (deviceOfflineMoreThanOneDay()) {
            enableManualLogin(self);
        } else {
            autoLogin(self);
        }
    }

    function updateLastResponse(event, xhr, settings) {
        if (!contains(settings.url, UNAUTHORIZEDPING_URL)) {
            ApplicationContext.connectionStatus.lastResponse = new Date();
        }
    }

    function contains(string, partialString) {
        return string.indexOf(partialString) > -1;
    }

    function checkIfSessionIsValid(self) {
        var sessionid = ApplicationContext.session.id,
            dfd = $.Deferred();
        self.applicationService.checksession(sessionid)
            .done(isSessionValid.bind(null, dfd));
        return dfd.promise();
    }

    function isSessionValid(dfd, sessionIsValid) {
        if (sessionIsValid === true) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    }

    function deviceOfflineMoreThanOneDay() {
        var offlineHours = (new Date() - lastResponse()) / MILISECONDS_IN_SECOND / SECONDS_IN_MINUTE / MINUTES_IN_HOUR;
        return offlineHours > HOURS_IN_DAY;
    }

    function lastResponse() {
        return ApplicationContext.connectionStatus.lastResponse;
    }

    function autoLogin (self) {
        signin(self)
            .then(initSession.bind(null, self))
            .then(loadUser.bind(null, self))
            .done(backOnline.bind(null, self));
    }

    function initSession (self, session) {
        var apiServer = getApiServer(self);
        session = self.loginManager.overrideApiServer(session, apiServer);
        self.loginManager.setContextSession(session);
        self.loginManager.saveSession(session);
        self.loginManager.setSessionCookie(session);
        self.loginManager.registerAjaxClientWithSession(session);
        self.loginManager.setLocalStorageUserDataSourceApiServer(session, apiServer);
        return session;
    }

    function getApiServer () {
        return ApplicationContext.session.apiServer;
    }

    function loadUser (self, session) {
        self.loginManager.saveUserCulture(session);
        self.loginManager.getUser()
            .catch(self.loginManager.onFailedUserLoad)
            .then(self.loginManager.checkIfPasswordHasToChange.bind(self.loginManager))
            .then(self.loginManager.setContextUser)
            .then(self.loginManager.registerAjaxClientWithUser);
    }

    function signin(self) {
        var datasource = ApplicationContext.session.datasourceId,
            userid = ApplicationContext.session.userId,
            password = OfflineLoginContext.user.password;
        return self.loginManager.login(datasource, userid, password);
    }

    function enableManualLogin(self) {
        self.appEvents.offlineSessionExpired.raise();
    }

    return AjaxEventHandler;
});
