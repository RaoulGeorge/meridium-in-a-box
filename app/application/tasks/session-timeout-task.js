define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        MessageBox = require('system/ui/message-box'),
        Translator = require('system/globalization/translator'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        ApplicationService = require('application/application-service'),
        LoginViewModel = require('security/view-models/login-view-model'),
        MILISECONDS_IN_SECOND = 1000,
        SECONDS_IN_MINUTE = 60,
        MINUTES_BEFORE_WARNING = 5,
        MINUTES_BEFORE_TIMEOUT = 1,
        OFFLINE_SESSION_TIMEOUT = 60;

    function SessionTimeoutTask() {
        Assert.implementsInterface(this, ITask, 'this');
        this.appEvents = Object.resolve(ApplicationEvents);
        this.translator = Object.resolve(Translator);
        this.applicationService = Object.resolve(ApplicationService);
        this.loggingout = false;
        this.promptShown = false;
        this.continueMessageBox = null;
    }

    SessionTimeoutTask.prototype.execute = function () {
        if (this.loggingout === true) {
            return;
        }

        var remaining = getRemainingTimeUntilTimeout();

        if (remaining <= MINUTES_BEFORE_TIMEOUT) {
            promptToLogout(this);
        }

        if (this.promptShown === true && remaining > MINUTES_BEFORE_WARNING) {
            closeMessageBox(this.continueMessageBox);
            this.promptShown = false;
        }

        if (this.promptShown === true) {
            return;
        }

        if (remaining <= MINUTES_BEFORE_WARNING) {
            promptToContinue(this);
        }
    };

    function getRemainingTimeUntilTimeout() {
        var elapsed = getElapsedTime();
        return getRemainingTime(elapsed);
    }

    function getRemainingTime(elapsedTime) {
        var timeout = isOnline() ? sessiontimeout() : OFFLINE_SESSION_TIMEOUT;
        return timeout - elapsedTime;
    }

    function getElapsedTime() {
        var referenceDate = isOnline() ? lastResponse() : lastUserActivity();
        return (new Date() - referenceDate) / MILISECONDS_IN_SECOND / SECONDS_IN_MINUTE;
    }

    function isOnline() {
        return ApplicationContext.connectionStatus.connected;
    }

    function sessiontimeout() {
        return ApplicationContext.session.sessionTimeout;
    }

    function lastResponse() {
        return ApplicationContext.connectionStatus.lastResponse;
    }

    function lastUserActivity() {
        return ApplicationContext.connectionStatus.lastUserActivity;
    }

    function promptToContinue(self) {
        var title = self.translator.translate('SESSION_ABOUT_TO_EXPIRE'),
            message = self.translator.translate('CLICK_OK_TO_CONTINUE'),
            okText = self.translator.translate('OK');
        self.promptShown = true;
        self.continueMessageBox = createMessageBox(self, message, title, okText);
        self.continueMessageBox.showMessage().done(ping.bind(null, self));
    }

    function ping(self) {
        self.promptShown = false;
        self.continueMessageBox = null;
        self.applicationService.ping();
    }

    function promptToLogout(self) {
        var title = self.translator.translate('SESSION_EXPIRED_TITLE'),
            message = self.translator.translate('SESSION_EXPIRED_MSG'),
            loginText = self.translator.translate('LOGIN'),
            loginMessageBox = null;
        ApplicationContext.sessionStatus.isActive = false;
        self.appEvents.sessionChanged.raise(self, ApplicationContext.sessionStatus);
        self.appEvents.sessionExpired.raise();
        self.loggingout = true;
        closeMessageBox(self.continueMessageBox);
        loginMessageBox = createMessageBox(self, message, title, loginText);
        loginMessageBox.showMessage().done(forceReload);
    }

    function logout () {
        var login = Object.resolve(LoginViewModel);
        login.forceLogout();
    }

    function forceReload () {
        logout();
        window.location.reload();
    }

    function createMessageBox (self, message, title, name) {
        var messageBox = null,
            buttons = null;
        buttons = [{ name: name }];
        messageBox = new MessageBox(message, title, buttons);
        return messageBox;
    }

    function closeMessageBox(messagebox) {
        if (messagebox === null) {
            return;
        }
        messagebox.dialog.closeDialog();
        messagebox = null;
    }

    return SessionTimeoutTask;
});
