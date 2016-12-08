define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        Region = require('spa/region'),
        RoleEvents = require('./role-events'),
        RoleDTO = require('../../services/role-dto'),
        RoleModel = require('../../model/role-model'),
        roleAdapter = require('../../adapters/role-adapter'),
        view = require('text!../views/role-detail.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');

    function RoleDetailViewModel(kom, applicationEvents, securityService,  roleEvents) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = roleEvents;

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        // knockout observables
        this.selectedRole = null;
        this.isLoading = null;
    }

    var base = Object.inherit(KnockoutViewModel, RoleDetailViewModel);
    RoleDetailViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, RoleEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    RoleDetailViewModel.prototype.load =
        function roleViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.selectedRole = this.kom.observable();
            this.isLoading = this.kom.observable();
            // Clear isDirty().
            clearIsDirty(this);

            return dfd.promise();
        };

    RoleDetailViewModel.prototype.activate =
        function roleViewModel_activate() {
            this.events.roleSelected.add(this.onRoleSelected, this);
            this.kom.subscribe(this.isDirty, isDirtyChanged.bind(null, this));
        };

    RoleDetailViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
        };

    RoleDetailViewModel.prototype.detach =
        function roleViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    RoleDetailViewModel.prototype.deactivate =
        function roleViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.roleSelected.remove(this);
        };

    RoleDetailViewModel.prototype.unload =
        function roleDetailViewModel_unload() {
            this.kom.disposeObservables();
        };

    /////////////////////
    // Behavior
    /////////////////////

    RoleDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    RoleDetailViewModel.prototype.onRoleAdded =
        function roleDetailViewModel_onRoleAdded() {
            if (this.selectedRole().key !== '0') {
                this.kom.tracker.markCurrentStateAsClean();
            }
        };

    RoleDetailViewModel.prototype.onRoleSelected =
        function roleDetailViewModel_onRoleSelected(selectedRole) {
            this.selectedRole(selectedRole);
            if (this.selectedRole().key !== '0') {
                clearIsDirty(this);
            }
        };

    RoleDetailViewModel.prototype.getRole = function (key) {
        return this.selectedRole();
    };

    //////////////////////
    // Implementation
    //////////////////////

    function clearIsDirty(self) {
        // Clear isDirty().
        self.kom.tracker.markCurrentStateAsClean();
    }

    function handleAjaxRequestError(self, response, dfd) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);

        self.applicationEvents.errorOccured.raise(self, errorMessage);
        self.isLoading(false);

        if (dfd) {
            dfd.reject();
        }
    }

    function isDirtyChanged(self, newValue) {
        self.events.isRoleDirty.raise(newValue);
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedRole()) {
            return;
        }

        hashObject = {
            key: self.selectedRole().key,
            id: self.selectedRole().id(),
            caption: self.selectedRole().caption(),
            description: self.selectedRole().description()
        };
        return JSON.stringify(hashObject);
    }

    return RoleDetailViewModel;
});
