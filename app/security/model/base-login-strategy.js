define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash'),
        Promise = require('bluebird');

    var Assert = require('mi-assert'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ApplicationContext = require('application/application-context'),
        SecurityService = require('security/services/security-service'),
        ResourceService = require('system/globalization/resource-service'),
        Formatter = require('system/text/formatter'),
        Translator = require('system/globalization/translator'),
        Event = require('system/lang/event'),
        MessageBox = require('system/ui/message-box'),
        Device = require('system/hardware/device'),
        CultureList = require('system/globalization/culture-list'),
        OfflineLoginContext = require('security/offline-login/context/offline-login-context'),
        DateTimeControl = require('ui/elements/date-time/date-time-control'),
        LoginManager = require('security/model/login-manager');

    function BaseLoginStrategy(vm) {
        Object.abstractClass(this, BaseLoginStrategy);
        Assert.ok(vm, 'vm');
        Assert.isDeferred(vm.loginDeferred, 'vm.loginDeferred');
        this.vm = vm;
        this.loginDeferred = vm.loginDeferred;
        this.securityService = Object.resolve(SecurityService);
        this.resourceService = Object.resolve(ResourceService);
        this.formatter = Object.resolve(Formatter);
        this.translator = Object.resolve(Translator);
        this.meridiumResourceLoaded = Object.resolve(Event);
        this.loginManager = Object.resolve(LoginManager);
    }

    BaseLoginStrategy.prototype.start = function () {
        Object.abstractMethod('start');
    };

    BaseLoginStrategy.prototype.showPrompt = function () {
        return false;
    };

    BaseLoginStrategy.prototype.login = function () {
        // do nothing
    };

    BaseLoginStrategy.prototype.dispose = function () {
        this.meridiumResourceLoaded.remove();
        this.meridiumResourceLoaded = null;
        this.translator = null;
        this.formatter = null;
        this.resourceService = null;
        this.securityService = null;
    };

    BaseLoginStrategy.prototype.onMeridiumResourceLoaded = function () {
        this.meridiumResourceLoaded.raise(this, {});
    };

    BaseLoginStrategy.prototype.newSession = function (session) {
        this.initSession(session);
        logger.info('Logged in, new session:', session);
    };

    BaseLoginStrategy.prototype.initSession = function (session) {
        var apiServer = getApiServer(this);
        session = this.loginManager.overrideApiServer(session, apiServer);
        this.loginManager.setContextSession(session);
        this.loginManager.saveSession(session);
        this.loginManager.setSessionCookie(session);
        this.loginManager.registerAjaxClientWithSession(session);
        this.loginManager.setLocalStorageUserDataSourceApiServer(session, apiServer);
    };

    function getApiServer (self) {
        return self.vm.apiServer();
    }

    BaseLoginStrategy.prototype.setAjaxClientServerFromVm = function () {
        this.vm.setAjaxClientServerFromVm();
    };

    BaseLoginStrategy.prototype.loadUser = function (session) {
        this.loginManager.saveUserCulture(session);
        var promise = this.loginManager.getUser()
            .catch(this.loginManager.onFailedUserLoad)
            .then(this.loginManager.setContextUser)
            .then(this.loginManager.registerAjaxClientWithUser)
            .then(initClientSideLogging.bind(null, this));
        if (promise) {
            promise
                .then(this.loginManager.getSites.bind(null, this))
                .catch(this.loginManager.onFailedSitesLoad)
                .then(this.loginManager.setSitesCount)
                .then(fetchGlobalizeResource.bind(null, this), fetchGlobalizeResource.bind(null, this))
                .catch(getGlobalizeResourceFailed)
                .then(setFormatterCulture.bind(null, this))
                .then(fetchDateTimeResource.bind(null, this), fetchDateTimeResource.bind(null, this))
                .catch(getDateTimeResourceFailed)
                .then(setDateTimeControlCulture)
                .then(getLicensedModules.bind(null, this), getLicensedModules.bind(null, this))
                .then(setContextLicensedModules)
                .then(getMeridiumResource.bind(null, this, session))
                .catch(notifyResourceNotFound)
                .then(this.setTranslatorLocale.bind(this))
                .then(this.onMeridiumResourceLoaded.bind(this))
                .then(checkForPasswordChange.bind(null, this, session))
                .catch(resolveLoginDeferredWithoutSession.bind(null, this))
                .finally(this.vm.hideBusy.bind(this.vm));
        }
    };

    function initClientSideLogging(self) {
        if(localStorageEnabled()) {
            return initLogManager();
        } else {
            notifyNoLocalStorage(self);
        }
    }

    function notifyNoLocalStorage(self) {
            MessageBox.showOk(self.translator.translate('LOGIN_NO_LOCAL_STORAGE_MESSAGE'),
                self.translator.translate('LOGIN_FAILED'));
        }

    function initLogManager() {
        return Promise.resolve(LogManager.initialize());
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

    function fetchGlobalizeResource(self) {
        var user = ApplicationContext.user;
        var userCulture = user.cultureId;
        return Promise.resolve(self.resourceService.getGlobalizeResource(new CultureList(userCulture)));
    }

    function setFormatterCulture(self, culture) {
        self.formatter.setCulture(culture);
    }

    function getGlobalizeResourceFailed(response) {
        logger.error('Failed to load globalize.js resource file:', response);
    }

    function fetchDateTimeResource(self) {
        var user = ApplicationContext.user;
        var cultures = new CultureList(user.cultureId);
        return Promise.resolve(self.resourceService.getDateTimeResource(cultures));
    }

    function setDateTimeControlCulture(culture) {
        DateTimeControl.setCulture(culture);
    }

    function getDateTimeResourceFailed(response) {
        logger.error('Failed to load date time picker resource file:', response);
    }

    function getLicensedModules(self) {
        return Promise.resolve(self.securityService.getLicensedModules());
    }

    function setContextLicensedModules(data) {
        ApplicationContext.licensedModules = data;
    }

    function getMeridiumResource(self, session) {
        return Promise.resolve(self.getMeridiumResource(session.licensedCultureId));
    }

    BaseLoginStrategy.prototype.getMeridiumResource = function (culture) {
        var cultures = new CultureList(culture);
        return this.resourceService.getMeridiumResource(cultures);
    };

    BaseLoginStrategy.prototype.setTranslatorLocale = function (locale) {
        this.translator.setLocale(locale);
        cacheLocale(locale);
    };

    function cacheLocale(locale) {
        var device = new Device();

        if(device.isMobileApp()) {
            OfflineLoginContext.locale = locale;
        }
    }

    function checkForPasswordChange(self, session) {
        var user = ApplicationContext.user;
        if (user.mustChangePassword) {
            startChangePassword(self);
        } else {
            resolveLoginDeferredWithSession(self, session);
        }
        return null;
    }

    function startChangePassword(self) {
        self.vm.switchToChangePasswordForm();
    }

    function resolveLoginDeferredWithSession(self, session) {
        self.loginDeferred.resolve(session);
    }

    function notifyResourceNotFound(response) {
        logger.error('Error loading locale:', response);
    }

    function resolveLoginDeferredWithoutSession(self) {
        self.loginDeferred.resolve();
        return Promise.reject();
    }

    BaseLoginStrategy.prototype.notifySessionNotFound = function (response) {
        displayFailedAjaxResponse(this, response, this.translator.translate('LOGIN_FAILED'));
        logSessionNotFound(this, response);
        clearContext();
    };

    function displayFailedAjaxResponse(self, response, title) {
        if (!response.responseText) {
            MessageBox.showOk(self.translator.translate('SERVER_NOT_FOUND'), title);
        } else {
            MessageBox.showOk(response.responseText, title);
        }
    }

    function logSessionNotFound(self, response) {
        var loginInfo = createLoginInfo(self);
        LogManager.pushContext('logSessionNotFound');
        logger.warn('Failed login:', loginInfo, response);
        LogManager.popContext();
    }

    function createLoginInfo(self) {
        return {
            datasource: self.vm.datasource() ? self.vm.datasource().id : '',
            username: self.vm.userId()
        };
    }

    function clearContext() {
        ApplicationContext.session = null;
        ApplicationContext.user = null;
    }

    BaseLoginStrategy.prototype.changePassword = function (newPassword, retypeNewPassword) {
        if (newPassword.length === 0) {
            return notifyNewPassworRequired(this);
        }

        if (newPassword !== retypeNewPassword) {
            return notifyPasswordsDoNotMatch(this);
        }

        startUpdatePassword(this, newPassword);
    };

    function startUpdatePassword(self, newPassword) {
        self.vm.showBusy();
        self.loginManager.getUser()
            .then(updatePasswordAndSaveUser.bind(null, self, newPassword))
            .catch(self.vm.hideBusy.bind(self.vm))
            .catch(notifyChangePasswordFailed.bind(null, self));
    }

    function updatePasswordAndSaveUser(self, newPassword, user) {
        user = updatePassword(user, newPassword);
        user.unhashedPassword = self.vm.password();
        saveNewPassword(self, user)
            .done(resolveLoginDeferredWithoutSession.bind(null, self))
            .fail(notifyChangePasswordFailed.bind(null, self))
            .always(self.vm.hideBusy.bind(self.vm));
    }

    function updatePassword(user, newPassword) {
        user = nullOutArrays(user);
        user.newPassword = newPassword;
        user.mustChangePassword = false;
        return user;
    }

    function nullOutArrays(user) {
        _.forEach(user, nullOutArray);
        return user;
    }

    function nullOutArray(value, key, user) {
        if (_.isArray(value)) {
            user[key] = null;
        }
    }

    function saveNewPassword(self, user) {
        return self.securityService.changePassword(user);
    }

    function notifyChangePasswordFailed(self, response) {
        displayChangePaswordFailed(self, response);
        logChangePasswordFailed(self, response);
    }

    function displayChangePaswordFailed(self, response) {
        displayFailedAjaxResponse(self, response, self.translator.translate('CHANGE_PASSWORD_FAILED'));
    }

    function logChangePasswordFailed(self, response) {
        var loginInfo = createLoginInfo(self);
        LogManager.pushContext('logChangePasswordFailed');
        logger.error('Change password failed:', loginInfo, response);
        LogManager.popContext();
    }

    function notifyNewPassworRequired(self) {
        MessageBox.showOk(self.translator.translate('NEW_PASSWORD_IS_REQUIRED'),
            self.translator.translate('CHANGE_PASSWORD'));
    }

    function notifyPasswordsDoNotMatch(self) {
        MessageBox.showOk(self.translator.translate('PASSWORDS_DONT_MATCH'),
            self.translator.translate('CHANGE_PASSWORD'));
    }

    return BaseLoginStrategy;
});
