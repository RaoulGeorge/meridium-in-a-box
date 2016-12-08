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
    SecurityService = require('../../services/security-service'),
    UserEvents = require('./user-events'),
    DialogBox = require('system/ui/dialog-box'),
    DialogScreen = require('./user-detail-roles-dialog-view-model'),
    view = require('text!../views/user-detail-roles.html');

    require('ui/elements/list-group/view-model');

    function UserDetailRolesViewModel(kom, applicationEvents, securityService,userEvents) {
        base.call(this, view);
        var self = this;
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = userEvents;
        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.selectedUser = this.kom.observable();
        // knockout observables
        this.isLoading = null;
        this.canDelete = null;

        this.assignedList = { items: [], selectedItems: [] };
        // Keep track of each change to related collections, so we can
        // commit those changes on save.
        this.assignedNewChangeLog = [];
        this.assignedRemoveChangeLog = [];
        this.selected = this.kom.observableArray([]);
        this.canAdd = null;

        this.show = function () {

            var screen = Object.resolve(DialogScreen);
            screen.currentGroups(this.assignedList.items);

            var options = {
                buttons: [
                           { name: self.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                           { name: self.translate('UPDATE'), value: 'save', cssClass: 'btn-primary' }
                ],
                closeOnReject: true
            };
            var dialog = new DialogBox(screen, self.translate('SEC_USERS_ASSIGN_ROLES'), options);
            dialog.show()
                .done(function (btnIndex, btnValue, data) {
                    if (btnValue === 'save') {
                        // do something on save click
                        dialog_done(self, data);
                    }
                }
                );
        };

    }

    var base = Object.inherit(KnockoutViewModel, UserDetailRolesViewModel);
    UserDetailRolesViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService,UserEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    UserDetailRolesViewModel.prototype.load =
        function userDetailRolesViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.isLoading = this.kom.observable();


            // Clear isDirty().
            clearIsDirty(this);





            return dfd.promise();
        };

    UserDetailRolesViewModel.prototype.activate =
        function userDetailRolesViewModel_activate() {
            // Set up our computed observables.
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.events.userSelected.add(this.selectUser, this);
            this.isDirty.subscribe(isDirtyChanged.bind(null, this));
        };

    UserDetailRolesViewModel.prototype.attach =
        function userDetailRolesViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
            this.assignedList = this.region.$element.find('mi-list-group')[0];
            Element.upgrade(this.assignedList);
            this.assignedList.loader = loadRoles.bind(null, this);
            this.selected([]);
        };

    UserDetailRolesViewModel.prototype.detach =
        function userDetailRolesViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    //UserDetailRolesViewModel.prototype.canUnload =
    //    function userDetailRolesViewModel_canUnload() {
    //        return !this.isDirty() && !this.isLoading();
    //    };

    UserDetailRolesViewModel.prototype.deactivate =
        function userDetailRolesViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.userSelected.remove(this);
        };

    UserDetailRolesViewModel.prototype.unload =
        function userDetailRolesViewModel_unload() {
            this.kom.disposeObservables();
        };


    /////////////////////
    // Behavior
    /////////////////////

    UserDetailRolesViewModel.prototype.onAdd =
   function userDetailRolesViewModel_onGroupAdd(data, event) {
       var vm = ko.contextFor(event.target).$root;
       vm.show();
   };

    UserDetailRolesViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserDetailRolesViewModel.prototype.selectAll =
      function userDetailGRolesViewModel_selectAll(data, event) {
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

    UserDetailRolesViewModel.prototype.onSelected =
      function userDetailRolesViewModel_onRoleSelected(data, event) {
          var roleKey, vm, foundRole, roleReallySelected;
          if (event.target.value) {
              roleKey = event.target.value.key;

              vm = ko.contextFor(event.target).$root;

              roleReallySelected = _.find(vm.assignedList.selectedItems, function (item) {
                  return item.key === roleKey;
              });

              if (roleReallySelected) {
                  foundRole = _.find(vm.selected(), function (role) { return role.key === roleKey; });
                  if (foundRole === undefined) {
                      vm.selected.push(event.target.value);
                  }
              }
              else {
                  foundRole = _.find(vm.selected(), function (role) { return role.key === roleKey; });
                  if (foundRole) {
                      vm.selected.splice(vm.selected.indexOf(event.target.value), 1);
                  }
              }
          }
      };

    UserDetailRolesViewModel.prototype.hasChanges = function hasChanges() {
        return this.isDirty();
    };

    UserDetailRolesViewModel.prototype.save = function save() {
    };

    UserDetailRolesViewModel.prototype.canSave = function canSave() {
        return this.isDirty();
    };

    UserDetailRolesViewModel.prototype.clearDirty = function hasChanges() {
        clearIsDirty(this);
    };

    UserDetailRolesViewModel.prototype.getUser = function getUser() {
        return this.selectedUser();
    };

    UserDetailRolesViewModel.prototype.selectUser = function selectUser(selectedUser) {
        this.selected([]);
        clearLists(this);
        this.selectedUser(selectedUser);
        this.assignedList.items = this.selectedUser().roles();
        if (this.selectedUser().key !== '0') {
            clearIsDirty(this);
        }
    };

    UserDetailRolesViewModel.prototype.delete =
      function userDetailRolesViewModel_delete(data, event) {
          var vm = ko.contextFor(event.target).$root;
          promptDeleteRoles(vm, confirmDeleteRoles_done.bind(null, vm));
      };


    //////////////////////
    // Implementation
    //////////////////////

    function isDirtyChanged(self, newValue) {
        self.events.isUserDirty.raise(newValue);
    }

    function dialog_done(self, dto) {
        var roleItems = self.assignedList.items;

        dto.forEach(function (item) {
            addNewToNewChangeLog(self, item);
            roleItems.push(item);
        });
        self.assignedList.items = sortByCaption(roleItems);
        self.selectedUser().roles(self.assignedList.items);
        self.selected([]);
    }

    function loadRoles(self, page, pageSize) {
        var dfd = $.Deferred();

        if (self.selectedUser()) {
            dfd.resolve(self.selectedUser().roles());
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    }

    function clearLists(self) {
        self.assignedNewChangeLog = [];
        self.assignedRemoveChangeLog = [];
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

    function removeFromRemoveChangedList(self, group) {
        for (var i = 0; i < self.assignedRemoveChangeLog.length; i++) {
            if (self.assignedRemoveChangeLog[i].key === group.key) {
                self.assignedRemoveChangeLog.splice(i, 1);
                break;
            }
        }
    }

    function removeFromNewChangedList(self, group) {
        for (var i = 0; i < self.assignedNewChangeLog.length; i++) {
            if (self.assignedNewChangeLog[i].key === group.key) {
                self.assignedNewChangeLog.splice(i, 1);
                break;
            }
        }
    }

    function removeFromList(self, groupToRemove) {
        var items = self.assignedList.items.slice();
        for (var i = 0; i < items.length; i++) {
            if (items[i].key === groupToRemove.key) {
                items.splice(i, 1);
            }
        }
        self.assignedList.items = items;
    }

    function addNewToRemoveChangeLog(self, group) {
        var canAdd = true;
        self.assignedNewChangeLog.forEach(function (item) {
            if (item.key === group.key) {
                canAdd = false;
                // Remove from new group as well, add\delete cancel eachother out
                removeFromNewChangedList(self, item);
            }
        });
        if (canAdd) {
            self.assignedRemoveChangeLog.push(group);
        }
    }

    function sortByCaption(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'caption'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }

    function promptDeleteRoles(self, doneCallback) {
        var msg = self.translate('SEC_USERS_CONFIRM_DELETE_CURRENT_ROLE'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function canDelete_read(self) {
        return self.selected().length > 0 && self.selectedUser() && !self.isLoading();
    }

    function confirmDeleteRoles_done(self, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            self.assignedList.selectedItems.forEach(function (item) {
                addNewToRemoveChangeLog(self, item);
                removeFromList(self, item);
            });
            self.selectedUser().roles(self.assignedList.items);
            self.selected([]);
        }
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedUser()) {
            return;
        }

        hashObject = {
            assignedRoles: _.map(self.selectedUser().roles(), function (role) {
                return role.key;
            })
        };
        return JSON.stringify(hashObject);
    }

    return UserDetailRolesViewModel;
});
