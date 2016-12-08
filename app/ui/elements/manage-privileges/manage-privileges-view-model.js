define(function (require) {
    'use strict';

    var _ = require('lodash');
    var ko = require('knockout'),
    UsersListViewModel = require('ui/elements/manage-privileges/users-list-view-model'),
    PrivilegesModel = require('ui/elements/manage-privileges/privileges-model'),
    DialogBox = require('system/ui/dialog-box'),
    ApplicationContext = require('application/application-context'),
    Translator = require('system/globalization/translator'),
    toastr = require("toastr");

    require('kobindings');
    require('system/lang/object');
    require('knockouteditables');
    

    function ManagePrivilegesViewModel(params) {

        var self = this;

        self.privileges = params.$raw ? ko.pureComputed({
            read: params.privilegesList,

            write: function (value) { params.$raw.privilegesList(value); }
        }) : params.privilegesList;

       
        self.selectedUserViewPrivilege = params.configurePrivilegesList[0];
        self.selectedUserUpdatePrivilege = params.configurePrivilegesList[1];
        self.selectedUserDeletePrivilege = params.configurePrivilegesList[2];
        self.translator = Object.resolve(Translator);
        self.currentUserKey = ko.observable(parseInt(ApplicationContext.user.key));
         _.each(self.privileges(), function (item) {
           item.canUpdate.subscribe(function (newValue) {
                if (newValue === false) {
                    item.canDelete(false);
                    }
        });

            item.canDelete.subscribe(function (newValue) {
                if (newValue === true) {
                    item.canUpdate(true);
        }
        });

        });      
    }
    ManagePrivilegesViewModel.prototype.load = function load() {
        var self = this;
        self.privileges(_.sortBy(self.privileges(), function (item) {
            return item.name;
        }));
    };

    //ManagePrivilegesViewModel.prototype.canUnload = function canUnload() {
    //    var self = this;
    //    _.each(self.privileges(), function (item) {

    //        item.canUpdate.dispose();
    //        item.canDelete.dispose();
    //    });
    //};

    //var base = Object.inherit(KnockoutViewModel, ManagePrivilegesViewModel);
    ManagePrivilegesViewModel.prototype.add = function addUserOrGroup() {
        var self = this;
        var screen = Object.resolve(UsersListViewModel);
        
        var options = {
            buttons: [{ name: self.translator.translate('OK'), value: 'ok', cssClass: 'btn-text btn-primary' },
                      { name: self.translator.translate('CANCEL'), value: 'close', cssClass: 'btn-text btn-secondary'}],
            closeOnReject: false,
            height: '80%',
            width: '50%'
        };

        var dialog = new DialogBox(screen, self.translator.translate('PRIVILEGE_SELECT_USERS_OR_GROUP'), options);
        dialog.show()
        .done(function (btnIndex, btnValue, data) {
        switch (btnValue) {
            case 'ok': {

                if ((data.selectedUsersList() && data.selectedUsersList().length) || (data.selectedGroupList() && data.selectedGroupList().length)) {

                    // adding selected users
                    _.each(data.selectedUsersList(), function (item) {
                       
                        var checkDuplicate = false;
                        _.find(self.privileges(), function (userOrGroup) {
                            if (userOrGroup.key() === item.key) {
                                checkDuplicate = true;
                            }
                        });

                        if (!checkDuplicate) {
                            var privilegesModel = new PrivilegesModel();



                                if (item.firstName && item.lastName) {
                                    privilegesModel.name(item.lastName + ', ' + item.firstName);
                                } else {
                                    privilegesModel.name(item.id);
                                }

                            
                            privilegesModel.key(parseInt(item.key));
                            privilegesModel.isGroupPrivilege(false);
                            privilegesModel.canView(true);
                            privilegesModel.canUpdate(item.isSuperUser);
                            privilegesModel.canDelete(item.isSuperUser);
                            privilegesModel.isSuperUser(item.isSuperUser);
                                                                                                
                                                        
                            self.privileges.push(privilegesModel);
                        }
                    });


                    // adding selected groups


                    _.each(data.selectedGroupList(), function (item) {

                        var checkDuplicate = false;
                        _.find(self.privileges(), function (userOrGroup) {
                            if (userOrGroup.key() === item.key) {
                                checkDuplicate = true;
                            }
                        });

                        if (!checkDuplicate) {
                            var privilegesModel = new PrivilegesModel();


                                if (item.caption !== null || item !== '') {
                                    privilegesModel.name(item.caption);
                                } else {
                                    privilegesModel.name(item.id);
                                }
                                
                            privilegesModel.key(item.key);
                            privilegesModel.isGroupPrivilege(true);
                            privilegesModel.canView(true);
                            privilegesModel.canUpdate(false);
                            privilegesModel.canDelete(false);

                            self.privileges.push(privilegesModel);
                        }
                    });

                }

               
                _.each(self.privileges(), function (item) {
                    item.canUpdate.subscribe(function (newValue) {
                         if (newValue === false) {
                            item.canDelete(false);
                         }
                     });

                    item.canDelete.subscribe(function (newValue) {
                        if (newValue === true) {
                            item.canUpdate(true);
                        }
                    });
                });
                
                break;
            }
        }
        });


    };

    ManagePrivilegesViewModel.prototype.remove = function removeUserOrGroup(obj,userOrGroup) {
        var self = this;


        if (userOrGroup.key() === parseInt(ApplicationContext.user.key)) {
            toastr.error(self.translator.translate('PRIVILEGE_CANT_REMOVE_CURRENT_USER'));
            } else {
            obj.privileges.remove(function (item) {
                return item.key() === userOrGroup.key();
                });
            }
        

    };


    return ManagePrivilegesViewModel;

});