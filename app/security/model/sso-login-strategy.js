define(function (require, exports, module) {
    'use strict';

    var Assert = require('mi-assert'),
        ILoginStrategy = require('./i-login-strategy'),
        BaseLoginStrategy = require('./base-login-strategy');

    function SsoLoginStrategy(vm) {
        base.call(this, vm);
        Assert.implementsInterface(this, ILoginStrategy, module.id);
    }
    var base = Object.inherit(BaseLoginStrategy, SsoLoginStrategy);

    SsoLoginStrategy.prototype.showPrompt = function () {
        return true;
    };

    SsoLoginStrategy.prototype.start = function () {
        var sessionId = getSsoSessionId();
        clearSsoSessionId();
        getSession(this, sessionId)
            .done(this.setAjaxClientServerFromVm.bind(this))
            .done(setSessionApiServer.bind(null, this))
            .done(this.newSession.bind(this))
            .done(this.loadUser.bind(this))
            .fail(this.notifySessionNotFound.bind(this));
    };

    function getSsoSessionId() {
        // window.name is being used to pass in session ID for SSO integration
        return window.name;
    }

    function clearSsoSessionId() {
        // window.name is being used to pass in session ID for SSO integration
        window.name = "";
    }

    function getSession(self, session) {
        return self.securityService.getSession(session);
    }

    function setSessionApiServer(self, session) {
        session.apiServer = self.vm.apiServer();
    }

    return SsoLoginStrategy;
});