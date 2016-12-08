define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        LoginStrategyFactory = require('../model/login-strategy-factory'),
        DatasourceService = require('security/services/datasource-service'),
        SecurityService = require('security/services/security-service'),
        OfflineLoginApi = require('security/offline-login/api/offline-login-api'),
        AjaxClient = require('system/http/ajax-client'),
        ApplicationContext = require('application/application-context'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        SavedSession = require('../model/saved-session'),
        LogManager = require('system/diagnostics/log-manager'),
        CreateDatasourceDialog = require('./create-datasource-dialog'),
        OfflineLoginContext = require('security/offline-login/context/offline-login-context'),
        ConnectionChecker = require('security/offline-login/security/connection-checker'),
        MessageBox = require('system/ui/message-box'),
        Device = require('system/hardware/device'),
        ScreenSize = require('ui/screen-size'),
        logger = LogManager.getLogger(module.id),
        BusyIndicator = require('system/ui/busy-indicator'),
        view = require('text!../views/login.html');

    var REDIRECT_DELAY = 250,
        ANDROID_KEYBOARD_FIX_MIN_HEIGHT = 800,
        LOGOUT_ACTION = 'logout',
        CONNECTION_CHECK_INTERVAL = 5000;

    function LoginViewModel() {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.loginStrategyFactory = Object.resolve(LoginStrategyFactory);
        this.loginStrategy = null;
        this.createDatasourceDialog = Object.resolve(CreateDatasourceDialog);
        this.datasourceService = Object.resolve(DatasourceService);
        this.securityService = Object.resolve(SecurityService);
        this.translator = Object.resolve(Translator);
        this.device = Object.resolve(Device);
        this.screenSize = Object.resolve(ScreenSize);
        this.busyIndicator = Object.resolve(BusyIndicator);
        this.loginDeferred = null;
        this.showLogon = this.kom.observable(true);
        this.showLogonForm = this.kom.observable(true);
        this.showChangePasswordForm = this.kom.observable(false);
        this.userId = this.kom.observable('');
        this.password = this.kom.observable('');
        this.apiServer = this.kom.observable((window.cordova ? '' : location.host));
        this.datasources = this.kom.observableArray();
        this.datasource = this.kom.observable();
        this.areDatasourcesLoaded = this.kom.observable(false);
        this.busy = this.kom.observable(false);
        this.newPassword = this.kom.observable('');
        this.retypeNewPassword = this.kom.observable('');
        this.userNameCaption = this.kom.observable('Username');
        this.passwordCaption = this.kom.observable('Password');
        this.apiServerCaption = this.kom.observable('API Server');
        this.datasourceCaption = this.kom.observable('Datasource');
        this.addDatasourceCaption = this.kom.observable('Add Datasource');
        this.loginCaption = this.kom.observable('Login');
        this.changePasswordHeader = this.kom.observable('Password Change Required');
        this.newPasswordCaption = this.kom.observable('New Password');
        this.retypeNewPasswordCaption = this.kom.observable('Re-Type Password');
        this.changePasswordCaption = this.kom.observable('Change Password');
        this.allowServerInput = this.apiServer() === '' || window.MSApp;
        this.showLoginInput = this.kom.computed(showLoginInput_read.bind(null, this));
        this.canAddDatasource = this.kom.computed(canAddDatasource_read.bind(null, this));
        this.browserUnsupportedCaption = this.kom.observable('');
        this.versionNum = '1.0';
        this.versionCaption = this.kom.observable('Version ');
		this.detached = false;
    }

    var base = Object.inherit(KnockoutViewModel, LoginViewModel);

    function showLoginInput_read(self) {
        return !!self.userId();
    }

    function canAddDatasource_read(self) {
        return self.apiServer() === 'localhost' &&
            self.areDatasourcesLoaded() &&
            self.datasources &&
            self.datasources() &&
            !self.datasources().length;
    }

    LoginViewModel.prototype.activate = function securityViewModel_activate(action) {
        try {
            return tryActivate(this, action);
        } catch (e) {
            console.error(e.stack);
        }
    };

    function tryActivate(self, action) {
        setBrowserSnifferCaptions(self, 'This Operating System is not Supported', 'This Browser is Not Supported');

        self.loginDeferred = new $.Deferred();
        if (isLogoutAction(action)) {
            performLogout(self);
        } else {
            startLogin(self);
        }
        return self.loginDeferred.promise();
    }

    function setBrowserSnifferCaptions(self, mobileCaption, browserCaption){
        if(self.device.isMobileApp()) {
            self.browserUnsupportedCaption(mobileCaption);
        } else {
            self.browserUnsupportedCaption(browserCaption);
        }
    }

    function isLogoutAction(action) {
        return action && action === LOGOUT_ACTION;
    }

    function performLogout(self) {
        self.logout();
        self.loginDeferred.resolve();
    }

    LoginViewModel.prototype.forceLogout = function() {
        $(window).off('beforeunload');
        callLogoutService(this);
    };

    LoginViewModel.prototype.logout = function () {
        var promise = onSignOut();
        if (wasPromiseAddedByListener(promise)) {
            promise.done(callLogoutService.bind(null, this));
        } else {
            callLogoutService(this);
        }
    };

    function onSignOut() {
        var appEvents = Object.resolve(ApplicationEvents),
            e = { promise: null };
        appEvents.signout.raise(e);
        return e.promise;
    }

    function wasPromiseAddedByListener(promise) {
        return !!promise;
    }

    function callLogoutService(self) {
        self.securityService.logout()
            .always(resetApplication.bind(null));
    }

    function resetApplication() {
        logSessionLogout();
        SavedSession.deleteSession();
        clearAjaxHeaders();
        asyncRefresh();
    }

    function logSessionLogout() {
        console.log('Logged out session', SavedSession.getSession());
        logger.info('Logged out session', SavedSession.getSession());
    }

    function clearAjaxHeaders() {
        logger.debug('SavedSession.getUserId() clearAjaxHeaders() :: ' + SavedSession.getUserId());
        AjaxClient.clearHeaders();
    }

    function asyncRefresh() {
        _.delay(refresh, REDIRECT_DELAY);
    }

    function refresh() {
        logger.debug('refresh() before redirect :: ' +SavedSession.getUserId() +
                    ' / window.location :: ' + window.location.toString() + ' / window.location.pathname :: ' + window.location.pathname.toString());
        window.location = window.location.href.split('#')[0];
    }

    function startLogin(self) {
        self.loginStrategy = self.loginStrategyFactory.createStrategy(self);
        self.showLogon(self.loginStrategy.showPrompt());
        self.loginStrategy.meridiumResourceLoaded.add(updateCaptions, self, self);
        self.loginStrategy.start();
    }

    function updateCaptions(self) {
        self.userNameCaption(self.translator.translate('USER_NAME_CAPTION'));
        self.passwordCaption(self.translator.translate('PASSWORD_CAPTION'));
        self.apiServerCaption(self.translator.translate('API_SERVER_CAPTION'));
        self.datasourceCaption(self.translator.translate('DATASOURCE_CAPTION'));
        self.loginCaption(self.translator.translate('LOGIN'));
        self.addDatasourceCaption(self.translator.translate('ADD_DATASOURCE'));

        self.changePasswordHeader(self.translator.translate('CHANGE_PASSWORD_HEADER'));
        self.newPasswordCaption(self.translator.translate('NEW_PASSWORD'));
        self.retypeNewPasswordCaption(self.translator.translate('RETYPE_CONFIRM_PASSWORD'));
        self.changePasswordCaption(self.translator.translate('CHANGE_PASSWORD'));
        setBrowserSnifferCaptions(self, self.translator.translate('OS_NOT_SUPPORTED'), self.translator.translate('BROWSER_NOT_SUPPORTED'));
        self.versionCaption(self.translator.translate('CURRENT_VERSION'));
    }

    LoginViewModel.prototype.initUserId = function () {
        this.userId(SavedSession.getUserId());
    };

    LoginViewModel.prototype.initApiServer = function () {
        if (this.allowServerInput) {
            listenToApiServer(this);
            this.apiServer(SavedSession.getApiServer());
        }
    };

    function listenToApiServer(self) {
        self.kom.subscribe(self.apiServer, apiServer_changed.bind(null, self));
    }

    function apiServer_changed(self, serverName) {
        var device = new Device();
        if (self.detached) { return; }
        if(device.isMobileApp()) {
            prepareLogin(self, prepareOnlineLogin.bind(null, self, serverName), prepareOfflineLogin.bind(null, self, serverName));
            ApplicationContext.connectionStatus.connectionCheckerInterval = setInterval(checkConnectionStatus.bind(null, self, serverName), CONNECTION_CHECK_INTERVAL);
        } else {
            prepareOnlineLogin(self, serverName);
        }
    }

    function prepareLogin(self, prepareOnlineLoginCallback, prepareOfflineLoginCallback) {
        var connectionChecker = new ConnectionChecker();

        connectionChecker.checkConnection(self.apiServer())
            .done(prepareOnlineLoginCallback)
            .fail(prepareOfflineLoginCallback);
    }

    function getDatasourceObjects(datasources) {
        var datasourceObjects = [];

        for(var i = 0; i < datasources.length; i++) {
            datasourceObjects.push(datasources[i]['datasourceInfo']);
        }

        return datasourceObjects;
    }

    function prepareOnlineLogin(self, serverName) {
        var userCulture = SavedSession.getUserCulture();
        ApplicationContext.connectionStatus.connected = true;
        self.datasources.removeAll();
        self.apiServer(serverName);
        self.setAjaxClientServerFromVm();
        self.loginStrategy.getMeridiumResource(userCulture)
            .done(self.loginStrategy.setTranslatorLocale.bind(self.loginStrategy))
            .done(updateCaptions.bind(null, self))
            .always(getFilteredDatasources.bind(null, self))
            .fail(logGetMeridiumResourceFailed);
    }

    function checkConnectionStatus(self, serverName) {
        prepareLogin(self, prepareOnlineLoginOnStatusChange.bind(null, self, serverName),
            prepareOfflineLoginOnStatusChange.bind(null, self, serverName));
    }

    function prepareOnlineLoginOnStatusChange(self, serverName) {
        if(self.detached) { return; }
        if (!ApplicationContext.connectionStatus.connected) {
            prepareOnlineLogin(self, serverName);
        }
    }

    function prepareOfflineLoginOnStatusChange(self, serverName) {
        if (ApplicationContext.connectionStatus.connected) {
            prepareOfflineLogin(self, serverName);
        }
    }

    function prepareOfflineLogin(self, serverName) {
        if(serverName) {
            var offlineLoginApi = new OfflineLoginApi();
            ApplicationContext.connectionStatus.connected = false;

            offlineLoginApi.getDatasources(serverName)
                .then(getOfflineDatasourcesDone.bind(null, self, serverName));
        }
    }

    function getOfflineDatasourcesDone(self, serverName, datasources) {
        setDatasources(self, []);
        setAreDatasourcesLoaded(self);

        self.datasources(getDatasourceObjects(datasources));
        selectDefaultDatasource();
        setAreDatasourcesLoaded(self);
    }

    LoginViewModel.prototype.setAjaxClientServerFromVm = function () {
        AjaxClient.setServer(this.apiServer());
    };

    function getFilteredDatasources(self) {
        if (self.apiServer()) {
            self.datasourceService.getFilteredDatasources(self.apiServer())
                .done(cacheDatasources)
                .done(setDatasources.bind(null, self))
                .done(selectDefaultDatasource.bind(null, self))
                .done(setAreDatasourcesLoaded.bind(null, self))
                .fail(notifyGetFilteredDatasourcesFailed);
        } else {
            setDatasources(self, []);
            setAreDatasourcesLoaded(self);
        }
    }

    function cacheDatasources(datasources) {
        var device = new Device();

        if(device.isMobileApp()) {
            OfflineLoginContext.datasources = datasources;
        }
    }

    function logGetMeridiumResourceFailed(response) {
        LogManager.pushContext('logGetMeridiumResourceFailed');
        logger.error('Error loading locale:', response);
        LogManager.popContext();
    }

    function setDatasources(self, datasources) {
        self.datasources(datasources);
    }

    function selectDefaultDatasource(self, datasources) {
        var i, datasource,
            defaultDatasourceId = SavedSession.getDatasource();
        if (!defaultDatasourceId || !datasources) { return; }
        for (i = 0; i < datasources.length; i++) {
            datasource = datasources[i];
            if (datasource.id === defaultDatasourceId) {
                self.datasource(datasource);
                break;
            }
        }
    }

    function setAreDatasourcesLoaded(self) {
        self.areDatasourcesLoaded(true);
    }

    function notifyGetFilteredDatasourcesFailed(response) {
        LogManager.pushContext('getFilteredDatasources');
        MessageBox.showOk('Unable to retrieve datasources', 'Error');
        logger.error('Error loading datasources', response);
        LogManager.popContext();
    }

    LoginViewModel.prototype.attach = function knockoutScreen_attach(region) {
        try {
            tryAttach(this, region);
        } catch (e) {
            console.error(e);
        }
    };

    function tryAttach(self, region) {
        base.prototype.attach.call(self, region);
        if (self.screenSize.isTooSmallForAllPages()) {
            screen.lockOrientation && screen.lockOrientation('portrait');
        } else {
            screen.lockOrientation && screen.lockOrientation('landscape');
        }
        var busyIndContainer = document.querySelector('.noDatasource');
        if(busyIndContainer) {
            self.busyIndicator.attachTo(busyIndContainer);
            self.busyIndicator.show();
        }

        if (typeof cordova !== 'undefined') {
            //for all devices, rollback the override on window.open that InAppBrowser made
            //for IOS, this also prevents navigation away from Meridum
            delete window.open;
        }
        if (typeof cordova !== 'undefined' && typeof MSApp !== 'undefined') {
            //InAppBrowser doesn't work right on windows so we override it with our own method.
            //This override might later be moved to window.open, but for now we just want to override InAppBrowser's
            cordova.InAppBrowser.open = function (URL) {
                Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(URL));
            };
        }

        if (!ApplicationContext.isSupportedBrowser) {
            $('#login-screen').prepend('<div class="browser-not-supported">' + self.browserUnsupportedCaption() + '</div>');
        }

        addScrollOnSmallAndroidDevices(self, region);
    }

    function addScrollOnSmallAndroidDevices(self, region) {
        if(self.device.isChromeOnAndroid() && window.innerHeight < ANDROID_KEYBOARD_FIX_MIN_HEIGHT) {
            addScroll(region);
        }
    }

    function addScroll(region) {
        var loginScreenElement = region.element.querySelector('#login-screen');

        if(loginScreenElement) {
            region.element.style.overflowY = 'auto';
            loginScreenElement.style.height = loginScreenElement.offsetHeight + 'px';
        }
    }

    LoginViewModel.prototype.login = function securityViewModel_login() {
        var device = new Device(),
            connectionChecker = new ConnectionChecker();

        if(device.isMobileApp()) {
            connectionChecker.checkConnection(this.apiServer())
                .done(loginOnline.bind(null, this))
                .fail(loginOffline.bind(null, this));
        } else {
            loginOnline(this);
        }
    };

    function loginOnline(self) {
        self.loginStrategy.login(self.datasource().id, self.userId(), self.password(), self.apiServer());
    }

    function loginOffline(self) {
        if (self.datasource()) {
            self.loginStrategy.loginOffline(self.datasource().id, self.userId(), self.password(), self.apiServer());
        } else {
            MessageBox.showOk('No offline datasources found.  You must login while online at least once in order to enable offline login', 'Error');
        }
    }

    LoginViewModel.prototype.showBusy = function () {
        this.busy(true);
    };

    LoginViewModel.prototype.addDatasource = function loginViewModel_addDataSource() {
        this.createDatasourceDialog.show()
            .done(reloadDatasources.bind(null, this));
    };

    function reloadDatasources(self) {
        self.areDatasourcesLoaded(false);
        getFilteredDatasources(self);
    }

    LoginViewModel.prototype.detach = function (region) {
        try {
            tryDetach(this, region);
        } catch (e) {
            console.error(e);
        }
    };

    function tryDetach(self, region){
        base.prototype.detach.call(self, region);
        self.busyIndicator.detach();
        self.detached = true;
    }

    LoginViewModel.prototype.unload = function unload() {
        try {
            tryUnload(this);
        } catch (e) {
            console.error(e);
        }
    };

    function tryUnload(self) {
        self.kom.dispose();
        self.kom = null;
        self.datasourceService = null;
        self.securityService = null;
        self.translator = null;
        self.loginDeferred = null;
        self.createDatasourceDialog = null;
    }

    LoginViewModel.prototype.switchToChangePasswordForm = function () {
        this.showLogon(true);
        this.showLogonForm(false);
        this.showChangePasswordForm(true);
    };

    LoginViewModel.prototype.changePassword = function () {
        this.loginStrategy.changePassword(this.newPassword(), this.retypeNewPassword());
    };

    LoginViewModel.prototype.hideBusy = function () {
        this.busy(false);
    };

    return LoginViewModel;
});
