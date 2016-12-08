define(["require", "exports", "ramda"], function (require, exports, ramda_1) {
    "use strict";
    var hasValue = function (getter) { return function (object) {
        if (!object) {
            return false;
        }
        var value = getter(object);
        if (ramda_1.isNil(value)) {
            return false;
        }
        return value !== '';
    }; };
    var hasSiteKey = hasValue(ramda_1.prop('siteKey'));
    var hasDefaultSite = hasValue(ramda_1.prop('defaultSiteKey'));
    var ApplicationContext = (function () {
        function ApplicationContext() {
            initialize(this);
        }
        ApplicationContext.prototype.getSiteContext = function () {
            if (hasSiteKey(this.assetcontext)) {
                return this.assetcontext.siteKey;
            }
            if (hasDefaultSite(this.user)) {
                return this.user.defaultSiteKey;
            }
            return null;
        };
        ApplicationContext.prototype.reset = function () {
            initialize(this);
        };
        return ApplicationContext;
    }());
    function initialize(applicationContext) {
        applicationContext.user = null;
        applicationContext.session = null;
        applicationContext.homeRoute = 'home';
        applicationContext.sessionStatus = {
            isActive: false
        };
        applicationContext.assetcontext = null;
        applicationContext.licensedModules = null;
        applicationContext.help = {
            helpContext: null,
            helpUrl: null,
            isAdmin: false
        };
        applicationContext.connectionStatus = {
            connected: true,
            lastStatusChange: null,
            connectionCheckerInterval: null,
            lastResponse: new Date(),
            lastUserActivity: new Date()
        };
        applicationContext.navigation = {
            activeRoute: null
        };
        applicationContext.isSupportedBrowser = true;
    }
    return new ApplicationContext();
});
