define(function (require) {
    'use strict';

    var $ = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        DialogBox = require('system/ui/dialog-box'),
        Region = require('spa/region'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        SecurityService = require('../services/security-service'),
        UserDTO = require('../services/user-dto'),
        MessageBox = require('system/ui/message-box'),
        UserModel = require('../model/user-model'),
        userAdapter = require('../adapters/user-adapter'),
        ko = require('knockout'),
        view = require('text!../views/user-browser.html');

    function UserBrowserViewModel(kom, applicationEvents, securityService) {
        base.call(this, view);
        this.kom = kom;
        this.translator = Object.resolve(Translator);
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;

        this.saveCallback = null;
        this.cancelCallback = null;
        this.selectedUser = null;
        this.users = null;
        this.filteredUsers = null;
        this.userFilter = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserBrowserViewModel);
    UserBrowserViewModel.dependsOn = [KnockoutManager, Region, SecurityService];

    ////////////////////
    // API
    ////////////////////

    UserBrowserViewModel.prototype.show = function show(observableCallback, saveCallback, cancelCallback) {
        var dialogOptions = {
            height: '80%',
            width: '80%',
            buttons: [
                { name: this.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                { name: this.translate('DONE'), value: 'save', cssClass: 'btn-primary' }
            ]
        };

        this.dialog = new DialogBox(this, 'User Browser', dialogOptions);
        this.selectedUser = observableCallback;
        this.saveCallback = saveCallback;
        this.cancelCallback = cancelCallback;

        this.dialog.show();
        this.dfd = $.Deferred();
        return this.dfd.promise();
    };

    UserBrowserViewModel.prototype.close = function close() {
        this.dialog = null;
    };

    ///////////////////
    // Lifecycle
    ///////////////////

    UserBrowserViewModel.prototype.load = function load() {
        var dfd = new $.Deferred();
        this.users = this.kom.observableArray();
        this.userFilter = this.kom.observable();
        this.filteredUsers = this.kom.computed(filteredUsers_read.bind(null, this));

        // Load data.
        this.securityService.getUsers(true, true)
            .done(getUsers_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    UserBrowserViewModel.prototype.activate = function activate() {
    };

    UserBrowserViewModel.prototype.attach = function attach(region) {
        base.prototype.attach.call(this, region);
        this.region = region;
    };

    UserBrowserViewModel.prototype.detach = function detach(region) {
        base.prototype.detach.call(this, region);
    };

    UserBrowserViewModel.prototype.canUnload = function canUnload() {
    };

    UserBrowserViewModel.prototype.deactivate = function deactivate(region) {
    };

    UserBrowserViewModel.prototype.unload = function unload() {
        if (this.dfd.state() !== 'resolved') {
            this.dfd.reject();
        }
        this.dfd = null;
    };

    /////////////////////
    // Behavior
    /////////////////////

    UserBrowserViewModel.prototype.translate = function translate(key) {
        return this.translator.translate(key);
    };

    UserBrowserViewModel.prototype.selected = function (model) {
        this.selectedUser(model);
    };

    UserBrowserViewModel.prototype.save = function save() {
        if (this.selectedUser() === undefined) {
            MessageBox.showOk(this.translate('SELECT_USER_OR_CANCEL'));
            return;
        }
        return this.saveCallback();
    };

    UserBrowserViewModel.prototype.cancel = function cancel() {
        return this.cancelCallback();
    };

    /////////////////////
    // Implementation
    /////////////////////
    function handleErrorMsg(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    function filteredUsers_read(self) {
        var filter = null;
        var values = [];

        if (!self.userFilter()) {
            return self.users();
        }

        filter = self.userFilter().toLowerCase();
        for (var i = 0; i < self.users().length; i++) {
            var last = self.users()[i].lastName().toLowerCase();
            var first = self.users()[i].firstName().toLowerCase();
            var id=self.users()[i].id().toLowerCase();
            if (filter === last.substring(0, filter.length)) {
                values.push(self.users()[i]);
            }
            else if (filter===first.substring(0,filter.length)) {
               values.push(self.users()[i]);
            } else {
                if (filter===id.substring(0,filter.length)) {
                    values.push(self.users()[i]);
                }
            }
        }

        values.sort(userComparer.bind(null));
        return values;
    }

    //function userFilter(u) {
    //    return u.firstName().toLowerCase().startsWith(self.filter) ||
    //        u.lastName().toLowerCase().startsWith(self.filter);
    //}

    function userComparer(left, right) {
        return left.displayName().toLowerCase() === right.displayName().toLowerCase() ? 0
            : (left.displayName().toLowerCase() < right.displayName().toLowerCase() ? -1
            : 1);
    }

    function getUsers_done(self, dfd, data) {
        var dtos = UserDTO.fromDataCollection(data);
        self.users(userAdapter.toModelObjectArray(dtos));
        dfd.resolve();
    }

    return UserBrowserViewModel;
});