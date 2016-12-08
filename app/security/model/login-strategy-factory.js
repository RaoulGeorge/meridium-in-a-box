define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ILoginStrategy = require('./i-login-strategy'),
        SavedSessionLoginStrategy = require('./saved-session-login-strategy'),
        SsoLoginStrategy = require('./sso-login-strategy'),
        PromptLoginStrategy = require('./prompt-login-strategy');

    var MERIDIUM_SESSION = 'meridium-session';

    function LoginStrategyFactory() {
        // empty
    }
    LoginStrategyFactory.singleton = true;
    
    LoginStrategyFactory.prototype.createStrategy = function (vm) {
        var strategy,urlCookie;
        if (hasExistingSession()) {
            strategy = Object.resolve(SavedSessionLoginStrategy, vm);
        } else if (hasSsoSession()) {
            strategy = Object.resolve(SsoLoginStrategy, vm);
            urlCookie = readCookie("meridium_extraURL");
            if (urlCookie) {
                history.replaceState('{}', '', '/Meridium/sso-index.html' + urlCookie);
            } else {
                history.replaceState('{}', '', '/Meridium/sso-logout.html');
            }
        } else {
            strategy = Object.resolve(PromptLoginStrategy, vm);
        }
        Assert.implementsInterface(strategy, ILoginStrategy);
        return strategy;
    };

    function hasExistingSession() {
        return !!getSavedMeridiumSession();
    }

    function getSavedMeridiumSession() {
        try {
            return sessionStorage.getItem(MERIDIUM_SESSION);
        } catch (error) {
            logger.error('Failed to get sessionStorage - error:', error);
            return false;
        }
    }

    function hasSsoSession() {
        return !!window.name;
    }

    function readCookie(name) {
        var nameEQ = encodeURIComponent(name) + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }
    
    return LoginStrategyFactory;
});