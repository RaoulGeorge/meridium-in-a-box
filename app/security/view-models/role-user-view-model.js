define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
    ApplicationEvents = require('application/application-events'),
    Translator = require('system/globalization/translator'),
    ErrorMessage = require('system/error/error-message'),
    MessageBox = require('system/ui/message-box'),
    KnockoutViewModel = require('spa/ko/knockout-view-model'),
    KnockoutManager = require('system/knockout/knockout-manager'),
    SecurityService = require('../services/security-service'),
    Conductor = require('spa/conductor'),
    Region = require('spa/region'),
    RoleDTO = require('../services/role-dto'),
    DialogBox = require('system/ui/dialog-box'),
    DialogScreen = require('./role-user-popover-view-model'),
    view = require('text!../views/role-user.html');

    require('ui/elements/list-group/view-model');



    function RoleUserViewModel(kom, applicationEvents, securityService) {
        base.call(this, view);
        var self = this;
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.conductor = Object.resolve(Conductor);


        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        // Reference to the tree controls containing assigned groups/users.
        this.assignedList = { items: [], selectedItems: [] };
        this.show = function () {
            var screen = Object.resolve(DialogScreen);
            screen.currentUsers(this.assignedList.items);

            var options = {
                buttons: [
                           { name: self.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                           { name: self.translate('UPDATE'), value: 'save', cssClass: 'btn-primary' }

                ],
                closeOnReject: true
            };
            var dialog = new DialogBox(screen,self.translate('ASSIGN_USERS'), options);
            dialog.show()
                .done(function (btnIndex, btnValue, data) {
                    if (btnValue === 'save') {
                        // do something on save click
                        dialog_done(self,data);
                    }
                }
                );
        };


        // knockout observables
        this.assigned = null;
        this.isLoading = null;
        this.canSave = null;
        this.canDelete = null;
        this.selectedRole = null;

        // Keep track of each change to related collections, so we can
        // commit those changes on save.
        this.assignedNewChangeLog = [];
        this.assignedRemoveChangeLog = [];
        this.selected = [];
    }

    var base = Object.inherit(KnockoutViewModel, RoleUserViewModel);
    RoleUserViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService];

    ///////////////////
    // Lifecycle
    ///////////////////

    RoleUserViewModel.prototype.load =
        function roleUserViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.assigned = this.kom.observableArray();
            this.isLoading = this.kom.observable();
            this.selected = this.kom.observableArray();
            // Clear isDirty().
            clearIsDirty(this);

            return dfd.promise();
        };

    RoleUserViewModel.prototype.activate =
        function roleUserViewModel_activate() {
            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));

        };

    RoleUserViewModel.prototype.attach =
        function roleUserViewModel_attach(region, selectedRole) {
            var self = this;
            base.prototype.attach.call(this, region);
            this.region = region;

            this.assignedList = this.region.$element.find('mi-list-group')[0];
            Element.upgrade(this.assignedList);
            this.assignedList.loader = loadUsers.bind(null, this, selectedRole.key());
            this.selectedRole = selectedRole;
            
            this.selected([]);
        };

    RoleUserViewModel.prototype.detach =
        function roleUserViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    RoleUserViewModel.prototype.canUnload =
        function roleUserViewModel_canUnload() {
            return !this.isDirty();
        };

    RoleUserViewModel.prototype.deactivate =
        function roleUserViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
        };

    RoleUserViewModel.prototype.unload =
        function roleUserViewModel_unload() {
            this.kom.disposeObservables();
        };

  



    /////////////////////
    // Behavior
    /////////////////////

    RoleUserViewModel.prototype.onAdd =
       function roleUserViewModel_onGroupAdd(data, event) {
           var vm = ko.contextFor(event.target).$root;
           vm.show();
       };

    RoleUserViewModel.prototype.clearLists =
   function roleUserViewModel_clearList(data, event) {
       this.assignedNewChangeLog = [];
       this.assignedRemoveChangeLog=[];
   };

    RoleUserViewModel.prototype.selectAll =
     function roleUserViewModel_selectAll(data, event) {
         var items, vm, emptyList;

         vm = ko.contextFor(event.target).$root;

         items = vm.assignedList.items;
         if (vm.assignedList.selectedItems.length === 0) {
             vm.assignedList.selectedItems = items;
             vm.selected(items);
         } else {
             vm.assignedList.selectedItems.splice(0, vm.assignedList.selectedItems.length);
             vm.assignedList.items = items;
             vm.selected([]);
         }
     };

    RoleUserViewModel.prototype.onSelected =
       function roleUserViewModel_onUserSelected(data, event) {
           var userKey, vm, foundUser, userReallySelected;


           if (event.target.value) {
               userKey = event.target.value.key;
               vm = ko.contextFor(event.target).$root;

               userReallySelected = _.find(vm.assignedList.selectedItems, function (item) {
                   return item.key === userKey;
               });
               if (userReallySelected) {
                   foundUser = _.find(vm.selected(), function (user) { return user.key === userKey; });
                   if (foundUser === undefined) {
                       vm.selected.push(event.target.value);
                   }
               }
               else {
                   foundUser = _.find(vm.selected(), function (user) { return user.key === userKey; });
                   if (foundUser) {
                       vm.selected.splice(vm.selected.indexOf(event.target.value), 1);
                   }
               }
           }
       };

    RoleUserViewModel.prototype.save =
        function roleUserViewModel_save() {
            var usersToAdd, usersToDelete;
            var self = this;

            // If no changes, nothing to do.
            if (this.assignedNewChangeLog.length > 0 || this.assignedRemoveChangeLog.length > 0) {
                this.isLoading(true);
                if (this.assignedNewChangeLog.length > 0) {
                    usersToAdd = createRoleDTOAdd(this);
                    this.securityService.addRoleUsers(usersToAdd)
                        .done(addRoleUsers_done.bind(null, this))
                        .fail(handleAjaxRequestError.bind(null, this));
                }
                if (this.assignedRemoveChangeLog.length > 0) {
                    usersToDelete = createRoleDTODelete(this);
                    usersToDelete.users.forEach(function (item) {
                        self.securityService.deleteRoleUsers(self.selectedRole.key(), item.key)
                        .done(removeRoleUsers_done.bind(null, self))
                        .fail(handleAjaxRequestError.bind(null, self));
                    });
                }
            }
        };

    RoleUserViewModel.prototype.delete =
        function roleUserViewModel_delete(data, event) {
            var vm = ko.contextFor(event.target).$root;
            promptDelete(vm, confirmDelete_done.bind(null, vm));
        };

    RoleUserViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    RoleUserViewModel.prototype.clearDirty =
   function roleUserViewModel_clearDirty() {
       this.kom.tracker.markCurrentStateAsClean();

   };

    RoleUserViewModel.prototype.hasChanges = function hasChanges() {
        return this.isDirty();
    };

    //////////////////////
    // Implementation
    //////////////////////



    function dialog_done(self,dto) {
        var userItems = self.assignedList.items;

        dto.forEach(function (item) {
            addNewToNewChangeLog(self, item);
            userItems.push(item);
        });
        self.assignedList.items = sortBy(userItems);
        self.assigned(self.assignedList.items);
        self.selected([]);
    }
    // loading the control functions

    function loadUsers(self, roleKey, page, pageSize) {
        var dfd = $.Deferred();

        if (roleKey!=='0') {
            var users = self.securityService.getRoleUsers(roleKey)
                .done(getRoleUsers_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self, dfd));
            $.when(users)
                .done(loadAllDone.bind(null, self));
        } else {
            loadAllDone(self);
            dfd.resolve();
        }
        return dfd.promise();
    }

    function getRoleUsers_done(self, dfd, dtos) {
        self.assigned(sortBy(dtos));
        dfd.resolve(self.assigned());
    }

    function loadAllDone(self) {
        var temp = self.assignedList.items;
        clearIsDirty(self);

        self.assignedNewChangeLog.forEach(function (item) {
            temp.push(item);
        });
        self.assignedList.items = sortBy(temp);
        self.assignedRemoveChangeLog.forEach(function (item) {
            removeFromList(self, item);
        });
        self.assigned(self.assignedList.items);
      
    }
    // end loading the control functions

    // sorting functions
    function sortBy(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'displayName'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }
    // end sorting functions

    // role-group functions
    function removeRoleUsers_done(self) {
        clearIsDirty(self);
        self.isLoading(false);
        self.assignedList.items = sortBy(self.assignedList.items);
        self.assigned(self.assignedList.items);
        self.assignedRemoveChangeLog = [];
    }

    function addRoleUsers_done(self) {
        clearIsDirty(self);
        self.isLoading(false);
        self.assignedList.items = sortBy(self.assignedList.items);
        self.assignedNewChangeLog = [];

    }

    function confirmDelete_done(self, clickedButtonIndex) {
        var usersToDelete;
        if (clickedButtonIndex === 0) {
            self.assignedList.selectedItems.forEach(function (item) {
                addNewToRemoveChangeLog(self, item);
                removeFromList(self, item);
            });
            self.assigned(self.assignedList.items);
            self.selected([]);
        }
    }

    function removeFromList(self, itemToRemove) {
        var items = self.assignedList.items.slice();
        for (var i = 0; i < items.length; i++) {
            if (items[i].key === itemToRemove.key) {
                items.splice(i, 1);
            }
        }
        self.assignedList.items = items;
    }

    function addNewToNewChangeLog(self, group) {
        var canAdd = true;
        self.assignedRemoveChangeLog.forEach(function (item) {
            if (item.key === group.key) {
                canAdd = false;
                // Remove from new group as well, add\delete cancel eachother out
                removeFromRemoveChangedList(self, item);
            }
        });
        if (canAdd) {
            self.assignedNewChangeLog.push(group);
        }
    }

    function removeFromRemoveChangedList(self, item) {
        for (var i = 0; i < self.assignedRemoveChangeLog.length; i++) {
            if (self.assignedRemoveChangeLog[i].key === item.key) {
                self.assignedRemoveChangeLog.splice(i, 1);
                break;
            }
        }
    }

    function addNewToRemoveChangeLog(self, user) {
        var canAdd = true;
        self.assignedNewChangeLog.forEach(function (item) {
            if (item.key === user.key) {
                canAdd = false;
                // Remove from new group as well, add\delete cancel eachother out
                removeFromNewChangedList(self, item);
            }
        });
        if (canAdd) {
            self.assignedRemoveChangeLog.push(user);
        }
    }

    function removeFromNewChangedList(self, item) {
        for (var i = 0; i < self.assignedNewChangeLog.length; i++) {
            if (self.assignedNewChangeLog[i].key === item.key) {
                self.assignedNewChangeLog.splice(i, 1);
                break;
            }
        }
    }

    function createRoleDTOAdd(self) {
        var dto = new RoleDTO();

        dto.id = self.selectedRole.id();
        dto.key = self.selectedRole.key();
        dto.caption = self.selectedRole.caption();
        dto.description = self.selectedRole.description();
        dto.users = [];
        dto.groups = [];
        self.assignedNewChangeLog.forEach(function (item) {
            dto.users.push(item);
        });
        return dto;
    }

    function createRoleDTODelete(self) {
        var dto = new RoleDTO();

        dto.id = self.selectedRole.id();
        dto.key = self.selectedRole.key();
        dto.caption = self.selectedRole.caption();
        dto.description = self.selectedRole.description();
        dto.users = [];
        dto.groups = [];
        self.assignedRemoveChangeLog.forEach(function (item) {
            dto.users.push(item);
        });
        return dto;
    }

    function canSave_read(self) {
        return self.isDirty() && self.selectedRole && !self.isLoading();
    }

    function canDelete_read(self) {
        return self.selected().length > 0 && self.selectedRole && !self.isLoading();
    }
    // end role-group functions

    //Promtps
    

    function promptDelete(self, doneCallback) {
        var msg = self.translate('SEC_ROLEUSER_CONFIRM_DELETE_CURRENT'),
                 title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }



    // end prompts

    // misc
   
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

        if (!self.selectedRole) {
            return;
        }

        hashObject = {
            assignedUsers: _.map(self.assigned(), function (user) {
                return user.key;
            })
        };
        return JSON.stringify(hashObject);
    }
    return RoleUserViewModel;
});
