define(function(require) {
    'use strict';

    var localforage = require('localforage'),
        ApplicationContext = require('application/application-context');

    var OFFLINE_LOGIN_TABLE = 'login';

    function OfflineGlobalization() {
        //do nothing
    }

    OfflineGlobalization.prototype.setOfflineTranslations = function(locale) {
        localforage.getItem(OFFLINE_LOGIN_TABLE).then(setTranslations.bind(null, locale));
    };

    OfflineGlobalization.prototype.getOfflineTranslations = function(apiServer, datasource, userId) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getTranslationsDone.bind(null, apiServer, datasource, userId));
    };

    function getTranslationsDone(apiServer, datasource, userId, offlineCache) {
        var licensedCultureId = getLicensedCulture(offlineCache[apiServer].users[datasource], userId),
            translations = offlineCache[apiServer].users[datasource].translations[licensedCultureId];

        return translations;
    }

    function getLicensedCulture(datasourceStorageObject, userId) {
        return datasourceStorageObject.users[userId].session.licensedCultureId;
    }

    function setTranslations(locale, offlineCache) {
        if(offlineCache) {
            var apiServer = ApplicationContext.session.apiServer.toUpperCase(),
                datasourceId = ApplicationContext.session.datasourceId.toUpperCase(),
                licensedCultureId = ApplicationContext.session.licensedCultureId;

            if (!offlineCache[apiServer].users[datasourceId].translations) {
                offlineCache[apiServer].users[datasourceId].translations = {};
            }

            offlineCache[apiServer].users[datasourceId].translations[licensedCultureId] = locale;

            localforage.setItem(OFFLINE_LOGIN_TABLE, offlineCache);
        }
    }

    return OfflineGlobalization;
});