define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../services/security-service'),
        ko = require('knockout'),
        GroupModel = require('../model/group-model'),
        groupAdapter = require('../adapters/group-adapter'),
        UserModel = require('../model/user-model'),
        userAdapter = require('../adapters/user-adapter'),
        view = require('text!../views/group.html');
    require('system/lang/object');
    require('spa/ko/extenders/confirmable');
    require('system/lang/string');

    //ToDo:
    // determine DTO state
    // Localization/Globalization
    // Site Filtering
    // filterGroups has embedded recurseGroups but others are calling these two sync
    function GroupViewModel(kom, applicationEvents, securityService) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.requestedGroupKey = null;

        // knockout observables
        this.rootNode = null; // a root-level group to which all groups are added for display.
        this.flatGroups = null; // a flat (non-recursive) list of all children of the rootNode.
        this.flatGroupsFiltered = null; // flatGroups, but excluding the selectedGroup and its children and ancestors.
        this.listedGroups = null;  // Computed - a sorted list of the children of the navigatedGroup.
        this.navigatedGroup = null; // Holds the parent item (in the header) of the hierarchical view.
        this.selectedGroup = null; // Holds the currently selected item from the group hierarchical view.
        this.selectedGroupDetails = null; // Holds the current item in the group details pane.
        this.isGroupPathVisible = null;
        this.canGoBack = null;
        this.canShowPath = null;
        this.canDrillDown = null;
        this.canAddGroup = null;
        this.isEditPending = null;
        this.isDirty = null;
        this.isNew = null;
        this.allUsers = null;
        this.allUsersFiltered = null;
        this.allUsersFilterText = null;
        this.assignedUsersFiltered = null;
        this.assignedUsersFilterText = null;
    }

    var base = Object.inherit(KnockoutViewModel, GroupViewModel);
    GroupViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService];

    ///////////////////
    // Lifecycle
    ///////////////////

    GroupViewModel.prototype.load =
        function groupViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            this.rootNode = this.kom.observable(constructRootNode(this));

            this.selectedGroupDetails = this.kom.observable();

            this.selectedGroup = this.kom.observable(this.rootNode()).extend({
                confirmable: {
                    message: this.translate('SEC_GROUP_UNSAVED_CHANGES') + '\n\n' +
                             this.translate('ARE_YOU_SURE_CONTINUE'),
                    unless: function () {
                        return !self.isDirty();
                    }
                }
            });

            this.navigatedGroup = this.kom.observable(this.rootNode());
            this.isGroupPathVisible = this.kom.observable(false);
            this.allUsers = this.kom.observableArray();
            this.isEditPending = this.kom.observable(false);

            this.securityService.getGroups(true, false)
                .done(getGroups_done.bind(null, this, dfd))
                .fail(handleAjaxRequestError.bind(null, this));

            this.securityService.getUsers(true, true)
                .done(getUsers_done.bind(null, this, dfd))
                .fail(handleAjaxRequestError.bind(null, this));

            this.isDirty = this.kom.isDirty;
            this.isNew = this.kom.computed(isNew_read.bind(null, this));
            this.canGoBack = this.kom.computed(canGoBack_read.bind(null, this));
            this.canShowPath = this.kom.computed(canShowPath_read.bind(null, this));
            this.canDrillDown = this.kom.computed(canDrillDown_read.bind(null, this));
            this.canAddGroup = this.kom.computed(canAddGroup_read.bind(null, this));
            this.canDeleteGroup = this.kom.computed(canDeleteGroup_read.bind(null, this));

            this.listedGroups = this.kom.computed(listedGroups_read.bind(null, this));

            this.flatGroups = this.kom.computed(flattenGroups.bind(null, this));
            this.flatGroupsFiltered = this.kom.computed(flatGroupsFiltered_read.bind(null, this));

            this.allUsersFilterText = this.kom.observable();
            this.allUsersFiltered = this.kom.computed(allUsersFiltered_read.bind(null, this));
            this.assignedUsersFilterText = this.kom.observable();
            this.assignedUsersFiltered = this.kom.computed(assignedUsersFiltered_read.bind(null, this));

            // If routeArgs are defined, a specific group was requested.
            if (routeArgs && routeArgs.entityKey) {
                this.requestedGroupKey = routeArgs.entityKey.toString();
            }

            this.kom.tracker.hashFunction = createHash.bind(null, self);
            this.kom.tracker.markCurrentStateAsClean();

            return dfd.promise();
        };

    GroupViewModel.prototype.activate =
        function groupViewModel_activate() {
            // Subscribe to changes in group selection.
            this.kom.subscribe(this.selectedGroup,
                selectedGroup_beforeChange.bind(null, this),
                null, 'beforeChange');

            this.kom.subscribe(this.selectedGroup,
                selectedGroup_change.bind(null, this));

            this.kom.subscribe(this.selectedGroupDetails,
                selectedGroupDetails_change.bind(null, this));

            // Subscribe to changes in group navigation.
            this.kom.subscribe(this.navigatedGroup,
                navigatedGroup_change.bind(null, this));
        };

    GroupViewModel.prototype.attach =
        function groupViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
        };

    GroupViewModel.prototype.detach =
        function groupViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    GroupViewModel.prototype.canUnload =
        function groupViewModel_canUnload() {
            var confirmation = true;

            // If we return false, it should prevent the app from navigating away
            // from the current URL.  This should work for navigation triggered by the
            // app OR by the browser (i.e. refresh, back, forward browser buttons).
            if (this.isDirty()) {
                confirmation = confirm(this.translate('SEC_GROUP_UNSAVED_CHANGES') + '\n\n' +
                                       this.translate('ARE_YOU_SURE_CONTINUE'));
            }

            return confirmation;
        };

    GroupViewModel.prototype.deactivate =
        function groupViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
        };

    GroupViewModel.prototype.unload =
        function groupViewModel_unload() {
            this.kom.disposeObservables();
        };

    /////////////////////
    // Behavior
    /////////////////////

    GroupViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    // Navigation behavior

    GroupViewModel.prototype.selectGroup =
        function groupViewModel_selectGroup(data, event) {
            var smallGroup = ko.dataFor(event.target),
                smallGroupUrl = 'security/manager/group/';

            if (!smallGroup || !(smallGroup instanceof GroupModel)) {
                return;
            }

            smallGroupUrl += smallGroup.key;

            if ($(event.target).hasClass('group-drill-down') && this.canDrillDown()) {
                // Drill down the hierarchy and display the current element's children.
                // This only affects the navigation pane.
                this.navigatedGroup(smallGroup);
            } else {
                // Sets the currently selected group from the navigation control,
                // triggering the details pane to display the group's details.
                if (this.selectedGroup() !== smallGroup) {
                    this.selectedGroup(smallGroup);
                    //this.applicationEvents.navigate.raise(smallGroupUrl, { replace: true });
                }
            }

            this.isGroupPathVisible(false);
        };

    GroupViewModel.prototype.groupGoBack =
        function groupViewModel_groupGoBack() {
            // Navigate to the parent group.
            this.navigatedGroup(this.navigatedGroup().parent());
            this.scrollToActiveGroupListItem();
        };

    GroupViewModel.prototype.groupShowPath =
        function groupViewModel_groupShowPath() {
            if (this.isGroupPathVisible()) {
                this.isGroupPathVisible(false);
            } else {
                this.isGroupPathVisible(true);
            }
        };

    GroupViewModel.prototype.selectPathGroup =
        function groupViewModel_selectPathGroup(data, event) {
            var smallGroup = ko.dataFor(event.target);

            if (!smallGroup || !(smallGroup instanceof GroupModel)) {
                return;
            }

            this.navigatedGroup(smallGroup);
            this.scrollToActiveGroupListItem();
        };

    GroupViewModel.prototype.scrollToActiveGroupListItem =
        function groupViewModel_scrollToActiveGroupListItem() {
            var $item = this.region.$element.find('.group-list>.group-list-item.active').first(),
                $list = $item.closest('.group-list'),
                position = $item.position(),
                scrollTop = $list.scrollTop();

            if (!position) {
                return;
            }

            $list.scrollTop(scrollTop + position.top);
        };

    // Details behavior

    GroupViewModel.prototype.loadGroupDetails =
        function groupViewModel_loadGroupDetails(groupKey) {
            var self = this,
                dfd = new $.Deferred();

            if (!groupKey) {
                return;
            }

            self.securityService.getGroup(groupKey)
                .done(getGroup_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self));

            return dfd.promise();
        };

    GroupViewModel.prototype.assignUser =
        function groupViewModel_assignUser(data, event) {
            var vm = ko.contextFor(event.target).$root,
                user = ko.dataFor(event.target);

            // Only process event if the icon was clicked.
            if (!$(event.target).is('i')) {
                return;
            }

            if (user instanceof UserModel &&
                !_.contains(_.pluck(vm.selectedGroupDetails().assignedUsers(), 'key'), user.key)) {

                vm.selectedGroupDetails().assignedUsers.push(user);
            }
        };

    GroupViewModel.prototype.unassignUser =
        function groupViewModel_unassignUser(data, event) {
            var vm = ko.contextFor(event.target).$root,
                user = ko.dataFor(event.target);

            // Only process event if the icon was clicked.
            if (!$(event.target).is('i')) {
                return;
            }

            if (user instanceof UserModel) {
                vm.selectedGroupDetails().assignedUsers.remove(function (u) { return u.key === user.key; });
            }
        };

    GroupViewModel.prototype.saveGroup =
        function groupViewModel_saveGroup(data, event) {
            var vm = ko.contextFor(event.target).$root,
                dfd = new $.Deferred(),
                dto = groupAdapter.toDTO(vm.selectedGroupDetails());

            if (!vm.selectedGroupDetails().id().trim()) {
                alert(vm.translate('SEC_GROUP_ENTER_GROUP_ID')); return;
            }
            if (!vm.selectedGroupDetails().caption().trim()) {
                alert(vm.translate('SEC_GROUP_ENTER_GROUP_CAPTION')); return;
            }

            vm.isEditPending(true);

            // Check for new group.
            if (vm.selectedGroupDetails().key) {
                vm.securityService.putGroup(dto)
                    .done(putGroup_done.bind(null, vm, dfd))
                    .fail(handleAjaxRequestError.bind(null, vm));
            } else {
                vm.securityService.postGroup(dto)
                    .done(postGroup_done.bind(null, vm, dfd))
                    .fail(handleAjaxRequestError.bind(null, vm));
            }

            return dfd.promise();
        };

    GroupViewModel.prototype.newGroup =
        function groupViewModel_newGroup(data, event) {
            var vm = ko.contextFor(event.target).$root,
                newGroup = new GroupModel(),
                newGroupDetail;

            if (!vm.navigatedGroup()) {
                return;
            }

            newGroup.id(vm.translate('SEC_GROUP_NEW_GROUP'));
            newGroup.caption(vm.translate('SEC_GROUP_NEW_GROUP'));
            newGroup.parentKey(vm.navigatedGroup().key);
            newGroup.parent(vm.navigatedGroup());
            newGroup.isActive(true);

            vm.navigatedGroup().children.push(newGroup);
            vm.selectedGroup(newGroup);

            // Clone the newGroup, so that we are not referencing
            // it in the list.  Otherwise, renaming the group causes
            // the new item to scroll out of the list view, due to the
            // dependency chain created.  We want this GroupDetail to behave
            // similarly to the GroupDetail that we load on-demand from the
            // server.  In that instance, there is no dependency chain.
            newGroupDetail = cloneGroup(newGroup, true);
            vm.selectedGroupDetails(newGroupDetail);

            // Scroll to the selected group.
            vm.scrollToActiveGroupListItem();
        };

    function testStateDialog_done(self, data) {
        alert(JSON.stringify(data));
    }

    function testStateDialog_fail(self, data) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = 'State dialog failed to resolve.\n\n' + (data || 'No data returned.'),
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);

        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    GroupViewModel.prototype.deleteGroup =
        function groupViewModel_deleteGroup(data, event) {
            var vm = ko.contextFor(event.target).$root,
                dfd = new $.Deferred(),
                confirmMsg = vm.translate('SEC_GROUP_CONFIRM_DELETE');

            if (confirm(confirmMsg)) {
                vm.isEditPending(true);

                vm.securityService.deleteGroup(vm.selectedGroupDetails().key)
                    .done(deleteGroup_done.bind(null, vm, dfd))
                    .fail(handleAjaxRequestError.bind(null, vm));
                return dfd.promise();
            }
        };

    //////////////////////
    // Implementation
    //////////////////////

    function constructRootNode(self) {
        var root = new GroupModel();

        root.id(self.translate('GROUPS'));
        root.caption(self.translate('GROUPS'));
        root.key = '0';

        return root;
    }

    function finalizeSaveAction(self) {
        if (!self || !self.kom || !self.selectedGroupDetails()) {
            return;
        }

        // Update the displayed group details.
        self.kom.tracker.markCurrentStateAsClean();
        self.loadGroupDetails(self.selectedGroupDetails().key);

        // Refresh the list.
        processGroupAssignments(self);
    }

    function putGroup_done(self, dfd) {
        dfd.resolve();

        if (!self || !self.isEditPending()) {
            return;
        }

        self.isEditPending(false);

        // Update the UI to reflect changes.
        finalizeSaveAction(self);
    }

    function postGroup_done(self, dfd, data) {
        var newGroupKey = data.key;
        dfd.resolve();

        if (!self ||
            !self.isEditPending ||
            !self.selectedGroupDetails() ||
            !self.selectedGroup()) {
            return;
        }

        self.isEditPending(false);

        // Make sure the key is set.
        self.selectedGroupDetails().key = newGroupKey;
        self.selectedGroup().key = newGroupKey;

        // Update the UI to reflect changes.
        finalizeSaveAction(self, newGroupKey);
    }

    function deleteGroup_done(self, dfd) {
        var parent;
        dfd.resolve();

        if (!self ||
            !self.isEditPending ||
            !self.selectedGroup() ||
            !self.selectedGroup().parent() ||
            !self.kom ||
            !self.navigatedGroup) {
            return;
        }

        self.isEditPending(false);

        parent = self.selectedGroup().parent();

        // Remove the deleted group from the collection.
        parent.children.remove(self.selectedGroup());

        // Ensure the selected group detail is not dirty.  This
        // will suppress the prompt to navigate away from the deleted
        // group.
        self.kom.tracker.markCurrentStateAsClean();

        // Select the parent group.
        self.navigatedGroup(parent);
        self.selectedGroup(parent);

        self.scrollToActiveGroupListItem();
    }

    /// Update the group tree control to show the current group in the correct position,
    /// taking into account the group's parent may have changed.
    function processGroupAssignments(self) {
        var oldParentGroup,
            newParentGroup;

        if (!self.selectedGroupDetails()) {
            return;
        }

        // Determine the old and new parents, so we can update their
        // children collections appropriately.
        oldParentGroup = findGroupInFlatList(self, self.selectedGroup().parentKey());
        oldParentGroup = oldParentGroup || self.rootNode();
        newParentGroup = findGroupInFlatList(self, self.selectedGroupDetails().parentKey());
        newParentGroup = newParentGroup || self.rootNode();

        // Copy the parents and children from the old group, since
        // these relationships are created only when we load the entire
        // list of groups from the server.
        self.selectedGroupDetails().parent(newParentGroup);
        self.selectedGroupDetails().children(self.selectedGroup().children());

        // Update the old and new parents' collections.
        oldParentGroup.children.remove(self.selectedGroup());
        newParentGroup.children.push(self.selectedGroupDetails());

        // If currently navigated to the parent group,
        // change navigation to the new parent. Otherwise,
        // update the navigated group with our current detail
        // object.
        if (oldParentGroup === self.navigatedGroup()) {
            self.navigatedGroup(newParentGroup);
        } else {
            self.navigatedGroup(self.selectedGroupDetails());
        }

        // Update the selected group with our current detail object.
        self.selectedGroup(self.selectedGroupDetails());

        self.scrollToActiveGroupListItem();
    }

    function findGroupInFlatList(self, groupKey) {
        return _.find(self.flatGroups(), function (item) {
            return item.key === groupKey;
        });
    }

    function getGroups_done(self, dfd, dtos) {
        var rootNode = self.rootNode(),
            requestedGroup,
            i = 0;

        dfd.resolve();

        if (!self || !rootNode) {
            return;
        }

        rootNode.children(groupAdapter.toModelObjectHierarchy(dtos));

        // Assign the rootNode to the parent() property of each group node.
        for (i = 0; i !== rootNode.children().length; i++) {
            rootNode.children()[i].parent(rootNode);
        }

        // If a specific group was requested, display that group.
        if (self.requestedGroupKey) {
            // Find the group in the list.
            requestedGroup = findGroupInFlatList(self, self.requestedGroupKey);

            // Select the group.
            self.selectedGroup(requestedGroup);

            // Set the navigation context to the group's parent.
            self.navigatedGroup(requestedGroup.parent());

            // Scroll to the active group.
            self.scrollToActiveGroupListItem();
        }
    }

    function getUsers_done(self, dfd, dtos) {
        dfd.resolve();

        if (!self || !self.allUsers) {
            return;
        }

        self.allUsers(userAdapter.toModelObjectArray(dtos));
    }

    function getGroup_done(self, dfd, dto) {
        var model = groupAdapter.toModelObject(dto);

        dfd.resolve();

        if (!self || !self.selectedGroupDetails) {
            return;
        }

        self.selectedGroupDetails(model);
    }

    function selectedGroup_beforeChange(self, oldValue) {
        if (oldValue) {
            oldValue.isSelected(false);

            if (oldValue.key === undefined) {
                // The old value is a new group, and we need to remove it from the list.
                oldValue.parent().children.remove(oldValue);
            }
        }
    }

    function selectedGroup_change(self, newValue) {
        // Hide the groupPath drop down.
        self.isGroupPathVisible(false);

        if (newValue) {
            newValue.isSelected(true);
        }

        if (newValue.key) {
            // Retrieve the group details from the server and hydrate
            // the Group Details form controls.
            self.loadGroupDetails(newValue.key);
        } else {
            // Clear the selected group details view.
            self.selectedGroupDetails(null);
        }
    }

    function selectedGroupDetails_change(self) {
        self.kom.tracker.markCurrentStateAsClean();
        self.assignedUsersFilterText('');
        self.allUsersFilterText('');
    }

    function navigatedGroup_change(self) {
        // Hide the groupPath drop down.
        self.isGroupPathVisible(false);
    }

    function isNew_read(self) {
        if (self.selectedGroupDetails()) {
            return self.selectedGroupDetails().key === '0' || self.selectedGroupDetails().key === undefined;
        } else {
            return false;
        }
    }

    function allUsersFiltered_read(self) {
        var retVal = self.allUsers,
            filter = self.allUsersFilterText();

        retVal = ko.utils.arrayFilter(retVal(), filterAllUsers.bind(null, self, filter));
        retVal.sort(sortUsers);

        return retVal;
    }

    function filterAllUsers(self, filter, u) {
        var matchesFilter = true,// Only return items that don't contain the filter text in their displayValue.
            notAlreadyAssigned = false; // Only return items that aren't in the assigned users list.

        // Check to see if the current user matches the filter.
        matchesFilter = filterSearchText(filter, u);

        // Check to see if the current user is already assigned to the current group.
        if (self.selectedGroupDetails() && self.selectedGroupDetails().assignedUsers()) {
            notAlreadyAssigned = _.find(self.selectedGroupDetails().assignedUsers(),
                compareUsers.bind(null, u)) ? false : true;
        }

        return matchesFilter && notAlreadyAssigned;
    }

    function assignedUsersFiltered_read(self) {
        var retVal,
            filter = self.assignedUsersFilterText();

        if (!self.selectedGroupDetails()) {
            return [];
        } else {
            retVal = self.selectedGroupDetails().assignedUsers;
        }

        retVal = ko.utils.arrayFilter(retVal(), filterSearchText.bind(null, filter));

        retVal.sort(sortUsers);

        return retVal;
    }

    function compareUsers(user1, user2) {
        return user1.key === user2.key;
    }

    function sortUsers(left, right) {
        var leftDisplayName = left.displayName().toLowerCase(),
            rightDisplayName = right.displayName().toLowerCase();

        return leftDisplayName === rightDisplayName ? 0
            : (leftDisplayName < rightDisplayName ? -1
            : 1);
    }

    function filterSearchText(searchText, u) {
        // Only return items that don't contain the filter text in their displayValue.
        if (searchText) {
            return (u.firstName().toLowerCase().startsWith(searchText.toLowerCase())) ||
                     (u.lastName().toLowerCase().startsWith(searchText.toLowerCase()));
        } else {
            return true;
        }
    }

    function listedGroups_read(self) {
        var selected = self.navigatedGroup(),
            retVal = self.rootNode().children;

        if (selected) {
            retVal = selected.children;
        }

        retVal.sort(function (left, right) {
            var leftDisplayName = left.displayName().toLowerCase(),
                rightDisplayName = right.displayName().toLowerCase();

            return leftDisplayName === rightDisplayName ? 0
                : (leftDisplayName < rightDisplayName ? -1
                : 1);
        });

        return retVal();
    }

    function canGoBack_read(self) {
        return self.navigatedGroup() &&
               self.navigatedGroup().parent() &&
               !self.isNew();
    }

    function canShowPath_read(self) {
        return self.canGoBack();
    }

    function canDrillDown_read(self) {
        return !self.isNew();
    }

    function canAddGroup_read(self) {
        return !self.isDirty();
    }

    function canDeleteGroup_read(self) {
        return self.selectedGroupDetails() &&
               self.selectedGroupDetails().key &&
               !self.isEditPending();
    }

    function flatGroupsFiltered_read(self) {
        var values = ko.utils.arrayFilter(self.flatGroups(), function (item) {
            // Only return items that don't contain the selected group in their path.
            // This will prevent the selected group from being added to its own decendants.
            var selectedGroupIndex = _.indexOf(item.path(), self.selectedGroup());
            return selectedGroupIndex === -1;
        });
        return values;
    }

    function flattenGroups(self, parents, currentList) {
        var i = 0;

        parents = parents || self.rootNode().children();
        currentList = currentList || [];

        for (i = 0; i !== parents.length; i++) {
            currentList.push(parents[i]);

            if (parents[i].children()) {
                flattenGroups(self, parents[i].children(), currentList);
            }
        }

        return currentList;
    }

    function handleAjaxRequestError(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);

        self.applicationEvents.errorOccured.raise(self, errorMessage);
        self.isEditPending(false);
    }

    function cloneGroup(groupModel, defaultToDirty) {
        defaultToDirty = defaultToDirty || false;

        return groupAdapter.toModelObject(ko.toJS(groupModel));
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedGroupDetails()) {
            return;
        }

        hashObject = {
            id: self.selectedGroupDetails().id(),
            key: self.selectedGroupDetails().key,
            caption: self.selectedGroupDetails().caption(),
            description: self.selectedGroupDetails().description(),
            isActive: self.selectedGroupDetails().isActive(),
            parentKey: self.selectedGroupDetails().parentKey(),
            assignedUsers: _.pluck(self.selectedGroupDetails().assignedUsers(), 'key')
        };

        return JSON.stringify(hashObject);
    }

    return GroupViewModel;
});
