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
    DialogScreen = require('./user-detail-groups-dialog-view-model'),
    view = require('text!../views/user-detail-groups.html');

    require('ui/elements/list-group/view-model');

    function UserDetailGroupsViewModel(kom, applicationEvents, securityService,userEvents) {
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
            var dialog = new DialogBox(screen,self.translate('SEC_USERS_ASSIGN_GROUPS') , options);
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

    var base = Object.inherit(KnockoutViewModel, UserDetailGroupsViewModel);
    UserDetailGroupsViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService,UserEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    UserDetailGroupsViewModel.prototype.load =
        function userDetailGroupsViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.isLoading = this.kom.observable();
           

            // Clear isDirty().
            clearIsDirty(this);

            return dfd.promise();
        };

    UserDetailGroupsViewModel.prototype.activate =
        function userDetailGroupsViewModel_activate() {
            // Set up our computed observables.
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.events.userSelected.add(this.selectUser, this);
            this.isDirty.subscribe(isDirtyChanged.bind(null, this));
        };

    UserDetailGroupsViewModel.prototype.attach =
        function userDetailGroupsViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
            this.assignedList = this.region.$element.find('mi-list-group')[0];
            Element.upgrade(this.assignedList);
            this.assignedList.loader = loadGroups.bind(null, this);
            this.selected([]);
        };

    UserDetailGroupsViewModel.prototype.detach =
        function userDetailGroupsViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    //UserDetailGroupsViewModel.prototype.canUnload =
    //    function userDetailgroupsViewModel_canUnload() {
    //        return !this.isDirty() && !this.isLoading();
    //    };

    UserDetailGroupsViewModel.prototype.deactivate =
        function userDetailGroupsViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.userSelected.remove(this);
        };

    UserDetailGroupsViewModel.prototype.unload =
        function userDetailGroupsViewModel_unload() {
            this.kom.disposeObservables();
        };


    /////////////////////
    // Behavior
    /////////////////////

    UserDetailGroupsViewModel.prototype.onAdd =
   function userDetailGroupsViewModel_onGroupAdd(data, event) {
       var vm = ko.contextFor(event.target).$root;
       vm.show();
   };

    UserDetailGroupsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserDetailGroupsViewModel.prototype.selectAll =
      function userDetailGroupsViewModel_selectAll(data, event) {
          var items, vm, emptyList;

          vm = ko.contextFor(event.target).$root;

          items = vm.assignedList.items;

          if (vm.assignedList.selectedItems.length === 0) {
              vm.assignedList.selectedItems = _.filter(items, function (item) { return item.key!=='-1'; }); 
              vm.selected(items);
          } else {
              vm.assignedList.selectedItems.splice(0, vm.assignedList.selectedItems.length);
              vm.assignedList.items = items;
              vm.selected([]);
          }
      };

    UserDetailGroupsViewModel.prototype.onSelecting =
     function userDetailGroupsViewModel_onGroupSelected(data, event) {
         var items;
         if (event.originalEvent.newValue) {
             if (event.originalEvent.newValue.key === '-1') {
                 event.preventDefault();

                 MessageBox.showOk(this.translate('SEC_USERS_CANT_SELECT_EVERYONE'), this.translate('SEC_USERS_SELECT_GROUP'));
                 // Bug in the control.  if you remove it from the selecteditems, and try and set the selcteditems to the new list, it still leaves it selected in the main list.
                 // Have to remove it from the list and re-add it back. When it gets added back it adds it as unselected.
                 items = this.assignedList.items;
                 items.splice(this.assignedList.items.indexOf(event.originalEvent.newValue), 1);
                 items.push(event.originalEvent.newValue);
                 this.assignedList.items = sortByCaption(items);
                 this.selected([]);
                 return false;
             }
         }
         return true;
     };

    UserDetailGroupsViewModel.prototype.onSelected =
      function userDetailGroupsViewModel_onGroupSelected(data, event) {
          var groupKey, vm, foundGroup, groupReallySelected;
          if (event.target.value) {
              groupKey = event.target.value.key;
              vm = ko.contextFor(event.target).$root;
              groupReallySelected = _.find(vm.assignedList.selectedItems, function (item) {
                  return item.key === groupKey;
              });
              if (groupReallySelected) {
                  foundGroup = _.find(vm.selected(), function (group) { return group.key === groupKey; });
                  if (foundGroup === undefined) {
                      vm.selected.push(event.target.value);
                  }
              }
              else {
                  foundGroup = _.find(vm.selected(), function (group) { return group.key === groupKey; });
                  if (foundGroup) {
                      vm.selected.splice(vm.selected.indexOf(event.target.value), 1);
                  }
              }
          }
      };

    UserDetailGroupsViewModel.prototype.hasChanges = function hasChanges() {
        return this.isDirty();
    };

    UserDetailGroupsViewModel.prototype.save = function save() {

    };

    UserDetailGroupsViewModel.prototype.canSave = function canSave() {
        return this.isDirty();
    };

    UserDetailGroupsViewModel.prototype.clearDirty = function hasChanges() {
        clearIsDirty(this);
    };

    UserDetailGroupsViewModel.prototype.getUser = function getUser() {
        return this.selectedUser();
    };

    UserDetailGroupsViewModel.prototype.selectUser = function selectUser(selectedUser) {
        this.selectedUser(selectedUser);
        this.selected([]);
        this.assignedList.items = sortByCaption(this.selectedUser().groups());
        if (this.selectedUser().key !== '0') {
            clearIsDirty(this);
        }
    };
    
    UserDetailGroupsViewModel.prototype.delete =
      function userDetailGroupsViewModel_delete(data, event) {
          var vm = ko.contextFor(event.target).$root;
          promptDeleteGroups(vm, confirmDeleteGroups_done.bind(null, vm));
      };


    //////////////////////
    // Implementation
    //////////////////////

    function isDirtyChanged(self, newValue) {
        self.events.isUserDirty.raise(newValue);
    }

    function dialog_done(self, dto) {
        var groupItems = self.assignedList.items;

        dto.forEach(function (item) {
            addNewToNewChangeLog(self, item);
            groupItems.push(item);
        });
        self.assignedList.items = sortByCaption(groupItems);
        self.selectedUser().groups(self.assignedList.items);
        self.selected([]);
    }

    function loadGroups(self, page, pageSize) {
        var dfd = $.Deferred();

        if (self.selectedUser()) {
            dfd.resolve(self.selectedUser().groups());
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
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'caption'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }

    function promptDeleteGroups(self, doneCallback) {
        var msg = self.translate('SEC_USERS_CONFIRM_DELETE_CURRENT_GROUP'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function canDelete_read(self) {
        return self.selected().length > 0 && self.selectedUser() && !self.isLoading();
    }

    function confirmDeleteGroups_done(self, clickedButtonIndex) {
        var groupsToDelete;
        if (clickedButtonIndex === 0) {
            self.assignedList.selectedItems.forEach(function (item) {
                addNewToRemoveChangeLog(self, item);
                removeFromList(self, item);
            });
            console.log("testing");
            self.selectedUser().groups(self.assignedList.items);
            self.selected([]);
        }
    }


    function createHash(self) {
        var hashObject;

        if (!self.selectedUser()) {
            return;
        }

        hashObject = {
            assignedGroups: _.map(self.selectedUser().groups(), function (group) {
                return group.key;
            })
        };
        return JSON.stringify(hashObject);
    }

    return UserDetailGroupsViewModel;
});
