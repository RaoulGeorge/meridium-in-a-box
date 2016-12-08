define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
    ApplicationEvents = require('application/application-events'),
    Translator = require('system/globalization/translator'),
    GroupEvents = require('./group-events'),
    KnockoutViewModel = require('spa/ko/knockout-view-model'),
    KnockoutManager = require('system/knockout/knockout-manager'),
    SecurityService = require('../../services/security-service'),
    groupAdapter = require('../../adapters/group-adapter'),
    GroupDTO = require('../../services/group-dto'),
    GroupModel = require('../../model/group-model'),
    view = require('text!../views/group-detail.html');

    require('ui/elements/tab-group/view-model');
    require('ui/elements/tab-group-item/view-model');
    require('ui/elements/combobox/view-model');

    function GroupsDetailsViewModel(kom, applicationEvents, securityService,groupEvents) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = groupEvents;
        // isDirty implementation.
        this.selectedGroup = null;

        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;


        // knockout observables
        this.isLoading = null;



    }

    var base = Object.inherit(KnockoutViewModel, GroupsDetailsViewModel);
    GroupsDetailsViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, GroupEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    GroupsDetailsViewModel.prototype.load =
        function groupDetailsViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();
            // Set up our observables.
            this.isLoading = this.kom.observable();
            this.selectedGroup = this.kom.observable();

            // Clear isDirty().
            clearIsDirty(this);

            return dfd.promise();
        };

    GroupsDetailsViewModel.prototype.activate =
        function userDetailViewModel_activate() {
            this.events.groupSelected.add(this.onGroupSelected, this);
            this.events.folderUpdated.add(this.onFolderUpdated, this);
            // Set up our computed observables.
            this.isDirty.subscribe(isDirtyChanged.bind(null, this));
        };

    GroupsDetailsViewModel.prototype.attach =
        function groupDetailsViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
        };

    GroupsDetailsViewModel.prototype.detach =
        function groupDetailsViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    GroupsDetailsViewModel.prototype.canUnload =
        function groupDetailsViewModel_canUnload() {
            return true;
        };

    GroupsDetailsViewModel.prototype.deactivate =
        function userDetailViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.groupSelected.remove(this);
            this.events.folderUpdated.remove(this);
        };

    GroupsDetailsViewModel.prototype.unload =
        function groupDetailsViewModel_unload() {
            this.kom.disposeObservables();
        };


    /////////////////////
    // Behavior
    /////////////////////

    GroupsDetailsViewModel.prototype.onFolderUpdated =
        function groupsNavViewModel_onFolderUpdated(folder) {
            clearIsDirty(this);
        };

    GroupsDetailsViewModel.prototype.onGroupSelected =
    function groupDetailsViewModel_onGroupSelected(group) {
        if (group !== null) {
            if (group.key!=='0') {
                this.selectedGroup(group);
                clearIsDirty(this);
            } else {
                this.selectedGroup(group);
            }
        } else {
            this.selectedGroup(null);
        }
    };

    GroupsDetailsViewModel.prototype.getGroup = function () {
        return this.selectedGroup();
    };

    GroupsDetailsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    //////////////////////
    // Implementation
    //////////////////////

    function constructNewGroup(self,key) {
        var newGroup = { id: 'newGroup', caption: 'newGroup', parentKey: key, key: '0', isActive: true };
        return new GroupDTO(newGroup);
    }

    function clearIsDirty(self) {
        // Clear isDirty().
        self.kom.tracker.markCurrentStateAsClean();
    }

    function isDirtyChanged(self, newValue) {
        self.events.isGroupDirty.raise(newValue);
    }

    function createHash(self) {
        var hashObject;
        if (!self.selectedGroup()) {
            hashObject = {
                key: '',
                id: '',
                caption: '',
                description: '',
                isActive: '',
                parentKey: ''
            };
            return JSON.stringify(hashObject);
        }

        hashObject = {
            key: self.selectedGroup().key,
            id: self.selectedGroup().id(),
            caption: self.selectedGroup().caption(),
            description: self.selectedGroup().description(),
            isActive: self.selectedGroup().isActive(),
            parentKey: self.selectedGroup().parentKey()
        };
        return JSON.stringify(hashObject);
    }

    return GroupsDetailsViewModel;
});
