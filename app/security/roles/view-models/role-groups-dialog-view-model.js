
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
        view = require('text!../views/role-groups-dialog.html');

    require('system/lang/object');
    require('ui/elements/searchbox/view-model');


    function RoleGroupsDialogViewModel(securityService) {
        base.call(this, view);
        this.region = null;
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.service = securityService;

        // set by caller, currently assigned
        this.currentGroups = ko.observableArray();

        this.listControl = null;
        this.searchControl = null;
        this.searchValue = null;
    }

    var base = Object.inherit(KnockoutViewModel, RoleGroupsDialogViewModel);

    RoleGroupsDialogViewModel.dependsOn = [SecurityService];

    RoleGroupsDialogViewModel.prototype.activate = function () {
    };

    RoleGroupsDialogViewModel.prototype.load = function roleGroupPopoverViewModel_load() {
        var dfd = new $.Deferred();
        return dfd.promise();
    };

    RoleGroupsDialogViewModel.prototype.attach = function (region) {
        base.prototype.attach.call(this, region);
        this.region = region;
        base.prototype.attach.apply(this, arguments);

        this.listControl = this.region.$element.find('mi-list-group')[0];
        Element.upgrade(this.listControl);
        this.listControl.loader = loadGroups.bind(null, this);

        this.searchControl = this.region.$element.find('mi-tool-bar mi-searchbox')[0];
        if (window.CustomElements && !window.CustomElements.useNative) {
            window.CustomElements.upgrade(this.searchControl);
        }
        this.searchControl.searchCallback = searchCallback.bind(null, this);
    };

    RoleGroupsDialogViewModel.prototype.detach = function RoleGroupPopoverViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    RoleGroupsDialogViewModel.prototype.unload = function RoleGroupPopoverViewModel_unload() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.kom.disposeObservables();
    };

    RoleGroupsDialogViewModel.prototype.deactivate = function () {
        this.kom.dispose();
    };

    RoleGroupsDialogViewModel.prototype.save = function () {
        return this.listControl.selectedItems;
    };

    RoleGroupsDialogViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    ///////////////////
    // IMPLEMENTATION
    ///////////////////

    function loadGroups(self, pageNum, pageSize) {
        var dfd = $.Deferred(),
            pageOffset,
            search = '',
            status = '';

        if (self.searchValue) {
            search = self.searchValue;
        }
        pageOffset = pageNum - 1;

        self.service.getGroups()
            .done(getGroup_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self));

        return dfd;
    }

    function getGroup_done(self, dfd, dtos) {
        if (dtos) {
            if (self.currentGroups) {
                dtos = dtos.filter(filterGroups.bind(null, self));
                dtos = sortDtos(dtos);
            }
        }
        dfd.resolve(dtos);
    }

    function filterGroups(self, dto) {
        for (var i = 0; i < self.currentGroups().length; i++) {
            if (dto.key === self.currentGroups()[i].key) {
                return false;
            }
        }
        return true;
    }

    function sortDtos(dtos) {
        return dtos.sort(function (x, y) {
            var xcap = x.caption.toLowerCase();
            var ycap = y.caption.toLowerCase();
            if (xcap < ycap) {
                return -1;
            } else if (xcap > ycap) {
                return 1;
            }
            return;
        });
    }

    function searchCallback(self, newSearchTerm) {
        if (newSearchTerm.length === 0) {
            self.searchCleared = true;
            self.searchValue = null;
        }
        else {
            self.searchValue = newSearchTerm;
        }
        self.listControl.reload();
    }

    function handleAjaxRequestError(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.appEvents.errorOccured.raise(self, errorMessage);
    }

    return RoleGroupsDialogViewModel;
});