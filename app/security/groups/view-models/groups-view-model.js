define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        GroupNavViewModel = require('./groups-nav-view-model'),
        GroupsDetailsViewModel = require('./groups-nav-detail-view-model'),
        GroupEvents = require('./group-events'),
        Region = require('spa/region'),
        Translator = require('system/globalization/translator'),
        view = require('text!../views/groups.html');

    require('system/lang/object');
    require('ui/elements/breadcrumb/view-model');

    function GroupsViewModel(applicationEvents,
                              kom,
                              groupsNavRegion,
                              groupsNavViewModel,
                              groupsDetailsRegion,
                              groupsDetailsViewModel,
                              groupEvents) {
        base.call(this, view);
        this.applicationEvents = applicationEvents;
        this.kom = kom;
        this.navRegion = groupsNavRegion;
        this.navViewModel = groupsNavViewModel;
        this.detailsRegion = groupsDetailsRegion;
        this.detailsViewModel = groupsDetailsViewModel;
        this.translator = Object.resolve(Translator);
        this.events = groupEvents;

        // isDirty implementation.
        this.isDirty = null;

        this.collapsedNav = null;
    }

    var base = Object.inherit(KnockoutViewModel, GroupsViewModel);
    GroupsViewModel.dependsOn = [ApplicationEvents, KnockoutManager, Region, GroupNavViewModel, Region, GroupsDetailsViewModel, GroupEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    GroupsViewModel.prototype.open =
        function catalogViewModel_open() {
            this.applicationEvents.titleChanged.raise(this.translate('GROUPS'), this);
        };

    GroupsViewModel.prototype.load =
        function groupsViewModel_load(routeArgs) {
            var dfd = new $.Deferred();

            this.navViewModel.load(routeArgs);
            this.detailsViewModel.load(routeArgs);

            // Initialize observables.
            this.collapsedNav = this.kom.observable(false);

            // Load data.

            // Initialize computeds.
            this.isDirty = this.kom.observable(false);

            // Parse route args.

            // Clear isDirty().
            clearIsDirty(this);

            return dfd.promise();
        };

    GroupsViewModel.prototype.activate =
        function groupsViewModel_activate() {
            this.navViewModel.activate();
            this.detailsViewModel.activate();

            // Initialize subscriptions.
            this.navViewModel.navCollapsed.add(navCollapsed.bind(null, this));
            this.navViewModel.navExpanded.add(navExpanded.bind(null, this));

            // Initialize event handlers.
            this.events.isGroupDirty.add(this.OnIsGroupDirty, this);

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/Groups.htm';
        };

    GroupsViewModel.prototype.attach =
        function groupsViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.navRegion.setElement(this.region.$element.find('div.groups-nav-container'));
            this.navViewModel.attach(this.navRegion);

            this.detailsRegion.setElement(this.region.$element.find('div.groups-details-container'));
            this.detailsViewModel.attach(this.detailsRegion);

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);
        };

    GroupsViewModel.prototype.detach =
        function groupsViewModel_detach(region) {
            this.navViewModel.detach(this.navRegion);
            this.navRegion.clear();

            this.detailsViewModel.detach(this.navRegion);
            this.detailsRegion.clear();

            base.prototype.detach.call(this, region);
        };

    GroupsViewModel.prototype.canUnload =
        function groupsViewModel_canUnload() {
            return this.navViewModel.canUnload();
        };

    GroupsViewModel.prototype.deactivate =
        function groupsViewModel_deactivate(region) {
            this.navViewModel.deactivate(this.navRegion);
            this.detailsViewModel.deactivate(this.detailsRegion);
            this.events.isGroupDirty.remove(this);

            this.navViewModel.navCollapsed.remove(navCollapsed.bind(null, this), this);
            this.navViewModel.navExpanded.remove(navExpanded.bind(null, this), this);

            //this.kom.disposeSubscriptions();
            //this.kom.disposeComputeds();
        };

    GroupsViewModel.prototype.unload =
        function groupsViewModel_unload() {
            this.navViewModel.unload();
            this.detailsViewModel.unload();

            //this.kom.disposeObservables();
        };

    GroupsViewModel.prototype.OnIsGroupDirty =
        function groupsViewModell_OnIsGroupDirty(dirty) {
            this.isDirty(dirty);
        };

    ///////////////////
    // BEHAVIOR
    ///////////////////

    GroupsViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
			{ 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    GroupsViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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

    GroupsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    function navCollapsed(self) {
        self.collapsedNav(true);
    }

    function navExpanded(self) {
        self.collapsedNav(false);
    }

    function clearIsDirty(self) {
        self.isDirty(false);
    }

    return GroupsViewModel;
});