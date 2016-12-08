define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ILoginStrategy = require('./i-login-strategy'),
        BaseLoginStrategy = require('./base-login-strategy'),
        SavedSession = require('./saved-session');

    function SavedSessionLoginStrategy(vm) {
        base.call(this, vm);
        Assert.implementsInterface(this, ILoginStrategy, module.id);
    }
    var base = Object.inherit(BaseLoginStrategy, SavedSessionLoginStrategy);

    SavedSessionLoginStrategy.prototype.start = function () {
        var sessionData = SavedSession.getSession(),
            session = parseSessionData(sessionData);
        logger.info('Reusing existing session', session);
        this.initSession(session);
        this.loadUser(session);
    };

    function parseSessionData(sessionData) {
        Assert.stringNotEmpty(sessionData, 'sessionData');
        return JSON.parse(sessionData);
    }

    return SavedSessionLoginStrategy;
});