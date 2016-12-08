define(function defineApplication(require) {
    'use strict';

    var $ = require('jquery');

    var LoginViewModel = require('security/view-models/login-view-model'),
        Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        ApplicationTasks = require('./application-tasks');

    function Application(loginViewModel, conductor) {
        this.securityRegion = new Region();
        this.shellRegion = new Region();
        this.loginViewModel = loginViewModel;
        this.shellViewModel = null;
        this.conductor = conductor;
        this.tasks = Object.resolve(ApplicationTasks);
    }

    Application.dependsOn = [LoginViewModel, Conductor];
    Application.singleton = true;

    Application.prototype.activate = function () {
        return this.tasks.runPreLoginTasks()
            .then(activateLoginViewModel.bind(null, this));
    };

    function activateLoginViewModel(self) {
        self.conductor.activateScreen(self.loginViewModel)
            .done(switchFromLoginToShell.bind(null, self));
        loadShell();
        return null;
    }

    function loadShell() {
        return Object.require(['config/dependency'])
            .then(Object.require.bind(null, ['shell/shell-view-model']));
    }

    function switchFromLoginToShell(self) {
        self.tasks.runPostLoginTasks()
            .then(removeLoginScreen.bind(null, self))
            .then(loadShell.bind(null, self))
            .then(activateShell.bind(null, self));
    }

    function removeLoginScreen(self) {
        self.conductor.clearScreen(self.securityRegion);
        self.loginViewModel = null;
        self.securityRegion.removeAndDispose();
    }

    function activateShell(self, modules) {
        var ShellViewModel = modules[0];
        self.shellViewModel = Object.resolve(ShellViewModel);
        $('#shell').removeClass('shell-inactive');
        self.conductor.changeScreen(self.shellViewModel, self.shellRegion);
    }

    Application.prototype.attach = function (body) {
        this.shellRegion.setElement(body.querySelector('#shell'));
        this.securityRegion.setElement(body.querySelector('#security'));
        this.conductor.attachScreen(this.loginViewModel, this.securityRegion);
    };

    return Application;
});
