define(function(require) {
    'use strict';

    var _ = require('lodash'),
        localforage = require('localforage'),
        ApplicationContext = require('application/application-context');

    var OFFLINE_LOGIN_TABLE = 'login';

    function OfflineDatasources() {
        //do nothing
    }

    OfflineDatasources.prototype.setOfflineDatasources = function(datasources) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getCacheDone.bind(null, datasources));
    };

    OfflineDatasources.prototype.getDatasources = function(apiServer) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getDatasourcesDone.bind(null, apiServer));
    };

    function getDatasourcesDone(apiServer, offlineCache) {
        if(offlineCache && offlineCache[apiServer]) {
            return _.values(offlineCache[apiServer].users);
        }
    }

    OfflineDatasources.prototype.getLicensedModules = function(apiServer, datasource) {
        return localforage.getItem(OFFLINE_LOGIN_TABLE).then(getLicensedModulesDone.bind(null, apiServer, datasource));
    };

    function getLicensedModulesDone(apiServer, datasource, offlineCache) {
        return offlineCache[apiServer].users[datasource].licensedModules;
    }

    function getDatasourceIds(datasources) {
        var datasourceIds = [];

        for (var i = 0; i < datasources.length; i++) {
            datasourceIds.push(datasources[i].id.toUpperCase());
        }

        return datasourceIds;
    }

    function getCacheDone(datasources, offlineCache) {
        if(datasources) {
            var apiServer = ApplicationContext.session.apiServer.toUpperCase(),
                datasourceIds = getDatasourceIds(datasources);

            for (var i = 0; i < datasourceIds.length; i++) {
                if (!offlineCache[apiServer].users[datasourceIds[i]]) {
                    offlineCache[apiServer].users[datasourceIds[i]] = {
                        'datasourceInfo': datasources[i]
                    };
                } else {
                    offlineCache[apiServer].users[datasourceIds[i]].datasourceInfo = datasources[i];
                }
            }

            localforage.setItem(OFFLINE_LOGIN_TABLE, offlineCache);
        }
    }

    return OfflineDatasources;
});