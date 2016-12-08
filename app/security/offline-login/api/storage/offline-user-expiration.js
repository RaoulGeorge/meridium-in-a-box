define(function(require) {
    'use strict';

    var localforage = require('localforage');

    var OFFLINE_LOGIN_TABLE = 'login',
        THIRTY_DAYS_AGO = (30 * 24 * 60 * 60 * 1000);

    function OfflineUserExpiration() {
        this.cache = null;
        this.cacheObjectKeys = null;
        this.currentApiServer = null;
        this.currentDatasource = null;
        this.currentDatasourceUserKey = null;
    }

    OfflineUserExpiration.prototype.deleteExpiredUsers = function(getCache) {
        return getCache.then(getCacheDone.bind(null, this));
    };

    function getCacheDone(self, cache) {
        self.cache = cache;
        self.cacheObjectKeys = Object.keys(self.cache);

        for (var i = 0; i < self.cacheObjectKeys.length; i++) {
            self.currentApiServer = self.cache[self.cacheObjectKeys[i]];
            self.currentDatasource = self.currentApiServer.users;

            processDatasources(self);
        }

        return setCache(self);
    }

    function processDatasources(self) {
        for (var ii = 0; ii < Object.keys(self.currentDatasource).length; ii++) {
            self.currentDatasourceUserKey = Object.keys(self.currentDatasource)[ii];

            var datasourceUsers = self.currentDatasource[self.currentDatasourceUserKey].users;

            if (datasourceUsers) {
                processUsers(self);
            }
        }
    }

    function processUsers(self) {
        var datasourceUsers = Object.keys(self.currentDatasource[self.currentDatasourceUserKey].users),
            cacheHasDatasourceUsers = self.currentDatasource[self.currentDatasourceUserKey].users;

        for (var iii = 0; iii < datasourceUsers.length; iii++) {
            var currentUser = Object.keys(self.currentApiServer.users[self.currentDatasourceUserKey].users)[iii];

            if (cacheHasDatasourceUsers) {
                checkForExpiredUser(self, currentUser);
            }
        }
    }

    function checkForExpiredUser(self, currentUser) {
        var currentUserObject = self.currentApiServer.users[self.currentDatasourceUserKey].users[currentUser],
            userLastUpdated;

        if (currentUserObject) {
            userLastUpdated = self.currentApiServer.users[self.currentDatasourceUserKey].users[currentUser].lastUpdated;

            checkTimeStamp(self, userLastUpdated, currentUser);
        }
    }

    function checkTimeStamp(self, userLastUpdated, currentUser) {
        if (userLastUpdated < getThirtyDaysAgoDate()) {
            deleteOfflineUser(self, currentUser);
        }
    }

    function deleteOfflineUser(self, currentUser) {
        self.currentApiServer.users[self.currentDatasourceUserKey].users[currentUser] = null;
    }

    function setCache(self) {
        return localforage.setItem(OFFLINE_LOGIN_TABLE, self.cache);
    }

    function getThirtyDaysAgoDate() {
        return new Date().getTime() - THIRTY_DAYS_AGO;
    }

    return OfflineUserExpiration;
});