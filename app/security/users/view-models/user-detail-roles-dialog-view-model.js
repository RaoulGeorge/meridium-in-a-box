﻿
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
        view = require('text!../views/user-detail-roles-dialog.html');

    require('system/lang/object');
    require('ui/elements/searchbox/view-model');


    function UserDetailRolesDialogViewModel(securityService) {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.service = securityService;

        // Observables (set by the container view model)
        this.groups = null; // list of all groups loaded from the data source
        this.filteredGroups = null; // computed: this.groups list with filter applied
        this.availableGroups = null;
        this.selectedGroups = null;
        this.currentGroups = ko.observableArray();
        this.groupSearchbox = null;
        // Computed observables (set in attach).
        this.groupFilter = null;

        this.region = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserDetailRolesDialogViewModel);

    UserDetailRolesDialogViewModel.dependsOn = [SecurityService];

    UserDetailRolesDialogViewModel.prototype.activate = function () {
        // Computed observables.
        this.kom.subscribe(this.filteredGroups, filteredGroups_subscribe.bind(null, this));
    };

    UserDetailRolesDialogViewModel.prototype.load = function roleGroupPopoverViewModel_load() {
        var dfd = new $.Deferred();

        this.groups = this.kom.observableArray();
        this.groupFilter = this.kom.observable();
        this.filteredGroups = this.kom.computed(filteredGroups_read.bind(null, this));

        this.service.getRoles()
.done(getRoleGroups_done.bind(null, this, dfd))
.fail(handleAjaxRequestError.bind(null, this, dfd));

        return dfd.promise();
    };

    UserDetailRolesDialogViewModel.prototype.attach = function (region) {
        base.prototype.attach.call(this, region);
        this.region = region;
        base.prototype.attach.apply(this, arguments);

        this.availableGroups = this.region.$element.find('mi-list-group')[0];
        Element.upgrade(this.availableGroups);

        this.availableGroups.loader = this.loadGroup.bind(this);

        this.groupSearchbox = this.region.$element.find('mi-tool-bar mi-searchbox')[0];
        if (window.CustomElements && !window.CustomElements.useNative) {
            window.CustomElements.upgrade(this.groupSearchbox);
        }
        this.groupSearchbox.searchCallback = groupSearch.bind(null, this);
    };

    UserDetailRolesDialogViewModel.prototype.detach = function RoleGroupPopoverViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    UserDetailRolesDialogViewModel.prototype.unload = function RoleGroupPopoverViewModel_unload() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.kom.disposeObservables();
    };

    UserDetailRolesDialogViewModel.prototype.loadGroup = function loadGroup() {
        var dfd = $.Deferred();
        dfd.resolve(this.filteredGroups());
        return dfd.promise();
    };

    UserDetailRolesDialogViewModel.prototype.deactivate = function () {
        this.kom.dispose();
    };



    UserDetailRolesDialogViewModel.prototype.save = function () {
        return this.availableGroups.selectedItems;
    };

    UserDetailRolesDialogViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };


    ///////////////////
    // IMPLEMENTATION
    ///////////////////

    function filteredGroups_subscribe(self) {
        self.availableGroups.reload.call(self.availableGroups);
    }

    function filteredGroups_read(self) {
        var filter,
            retValues,
            values;

        values = self.groups();
        if (!self.groupFilter()) {
            retValues = values;
        } else {
            filter = self.groupFilter().toLowerCase();
            values = ko.utils.arrayFilter(values, function (u) {
                return u.caption.toLowerCase().startsWith(filter);
            });
            retValues = values;
        }
        return retValues;
    }
    function groupSearch(self, newSearchTerm) {
        self.groupFilter(newSearchTerm);
    }


    function getRoleGroups_done(self, dfd, dtos) {
        var results = _.filter(dtos, filterCurrentGroups.bind(null, self));
        self.groups(sortGroups(results));
        dfd.resolve();
    }

    function filterCurrentGroups(self, item) {
        for (var i = 0; i < self.currentGroups().length; i++) {
            if (self.currentGroups()[i].key === item.key) {
                return false;
            }
        }
        return true;
    }


    function sortGroups(groups) {
        return _.sortBy(groups, sortByCaseInsensitive.bind(null, 'caption'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
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



    return UserDetailRolesDialogViewModel;
});