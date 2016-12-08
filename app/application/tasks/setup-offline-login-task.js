define(function(require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationService = require('application/application-service'),
        ApplicationContext = require('application/application-context'),
        OfflineLoginContext = require('security/offline-login/context/offline-login-context'),
        Device = require('system/hardware/device'),
        OfflineLoginApi = require('security/offline-login/api/offline-login-api');

    function SetupOfflineLoginTask() {
        Assert.implementsInterface(this, ITask, 'this');
    }

    SetupOfflineLoginTask.prototype.execute = function() {
        var device = new Device(),
            applicationService = Object.resolve(ApplicationService);

        if (device.isMobileApp()) {
            applicationService.ping().done(setupOfflineStorage.bind(null, this));
            clearConnectionCheckerInterval();
        }
    };

    function setupOfflineStorage(self) {
        var offlineLoginApi = new OfflineLoginApi(),
            apiServer = ApplicationContext.session.apiServer,
            datasource = ApplicationContext.session.datasourceId,
            userId = ApplicationContext.session.userId,
            password = OfflineLoginContext.user.password,
            datasources = OfflineLoginContext.datasources,
            locale = OfflineLoginContext.locale;

        offlineLoginApi.setOfflineCache()
            .then(offlineLoginApi.setPassword.bind(null, apiServer, datasource, userId, password))
            .then(offlineLoginApi.setOfflineDatasources.bind(null, datasources))
            .then(offlineLoginApi.setOfflineTranslations.bind(null, locale))
            .then(offlineLoginApi.deleteExpiredUsers);
    }

    function clearConnectionCheckerInterval() {
        clearInterval(ApplicationContext.connectionStatus.connectionCheckerInterval);
    }

    return SetupOfflineLoginTask;
});