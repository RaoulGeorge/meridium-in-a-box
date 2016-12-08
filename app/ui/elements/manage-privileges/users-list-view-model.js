define(function (require) {

    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        view = require('text!ui/elements/manage-privileges/users-list-view.html'),
        ko = require('knockout'),
        ManagePrivilegesService = require('ui/elements/manage-privileges/manage-privileges-service'),
        Translator = require('system/globalization/translator'),
        ApplicationEvents = require('application/application-events'),
        ErrorMessage = require('system/error/error-message'),
        Conductor = require('spa/conductor'),
        DialogBox = require('system/ui/dialog-box');

    require('kobindings');
    require('system/lang/object');
    require('ui/elements/list-group/view-model');

    function UserListViewModel(conductor,managePrivilegesService, applicationEvents, translator) {
        var self = this;
        base.call(self, view);
        self.managePrivilegesService = managePrivilegesService;
        self.translator = translator;
        self.applicationEvents = applicationEvents;
        self.conductor = conductor || Object.resolve(Conductor);
        self.isBusy = ko.observable(false);
        self.type = ko.observable('user');
        self.showUser = ko.observable(true);
        self.showGroup = ko.observable(false);
        self.allUsersListLoaded = $.Deferred();
        self.allGroupsListLoaded = $.Deferred();
        self.allUsers = [];
        self.allGroups = [];        
        self.selectedUsersList = ko.observableArray([]);
        self.selectedGroupList = ko.observableArray([]);
        self.userList = null;
        self.groupList = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserListViewModel);
    UserListViewModel.dependsOn = [Conductor, ManagePrivilegesService, ApplicationEvents, Translator];//Dependency injection

    UserListViewModel.prototype.attach = function UserListViewModel_attach(region) {
        var self = this;

        base.prototype.attach.call(this, region);
        self.region = region;

        self.userList = self.region.$element.find('.user mi-list-group')[0];
        Element.upgrade(self.userList);
        self.userList.loader = LoadUserData.bind(null, self);
        self.userList.addEventListener('selected', this);
        self.userList.searchCallback = self.searchUserList.bind(self);


        self.groupList = self.region.$element.find('.group mi-list-group')[0];
        Element.upgrade(self.groupList);
        self.groupList.loader = LoadGroupData.bind(null, self);
        self.groupList.addEventListener('selected', this);
        self.groupList.searchCallback = self.searchGroupList.bind(self);

    };

    UserListViewModel.prototype.load = function UserListViewModel_load() {
        var self = this;
        
        self.isBusy(true);

        self.managePrivilegesService.getUsersList()
         .done(function (items) {

             _.each(items, getFullName);
             items = _.sortBy(items, 'fullName');

             self.allUsers = items;
             self.allUsersListLoaded.resolve();
             self.isBusy(false);

         })
         .fail(function (responsedata) {
             self.isBusy(false);
             handleServerError(self, responsedata, 'Error retrieving user list');
         });


        self.isBusy(true);

        self.managePrivilegesService.getGroupsList()
         .done(function (items) {

             _.each(items, getGroupCaption);
             items = _.sortBy(items, 'caption');

             self.allGroups = items;
             self.allGroupsListLoaded.resolve();
             self.isBusy(false);


         })
         .fail(function (responsedata) {
             self.isBusy(false);
             handleServerError(self, responsedata, 'Error retrieving group list');
         });



    };

    function getFullName(item) {
        if (item.firstName && item.lastName) {
            item.fullName = item.lastName + ', ' + item.firstName;
        } else {
            item.fullName = item.id;
        }
    }

    function getGroupCaption(item) {
        if (!item.caption) {
            item.caption = item.id;
        }
    }

    UserListViewModel.prototype.searchUserList = function UserListViewModel_searchUserList(searchString, pageNumber, pageSize) {
        var self = this,dfd = $.Deferred(),startIndex = (pageNumber - 1) * pageSize;

        self.allUsersListLoaded.done(function () {
           
            if (searchString && searchString.trim().length > 0) {
                searchString = searchString.trim().toLowerCase();

                var filtered = _.filter(self.allUsers, function (item) {
                    if (item.fullName.toLowerCase().indexOf(searchString) !== -1) {
                        return true;
                    }
                    return false;
                });

                if (startIndex < filtered.length) {
                    filtered = _.take(filtered.slice(startIndex), pageSize);
                    dfd.resolve(filtered);
                } else {
                    dfd.resolve([]);
                }

            } else {
                dfd.resolve(_.take(self.allUsers.slice(startIndex), pageSize));
            }

        });

        return dfd.promise();
    };



    UserListViewModel.prototype.searchGroupList = function UserListViewModel_searchGroupList(searchString, pageNumber, pageSize) {
        var self = this,dfd = $.Deferred(),startIndex = (pageNumber - 1) * pageSize;

        self.allGroupsListLoaded.done(function () {
          
            if (searchString && searchString.trim().length > 0) {
                searchString = searchString.trim().toLowerCase();
                var filtered = _.filter(self.allGroups, function (item) {
                    if (item.caption.toLowerCase().indexOf(searchString) !== -1) {
                        return true;
                    }
                    return false;
                });
               
                if (startIndex < filtered.length) {
                    filtered = _.take(filtered.slice(startIndex), pageSize);
                    dfd.resolve(filtered);
                } else {
                    dfd.resolve([]);
                }

            } else {
                dfd.resolve(_.take(self.allGroups.slice(startIndex), pageSize));
            }

        });

        return dfd.promise();
    };

    UserListViewModel.prototype.handleEvent = function (event) {
        var self = this;
        if (event.type === 'selected') {

            if (self.type() === 'user') {
                self.selectedUsersList(event.target.selectedItems);
            } else if (self.type() === 'group') {
                self.selectedGroupList(event.target.selectedItems);
            }
            
        }
    };



    function LoadUserData(self, pageNumber, pageSize) {
        var dfd = $.Deferred();

        self.allUsersListLoaded.done(function (items) {
            var startIndex = (pageNumber - 1) * pageSize;
            if (startIndex < self.allUsers.length) {
                var result = _.take(self.allUsers.slice(startIndex), pageSize);
                dfd.resolve(result);
            } else {
                dfd.resolve([]);
            }
        });



        return dfd.promise();
    }


    function LoadGroupData(self, pageNumber, pageSize) {
        var dfd = $.Deferred();

        self.allGroupsListLoaded.done(function () {
            var startIndex = (pageNumber - 1) * pageSize;
            if (startIndex < self.allGroups.length) {
                var result = _.take(self.allGroups.slice(startIndex), pageSize);
                dfd.resolve(result);
            } else {
                dfd.resolve([]);
            }
        });

        return dfd.promise();
    }

    UserListViewModel.prototype.ok = function ok_clicked() {
        var self = this;    
        return self;
    };

    UserListViewModel.prototype.selectuser = function ok_clicked() {
        var self = this;
        self.showUser(true);
        self.showGroup(false);
        self.type('user');
    };


    UserListViewModel.prototype.selectgroup = function ok_clicked() {
        var self = this;
        self.showUser(false);
        self.showGroup(true);
        self.type('group');
    };


    function handleServerError(self, response, message) {
        var code = response.status,
		detail = response.statusText,
		errorMessage = new ErrorMessage(code, message, detail);

        if (response.status === 400 && response.responseJSON && response.responseJSON.modelState) {
            self.selectedFamilyModel().serverErrors(response.responseJSON.modelState);
            errorMessage.message = errorMessage.message + ' : ' + 'Invalid data';
        } else {
            if (response.responseJSON && response.responseJSON.message) {
                errorMessage.detail = errorMessage.detail + " : " + '\n' + response.responseJSON.message;
            }
        }

        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }


    return UserListViewModel;
});