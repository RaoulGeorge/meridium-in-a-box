define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
    ApplicationEvents = require('application/application-events'),
    Translator = require('system/globalization/translator'),
    ErrorMessage = require('system/error/error-message'),
    MessageBox = require('system/ui/message-box'),
    GroupEvents = require('./group-events'),
    KnockoutViewModel = require('spa/ko/knockout-view-model'),
    KnockoutManager = require('system/knockout/knockout-manager'),
    SecurityService = require('../../services/security-service'),
    Region = require('spa/region'),
    userAdapter = require('../../adapters/user-adapter'),
    DialogBox = require('system/ui/dialog-box'),
    DialogScreen = require('./group-detail-users-dialog-view-model'),
    ChangeTracker = require('system/knockout/change-tracker'),
    view = require('text!../views/group-detail-users.html');

    require('ui/elements/list-group/view-model');

    function GroupDetailUsersViewModel(kom, applicationEvents, securityService,groupEvents) {
        base.call(this, view);
        var self = this;
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = groupEvents;
        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.selectedGroup = this.kom.observable();
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
            screen.currentUsers(this.assignedList.items);

            var options = {
                buttons: [
                           { name: self.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                           { name: self.translate('UPDATE'), value: 'save', cssClass: 'btn-primary' }
                ],
                closeOnReject: true
            };
            var dialog = new DialogBox(screen, self.translate('ASSIGN_USERS'), options);
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

    var base = Object.inherit(KnockoutViewModel, GroupDetailUsersViewModel);
    GroupDetailUsersViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, GroupEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    GroupDetailUsersViewModel.prototype.load =
        function groupDetailUsersViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.isLoading = this.kom.observable();


            // Clear isDirty().
            clearIsDirty(this);

            return dfd.promise();
        };

    GroupDetailUsersViewModel.prototype.activate =
        function groupDetailUsersViewModel_activate() {
            // Set up our computed observables.
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.events.groupSelected.add(this.onGroupSelected, this);
            this.events.folderUpdated.add(this.onFolderUpdated, this);
            this.isDirty.subscribe(isDirtyChanged.bind(null, this));
        };

    GroupDetailUsersViewModel.prototype.attach =
        function groupDetailUsersViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
            this.assignedList = this.region.$element.find('mi-list-group')[0];
            Element.upgrade(this.assignedList);
            this.assignedList.loader = loadUsers.bind(null, this);
            this.selected([]);
        };

    GroupDetailUsersViewModel.prototype.detach =
        function groupDetailUsersViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    GroupDetailUsersViewModel.prototype.canUnload =
        function userDetailUsersViewModel_canUnload() {
            return true;
        };

    GroupDetailUsersViewModel.prototype.deactivate =
        function groupDetailUsersViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.groupSelected.remove(this);
            this.events.folderUpdated.remove(this);
        };

    GroupDetailUsersViewModel.prototype.unload =
        function groupDetailUsersViewModel_unload() {
            this.kom.disposeObservables();
        };


    /////////////////////
    // Behavior
    /////////////////////

    GroupDetailUsersViewModel.prototype.onGroupSelected =
    function groupDetailUsersViewModel_onGroupSelected(group) {
        if (group !== null) {
            this.selectedGroup(group);
            this.selected([]);
            clearLists(this);
            this.assignedList.items = sortByCaption(this.selectedGroup().assignedUsers());
            if (group.key !== '0') {
                clearIsDirty(this);
            }
        } else {
            this.selectedGroup(null);
            this.selected([]);
            clearLists(this);
            this.assignedList.items = [];
            clearIsDirty(this);
        }
    };

    GroupDetailUsersViewModel.prototype.onFolderUpdated =
        function groupsNavViewModel_onFolderUpdated(folder) {
            clearIsDirty(this);
            clearLists(this);
            this.selected([]);
        };

    GroupDetailUsersViewModel.prototype.onAdd =
       function groupDetailUsersViewModel_onUserAdd(data, event) {
           var vm = ko.contextFor(event.target).$root;
           vm.show();
       };

    GroupDetailUsersViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    GroupDetailUsersViewModel.prototype.selectAll =
      function groupDetailUsersViewModel_selectAll(data, event) {
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

    GroupDetailUsersViewModel.prototype.onSelecting =
     function groupDetailUsersViewModel_onGroupSelected(data, event) {
         return true;
     };

    GroupDetailUsersViewModel.prototype.onSelected =
      function groupDetailUsersViewModel_onGroupSelected(data, event) {
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

    GroupDetailUsersViewModel.prototype.getGroup = function getUser() {
        return this.selectedGroup();
    };

    GroupDetailUsersViewModel.prototype.delete =
      function userDetailGroupsViewModel_delete(data, event) {
          var vm = ko.contextFor(event.target).$root;
          promptDeleteGroups(vm, confirmDeleteGroups_done.bind(null, vm));
      };


    //////////////////////
    // Implementation
    //////////////////////

    function isDirtyChanged(self, newValue) {
        self.events.isGroupDirty.raise(newValue);
    }

    function clearLists(self) {
        self.assignedNewChangeLog = [];
        self.assignedRemoveChangeLog = [];
    }

    function dialog_done(self, dto) {
        var userItems = self.assignedList.items;

        dto.forEach(function (item) {
            addNewToNewChangeLog(self, item);
            userItems.push(userAdapter.toModelObject(item));
        });
        self.assignedList.items = sortByCaption(userItems);
        self.selectedGroup().assignedUsers(self.assignedList.items);
        self.selected([]);
    }

    function loadUsers(self, page, pageSize) {
        var dfd = $.Deferred();

        if (self.selectedGroup()) {
            dfd.resolve(self.selectedGroup().assignedUsers());
        } else {
            dfd.resolve();
        }
        return dfd.promise();
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
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'displayName'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property]().toLowerCase();
    }

    function promptDeleteGroups(self, doneCallback) {
        var msg = self.translate('SEC_GROUPS_CONFIRM_DELETE_CURRENT_USER'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function canDelete_read(self) {
        return self.selected().length > 0 && self.selectedGroup() && !self.isLoading();
    }

    function confirmDeleteGroups_done(self, clickedButtonIndex) {
        var groupsToDelete;
        if (clickedButtonIndex === 0) {
            self.assignedList.selectedItems.forEach(function (item) {
                addNewToRemoveChangeLog(self, item);
                removeFromList(self, item);
            });
            self.selectedGroup().assignedUsers(self.assignedList.items);
            self.selected([]);
        }
    }


    function createHash(self) {
        var hashObject;

        if (!self.selectedGroup()) {
            return;
        }

        hashObject = {
            assignedGroups: _.map(self.selectedGroup().assignedUsers(), function (user) {
                return user.key;
            })
        };
        return JSON.stringify(hashObject);
    }

    return GroupDetailUsersViewModel;
});
