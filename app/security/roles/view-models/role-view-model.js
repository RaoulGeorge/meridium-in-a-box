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
        RoleDetailViewModel = require('./role-detail-view-model'),
        RoleGroupViewModel = require('./role-groups-view-model'),
        RoleUserViewModel = require('./role-users-view-model'),
        view = require('text!../views/role.html');

    require('ui/elements/panel/view-model');
    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');

    function RoleViewModel(kom, applicationEvents, securityService, roleDetailViewModel, roleDetailRegion, roleGroupViewModel, roleGroupRegion, roleUserViewModel, roleUserRegion, roleEvents) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = roleEvents;
        
        this.roleDetailViewModel = roleDetailViewModel;
        this.roleDetailRegion = roleDetailRegion;
        this.roleGroupViewModel = roleGroupViewModel;
        this.roleGroupRegion = roleGroupRegion;
        this.roleUserViewModel = roleUserViewModel;
        this.roleUserRegion = roleUserRegion;

        // isDirty implementation.
        this.isDirty = null;

        // Reference to the panel control containing role list.
        this.panel = null;

        // knockout observables
        this.selectedRole = null;
        this.isLoading = null;
        this.canSave = null;
        this.canDelete = null;
        this.canAdd = null;
        this.skipSelectingCheck = false;

        this.navCollapsed = null;
        this.canShowRoleDetails = null;
        this.canShowRoleGroups = null;
        this.canShowRoleUsers = null;
    }

    var base = Object.inherit(KnockoutViewModel, RoleViewModel);
    RoleViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, RoleDetailViewModel, Region, RoleGroupViewModel, Region, RoleUserViewModel, Region, RoleEvents];

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
            this.canShowRoleDetails = this.kom.observable(true);
            this.canShowRoleGroups = this.kom.observable(false);
            this.canShowRoleUsers = this.kom.observable(false);
            this.navCollapsed = this.kom.observable(false);

            // Clear isDirty().
            this.isDirty = this.kom.observable(false);
            clearIsDirty(this);

            // load child VM
            this.roleDetailViewModel.load(routeArgs);
            this.roleGroupViewModel.load(routeArgs);
            this.roleUserViewModel.load(routeArgs);

            return dfd.promise();
        };

    RoleViewModel.prototype.activate =
        function roleViewModel_activate() {
            
            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));
            this.canDisplayRoleDetails = this.kom.pureComputed(canDisplayRoleDetails_read.bind(null, this));
            this.events.isRoleDirty.add(this.OnIsRoleDirty, this);

            // activate group VM
            this.roleDetailViewModel.activate();
            this.roleGroupViewModel.activate();
            this.roleUserViewModel.activate();

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/Roles.htm';
        };

    RoleViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            var panelControl;

            base.prototype.attach.call(this, region);
            this.region = region;

            // Configure the panel control.
            panelControl = this.region.$element.find('mi-panel');
            this.panel = panelControl.get(0);
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.panel);
            }
            // **************
            // Must do this here, or IE will blow up when you switch tabs with a dirty record.  Called Selcting when coming back to tab.
            // don't bind this event in knockout.
            // ******************
            panelControl.on('selecting', onRoleSelecting.bind(null, this));
            panelControl.on('click', collapsible_change.bind(null, this));
            // Wire up the web component loaders for data loading.
            this.panel.loader = loadRoles.bind(null, this);
 
            this.roleDetailRegion.setElement(this.region.$element.find('div.role-detail-container'));
            this.roleDetailViewModel.attach(this.roleDetailRegion);
            this.roleGroupRegion.setElement(this.region.$element.find('div.role-groups-container'));
            this.roleGroupViewModel.attach(this.roleGroupRegion);
            this.roleUserRegion.setElement(this.region.$element.find('div.role-users-container'));
            this.roleUserViewModel.attach(this.roleUserRegion);

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

            this.canShowRoleDetails(true);
            this.canShowRoleGroups(false);
            this.canShowRoleUsers(false);
        };

    RoleViewModel.prototype.detach =
        function roleViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            this.roleDetailViewModel.detach(this.roleDetailRegion);
            this.roleDetailRegion.clear();
            this.roleGroupViewModel.detach(this.roleGroupRegion);
            this.roleGroupRegion.clear();
            this.roleUserViewModel.detach(this.roleUserRegion);
            this.roleUserRegion.clear();
        };

    RoleViewModel.prototype.canUnload =
        function roleViewModel_canUnload() {
            var dfd = $.Deferred();
            // If we return false, it should prevent the app from navigating away
            // from the current URL.  This should work for navigation triggered by the
            // app OR by the browser (i.e. refresh, back, forward browser buttons).
            if (this.isDirty() || this.roleGroupViewModel.isDirty()) { // || this.userViewModel.isDirty()) {
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
            this.roleDetailViewModel.deactivate(this.roleDetailRegion);
            this.roleGroupViewModel.deactivate(this.roleGroupRegion);
            this.roleUserViewModel.deactivate(this.roleUserRegion);
        };

    RoleViewModel.prototype.unload =
        function roleViewModel_unload() {
            this.kom.disposeObservables();
            this.roleDetailViewModel.unload();
            this.roleGroupViewModel.unload();
            this.roleUserViewModel.unload();
        };


    /////////////////////
    // Behavior
    /////////////////////

    RoleViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

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
            this.panel.listGroup.items = sortDtos(panelItems);

            // Select the newly added item from the panel / list.
            this.panel.value = newRole;
            updateSelectedRole(this, roleAdapter.toModelObject(newRole));
            this.roleDetailViewModel.onRoleAdded();
        };

    RoleViewModel.prototype.save =
        function roleViewModel_save() {
            var role,
                self = this;

            this.selectedRole(this.roleDetailViewModel.getRole());
            this.selectedRole().groups(this.roleGroupViewModel.getRole().groups());
            this.selectedRole().users(this.roleUserViewModel.getRole().users());
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
                this.securityService.putRole(role)
                    .done(putRole_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            }
        };

    RoleViewModel.prototype.onDeleteClick =
        function roleViewModel_delete(data, event) {
            promptDeleteRole(this, confirmDelete_done.bind(null, this));
        };

    RoleViewModel.prototype.showRoleDetails = function roleViewModel_showRoleDetails() {
        this.canShowRoleDetails(true);
        this.canShowRoleGroups(false);
        this.canShowRoleUsers(false);
    };

    RoleViewModel.prototype.showRoleGroups = function roleViewModel_showRoleGroups() {
        this.canShowRoleDetails(false);
        this.canShowRoleGroups(true);
        this.canShowRoleUsers(false);
    };

    RoleViewModel.prototype.showRoleUsers = function roleViewModel_showRoleUsers() {
        this.canShowRoleDetails(false);
        this.canShowRoleGroups(false);
        this.canShowRoleUsers(true);
    };

    RoleViewModel.prototype.OnIsRoleDirty = function onIsRoleDirty(dirty) {
        this.isDirty(dirty);
    };

    //////////////////////
    // Implementation
    //////////////////////

    function collapsible_change(self, event) {
        if (event.target.className === 'icon-collapse' || event.target.className === 'icon-expand') {
            self.navCollapsed(!self.navCollapsed());
        }
    }

    function onRoleSelecting(self, event) {
        // IE sometimes fires this event with undefined.
        // If dirty, confirm navigation, first.
        if (self.isDirty() && !self.skipSelectingCheck) {
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

    function getRoles_done(self, dfd, dtos) {
        if (dtos) {
            sortDtos(dtos);
            self.panel.value = dtos[0];
        }
        dfd.resolve(dtos);
    }

    function sortDtos(dtos) {
        return dtos.sort(function (x, y) {
            var xcap = x.caption.toLowerCase();
            var ycap = y.caption.toLowerCase();
            if (xcap < ycap) {
                return -1;
            } else if (xcap > ycap) {
                return 1;
            }
            return;
        });
    }

    function getRole_done(self, dto) {
        clearIsDirty(self);
        updateSelectedRole(self, roleAdapter.toModelObject(dto));
        self.isLoading(false);
    }

    function updateSelectedRole(self, model) {
        if (model) {
            self.selectedRole(model);
            if (self.selectedRole()) {
                self.events.roleSelected.raise(model);
                if (self.selectedRole().key !== '0') {
                    clearIsDirty(self);
                }
            }
        }
    }

    function roleLoading_done(self) {
        clearIsDirty(self);
        self.isLoading(false);
    }

    function postRole_done(self, response) {
        var dfd = $.Deferred();
        self.selectedRole(roleAdapter.toModelObject(response));
        clearIsDirty(self);
        updateListGroup(self);
        self.isLoading(false);
        return dfd.promise();
    }

    function putRole_done(self) {
        var dfd = $.Deferred();
        clearIsDirty(self);
        updateListGroup(self);
        self.isLoading(false);
        return dfd.promise();
    }

    function deleteRole_done(self) {
        var dfd = $.Deferred();
        self.selectedRole(null);
        deleteSelectedListGroupItem(self);
        clearIsDirty(self);
        self.isLoading(false);
        return dfd.promise();
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
        listGroup.items = sortDtos(items);
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
            if (self.selectedRole().key() === '0') {
                self.panel.reload();
                return;
            }
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
        return (self.isDirty() && self.selectedRole() && !self.isLoading());
    }

    function canDelete_read(self) {
        if (self.selectedRole()) {
            return true;
        }
        else {
            return false;
        }
    }

    function canAdd_read(self) {
        if (self.selectedRole()) {
            return self.selectedRole().key() !== '0';
        }
        return true;
    }

    function canDisplayRoleDetails_read(self) {
        return self.selectedRole() && self.panel.listGroup.value;
    }

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
            if (event.target.value.key ==='0') {
                deleteSelectedListGroupItem(self);
            }
            event.target.value = event.originalEvent.newValue;
        }
    }

    function clearIsDirty(self) {
        self.roleGroupViewModel.clearDirty();
        self.isDirty(false);
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

    return RoleViewModel;
});
