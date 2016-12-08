
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
        view = require('text!../views/group-detail-roles-dialog.html');

    require('system/lang/object');
    require('ui/elements/searchbox/view-model');


    function GroupDetailRolesDialogViewModel(securityService) {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.service = securityService;

        // Observables (set by the container view model)
        this.roles = null; // list of all groups loaded from the data source
        this.filteredRoles = null; // computed: this.groups list with filter applied
        this.availableRoles = null;
        this.selectedRoles = null;
        this.currentRoles = ko.observableArray();
        this.roleSearchbox = null;
        // Computed observables (set in attach).
        this.roleFilter = null;

        this.region = null;
    }

    var base = Object.inherit(KnockoutViewModel, GroupDetailRolesDialogViewModel);

    GroupDetailRolesDialogViewModel.dependsOn = [SecurityService];

    GroupDetailRolesDialogViewModel.prototype.activate = function () {
        // Computed observables.
        this.kom.subscribe(this.filteredRoles, filteredRoles_subscribe.bind(null, this));
    };

    GroupDetailRolesDialogViewModel.prototype.load = function roleGroupPopoverViewModel_load() {
        var dfd = new $.Deferred();

        this.roles = this.kom.observableArray();
        this.roleFilter = this.kom.observable();
        this.filteredRoles = this.kom.computed(filteredRoles_read.bind(null, this));

        this.service.getRoles()
            .done(getRoleGroups_done.bind(null, this, dfd))
            .fail(handleAjaxRequestError.bind(null, this, dfd));

        return dfd.promise();
    };

    GroupDetailRolesDialogViewModel.prototype.attach = function (region) {
        base.prototype.attach.call(this, region);
        this.region = region;
        base.prototype.attach.apply(this, arguments);

        this.availableRoles = this.region.$element.find('mi-list-group')[0];
        Element.upgrade(this.availableRoles);

        this.availableRoles.loader = this.loadRoles.bind(this);

        this.roleSearchbox = this.region.$element.find('mi-tool-bar mi-searchbox')[0];
        if (window.CustomElements && !window.CustomElements.useNative) {
            window.CustomElements.upgrade(this.roleSearchbox);
        }
        this.roleSearchbox.searchCallback = roleSearch.bind(null, this);
    };

    GroupDetailRolesDialogViewModel.prototype.detach = function RoleGroupPopoverViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    GroupDetailRolesDialogViewModel.prototype.unload = function RoleGroupPopoverViewModel_unload() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.kom.disposeObservables();
    };

    GroupDetailRolesDialogViewModel.prototype.loadRoles = function loadGroup() {
        var dfd = $.Deferred();
        dfd.resolve(this.filteredRoles());
        return dfd.promise();
    };

    GroupDetailRolesDialogViewModel.prototype.deactivate = function () {
        this.kom.dispose();
    };



    GroupDetailRolesDialogViewModel.prototype.save = function () {
        return this.availableRoles.selectedItems;
    };

    GroupDetailRolesDialogViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };


    ///////////////////
    // IMPLEMENTATION
    ///////////////////

    function filteredRoles_subscribe(self) {
        self.availableRoles.reload.call(self.availableRoles);
    }

    function filteredRoles_read(self) {
        var filter,
            retValues,
            values;

        values = self.roles();
        if (!self.roleFilter()) {
            retValues = values;
        } else {
            filter = self.roleFilter().toLowerCase();
            values = ko.utils.arrayFilter(values, function (u) {
                return u.caption.toLowerCase().startsWith(filter);
            });
            retValues = values;
        }
        return retValues;
    }
    function roleSearch(self, newSearchTerm) {
        self.roleFilter(newSearchTerm);
    }


    function getRoleGroups_done(self, dfd, dtos) {
        var results = _.filter(dtos, filterCurrentRoles.bind(null, self));
        self.roles(sortRoles(results));
        dfd.resolve();
    }

    function filterCurrentRoles(self, item) {
        for (var i = 0; i < self.currentRoles().length; i++) {
            if (self.currentRoles()[i].key() === item.key) {
                return false;
            }
        }
        return true;
    }


    function sortRoles(roles) {
        return _.sortBy(roles, sortByCaseInsensitive.bind(null, 'caption'));
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



    return GroupDetailRolesDialogViewModel;
});