/**
 * Created by washley on 5/7/2015.
 */
define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        Events = require('./events'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        FmlyPrivDTO = require('../../services/fmlypriv-dto'),
        FmlyAdapter = require('../../adapters/fmlypriv-adapter'),
        DialogBox = require('system/ui/dialog-box'),
        UserDialogScreen = require('./permissions-detail-users-dialog-view-model'),
        GroupDialogScreen = require('./permissions-detail-groups-dialog-view-model'),
        view = require('text!../views/permissions-details.html');

    require('ui/elements/list-group/view-model');

    function PermissionsDetailsViewModel(kom, applicationEvents, securityService,events) {
        base.call(this, view);
        var self = this;
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.events = events;
        this.familyCaption=null;
        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        // knockout observables
        this.isLoading = null;
        this.canDelete = null;
        this.canSave = null;
        this.familyType=null;
        // Keep track of each change to related collections, so we can
        // commit those changes on save.
        this.assignedNewChangeLog = [];
        this.assignedRemoveChangeLog = [];
        this.selectedEntity=null;
        this.familyPrivs=null;
        this.showParents=null;
        this.canShowParents=null;
        this.showGroups=null;
        this.showUsers=null;
        this.newGroupChangeLog=null;
        this.newUserChangeLog=null;

        this.showUserDialog = function () {

            var screen = Object.resolve(UserDialogScreen);
            screen.currentUsers(_.filter(self.familyPrivs(),function(priv) {
                return !priv.isGroup();
            }));

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
                        userdialog_done(self, data);
                    }
                }
            );
        };

        this.showGroupDialog = function () {

            var screen = Object.resolve(GroupDialogScreen);
            screen.currentGroups(_.filter(self.familyPrivs(),function(priv) {
                return priv.isGroup();
            }));

            var options = {
                buttons: [
                    { name: self.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                    { name: self.translate('UPDATE'), value: 'save', cssClass: 'btn-primary' }
                ],
                closeOnReject: true
            };
            var dialog = new DialogBox(screen, self.translate('SEC_USERS_ASSIGN_GROUPS'), options);
            dialog.show()
                .done(function (btnIndex, btnValue, data) {
                    if (btnValue === 'save') {
                        // do something on save click
                        groupdialog_done(self, data);
                    }
                }
            );
        };

    }

    var base = Object.inherit(KnockoutViewModel, PermissionsDetailsViewModel);
    PermissionsDetailsViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, Events];

    ///////////////////
    // Lifecycle
    ///////////////////

    PermissionsDetailsViewModel.prototype.load =
        function groupDetailUsersViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.isLoading = this.kom.observable();
            this.familyCaption=this.kom.observable();
            this.selectedEntity=this.kom.observable();
            this.familyPrivs = this.kom.observableArray();
            this.showParents=this.kom.observable(true);
            this.showGroups=this.kom.observable(true);
            this.showUsers=this.kom.observable(true);
            this.familyType=this.kom.observable('entity');
            this.newGroupChangeLog=this.kom.observableArray();
            this.newUserChangeLog=this.kom.observableArray();
            this.selectAllMode=true;
            // Clear isDirty().
            clearIsDirty(this);
            return dfd.promise();
        };

    PermissionsDetailsViewModel.prototype.activate =
        function groupDetailUsersViewModel_activate() {
            // Set up our computed observables.
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canShowParents=this.kom.pureComputed(canShowParents_read.bind(null, this));
            this.events.folderNavigated.add(this.onFamilySelected, this);
            this.events.familyType.add(this.onFamilyTypeChanged,this);
            this.isDirty.subscribe(isDirtyChanged.bind(null, this));
        };

    PermissionsDetailsViewModel.prototype.attach =
        function groupDetailUsersViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
        };

    PermissionsDetailsViewModel.prototype.detach =
        function groupDetailUsersViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    PermissionsDetailsViewModel.prototype.canUnload =
        function userDetailUsersViewModel_canUnload() {
            var foo = this.isDirty();
            return true;
        };

    PermissionsDetailsViewModel.prototype.deactivate =
        function groupDetailUsersViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.folderNavigated.remove(this);
            this.events.familyType.remove(this);
        };

    PermissionsDetailsViewModel.prototype.unload =
        function groupDetailUsersViewModel_unload() {
            this.kom.disposeObservables();
        };


    /////////////////////
    // Behavior
    /////////////////////

    PermissionsDetailsViewModel.prototype.onFamilyTypeChanged =
        function detailsViewModel_onSelected(ft,event) {
            this.familyType(ft);
            this.newUserChangeLog([]);
            this.newGroupChangeLog([]);
            this.selectedEntity(null);
            this.familyCaption();
            this.familyPrivs(null);
            this.events.familySelected.raise(null);
            clearIsDirty(this);
        };


    PermissionsDetailsViewModel.prototype.onFamilySelected =
        function detailsViewModel_onSelected(entityDTO,event) {
            if (entityDTO) {
                if (entityDTO.key) {
                    this.newUserChangeLog([]);
                    this.newGroupChangeLog([]);
                    this.selectedEntity(entityDTO);
                    this.familyCaption(entityDTO.caption);
                    if (entityDTO.key === 0) {
                        this.familyPrivs([]);
                        this.events.familySelected.raise(this.familyPrivs(), this.selectedEntity());
                    } else {
                        this.service.getFmlyPrivsAndChildren(entityDTO.key)
                            .done(get_done.bind(null, this))
                            .fail(handleAjaxRequestError.bind(null, this));
                    }
                } else {
                    this.newUserChangeLog([]);
                    this.newGroupChangeLog([]);
                    this.selectedEntity(null);
                    this.familyCaption();
                    this.familyPrivs(null);
                    this.events.familySelected.raise(null);
                    clearIsDirty(this);
                }
            }
        };

    PermissionsDetailsViewModel.prototype.onDelete =
        function detailsViewModel_onAddUser(data, event) {
            promptDelete(this, confirmDelete_done.bind(null, this));
        };

    PermissionsDetailsViewModel.prototype.onAddUser =
        function detailsViewModel_onAddUser(data, event) {
            var vm = ko.contextFor(event.target).$root;
            vm.showUserDialog();
        };

    PermissionsDetailsViewModel.prototype.onAddGroup =
        function detailsViewModel_onAddGroup(data, event) {
            var vm = ko.contextFor(event.target).$root;
            vm.showGroupDialog();
        };

    PermissionsDetailsViewModel.prototype.save =
        function detailsViewModel_onAddGroup(data, event) {
            var self = this;
            var i = 0;
            var dfd = new $.Deferred();
            if (!validatePrivs(self)) {
                MessageBox.showOk(self.translate('FAMILY_PRIVILEGE_INVALID_PRIV'),self.translate('SAVE'));
                return;
            }

            _.each(this.familyPrivs(), function (priv) {
                var dirty = priv.isDirty();
                if (priv.isDeleted()) {
                    self.service.deleteFmlyPriv(priv.key())
                        .done(delete_done.bind(null, self, dfd, priv))
                        .fail(handleAjaxRequestError.bind(null, self));
                } else if (priv.key() === '0') {
                    self.service.postFmlyPriv(FmlyAdapter.toDTO(priv))
                        .done(post_done.bind(null, self, dfd, i))
                        .fail(handleAjaxRequestError.bind(null, self));
                }
                else if (priv.isDirty()) {
                    self.service.putFmlyPriv(FmlyAdapter.toDTO(priv))
                        .done(put_done.bind(null, self, dfd, priv))
                        .fail(handleAjaxRequestError.bind(null, self));
                }
            });
            clearIsDirty(self);
            return dfd.promise();
        };

    PermissionsDetailsViewModel.prototype.canShowPriv =
        function detailsViewModel_onHideParents(isParent,isGroup,isDeleted) {
           if (isParent && !this.showParents()) {
               return false;
           }

            if (isGroup) {
                if (!this.showGroups()) {
                    return false;
                }
            } else {
                if (!this.showUsers()) {
                    return false;
                }
            }

            if (isDeleted) {
                return false;
            }
            return true;
        };


    PermissionsDetailsViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };



    PermissionsDetailsViewModel.prototype.selectAll =
        function groupDetailUsersViewModel_selectAll(data, event) {
            var items, vm, emptyList;

            vm = ko.contextFor(event.target).$root;
            


            _.each(vm.familyPrivs(),function(priv) {
                if (!priv.isParent(vm.familyCaption()) && vm.canShowPriv(priv.isParent(vm.familyCaption()),priv.isGroup(),priv.isDeleted())) {
                    priv.isSelected(vm.selectAllMode);
                }
            });
            vm.selectAllMode=!vm.selectAllMode;
        };


    //////////////////////
    // Implementation
    //////////////////////

    function validatePrivs(self) {
        _.each(self.familyPrivs(),function(priv) {
            var val = 0;
            if (priv.ins()) {
                val += 1;
            }
            if (priv.vw()) {
                val += 2;
            }
            if (priv.upd()) {
                val += 4;
            }
            if (priv.del()) {
                val += 8;
            }
            priv.privilege(val);
        });

        return  !_.find(self.familyPrivs(),function(priv) {
           return priv.privilege()===0 && priv.isDeleted(false);
        });
    }

    function get_done(self, data) {
        if (data) {
            self.familyPrivs(sortBy(FmlyAdapter.toModelObjectArray(data)));
        } else {
            self.familyPrivs([]);
        }
        clearIsDirty(self);
        self.events.familySelected.raise(self.familyPrivs(),self.selectedEntity());
    }




    function isDirtyChanged(self, newValue) {
        self.events.isFamilyDirty.raise(newValue);
    }

    function groupdialog_done(self, dtos) {
        _.each(dtos,function(dto) {
            self.newGroupChangeLog.push(dto);
            var priv = new FmlyPrivDTO();
            priv.key = '0';
            priv.familyKey = self.selectedEntity().key;
            priv.familyDisplay=self.selectedEntity().caption;
            priv.groupKey = dto.key;
            priv.groupDisplay=dto.caption;
            self.familyPrivs.push(FmlyAdapter.toModelObject(priv));
            self.familyPrivs(sortBy(self.familyPrivs()));
        });
    }

    function userdialog_done(self, dtos) {

        _.each(dtos,function(dto) {
            self.newUserChangeLog.push(dto);
            var priv = new FmlyPrivDTO();
            priv.key = '0';
            priv.familyKey = self.selectedEntity().key;
            priv.familyDisplay=self.selectedEntity().caption;
            priv.userKey = dto.key;
            priv.userDisplay=dto.fullDisplayName;
            self.familyPrivs.push(FmlyAdapter.toModelObject(priv));
            self.familyPrivs(sortBy(self.familyPrivs()));
        });
    }

    function delete_done(self, dfd, data) {
        clearIsDirty(self);
        dfd.resolve();
    }

    function put_done(self, dfd, priv) {
        priv.hash(priv.ins() + priv.vw() + priv.upd() + priv.del());
        clearIsDirty(self);
        dfd.resolve();
    }

    function post_done(self, dfd, idx, data) {
        self.service.getFmlyPrivsAndChildren(self.selectedEntity().key)
            .done(get_done.bind(null, self))
            .fail(handleAjaxRequestError.bind(null, self));
        dfd.resolve();
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

    function sortBy(dtos) {
        return _(dtos).chain().sortBy(function(priv) {
            return priv.caption();
        }).sortBy(function(priv) {
            return priv.isGroup();
        }).sortBy(function(priv) {
            return priv.familyDisplay();
        }).value();
    }

    function promptDelete(self, doneCallback) {
        var msg = self.translate('FMLYPRIV_CONFIRM_DELETE_MSG').format(name),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function canDelete_read(self) {
        return _.find(self.familyPrivs(),function(priv) {
           return priv.isSelected();
        });
    }

    function canSave_read(self) {
        return self.isDirty() && !self.isLoading();
    }
    function canShowParents_read(self) {
        return self.familyType()==='entity';
    }


    function confirmDelete_done(self,clickedButtonIndex) {
        var newGroup,newUser;
        if (clickedButtonIndex === 0) {
            _.each(self.familyPrivs(),function(priv) {
               if (priv.isSelected()) {
                   if (priv.isGroup()) {
                       newGroup=_.find(self.newGroupChangeLog(),function(item) {
                               return item.key===priv.groupKey();
                           });
                       if (newGroup) {
                           self.newGroupChangeLog.remove(newGroup);
                       }
                   } else {
                       newUser=_.find(self.newUserChangeLog(),function(item) {
                           return item.key===priv.userKey();
                       });
                       if (newUser) {
                           self.newUserChangeLog.remove(newUser);
                       }
                   }
                   priv.isDeleted(true);
                   priv.isSelected(false);
               }
            });

        }
    }


    function createHash(self) {
        var hashObject;

        if (!self.familyPrivs()) {
            return;
        }

        hashObject = {
            assignedPrivs: _.map(self.familyPrivs(), function (priv) {
                return FmlyAdapter.toDTO(priv);

            })
        };
        return JSON.stringify(hashObject);
    }

    return PermissionsDetailsViewModel;
});
