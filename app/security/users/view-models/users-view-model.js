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
        UserDTO = require('../../services/user-dto'),
        UserSiteDTO = require('../../services/usersite-dto'),
        convert = require('system/lang/converter'),
        UserEvents = require('./user-events'),
        userAdapter = require('../../adapters/user-adapter'),
        UserDetailViewModel = require('./user-detail-view-model'),
        UserDetailGroupsViewModel = require('./user-detail-groups-view-model'),
        UserDetailRolesViewModel = require('./user-detail-roles-view-model'),
        UserDetailSitesViewModel = require('./user-detail-sites-view-model'),
        view = require('text!../views/users.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('ui/elements/breadcrumb/view-model');
    require('ui/elements/searchbox/view-model');
    require('system/lang/string');
    require('ui/elements/filter/filter-no-ko');
    require('ui/elements/tab-group/view-model');
    require('ui/elements/tab-group-item/view-model');

    function UserViewModel(kom, applicationEvents, securityService, userDetailViewModel, userDetailRegion,userDetailGroupsViewModel,userDetailGroupsRegion,
        userDetailRolesViewModel,userDetailRolesRegion,userDetailSitesViewModel,userDetailSitesRegion,userEvents) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = userEvents;
        this.activeOnly=null;
        this.userDetailViewModel = userDetailViewModel;
        this.userDetailRegion = userDetailRegion;
        this.userDetailGroupsViewModel = userDetailGroupsViewModel;
        this.userDetailGroupsRegion = userDetailGroupsRegion;
        this.userDetailRolesViewModel = userDetailRolesViewModel;
        this.userDetailRolesRegion = userDetailRolesRegion;
        this.userDetailSitesViewModel = userDetailSitesViewModel;
        this.userDetailSitesRegion = userDetailSitesRegion;

        // isDirty implementation.
        this.isDirty = null;

        // Reference to the panel control containing user list.
        this.panel = null;
        this.$panelControl = null;
        //this.users = null; // list of all users loaded from the data source
        //this.filteredUsers = null; // computed: this.users list with filter applied
        this.userSearchbox = null;
        this.userFilter = null;

        // knockout observables
        this.selectedUser = null;
        this.isLoading = null;
        this.canSave = null;
        this.canAdd = null;
        this.canCopy = null;
        this.skipSelectingCheck = false;
        this.canDisplayUserDetails = null;
        this.availableUsers = null;
        this.canShowUserDetails = null;
        this.canShowUserGroups = null;
        this.canShowUserRoles = null;
        this.canShowUserSites = null;
        this.canSearch = null;
        this.userSearchbox = null;
        this.filterSelection = null;
        this.isFilteredOut=null;
        this.navCollapsed = null;
        this.searchCleared=false;
        //this.savedUserList = null;
        //this.sites = null;

        this.searchValue = null;
        this.statusValue = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserViewModel);
    UserViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, UserDetailViewModel, Region, UserDetailGroupsViewModel, Region,
        UserDetailRolesViewModel, Region, UserDetailSitesViewModel, Region,UserEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    UserViewModel.prototype.load =
        function userViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.selectedUser = this.kom.observable();
            this.isFilteredOut=this.kom.observable(false);
            this.isLoading = this.kom.observable();
            this.activeOnly = this.kom.observable(false);
            //this.users = this.kom.observableArray();
            this.userFilter = this.kom.observable();
            this.canShowUserDetails = this.kom.observable(true);
            this.canShowUserGroups = this.kom.observable(false);
            this.canShowUserRoles = this.kom.observable(false);
            this.canShowUserSites = this.kom.observable(false);
            this.sortValue = this.kom.observable();
            this.navCollapsed = this.kom.observable(false);
            this.isDirty=this.kom.observable(false);
            this.filterSelection = this.kom.observable("All");
            this.filter=null;

            // Clear isDirty().
            clearIsDirty(this);

            // load child VM
            this.userDetailViewModel.load(routeArgs);
            this.userDetailGroupsViewModel.load(routeArgs);
            this.userDetailRolesViewModel.load(routeArgs);
            this.userDetailSitesViewModel.load(routeArgs);

            //self.securityService.getUsers(true, self.activeOnly())
            //    .done(getUsers_done.bind(null, self, dfd))
            //    .fail(handleAjaxRequestError.bind(null, self, dfd));

            //self.securityService.getSites()
            //    .done(getSites_done.bind(null, self))
            //    .fail(handleAjaxRequestError.bind(null, self));

            return dfd.promise();
        };

    UserViewModel.prototype.activate =
        function userViewModel_activate() {

            // Set up our computed observables.
            //this.filteredUsers = this.kom.computed(filteredUsers_read.bind(null, this));
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));
            this.canCopy = this.kom.pureComputed(canCopy_read.bind(null, this));
            this.canDisplayUserDetails = this.kom.pureComputed(canDisplayUserDetails_read.bind(null, this));
            this.canSearch = this.kom.pureComputed(canSearch_read.bind(null, this));
            //this.kom.subscribe(this.filteredUsers, filteredUsers_subscribe.bind(null, this));
            this.events.isUserDirty.add(this.OnIsUserDirty, this);
            // activate child VM
            this.userDetailViewModel.activate();
            this.userDetailGroupsViewModel.activate();
            this.userDetailRolesViewModel.activate();
            this.userDetailSitesViewModel.activate();

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/Users.htm';
        };

    UserViewModel.prototype.attach =
        function userViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            // Configure the panel control.
            this.$panelControl = this.region.$element.find('mi-panel');
            this.availableUsers = this.$panelControl.get(0);
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.availableUsers);
            }
            // **************
            // Must do this here, or IE will blow up when you switch tabs with a dirty record.  Called Selcting when coming back to tab.
            // don't bind this event in knockout.
            // ******************
            this.$panelControl.on('selecting', onUserSelecting.bind(null, this));
            // Wire up the web component loaders for data loading.
            this.availableUsers.loader = loadUsers.bind(null, this);

            this.$panelControl.on('click', collapsible_change.bind(null, this));

            this.userDetailRegion.setElement(this.region.$element.find('div.user-detail-container'));
            this.userDetailViewModel.attach(this.userDetailRegion);

            this.userDetailGroupsRegion.setElement(this.region.$element.find('div.user-detail-groups-container'));
            this.userDetailGroupsViewModel.attach(this.userDetailGroupsRegion);

            this.userDetailRolesRegion.setElement(this.region.$element.find('div.user-detail-roles-container'));
            this.userDetailRolesViewModel.attach(this.userDetailRolesRegion);

            this.userDetailSitesRegion.setElement(this.region.$element.find('div.user-detail-sites-container'));
            this.userDetailSitesViewModel.attach(this.userDetailSitesRegion);

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

            this.userSearchbox = this.region.$element.find('mi-tool-bar mi-searchbox')[0];
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.userSearchbox);
            }
            this.userSearchbox.searchCallback = userSearch.bind(null, this);

            this.filter = this.region.$element.find('mi-filter-no-ko')[0];
            Element.upgrade(this.filter);
            this.filter.loader = this.consumerloader.bind(null, this);
            this.filter.filterCB = this.filterCB.bind(null, this);
            this.canShowUserDetails(true);
            this.canShowUserGroups(false);
            this.canShowUserRoles(false);
            this.canShowUserSites(false);

            //if (this.savedUserList) {
            //    //Restoring list to saved list
            //    this.availableUsers.listGroup.items=this.savedUserList;
            //    this.skipSelectingCheck=true;
            //    this.searchCleared=true;
            //    if(this.selectedUser()) {
            //        this.availableUsers.value = userAdapter.toDTO(this.selectedUser());
            //    } else if(this.userDetailViewModel.getUser()) {
            //        this.availableUsers.value = userAdapter.toDTO(this.userDetailViewModel.getUser());
            //    }
            //    this.savedUserList=null;
            //}
            //this.userDetailViewModel.sites(this.sites);
        };

    UserViewModel.prototype.detach =
        function userViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            this.userDetailViewModel.detach(this.userDetailRegion);
            this.userDetailRegion.clear();

            this.userDetailGroupsViewModel.detach(this.userDetailGroupsRegion);
            this.userDetailGroupsRegion.clear();

            this.userDetailRolesViewModel.detach(this.userDetailRolesRegion);
            this.userDetailRolesRegion.clear();

            this.userDetailSitesViewModel.detach(this.userDetailSitesRegion);
            this.userDetailSitesRegion.clear();
        };

    UserViewModel.prototype.canUnload =
        function userViewModel_canUnload() {
            var dfd = $.Deferred();
            // If we return false, it should prevent the app from navigating away
            // from the current URL.  This should work for navigation triggered by the
            // app OR by the browser (i.e. refresh, back, forward browser buttons).
            if (this.isDirty()) {
                // Prompt the user to lose changes.
                promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
            } else {
                dfd.resolve();
            }

            return dfd.promise();
        };

    UserViewModel.prototype.deactivate =
        function userViewModel_deactivate() {
            //if (this.selectedUser()) {
            //    this.savedUserList=this.availableUsers.listGroup.items;
            //}
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.userDetailViewModel.deactivate(this.userDetailRegion);
            this.userDetailGroupsViewModel.deactivate(this.userDetailGroupsRegion);
            this.userDetailRolesViewModel.deactivate(this.userDetailRolesRegion);
            this.userDetailSitesViewModel.deactivate(this.userDetailSitesRegion);
            this.events.isUserDirty.remove(this);
        };

    UserViewModel.prototype.unload =
        function userViewModel_unload() {
            this.kom.disposeObservables();
            this.userDetailViewModel.unload();
            this.userDetailGroupsViewModel.unload();
            this.userDetailRolesViewModel.unload();
            this.userDetailSitesViewModel.unload();
        };


    /////////////////////
    // Behavior
    /////////////////////

    UserViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
			{ 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    UserViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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


    UserViewModel.prototype.onUserSelected =
        function userViewModel_onUserSelected(data, event) {
            var self = this;
            // IE sometimes fires this event with undefined.
            if (!this.skipSelectingCheck) {

                if (event.target.value) {
                    if (event.target.value.key) {
                        var userKey = event.target.value.key,
                            getUser;

                        if (userKey !== '0' && !(!!this.selectedUser() && userKey === this.selectedUser().key)) {
                            this.isLoading(true);
                            getUser = self.securityService.getUser(userKey)
                                .done(getUser_done.bind(null, self))
                                .fail(handleAjaxRequestError.bind(null, self));


                            $.when(getUser)
                                .done(userLoading_done.bind(null, this));
                        } else {
                           // updateSelectedUser(self, userAdapter.toModelObject(constructNewUser(this)));
                        }
                    }
                }
            } else {
                if (!this.searchCleared) {
                    clearIsDirty(self);
                }
                this.searchCleared=false;
            }
            this.skipSelectingCheck = false;
        };

    UserViewModel.prototype.onUserAdding =
        function userViewModel_onUserAdding(data, event) {
            // Create a new user.
            var newUser = constructNewUser(this);
            // Add the DTO to the panel / list.
            var panelItems = this.availableUsers.listGroup.items;
            panelItems.push(newUser);
            this.availableUsers.listGroup.items = sortByDisplayName(panelItems);

            // Select the newly added item from the panel / list.
            this.availableUsers.value = newUser;
            updateSelectedUser(this, userAdapter.toModelObject(newUser));
            this.userDetailViewModel.userAdded();
        };



    UserViewModel.prototype.save =
        function userViewModel_save() {
            var user;
            var self = this;
            this.selectedUser(this.userDetailViewModel.getUser());
            this.selectedUser().groups(this.userDetailGroupsViewModel.getUser().groups());
            //this.selectedUser().sites(this.userDetailSitesViewModel.getUser().sites());
            this.selectedUser().sites(this.userDetailSitesViewModel.getUserSites());
            this.selectedUser().roles(this.userDetailRolesViewModel.getUser().roles());
            user = userAdapter.toDTO(this.selectedUser());

            this.isLoading(true);
            if (user.key === '0') {
                if (this.selectedUser().lastName()==='') {
                    MessageBox.showOk(this.translate("SEC_USER_ENTER_LAST_NAME"),this.translate("SEC_USER_DETAILS"));
                    this.isLoading(false);
                    return;
                }
                if (this.selectedUser().id()==='') {
                    MessageBox.showOk(this.translate("SEC_USER_ENTER_USER_ID"),this.translate("SEC_USER_DETAILS"));
                    this.isLoading(false);
                    return;
                }
                if (this.selectedUser().newPassword()==='') {
                    MessageBox.showOk(this.translate("PASSWORD_REQUIRED"),this.translate("SSRS_CONFIG_USER_PASSWORD"));
                    this.isLoading(false);
                    return;
                }
                if (!this.selectedUser().defaultSiteKey() || this.selectedUser().defaultSiteKey() === '0') {
                    MessageBox.showOk(this.translate("SEC_USER_SELECT_DEFAULT_SITE"), this.translate("SEC_USER_DETAILS"));
                    this.isLoading(false);
                    return;
                }
                this.securityService.postUser(user)
                    .done(postUser_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            } else {
                if (this.selectedUser().lastName()==='') {
                    MessageBox.showOk(this.translate("SEC_USER_ENTER_LAST_NAME"),this.translate("SEC_USER_DETAILS"));
                    this.isLoading(false);
                    return;
                }
                if (this.selectedUser().id()==='') {
                    MessageBox.showOk(this.translate("SEC_USER_ENTER_USER_ID"),this.translate("SEC_USER_DETAILS"));
                    this.isLoading(false);
                    return;
                }
                if (!this.selectedUser().defaultSiteKey()) {
                    MessageBox.showOk(this.translate("SEC_USER_SELECT_DEFAULT_SITE"), this.translate("SEC_USER_DETAILS"));
                    this.isLoading(false);
                    return;
                }
                this.userDetailViewModel.save();
                this.securityService.putUser(user)
                    .done(putUser_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            }
        };

    UserViewModel.prototype.copy =
       function userViewModel_copy() {
           var copyUser = userAdapter.toDTO(this.selectedUser());
           copyUser.id = 'newuser';
           copyUser.lastName = 'user';
           copyUser.initial = '';
           copyUser.firstName = 'new';
           copyUser.email = '';
           copyUser.password = '';
           copyUser.newPassword = '';
           copyUser.key = '0';
           copyUser.displayName = 'user, new';
           copyUser.isActive = true;
           copyUser.isSuperUser = false;

           var panelItems = this.availableUsers.listGroup.items;
           panelItems.push(copyUser);
           this.availableUsers.listGroup.items = sortByDisplayName(panelItems);

           // Select the newly added item from the panel / list.
           this.availableUsers.value = copyUser;
           updateSelectedUser(this, userAdapter.toModelObject(copyUser));
       };

    UserViewModel.prototype.showUserDetails = function userViewModel_showUserDetails() {
        this.canShowUserDetails(true);
        this.canShowUserGroups(false);
        this.canShowUserRoles(false);
        this.canShowUserSites(false);
    };

    UserViewModel.prototype.showUserGroups = function userViewModel_showUserGroups() {
        this.canShowUserDetails(false);
        this.canShowUserGroups(true);
        this.canShowUserRoles(false);
        this.canShowUserSites(false);
    };

    UserViewModel.prototype.showUserSites = function userViewModel_showUserSites() {
        this.canShowUserDetails(false);
        this.canShowUserGroups(false);
        this.canShowUserRoles(false);
        this.canShowUserSites(true);

        // Hack alert! If the user selected "None" from the default site key select, the
        // changed event is not fired (due to options loading and binding).  We will 
        // resolve this fringe case here, when the tab opens.
        if (this.selectedUser().defaultSiteKey() === '0') {
            this.userDetailSitesViewModel.noneSiteSelected();
        }
    };

    UserViewModel.prototype.showUserRoles = function userViewModel_showUserRoles() {
        this.canShowUserDetails(false);
        this.canShowUserGroups(false);
        this.canShowUserRoles(true);
        this.canShowUserSites(false);

    };

    UserViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserViewModel.prototype.consumerloader = function consumerloader(self) {
        var dfd = $.Deferred();
        var filteroptions = {
            'filteroptions': [
            {
                'type': 'select',
                'caption': 'User Type',
                'options': [
                    { 'option': { 'text': self.translate('ALL_CAPTION'), 'value': 'All', 'isSelected': self.filterSelection()==="All"?true:false} },
                    { 'option': { 'text': self.translate('ONLY_ACTIVE'), 'value': 'OnlyActive', 'isSelected': self.filterSelection()==="OnlyActive"?true:false } },
                    { 'option': { 'text': self.translate('INACTIVE'), 'value': 'InActive', 'isSelected': self.filterSelection()==="InActive"?true:false } }
                ]
            }
            ]
        };

        dfd.resolve(filteroptions);
        return dfd;
    };

    UserViewModel.prototype.filterCB = function filterCB(self, type, newValObj, allValues) {
        //handle updates in your module
        //self.filterSelection(allValues[0]);
        if (!newValObj) {
            self.statusValue = null;
        } else if (newValObj.value === 'InActive') {
            self.statusValue = "I";
        }
        else if (newValObj.value === 'OnlyActive') {
            self.statusValue = "A";
        }
        else {
            self.statusValue = null;
        }
        self.availableUsers.reload();
    };

    UserViewModel.prototype.OnIsUserDirty =
        function group_nav_detail_ViewModel_OnIsGroupDirty(dirty) {
            this.isDirty(dirty);
        };

    //////////////////////
    // Implementation
    //////////////////////



    function collapsible_change(self, event) {
        if (event.target.className === 'icon-collapse' || event.target.className==='icon-expand') {
        self.navCollapsed(!self.navCollapsed());
    }
    }

    function userSearch(self, newSearchTerm) {
        if (newSearchTerm.length===0) {
            self.searchCleared = true;
            self.searchValue = null;
        }
        else {
            self.searchValue = newSearchTerm;
        }
        
        self.availableUsers.reload();

        //self.userFilter(newSearchTerm);
    }

    function onUserSelecting(self, event) {
        // IE sometimes fires this event with undefined.
        // If dirty, confirm navigation, first.
        if (self.isDirty() && !self.skipSelectingCheck && !self.isLoading()) {
            event.preventDefault();
            promptLoseChanges(self, confirmPanelNavigation_done.bind(null, self, event));
            return false;
        }
        return true;
    }

    // loading the control functions
    function loadUsers(self, pageNum, pageSize) {
        var dfd = $.Deferred(),
            pageOffset,
            search = '',
            status = '';

        self.isLoading(true);
        
        if (self.searchValue) {
            search = self.searchValue;
        }
        if (self.statusValue) {
            status = self.statusValue;
        }
        pageOffset = pageNum - 1;

        self.securityService.getUsersPage(pageOffset, pageSize, status, search)
            .done(getUserPage_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self));

        return dfd;
    }

    function getUserPage_done(self, dfd, dtos) {
        if (dtos && !self.selectedUser()) {
            self.availableUsers.value = dtos[0];
        }
        dfd.resolve(dtos);

        //clearIsDirty(self);
        //updateSelectedUser(self, userAdapter.toModelObject(dto));
        self.isLoading(false);
    }

    function updateSelectedUser(self, selectedUser) {
        if (selectedUser) {
            self.isFilteredOut(false);
            self.selectedUser(selectedUser);
            if (self.selectedUser() ) {
                self.events.userSelected.raise(selectedUser);
                if (self.selectedUser().key !== '0') {
                        clearIsDirty(self);
                }
            }
        }
    }

    //function getUsers_done(self, dfd, users) {

    //    self.users(sortByDisplayName(users));
    //    dfd.resolve();
    //}

    // end loading the control functions

    // sorting functions
    function sortById(users) {
        return _.sortBy(users, sortByCaseInsensitive.bind(null, 'id'));
    }

    function sortByDisplayName(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'displayName'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }
    // end sorting functions



    // role functions
    function getUser_done(self, dto) {
        clearIsDirty(self);
        updateSelectedUser(self, userAdapter.toModelObject(dto));
        self.isLoading(false);
    }

    function userLoading_done(self) {
        clearIsDirty(self);
        self.isLoading(false);
    }

    function postUser_done(self, response) {
        var dfd = $.Deferred();
        updateSelectedUser(self, userAdapter.toModelObject(response));
        updateListGroup(self);
        clearIsDirty(self);
        //self.securityService.getUsers(true, self.activeOnly())
        //    .done(getUsers_done.bind(null, self, dfd))
        //    .fail(handleAjaxRequestError.bind(null, self, dfd));
        self.isLoading(false);
        return dfd.promise();
    }

    function putUser_done(self) {
        var dfd = $.Deferred();
        updateSelectedUser(self, self.selectedUser());
        updateListGroup(self);
        clearIsDirty(self);
        //self.securityService.getUsers(true, self.activeOnly())
        //    .done(getUsers_done.bind(null, self, dfd))
        //    .fail(handleAjaxRequestError.bind(null, self, dfd));
        self.isLoading(false);
        return dfd.promise();
    }

    function updateListGroup(self) {
        var userModel = self.selectedUser(),
            listGroup = self.availableUsers.listGroup,
            items = listGroup.items,
            canShow=true,
            currentItem;

        // Get the currently selected value in the list.
        // This should be the item you just saved.
        currentItem = _.find(items, listGroup.value);

        if (self.filterSelection() === 'InActive' && userModel.isActive()) {
            canShow = false;
        }
        if (self.filterSelection() === 'OnlyActive' && !userModel.isActive()) {
            canShow = false;
        }
        currentItem.id = userModel.id();
        currentItem.displayName = userModel.displayName();
        currentItem.key = userModel.key;
        currentItem.isActive = userModel.isActive();
        currentItem.defaultSiteKey = userModel.defaultSiteKey();
        if (canShow) {
            // Update the properties of the selected user value in the list.
            // Forces the DOM to reload.
            listGroup.items = sortByDisplayName(items);

            // Reselect the current item.
           self.skipSelectingCheck = true;
            listGroup.value =currentItem;
           // listGroup.reload();

        } else {
            deleteSelectedListGroupItem(self);
            self.isFilteredOut(true);
        }
    }

    function deleteSelectedListGroupItem(self) {
        var listGroup = self.availableUsers.listGroup,
            items = listGroup.items,
            currentItemIdx;

        // Delete the currently selected item from the array.
        currentItemIdx = items.indexOf(listGroup.value);
        items.splice(currentItemIdx, 1);

        // Forces the DOM to reload
        listGroup.items = items;
    }

    function constructNewUser(self) {
        var getSites, newUser;

        newUser = new UserDTO({ id: 'newUser', lastName: 'new', firstName: 'user', key: '0', isActive: true, isSuperUser: false, hasThumbnailPhoto: false });
        return newUser;
    }

    //function getSites_done(self, sites) {
    //    self.sites = sites;
    //}

    function canSave_read(self) {
        return self.isDirty()  && (self.selectedUser() && !self.isLoading());
    }

    function canAdd_read(self) {
        if (self.filterSelection()!=='All') {
            return false;
        }

        if (self.isDirty()) {
            return false;
        }
        
        if (self.selectedUser()) {
            return self.selectedUser().key !== '0';
        }
        return true;
    }

    function canCopy_read(self) {
        if (self.selectedUser()) {
            return !self.isDirty() && !self.isLoading();
        }
        return true;
    }

    function canDisplayUserDetails_read(self) {

        return self.selectedUser()  && !self.isFilteredOut()  && (!self.userFilter() || self.availableUsers.listGroup.value);
    }

    function canSearch_read(self) {
        if (self.selectedUser()) {
            return !self.isDirty();
        }
        return true;
    }

    //function filteredUsers_subscribe(self) {
    //    self.availableUsers.reload.call(self.availableUsers);
    //}

    //function filteredUsers_read(self) {
    //    var filter,
    //        retValues,
    //        values;

    //    values = self.users();
    //    if (!self.userFilter()) {
    //        retValues = values;
    //    } else {
    //        filter = self.userFilter().toLowerCase();
    //        values = ko.utils.arrayFilter(values, function (u) {
    //            return u.firstName.toLowerCase().startsWith(filter) ||
    //                u.lastName.toLowerCase().startsWith(filter) ||
    //                u.id.toLowerCase().startsWith(filter);
    //        });
    //        self.selectedUser(null);
    //        retValues = values;
    //    }
    //    self.isFilteredOut(false);

    //    if (self.filterSelection() !== 'All') {
    //        if (self.filterSelection() === 'InActive') {
    //            retValues = _.filter(retValues, function (user) { return !user.isActive; });
    //            if (self.availableUsers.listGroup.value) {
    //                if (self.availableUsers.listGroup.value.isActive) {
    //                    self.isFilteredOut(true);
    //                    self.skipSelectingCheck = true;
    //                    self.selectedUser(null);
    //                }
    //            }
    //        } else {
    //            retValues = _.filter(retValues, function (user) { return user.isActive; });
    //            if (self.availableUsers.listGroup.value) {
    //                if (!self.availableUsers.listGroup.value.isActive) {
    //                    self.isFilteredOut(true);
    //                    self.skipSelectingCheck = true;
    //                    self.selectedUser(null);
    //                }
    //            }
    //        }
    //    }
    //    return retValues;
    //}


    // end role functions

    //Promtps
    function promptLoseChanges(self, doneCallback) {
        var msg = self.translator.translate('SEC_USER_UNSAVED_CHANGES') +
                  '  ' +
                  self.translator.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translator.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }


    // end prompts

    // misc


    function confirmTabUnload_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    }

    function confirmPanelNavigation_done(self, event, clickedButtonIndex) {
        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            clearIsDirty(self);
            if (event.target.value) {
                if (event.target.value.key === '0') {
                    deleteSelectedListGroupItem(self);
                }
                event.target.value = event.originalEvent.newValue;
            }
        }
    }

    function clearIsDirty(self) {
        self.isDirty(false);
        // Clear isDirty().
        //self.events.isUserDirty.raise(self.isDirty());
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

    return UserViewModel;
});
