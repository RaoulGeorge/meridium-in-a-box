define(function(require) {
    'use strict';

    var OfflineLoginCache = require('security/offline-login/api/storage/offline-login-cache'),
        OfflineDatasources = require('security/offline-login/api/storage/offline-datasources'),
        OfflineUsers = require('security/offline-login/api/storage/offline-users'),
        OfflineLoginConfig = require('security/offline-login/api/storage/offline-login-config'),
        OfflineCredentials = require('security/offline-login/api/storage/offline-credentials'),
        OfflineUserExpiration = require('security/offline-login/api/storage/offline-user-expiration'),
        OfflineGlobalization = require('security/offline-login/api/storage/offline-globalization');

    function OfflineLoginApi() {
        //do nothing
    }

    OfflineLoginApi.prototype.setOfflineLoginConfig = function() {
        var offlineLoginConfig = new OfflineLoginConfig();

        offlineLoginConfig.setupOfflineStorageTables();
    };

    OfflineLoginApi.prototype.setOfflineCache = function() {
        var offlineLoginCache = new OfflineLoginCache();

        return offlineLoginCache.setCache();
    };

    OfflineLoginApi.prototype.setPassword = function(apiServer, datasource, userId, password) {
        var offlineCredentials = new OfflineCredentials();

        return offlineCredentials.setPassword(apiServer.toUpperCase(),
                datasource.toUpperCase(), userId, password);
    };

    OfflineLoginApi.prototype.getPassword = function(apiServer, datasource, userId) {
        var offlineCredentials = new OfflineCredentials();

        return offlineCredentials.getPassword(apiServer.toUpperCase(), datasource.toUpperCase(), userId);
    };

    OfflineLoginApi.prototype.setOfflineTranslations = function(locale) {
        var offlineGlobalization = new OfflineGlobalization();

        offlineGlobalization.setOfflineTranslations(locale);
    };

    OfflineLoginApi.prototype.setOfflineDatasources = function(datasources) {
        var offlineDatasources = new OfflineDatasources();

        return offlineDatasources.setOfflineDatasources(datasources);
    };

    OfflineLoginApi.prototype.getTranslations = function(apiServer, datasource, userId) {
        var offlineGlobalization = new OfflineGlobalization();

        return offlineGlobalization.getOfflineTranslations(apiServer.toUpperCase(),
            datasource.toUpperCase(), userId);
    };

    OfflineLoginApi.prototype.getDatasources = function(apiServer) {
        var offlineDatasources = new OfflineDatasources();

        return offlineDatasources.getDatasources(apiServer.toUpperCase());
    };

    OfflineLoginApi.prototype.getUsersByDatasource = function(apiServer, datasource) {
        var offlineUsers = new OfflineUsers();

        return offlineUsers.getUsersByDatasource(apiServer.toUpperCase(), datasource.toUpperCase());
    };

    OfflineLoginApi.prototype.getUser = function(apiServer, datasource, userId) {
        var offlineUsers = new OfflineUsers();

        return offlineUsers.getUser(apiServer.toUpperCase(), datasource.toUpperCase(), userId);
    };

    OfflineLoginApi.prototype.getLicensedModules = function(apiServer, datasource) {
        var offlineDatasources = new OfflineDatasources();

        return offlineDatasources.getLicensedModules(apiServer.toUpperCase(), datasource.toUpperCase());
    };

    OfflineLoginApi.prototype.deleteExpiredUsers = function() {
        var offlineUserExpiration = new OfflineUserExpiration(),
            offlineLoginCache = new OfflineLoginCache();

        return offlineUserExpiration.deleteExpiredUsers(offlineLoginCache.getCache());
    };

    return OfflineLoginApi;
});