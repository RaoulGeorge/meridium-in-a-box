define(function(require) {
    'use strict';

    var localforage = require('localforage');

    var OFFLINE_LOGIN_TABLE = 'login';

    function OfflineUsers() {
        //do nothing
    }

    OfflineUsers.prototype.getUsersByDatasource = function(apiServer, datasource) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getUsersByDatasourceDone.bind(null, apiServer, datasource));
    };

    function getUsersByDatasourceDone(apiServer, datasource, offlineCache) {
        return offlineCache[apiServer].users[datasource].users;
    }


    OfflineUsers.prototype.getUser = function(apiServer, datasource, userId) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getUserDone.bind(null, apiServer, datasource, userId));
    };

    function getUserDone(apiServer, datasource, userId, offlineCache) {
        return offlineCache[apiServer].users[datasource].users[userId];
    }

    return OfflineUsers;
});