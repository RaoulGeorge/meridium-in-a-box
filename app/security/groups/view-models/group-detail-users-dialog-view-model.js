
define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        ErrorMessage = require('system/error/error-message'),
        SecurityService = require('../../services/security-service'),
        Translator = require('system/globalization/translator'),
        Region = require('spa/region'),
        DialogBox = require('system/ui/dialog-box'),
        view = require('text!../views/group-detail-users-dialog.html');

    require('system/lang/object');
    require('ui/elements/searchbox/view-model');


    function GroupDetailUsersDialogViewModel(securityService) {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.service = securityService;

        this.availableUsers = null;
        this.currentUsers = ko.observableArray();
        this.userSearchbox = null;
        this.searchValue = null;

        this.region = null;
    }

    var base = Object.inherit(KnockoutViewModel, GroupDetailUsersDialogViewModel);

    GroupDetailUsersDialogViewModel.dependsOn = [SecurityService];

    GroupDetailUsersDialogViewModel.prototype.activate = function () {
    };

    GroupDetailUsersDialogViewModel.prototype.load = function roleGroupPopoverViewModel_load() {
        var dfd = new $.Deferred();
        return dfd.promise();
    };

    GroupDetailUsersDialogViewModel.prototype.attach = function (region) {
        base.prototype.attach.call(this, region);
        this.region = region;
        base.prototype.attach.apply(this, arguments);

        this.availableUsers = this.region.$element.find('mi-list-group')[0];
        Element.upgrade(this.availableUsers);

        this.availableUsers.loader = loadUsers.bind(null, this);

        this.userSearchbox = this.region.$element.find('mi-tool-bar mi-searchbox')[0];
        if (window.CustomElements && !window.CustomElements.useNative) {
            window.CustomElements.upgrade(this.userSearchbox);
        }
        this.userSearchbox.searchCallback = userSearch.bind(null, this);
    };

    GroupDetailUsersDialogViewModel.prototype.detach = function RoleGroupPopoverViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    GroupDetailUsersDialogViewModel.prototype.unload = function RoleGroupPopoverViewModel_unload() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.kom.disposeObservables();
    };

    GroupDetailUsersDialogViewModel.prototype.deactivate = function () {
        this.kom.dispose();
    };

    GroupDetailUsersDialogViewModel.prototype.save = function () {
        return this.availableUsers.selectedItems;
    };

    GroupDetailUsersDialogViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };


    ///////////////////
    // IMPLEMENTATION
    ///////////////////

    function loadUsers(self, pageNum, pageSize) {
        var dfd = $.Deferred(),
            pageOffset,
            search = '',
            status = '';

        if (self.searchValue) {
            search = self.searchValue;
        }
        if (self.statusValue) {
            status = self.statusValue;
        }
        pageOffset = pageNum - 1;

        self.service.getUsersPage(pageOffset, pageSize, status, search)
            .done(getUserPage_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self));

        return dfd;
    }

    function getUserPage_done(self, dfd, dtos) {
        if (dtos) {
            if (self.currentUsers) {
                dtos = dtos.filter(filterUsers.bind(null, self));
            }
        }
        dfd.resolve(dtos);
    }

    function filterUsers(self, dto) {
        for (var i = 0; i < self.currentUsers().length; i++) {
            if (dto.key === self.currentUsers()[i].key) {
                return false;
            }
        }
        return true;
    }

    function userSearch(self, newSearchTerm) {
        if (newSearchTerm.length === 0) {
            self.searchCleared = true;
            self.searchValue = null;
        }
        else {
            self.searchValue = newSearchTerm;
        }
        self.availableUsers.reload();
    }

    function handleAjaxRequestError(self, response) {
        handleError(self, response.statusText);
    }

    function handleError(self, message) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = message,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.appEvents.errorOccured.raise(self, errorMessage);
    }

    return GroupDetailUsersDialogViewModel;
});