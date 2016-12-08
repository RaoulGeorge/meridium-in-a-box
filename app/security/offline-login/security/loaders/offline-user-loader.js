define(function(require) {
    'use strict';

    var AjaxClient = require('system/http/ajax-client'),
        OfflineLoginApi = require('security/offline-login/api/offline-login-api'),
        KeyIdList = require('system/collections/key-id-list'),
        Formatter = require('system/text/formatter'),
        LogManager = require('system/diagnostics/log-manager'),
        MessageBox = require('system/ui/message-box'),
        DateTimeControl = require('ui/elements/date-time/date-time-control'),
        Event = require('system/lang/event'),
        Translator = require('system/globalization/translator'),
        LoginManager = require('security/model/login-manager'),
        ApplicationContext = require('application/application-context');

    function OfflineUserLoader() {
        this.meridiumResourceLoaded = Object.resolve(Event);
    }

    OfflineUserLoader.prototype.loadUser = function(user, apiServer, datasource) {
        var loginManager = Object.resolve(LoginManager);

        loginManager.setContextUser(user.user);
        loginManager.registerAjaxClientWithUser();
        initClientSideLogging(this);
        setCultureInformation(this, apiServer, datasource, user);
        getLicensedModules(apiServer, datasource);
    };

    function setCultureInformation(self, apiServer, datasource, user) {
        var culture = user.session.licensedCultureId,
            userId = user.user.id;

        setFormatterCulture(culture);
        setDateTimeControlCulture(culture);
        getTranslations(self, apiServer, datasource, userId);
    }

    function getLicensedModules(apiServer, datasource) {
        var offlineLoginApi = new OfflineLoginApi();

        offlineLoginApi.getLicensedModules(apiServer, datasource).then(setContextLicensedModules);
    }

    function setContextLicensedModules(data) {
        ApplicationContext.licensedModules = new KeyIdList(data.items);
    }

    function setFormatterCulture(culture) {
        var formatter = Object.resolve(Formatter);

        formatter.setCulture(culture);
    }

    function getTranslations(self, apiServer, datasource, userId) {
        var offlineLoginApi = new OfflineLoginApi();

        offlineLoginApi.getTranslations(apiServer, datasource, userId).then(setTranslatorLocale.bind(null, self));
    }

    function setTranslatorLocale(self, locale) {
        var translator = Object.resolve(Translator);

        translator.setLocale(locale);
        fireMeridiumResourceLoadedEvent(self);
    }

    function fireMeridiumResourceLoadedEvent(self) {
        self.meridiumResourceLoaded.raise(self, {});
    }

    function setDateTimeControlCulture(culture) {
        DateTimeControl.setCulture(culture);
    }

    function initClientSideLogging(self) {
        if (localStorageEnabled()) {
            LogManager.initialize();
        } else {
            notifyNoLocalStorage(self);
        }
    }

    function notifyNoLocalStorage(self) {
        MessageBox.showOk(self.translator.translate('LOGIN_NO_LOCAL_STORAGE_MESSAGE'),
            self.translator.translate('LOGIN_FAILED'));
    }

    function localStorageEnabled() {
        try {
            localStorage.setItem("__test", "data");
        } catch (e) {
            if (/QUOTA_?EXCEEDED/i.test(e.name)) {
                return false;
            }
        }
        return true;
    }

    return OfflineUserLoader;
});