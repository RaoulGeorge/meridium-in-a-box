define(function(require) {
    'use strict';

    var OfflineLoginApi = require('security/offline-login/api/offline-login-api'),
        PasswordEncryption = require('security/offline-login/security/password-encryption'),
        MessageBox = require('system/ui/message-box'),
        OfflineSessionLoader = require('security/offline-login/security/loaders/offline-session-loader'),
        OfflineUserLoader = require('security/offline-login/security/loaders/offline-user-loader'),
        OfflineLoginContext = require('security/offline-login/context/offline-login-context'),
        _private = require('system/lang/private');

    function OfflineSecurity(apiServer, datasource, userId, password, loginDeferredObject) {
        _private(this).apiServer = apiServer;
        _private(this).datasource = datasource;
        _private(this).userId = userId;
        _private(this).password = password;
        _private(this).loginDeferredObject = loginDeferredObject;
    }

    OfflineSecurity.prototype.login = function() {
        var offlineLoginApi = new OfflineLoginApi();

        offlineLoginApi.deleteExpiredUsers()
            .then(offlineLoginApi.getPassword.bind(null, _private(this).apiServer, _private(this).datasource, _private(this).userId))
            .then(verifyCredentials.bind(null, this))
            .catch(informUserLoginFailed);
    };

    function verifyCredentials(self, actualPassword) {
        var passwordEncryption = new PasswordEncryption(),
            encryptedEnteredPassword = passwordEncryption.getEncryptedPassword(_private(self).userId, _private(self).password);

        if (actualPassword === encryptedEnteredPassword) {
            loginOffline(self);
        } else {
            informUserLoginFailed();
        }
    }

    function loginOffline(self) {
        var offlineLoginApi = new OfflineLoginApi();

        cacheCredentials(_private(self).password);
        offlineLoginApi.getUser(_private(self).apiServer, _private(self).datasource, _private(self).userId)
            .then(setGlobalObjects.bind(null, self))
            .then(_private(self).loginDeferredObject.resolve());
    }

    function cacheCredentials(password) {
        OfflineLoginContext.user.password = password;
    }

    function informUserLoginFailed(e) {
        var failMessage = 'Credentials cannot be authenticated because the Datasource ID, User ID, or Password are invalid. ' +
            'You must login while online at least once to enable offline login functionality';

        MessageBox.showOk(failMessage, 'Offline Login Failed');
    }

    function setGlobalObjects(self, user) {
        initSession(user.session);
        loadUser(self, user);
    }

    function initSession(session) {
        var offlineSessionLoader = new OfflineSessionLoader();

        offlineSessionLoader.loadSession(session);
    }

    function loadUser(self, user) {
        var offlineUserLoader = new OfflineUserLoader();

        offlineUserLoader.loadUser(user, _private(self).apiServer, _private(self).datasource);
    }

    return OfflineSecurity;
});