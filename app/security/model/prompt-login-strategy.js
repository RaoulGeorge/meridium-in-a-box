define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ILoginStrategy = require('./i-login-strategy'),
        BaseLoginStrategy = require('./base-login-strategy'),
        SavedSession = require('./saved-session'),
        MessageBox = require('system/ui/message-box'),
        DatasourceService = require('security/services/datasource-service'),
        OfflineSecurity = require('security/offline-login/security/offline-security'),
        OfflineLoginContext = require('security/offline-login/context/offline-login-context'),
        Device = require('system/hardware/device'),
        CultureList = require('system/globalization/culture-list');

    function PromptLoginStrategy(vm) {
        base.call(this, vm);
        this.datasourceService = Object.resolve(DatasourceService);
        Assert.implementsInterface(this, ILoginStrategy, module.id);
    }
    var base = Object.inherit(BaseLoginStrategy, PromptLoginStrategy);

    PromptLoginStrategy.prototype.showPrompt = function () {
        return true;
    };

    PromptLoginStrategy.prototype.start = function () {
        var userCulture = SavedSession.getUserCulture();
        this.vm.initUserId();
        this.vm.initApiServer();
        if (this.vm.apiServer()) {
            getMeridiumResource(this, userCulture)
                .done(setTranslatorLocale.bind(null, this))
                .done(this.onMeridiumResourceLoaded.bind(this))
                .done(this.setAjaxClientServerFromVm.bind(this))
                .done(getFilteredDatasources.bind(null, this))
                .fail(notifyResourceNotFound);
        }
    };

    function getMeridiumResource(self, culture) {
        var cultures = new CultureList(culture);
        return self.resourceService.getMeridiumResource(cultures);
    }

    function setTranslatorLocale(self, locale) {
        self.translator.setLocale(locale);
    }

    function notifyResourceNotFound(response) {
        logger.error('Error loading locale:', response);
    }

    function getFilteredDatasources(self) {
        self.datasourceService.getFilteredDatasources(self.vm.apiServer())
            .done(setVmDatasources.bind(null, self))
            .fail(notifyGetDatasourcesFailed);
    }

    function setVmDatasources(self, datasources) {
        self.vm.datasources(datasources);
        var idx,
            defaultSource = SavedSession.getDatasource();

        if (defaultSource) {
            for (idx = 0; idx < datasources.length; idx++) {
                if (datasources[idx].id === defaultSource) {
                    self.vm.datasource(datasources[idx]);
                    break;
                }
            }
        }
        self.vm.areDatasourcesLoaded(true);
    }

    function notifyGetDatasourcesFailed(response) {
        LogManager.pushContext('getDatasources_fail');
        MessageBox.showOk('Unable to retrieve datasources', 'Error');
        logger.error('Error loading datasources', response);
        LogManager.popContext();
    }

    PromptLoginStrategy.prototype.login = function (datasource, userId, password, apiServer) {
        onlineLogin(this, apiServer, datasource, userId, password);
    };

    function onlineLogin(self, apiServer, datasource, userId, password) {
        self.vm.showBusy();
        self.securityService.login(datasource, userId, password)
            .done(cacheCredentials.bind(null, password))
            .done(self.newSession.bind(self))
            .done(self.loadUser.bind(self))
            .fail(self.vm.hideBusy.bind(self.vm))
            .fail(self.notifySessionNotFound.bind(self));
    }

    function cacheCredentials(password) {
        var device = new Device();

        if(device.isMobileApp()) {
            OfflineLoginContext.user.password = password;
        }
    }

    PromptLoginStrategy.prototype.loginOffline = function (datasource, userId, password, apiServer) {
        var device = new Device();

        if (device.isMobileApp()) {
            var offlineSecurity = new OfflineSecurity(apiServer, datasource, userId, password, this.loginDeferred);

            offlineSecurity.login();
        }
    };

    return PromptLoginStrategy;
});