define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        Events = require('./events'),
        Region = require('spa/region'),
        DetailsViewModel=require('./permissions-details-view-model'),
        view = require('text!../views/permissions-nav-detail.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('ui/elements/breadcrumb/view-model');
    require('ui/elements/searchbox/view-model');
    require('system/lang/string');
    require('ui/elements/filter/filter-no-ko');

    function PermissionsNavDetailViewModel(kom, applicationEvents, securityService,events,detailsViewModel,detailsRegion) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = events;
        this.detailsViewModel = detailsViewModel;
        this.detailsRegion = detailsRegion;
        this.isDirty = null;
        // knockout observables
        this.familyCaption=null;
        this.selectedPrivs = null;
        this.selectedEntity=null;
        this.isLoading = null;
        this.hasFamilySelected=null;
        this.canShowFamilyUsers = null;
        this.canShowFamilyGroups = null;
    }

    var base = Object.inherit(KnockoutViewModel, PermissionsNavDetailViewModel);
    PermissionsNavDetailViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, Events,DetailsViewModel,Region];

    ///////////////////
    // Lifecycle
    ///////////////////

    PermissionsNavDetailViewModel.prototype.load =
        function nav_detail_ViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.selectedPrivs = this.kom.observable();
            this.selectedEntity = this.kom.observable();
            this.isLoading = this.kom.observable();
            this.isDirty = this.kom.observable();
            this.canShowFamilyUsers = this.kom.observable(false);
            this.canShowFamilyGroups = this.kom.observable(false);
            this.familyCaption=this.kom.observable();
            // load child VM
            this.detailsViewModel.load(routeArgs);

            return dfd.promise();
        };

    PermissionsNavDetailViewModel.prototype.activate =
        function nav_detail_ViewModel_activate() {

            // Set up our computed observables.
            this.hasFamilySelected=this.kom.pureComputed(hasFamilySelected_read.bind(null, this));
            this.events.folderNavigated.add(this.onFamilySelected, this);
            this.events.isFamilyDirty.add(this.OnIsFamilyDirty, this);
            this.events.familyType.add(this.onFamilyTypeChanged,this);
            // activate child VM
            this.detailsViewModel.activate();
        };

    PermissionsNavDetailViewModel.prototype.attach =
        function nav_detail_ViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.detailsRegion.setElement(this.region.$element.find('div.permission-container'));
            this.detailsViewModel.attach(this.detailsRegion);
        };

    PermissionsNavDetailViewModel.prototype.detach =
        function nav_detail_ViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            this.detailsViewModel.detach(this.detailsRegion);
            this.detailsRegion.clear();
        };

    PermissionsNavDetailViewModel.prototype.canUnload =
        function nav_detail_canUnload() {
            return !this.isDirty();
        };

    PermissionsNavDetailViewModel.prototype.deactivate =
        function nav_detail_ViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.folderNavigated.remove(this);
            this.events.isFamilyDirty.remove(this);
            this.events.familyType.remove(this);
            this.detailsViewModel.deactivate(this.detailsRegion);
        };

    PermissionsNavDetailViewModel.prototype.unload =
        function nav_detail_unload() {
            this.kom.disposeObservables();
            this.detailsViewModel.unload();
        };


    /////////////////////
    // Behavior
    /////////////////////

    PermissionsNavDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    PermissionsNavDetailViewModel.prototype.onFamilySelected =
        function nav_detail_ViewModel_onFamilySelected(entityDTO, event) {
            if (!entityDTO) {
                return;
            }
            if (entityDTO && entityDTO.key) {
                this.selectedEntity(entityDTO);
                this.familyCaption(entityDTO.caption);

            } else {
                this.selectedEntity(null);
                this.familyCaption();
                this.selectedPrivs(null);
                this.events.familySelected.raise(null);
            }

        };

    PermissionsNavDetailViewModel.prototype.OnIsFamilyDirty =
        function nav_detail_ViewModel_OnIsFamilyDirty(dirty) {
            this.isDirty(dirty);
        };


    PermissionsNavDetailViewModel.prototype.showFamilyUsers = function nav_detail_ViewModel_showFamilyUsers() {
        this.canShowFamilyUsers(true);
        this.canShowFamilyGroups(false);
    };

    PermissionsNavDetailViewModel.prototype.showFamilyGroups = function nav_detail_ViewModel_showFamilyGroups() {
        this.canShowFamilyUsers(false);
        this.canShowFamilyGroups(true);
    };

    PermissionsNavDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    PermissionsNavDetailViewModel.prototype.onFamilyTypeChanged =
        function detailsViewModel_onSelected(ft,event) {
            this.selectedEntity(null);
            this.familyCaption();
            this.selectedPrivs(null);
            this.events.familySelected.raise(null);
        };

    //////////////////////
    // Implementation
    //////////////////////



    function hasFamilySelected_read(self) {
        return self.selectedEntity();
    }



    return PermissionsNavDetailViewModel;
});
