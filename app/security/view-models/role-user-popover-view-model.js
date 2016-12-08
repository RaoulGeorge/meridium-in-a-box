define(function(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        ErrorMessage = require('system/error/error-message'),
        Translator = require('system/globalization/translator'),
        SecurityService = require('../services/security-service'),
        Region = require('spa/region'),
        DialogBox = require('system/ui/dialog-box'),
        view = require('text!../views/role-user-popover.html');

    require('system/lang/object');
    require('ui/elements/searchbox/view-model');

    function RoleUserPopoverViewModel(securityService) {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.service = securityService;

        this.userSearchbox = null;
        this.availableUsers = null;
        this.currentUsers = ko.observableArray();

        this.searchValue = null;

        this.region = null;
    }

    var base = Object.inherit(KnockoutViewModel, RoleUserPopoverViewModel);

    RoleUserPopoverViewModel.dependsOn = [SecurityService];

    RoleUserPopoverViewModel.prototype.activate = function() {
        // Computed observables.
        this.canClickDone = this.kom.pureComputed(canClickDone_read.bind(null, this));
    };

    RoleUserPopoverViewModel.prototype.load = function roleUserPopoverViewModel_load() {
        var dfd = new $.Deferred();
        return dfd.promise();
    };

    RoleUserPopoverViewModel.prototype.attach = function(region) {
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

    RoleUserPopoverViewModel.prototype.deactivate = function () {
        this.kom.dispose();
    };
       
    RoleUserPopoverViewModel.prototype.save = function () {
        return this.availableUsers.selectedItems;
    };

    RoleUserPopoverViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    RoleUserPopoverViewModel.prototype.unload = function RoleUserPopoverViewModel_unload() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.kom.disposeObservables();
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

    function canClickDone_read(self) {
        return  true;
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

   
    return RoleUserPopoverViewModel;
});