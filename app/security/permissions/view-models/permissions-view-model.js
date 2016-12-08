define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        NavViewModel = require('./permissions-nav-view-model'),
        DetailsViewModel = require('./permissions-nav-detail-view-model'),
        Region = require('spa/region'),
        Translator = require('system/globalization/translator'),
        view = require('text!../views/permissions.html'),
        UnsavedChangesMessageBox = require('system/ui/unsaved-changes-message-box');

    require('system/lang/object');
    require('ui/elements/breadcrumb/view-model');

    function PermissionsViewModel(applicationEvents,
                              kom,
                              navRegion,
                              navViewModel,
                              detailsRegion,
                              detailsViewModel) {
        base.call(this, view);
        this.applicationEvents = applicationEvents;
        this.kom = kom;
        this.navRegion = navRegion;
        this.navViewModel = navViewModel;
        this.detailsRegion = detailsRegion;
        this.detailsViewModel = detailsViewModel;
        this.translator = Object.resolve(Translator);

        this.collapsedNav = null;
    }

    var base = Object.inherit(KnockoutViewModel, PermissionsViewModel);
    PermissionsViewModel.dependsOn = [ApplicationEvents, KnockoutManager, Region, NavViewModel, Region, DetailsViewModel];

    ///////////////////
    // Lifecycle
    ///////////////////

    PermissionsViewModel.prototype.open =
        function viewModel_open() {
            //this.applicationEvents.titleChanged.raise(this.translate('GROUPS'), this);
        };

    PermissionsViewModel.prototype.load =
        function viewModel_load(routeArgs) {
            var dfd = new $.Deferred();

            this.navViewModel.load(routeArgs);
            this.detailsViewModel.load(routeArgs);

            // Initialize observables.
            this.collapsedNav = this.kom.observable(false);

            // Load data.

            // Initialize computeds.

            // Parse route args.

            return dfd.promise();
        };

    PermissionsViewModel.prototype.activate =
        function viewModel_activate() {
            this.navViewModel.activate();
            this.detailsViewModel.activate();

            // Initialize subscriptions.
            this.navViewModel.navCollapsed.add(navCollapsed.bind(null, this));
            this.navViewModel.navExpanded.add(navExpanded.bind(null, this));

            // Initialize event handlers.

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/DataPermissions.htm';
        };

    PermissionsViewModel.prototype.attach =
        function viewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.navRegion.setElement(this.region.$element.find('div.nav-container'));
            this.navViewModel.attach(this.navRegion);

            this.detailsRegion.setElement(this.region.$element.find('div.details-container'));
            this.detailsViewModel.attach(this.detailsRegion);

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);
        };

    PermissionsViewModel.prototype.detach =
        function viewModel_detach(region) {
            this.navViewModel.detach(this.navRegion);
            this.navRegion.clear();

            this.detailsViewModel.detach(this.detailsRegion);
            this.detailsRegion.clear();

            base.prototype.detach.call(this, region);
        };

    PermissionsViewModel.prototype.canUnload =
        function viewModel_canUnload() {
            var nav = this.navViewModel.canUnload();
            var dtl = this.detailsViewModel.canUnload();
            if (!nav || !dtl) {
                return UnsavedChangesMessageBox.show();
            }
            return true;
        };

    PermissionsViewModel.prototype.deactivate =
        function viewModel_deactivate(region) {
            this.navViewModel.deactivate(this.navRegion);
            this.detailsViewModel.deactivate(this.detailsRegion);

            this.navViewModel.navCollapsed.remove(navCollapsed.bind(null, this), this);
            this.navViewModel.navExpanded.remove(navExpanded.bind(null, this), this);

            //this.kom.disposeSubscriptions();
            //this.kom.disposeComputeds();

            // Dispose event handlers.
        };

    PermissionsViewModel.prototype.unload =
        function viewModel_unload() {
            this.navViewModel.unload();
            this.detailsViewModel.unload();

            //this.kom.disposeObservables();
        };

    ///////////////////
    // BEHAVIOR
    ///////////////////

    PermissionsViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
			{ 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    PermissionsViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
        var value = data.value,
			i,
			index;

        //this.region.$element.find('.breadcrumb-notification-area').html('<kbd>' + JSON.stringify(data) + '</kbd>');

        for (i = 0; i < this.breadcrumb.items.length; i++) {
            if (this.breadcrumb.items[i].value === value) {
                index = i + 1;
                break;
            }
        }
        this.breadcrumbData.splice(index, this.breadcrumbData.length - index);
        this.breadcrumb.items = this.breadcrumbData;
        if (data.value === '1') {
            this.applicationEvents.navigate.raise('admin-menu/security-manager');
        }
    };

    PermissionsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    function navCollapsed(self) {
        self.collapsedNav(true);
    }

    function navExpanded(self) {
        self.collapsedNav(false);
    }

    return PermissionsViewModel;
});