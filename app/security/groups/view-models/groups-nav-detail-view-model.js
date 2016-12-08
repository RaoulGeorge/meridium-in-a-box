define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        GroupEvents = require('./group-events'),
        Region = require('spa/region'),
        GroupDTO = require('../../services/group-dto'),
        GroupModel = require('../../model/group-model'),
        groupAdapter = require('../../adapters/group-adapter'),
        GroupDetailsViewModel = require('./group-detail-view-model'),
        GroupDetailsUsersViewModel = require('./group-detail-users-view-model'),
        GroupDetailsRolesViewModel = require('./group-detail-roles-view-model'),
        view = require('text!../views/groups-nav-detail.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('ui/elements/breadcrumb/view-model');
    require('ui/elements/searchbox/view-model');
    require('system/lang/string');
    require('ui/elements/filter/filter-no-ko');

    function GroupNavDetailViewModel(kom, applicationEvents, securityService, groupDetailsViewModel, groupDetailsRegion, groupDetailsUsersViewModel, groupDetailsUsersRegion,
        groupDetailsRolesViewModel, groupDetailsRolesRegion, groupEvents) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = groupEvents;
        this.groupDetailsViewModel = groupDetailsViewModel;
        this.groupDetailsRegion = groupDetailsRegion;
        this.groupDetailsUsersViewModel = groupDetailsUsersViewModel;
        this.groupDetailsUsersRegion = groupDetailsUsersRegion;
        this.groupDetailsRolesViewModel = groupDetailsRolesViewModel;
        this.groupDetailsRolesRegion = groupDetailsRolesRegion;
        this.isDirty = null;
        // knockout observables
        this.selectedGroup = null;
        this.isLoading = null;
        this.canSave = null;
        this.canDelete = null;
        this.hasGroupSelected=null;
        this.canDisplayGroupDetails = null;
        this.canShowGroupDetails = null;
        this.canShowGroupUsers = null;
        this.canShowGroupRoles = null;
    }

    var base = Object.inherit(KnockoutViewModel, GroupNavDetailViewModel);
    GroupNavDetailViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, GroupDetailsViewModel, Region, GroupDetailsUsersViewModel, Region,
        GroupDetailsRolesViewModel, Region, GroupEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    GroupNavDetailViewModel.prototype.load =
        function group_nav_detail_ViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.selectedGroup = this.kom.observable();
            this.isLoading = this.kom.observable();
            this.isDirty = this.kom.observable();
            this.canShowGroupDetails = this.kom.observable(true);
            this.canShowGroupUsers = this.kom.observable(false);
            this.canShowGroupRoles = this.kom.observable(false);

            // load child VM
            this.groupDetailsViewModel.load(routeArgs);
            this.groupDetailsUsersViewModel.load(routeArgs);
            this.groupDetailsRolesViewModel.load(routeArgs);

            return dfd.promise();
        };

    GroupNavDetailViewModel.prototype.activate =
        function group_nav_detail_ViewModel_activate() {

            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.hasGroupSelected=this.kom.pureComputed(hasGroupSelected_read.bind(null, this));
            this.canDisplayGroupDetails = this.kom.pureComputed(canDisplayGroupDetails_read.bind(null, this));
            this.events.folderNavigated.add(this.onGroupSelected, this);
            this.events.isGroupDirty.add(this.OnIsGroupDirty, this);
            this.events.newGroup.add(this.OnNewGroup,this);
            // activate child VM
            this.groupDetailsViewModel.activate();
            this.groupDetailsUsersViewModel.activate();
            this.groupDetailsRolesViewModel.activate();
        };

    GroupNavDetailViewModel.prototype.attach =
        function group_nav_detail_ViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.groupDetailsRegion.setElement(this.region.$element.find('div.group-details-container'));
            this.groupDetailsViewModel.attach(this.groupDetailsRegion);

            this.groupDetailsUsersRegion.setElement(this.region.$element.find('div.group-details-users-container'));
            this.groupDetailsUsersViewModel.attach(this.groupDetailsUsersRegion);

            this.groupDetailsRolesRegion.setElement(this.region.$element.find('div.group-details-roles-container'));
            this.groupDetailsRolesViewModel.attach(this.groupDetailsRolesRegion);
        };

    GroupNavDetailViewModel.prototype.detach =
        function group_nav_detail_ViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            this.groupDetailsViewModel.detach(this.groupDetailsRegion);
            this.groupDetailsRegion.clear();

            this.groupDetailsUsersViewModel.detach(this.groupDetailsUsersRegion);
            this.groupDetailsUsersRegion.clear();

            this.groupDetailsRolesViewModel.detach(this.groupDetailsRolesRegion);
            this.groupDetailsRolesRegion.clear();
        };

    GroupNavDetailViewModel.prototype.canUnload =
        function group_nav_detail_canUnload() {
           // return !this.isDirty();
            return true;
        };

    GroupNavDetailViewModel.prototype.deactivate =
        function group_nav_detail_ViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.isGroupDirty.remove(this);
            this.events.newGroup.remove(this);
            this.groupDetailsViewModel.deactivate(this.groupDetailsRegion);
            this.groupDetailsUsersViewModel.deactivate(this.groupDetailsUsersRegion);
            this.groupDetailsRolesViewModel.deactivate(this.groupDetailsRolesRegion);
        };

    GroupNavDetailViewModel.prototype.unload =
        function group_nav_detail_unload() {
            this.kom.disposeObservables();
            this.groupDetailsViewModel.unload();
            this.groupDetailsUsersViewModel.unload();
            this.groupDetailsRolesViewModel.unload();
        };


    /////////////////////
    // Behavior
    /////////////////////

    GroupNavDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    GroupNavDetailViewModel.prototype.OnNewGroup =
        function group_nav_detail_ViewModel_onGroupSelected(parentKey) {
            var newGroup=constructNewGroup(this,parentKey);
            this.selectedGroup(groupAdapter.toModelObject(newGroup));
            this.events.folderAdded.raise(newGroup);
        };

    GroupNavDetailViewModel.prototype.onGroupSelected =
        function group_nav_detail_ViewModel_onGroupSelected(groupKey) {
            if (groupKey !== null) {
                if (groupKey==='0') {
                    this.events.groupSelected.raise(this.selectedGroup());
               } else {
                    this.service.getGroup(groupKey)
                        .done(getGroup_done.bind(null, this))
                        .fail(handleAjaxRequestError.bind(null, this));
                }
            } else {
                this.selectedGroup(null);
                this.events.groupSelected.raise(null);
            }

        };

        GroupNavDetailViewModel.prototype.OnIsGroupDirty =
        function group_nav_detail_ViewModel_OnIsGroupDirty(dirty) {
            this.isDirty(dirty);
        };

    GroupNavDetailViewModel.prototype.save =
        function group_nav_detail_ViewModel_save() {
            var group;
            var self = this;
            this.selectedGroup(this.groupDetailsViewModel.getGroup());
            this.selectedGroup().assignedUsers(this.groupDetailsUsersViewModel.getGroup().assignedUsers());
            this.selectedGroup().roles(this.groupDetailsRolesViewModel.getGroup().roles());
            group = groupAdapter.toDTO(this.selectedGroup());
            if (group.caption.length===0 || group.id.length===0) {
                MessageBox.showOk(this.translate('PROVIDE_REQUIRED_FIELDS_GROUP'),this.translate('SEC_ROLE_GROUPS'));
                return;
            }
            this.isLoading(true);
            if (group.key === '0') {
                this.service.postGroup(group)
                    .done(postGroup_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            } else {
                this.service.putGroup(group)
                     .done(putGroup_done.bind(null, this))
                     .fail(handleAjaxRequestError.bind(null, this));
            }

        };
      

    GroupNavDetailViewModel.prototype.showGroupDetails = function group_nav_detail_ViewModel_showGroupDetails() {
        this.canShowGroupDetails(true);
        this.canShowGroupUsers(false);
        this.canShowGroupRoles(false);
    };

    GroupNavDetailViewModel.prototype.showGroupUsers = function group_nav_detail_ViewModel_showGroupUsers() {
        this.canShowGroupDetails(false);
        this.canShowGroupUsers(true);
        this.canShowGroupRoles(false);
    };

    GroupNavDetailViewModel.prototype.showGroupRoles = function group_nav_detail_ViewModel_showGroupRoles() {
        this.canShowGroupDetails(false);
        this.canShowGroupUsers(false);
        this.canShowGroupRoles(true);
    };
    
    GroupNavDetailViewModel.prototype.deleteGroup = function group_nav_detail_ViewModel_delete() {
        this.service.checkGroupPriv(this.selectedGroup().key)
            .done(promptDeleteGroup.bind(null, this,confirmDelete_done.bind(null, this)))
            .fail(handleAjaxRequestError.bind(null, this));
    };

    GroupNavDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    //////////////////////
    // Implementation
    //////////////////////


    function constructNewGroup(self,key) {
        var newGroup = { id: 'newGroup', caption: 'newGroup', parentKey: key, key: '0', isActive: true };
        return new GroupDTO(newGroup);
    }

    function postGroup_done(self, response) {
        self.selectedGroup(groupAdapter.toModelObject(response));
        self.isDirty(false);
        self.isLoading(false);
        self.events.folderUpdated.raise(self.selectedGroup());
        self.events.isGroupDirty.raise(false);
        self.events.groupSelected.raise(self.selectedGroup());
    }

    function putGroup_done(self) {
        self.isDirty(false);
        self.isLoading(false);
        self.events.folderUpdated.raise(self.selectedGroup());
        self.events.isGroupDirty.raise(false);
        self.events.groupSelected.raise(self.selectedGroup());
    }

    function deleteGroup_done(self) {
        self.isLoading(false);
        self.events.isGroupDirty.raise(false);
        self.events.folderDeleted.raise(self.selectedGroup());
    }

    function getGroup_done(self, dto) {
        self.selectedGroup(groupAdapter.toModelObject(dto));
        self.events.groupSelected.raise(self.selectedGroup());
    }

    function confirmDelete_done(self, clickedButtonIndex) {

        if (clickedButtonIndex === 0) {
            self.isLoading(true);
            self.service.deleteGroup(self.selectedGroup().key)
                            .done(deleteGroup_done.bind(null, self))
                            .fail(handleAjaxRequestError.bind(null, self));
        }
    }

    function canSave_read(self) {
        return self.isDirty() && (self.selectedGroup() && !self.isLoading());
    }

    function canDelete_read(self) {
        if (self.selectedGroup()) {
            return self.selectedGroup().key > 0 && !self.isLoading();
        }
        return false;
    }

    function hasGroupSelected_read(self) {
        return self.selectedGroup();
    }
      

    function canDisplayGroupDetails_read(self) {
        return self.selectedGroup();
    }

    function promptDeleteGroup(self,doneCallback, response) {
        var msg,title;
        if (response) {
            msg = self.translate('SEC_GROUP_CANT_DELETE_PRIV'),
                title = self.translate('SEC_ROLE_GROUPS');
            MessageBox.showOk(msg, title);
        } else {
            msg = self.translate('SEC_GROUP_CONFIRM_DELETE_CURRENT'),
                title = self.translate('CONFIRM_DELETE');
            MessageBox.showYesNo(msg, title)
                .done(doneCallback);
        }
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

    return GroupNavDetailViewModel;
});
