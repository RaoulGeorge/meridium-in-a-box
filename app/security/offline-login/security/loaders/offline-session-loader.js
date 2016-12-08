define(function(require) {
    'use strict';

    var AjaxClient = require('system/http/ajax-client'),
        SavedSession = require('security/model/saved-session'),
        LoginManager = require('security/model/login-manager'),
        ApplicationContext = require('application/application-context');

    function OfflineSessionLoader() {
        //do nothing
    }

    OfflineSessionLoader.prototype.loadSession = function(session) {
        var loginManager = Object.resolve(LoginManager);

        loginManager.setContextSession(session);
        loginManager.saveSession(session);
        loginManager.setSessionCookie(session);
        loginManager.registerAjaxClientWithSession(session);
        loginManager.setLocalStorageUserDataSourceApiServer(session);
    };

    return OfflineSessionLoader;
});