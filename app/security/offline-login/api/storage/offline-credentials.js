define(function(require) {
    'use strict';

    var localforage = require('localforage'),
        Promise = require('bluebird'),
        PasswordEncryption = require('security/offline-login/security/password-encryption');

    var OFFLINE_LOGIN_TABLE = 'login';

    function OfflineCredentials() {
        //do nothing
    }

    OfflineCredentials.prototype.setPassword = function(apiServer, datasource, userId, password) {
        var passwordEncryption = new PasswordEncryption(),
            encryptedPassword = passwordEncryption.getEncryptedPassword(userId, password);

        if (password) {
            return localforage.getItem(OFFLINE_LOGIN_TABLE).then(setCache.bind(null, apiServer, datasource, userId, encryptedPassword));
        } else {
            return Promise.resolve();
        }
    };

    function setCache(apiServer, datasource, userId, password, offlineCache) {
        if(offlineCache) {
            offlineCache[apiServer].users[datasource].users[userId].password = password;

            localforage.setItem(OFFLINE_LOGIN_TABLE, offlineCache);
        }
    }

    OfflineCredentials.prototype.getPassword = function(apiServer, datasource, userId) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getCredentialsDone.bind(null, apiServer, datasource, userId));
    };

    function getCredentialsDone(apiServer, datasource, userId, offlineCache) {
        if(offlineCache && offlineCache[apiServer].users[datasource].users[userId]) {
            return offlineCache[apiServer].users[datasource].users[userId].password;
        } else {
            return Promise.reject();
        }
    }

    return OfflineCredentials;
});