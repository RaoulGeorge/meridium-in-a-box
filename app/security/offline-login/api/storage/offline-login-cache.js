define(function(require) {
    'use strict';

    var $ = require('jquery'),
        localforage = require('localforage'),
        ApplicationContext = require('application/application-context');

    var OFFLINE_LOGIN_TABLE = 'login';

    function OfflineLoginCache() {
        //do nothing
    }

    OfflineLoginCache.prototype.setCache = function() {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(setLoginCache);
    };

    OfflineLoginCache.prototype.getCache = function() {
        return localforage.getItem(OFFLINE_LOGIN_TABLE);
    };

    function getUpdatedCache() {
        var appServerContainer = {},
            userContainer = {
                'users': {},
                'licensedModules': ApplicationContext.licensedModules
            },
            userInformation = {
                'user': ApplicationContext.user,
                'session': ApplicationContext.session,
                'lastUpdated': Date.now()
            },
            datasourcesContainer = {};

        userContainer.users[ApplicationContext.user.id] = userInformation;

        datasourcesContainer[ApplicationContext.session.datasourceId.toUpperCase()] = userContainer;

        appServerContainer[ApplicationContext.session.apiServer.toUpperCase()] = {
            'users': datasourcesContainer
        };

        return appServerContainer;
    }

    function setLoginCache(existingLoginCache) {
        localforage.setItem(OFFLINE_LOGIN_TABLE, getExtendedLoginObject(existingLoginCache));
    }

    function getExtendedLoginObject(existingLoginCache) {
        return mergeObjects(getUpdatedCache(), existingLoginCache);
    }

    function mergeObjects(object, otherObject) {
        return $.extend(true, {}, otherObject, object);
    }

    return OfflineLoginCache;
});
