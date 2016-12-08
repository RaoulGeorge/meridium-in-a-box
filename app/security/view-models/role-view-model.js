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
        SecurityService = require('../services/security-service'),
        RoleDTO = require('../services/role-dto'),
        Region = require('spa/region'),
        RoleModel = require('../model/role-model'),
        roleAdapter = require('../adapters/role-adapter'),
        RoleGroupViewModel = require('./role-group-view-model'),
        RoleUserViewModel = require('./role-user-view-model'),
        view = require('text!../views/role.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');

    function RoleViewModel(kom, applicationEvents, securityService, roleGroupViewModel, roleGroupRegion,roleUserViewModel,roleUserRegion) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        
        this.groupViewModel = roleGroupViewModel;
        this.groupRegion = roleGroupRegion;

        this.userViewModel = roleUserViewModel;
        this.userRegion = roleUserRegion;

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        // Reference to the panel control containing role list.
        this.panel = null;
        this.$panelControl = null;


        // knockout observables
        this.selectedRole = null;
        this.isLoading = null;
        this.canSave = null;
        this.canDelete = null;
        this.canAdd = null;
        this.skipSelectingCheck = false;
    }

    var base = Object.inherit(KnockoutViewModel, RoleViewModel);
    RoleViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, RoleGroupViewModel, Region,RoleUserViewModel,Region];

    ///////////////////
    // Lifecycle
    ///////////////////

    RoleViewModel.prototype.load =
        function roleViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.selectedRole = this.kom.observable();
            this.isLoading = this.kom.observable();
            // Clear isDirty().
            clearIsDirty(this);

            // load the group VM
            this.groupViewModel.load(routeArgs);
            this.userViewModel.load(routeArgs);

            return dfd.promise();
        };

    RoleViewModel.prototype.activate =
        function roleViewModel_activate() {
            
            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));

            // activate group VM
            this.groupViewModel.activate();
            this.userViewModel.activate();

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/Roles.htm';
        };

    RoleViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            // Configure the panel control.
            this.$panelControl = this.region.$element.find('mi-panel');
            this.panel = this.$panelControl.get(0);
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.panel);
            }
            // **************
            // Must do this here, or IE will blow up when you switch tabs with a dirty record.  Called Selcting when coming back to tab.
            // don't bind this event in knockout.
            // ******************
            this.$panelControl.on('selecting', onRoleSelecting.bind(null, this));
            // Wire up the web component loaders for data loading.
            this.panel.loader = loadRoles.bind(null, this);
 
            if (this.selectedRole()) {
                this.groupRegion.setElement(this.region.$element.find('div.role-group-container'));
               
                this.groupViewModel.attach(this.groupRegion, this.selectedRole());

                this.userRegion.setElement(this.region.$element.find('div.role-user-container'));
                this.userViewModel.attach(this.userRegion,this.selectedRole());

            }

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

        };

    RoleViewModel.prototype.detach =
        function roleViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            this.groupViewModel.detach(this.groupRegion);
            this.groupRegion.clear();

            this.userViewModel.detach(this.userRegion);
            this.userRegion.clear();
        };

    RoleViewModel.prototype.canUnload =
        function roleViewModel_canUnload() {
            var dfd = $.Deferred();
            // If we return false, it should prevent the app from navigating away
            // from the current URL.  This should work for navigation triggered by the
            // app OR by the browser (i.e. refresh, back, forward browser buttons).
            if (this.isDirty() || this.groupViewModel.isDirty() || this.userViewModel.isDirty()) {
                // Prompt the user to lose changes.
                promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
            } else {
                dfd.resolve();
            }

            return dfd.promise();
        };

    RoleViewModel.prototype.deactivate =
        function roleViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.groupViewModel.deactivate(this.groupRegion);
            this.userViewModel.deactivate(this.userRegion);
        };

    RoleViewModel.prototype.unload =
        function roleViewModel_unload() {
            this.kom.disposeObservables();
            this.groupViewModel.unload();
            this.userViewModel.unload();
        };


    /////////////////////
    // Behavior
    /////////////////////

    RoleViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('SEC_SHELL_SECURITY_MGR'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    RoleViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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

    RoleViewModel.prototype.onRoleSelected =
        function roleViewModel_onRoleSelected(data, event) {
            // IE sometimes fires this event with undefined.
            if (!this.skipSelectingCheck) {
                if (event.target.value) {
                    var roleKey = event.target.value.key,
                        getRole;

                    if (roleKey !== '0') {
                        this.isLoading(true);

                        // Load the details for the selected role.
                        getRole = this.securityService.getRole(roleKey)
                            .done(getRole_done.bind(null, this))
                            .fail(handleAjaxRequestError.bind(null, this));

                        $.when(getRole)
                            .done(roleLoading_done.bind(null, this));
                    } else {
                        this.selectedRole(roleAdapter.toModelObject(constructNewRole(this)));

                    }
                }
            }
            this.skipSelectingCheck = false;
        };

    RoleViewModel.prototype.onRoleAdding =
        function roleViewModel_onRoleAdding(data, event) {
            // Create a new RoleDTO.
            var newRole = constructNewRole(this);

            // Add the DTO to the panel / list.
            var panelItems = this.panel.listGroup.items;
            panelItems.push(newRole);
            this.panel.listGroup.items = sortByCaption(panelItems);

            // Select the newly added item from the panel / list.
            this.panel.value = newRole;
            this.selectedRole(roleAdapter.toModelObject(newRole));
        };

   
    
    RoleViewModel.prototype.save =
        function roleViewModel_save() {
            var role, usersToAdd, groupsToAdd, usersToDelete, groupsToDelete;
            var self = this;
            role = roleAdapter.toDTO(this.selectedRole());



            if (this.selectedRole().caption()==='') {
                MessageBox.showOk(this.translate("SEC_ROLE_ENTER_ROLE_CAPTION"),this.translate("ROLES"));
                return;
            }

            if (this.selectedRole().id()==='') {
                MessageBox.showOk(this.translate("SEC_ROLE_ENTER_ROLE_ID"),this.translate("ROLES"));
                return;
            }
            this.selectedRole().caption(this.selectedRole().caption().trim());
            this.selectedRole().id(this.selectedRole().id().trim());

            this.isLoading(true);

            if (this.selectedRole().description()) {
                this.selectedRole().description(this.selectedRole().description().trim());
            }

            if (role.key === '0') {
                this.securityService.postRole(role)
                    .done(postRole_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            } else {
                this.groupViewModel.save();
                this.userViewModel.save();
                this.securityService.putRole(role)
                    .done(putRole_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            }
        };

    RoleViewModel.prototype.delete =
        function roleViewModel_delete(data, event) {
            promptDeleteRole(this, confirmDelete_done.bind(null, this));
        };

    RoleViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    //////////////////////
    // Implementation
    //////////////////////

    function onRoleSelecting(self, event) {


        // IE sometimes fires this event with undefined.
        // If dirty, confirm navigation, first.
        if ((self.isDirty() || self.groupViewModel.isDirty() || self.userViewModel.isDirty()) && !self.skipSelectingCheck) {
            event.preventDefault();
            promptLoseChanges(self, confirmPanelNavigation_done.bind(null, self, event));
            return false;
        }
        return true;
    }

    // loading the control functions
    function loadRoles(self) {
        var dfd = $.Deferred();

        self.securityService.getRoles()
            .done(getRoles_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self, dfd));

        return dfd.promise();
    }

    function getRoles_done(self, dfd, roles) {
        var sortedRoles=sortByCaption(roles);
        dfd.resolve(sortedRoles);
        if (self.selectedRole()) {
            if (self.selectedRole().key() === '0') {
                self.skipSelectingCheck = true;
                var panelItems = self.panel.listGroup.items;
                var newRole=roleAdapter.toDTO(self.selectedRole());
                panelItems.push(newRole);
                self.panel.listGroup.items = sortByCaption(panelItems);

                // Select the newly added item from the panel / list.
                self.panel.value = newRole;
            } else {
                if (self.isDirty() || self.groupViewModel.hasChanges() || self.userViewModel.hasChanges()) {
                    self.skipSelectingCheck = true;
                }
                self.panel.value = roleAdapter.toDTO(self.selectedRole());
            }
        } else {
            if (sortedRoles.length > 0) {
                self.panel.value=sortedRoles[0];
                self.selectedRole(roleAdapter.toModelObject(sortedRoles[0]));
            }
        }
    }

    // end loading the control functions

    // sorting functions
    function sortById(users) {
        return _.sortBy(users, sortByCaseInsensitive.bind(null, 'id'));
    }

    function sortByCaption(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'caption'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }
    // end sorting functions



    // role functions
    function getRole_done(self, dto) {
        self.selectedRole(roleAdapter.toModelObject(dto));

        self.groupRegion.setElement(self.region.$element.find('div.role-group-container'));
        self.groupViewModel.attach(self.groupRegion, self.selectedRole());
        self.groupViewModel.clearLists();

        self.userRegion.setElement(self.region.$element.find('div.role-user-container'));
        self.userViewModel.attach(self.userRegion, self.selectedRole());
        self.userViewModel.clearLists();
    }

    function roleLoading_done(self) {
        clearIsDirty(self);
        self.isLoading(false);

    }

    function postRole_done(self, response) {
        self.selectedRole(roleAdapter.toModelObject(response));
        clearIsDirty(self);
        updateListGroup(self);
        self.groupRegion.setElement(self.region.$element.find('div.role-group-container'));
        self.groupViewModel.attach(self.groupRegion, self.selectedRole());
        self.groupViewModel.clearLists();

        self.userRegion.setElement(self.region.$element.find('div.role-user-container'));
        self.userViewModel.attach(self.userRegion, self.selectedRole());
        self.userViewModel.clearLists();
        self.isLoading(false);
    }

    function putRole_done(self) {
        clearIsDirty(self);
        updateListGroup(self);
        self.isLoading(false);
    }

    function deleteRole_done(self) {
        self.selectedRole(null);
        deleteSelectedListGroupItem(self);
        clearIsDirty(self);
        self.groupViewModel.clearDirty();
        self.userViewModel.clearDirty();
        self.isLoading(false);
    }

    function updateListGroup(self) {
        var roleModel = self.selectedRole(),
            listGroup = self.panel.listGroup,
            items = listGroup.items,
            currentItem;

        // Get the currently selected value in the list.
        // This should be the item we just saved.
        currentItem = _.find(items, listGroup.value);

        // Update the properties of the selected role value in the list.
        currentItem.id = roleModel.id();
        currentItem.caption = roleModel.caption();
        currentItem.description = roleModel.description();
        currentItem.key = roleModel.key();

        // Forces the DOM to reload.
        listGroup.items = sortByCaption(items);
        // Reselect the current item.
        self.skipSelectingCheck = true;
        listGroup.value = currentItem;
    }

    function deleteSelectedListGroupItem(self) {
        var roleModel = self.selectedRole(),
            listGroup = self.panel.listGroup,
            items = listGroup.items,
            currentItemIdx;

        // Delete the currently selected item from the array.
        currentItemIdx = items.indexOf(listGroup.value);
        items.splice(currentItemIdx, 1);

        // Forces the DOM to reloadf
        listGroup.items = items;
    }

    function confirmDelete_done(self, clickedButtonIndex) {

        if (clickedButtonIndex === 0) {
            self.isLoading(true);
            self.securityService.deleteRole(self.selectedRole().key())
                            .done(deleteRole_done.bind(null, self))
                            .fail(handleAjaxRequestError.bind(null, self));
        }
    }

    function constructNewRole(self) {
        var newId = self.translate('SEC_ROLE_NEW_ROLE');
        return new RoleDTO({ id: newId, caption: newId });
    }

    function canSave_read(self) {
        return (self.isDirty() || self.groupViewModel.canSave() || self.userViewModel.canSave()) && self.selectedRole() && !self.isLoading();
    }

    function canDelete_read(self) {
        if (self.selectedRole) {
            return self.selectedRole().key()>0 && !self.isLoading();
        }
        return false;
    }

    function canAdd_read(self) {
        
        if (self.selectedRole()) {
            return self.selectedRole().key() !== '0';
        }
        return true;
    }

    // end role functions

    //Promtps
    function promptLoseChanges(self, doneCallback) {
        var msg = self.translate('SEC_ROLE_UNSAVED_CHANGES') +
                  '  ' +
                  self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function promptDeleteRole(self, doneCallback) {
        var msg = self.translate('SEC_ROLE_CONFIRM_DELETE_CURRENT'),
            title = self.translate('CONFIRM_DELETE');

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
            self.groupViewModel.clearDirty();
            self.userViewModel.clearDirty();
            if (event.target.value.key ==='0') {
                deleteSelectedListGroupItem(self);
            }
            event.target.value = event.originalEvent.newValue;
        }
    }

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

    function createHash(self) {
        var hashObject;

        if (!self.selectedRole()) {
            return;
        }

        hashObject = {
            id: self.selectedRole().id(),
            key: self.selectedRole().key(),
            caption: self.selectedRole().caption(),
            description: self.selectedRole().description(),
            groupDirty: self.groupViewModel.isDirty(),
            userDirty: self.userViewModel.isDirty(),
        };
        return JSON.stringify(hashObject);
    }

    return RoleViewModel;
});
