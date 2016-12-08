define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        SecurityService = require('security/services/security-service'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        FamilyDTO = require('security/services/family-dto'),
        GroupDTO = require('security/services/group-dto'),
        UserDTO = require('security/services/user-dto'),
        FmlyPrivDTO = require('security/services/fmlypriv-dto'),
        FmlyAdapter = require('../adapters/fmlypriv-adapter'),
        FmlyModel = require('../model/fmlypriv-model'),
        MessageBox = require('system/ui/message-box'),
        view = require('text!../views/fmlypriv.html');

    function FmlyPrivViewModel(kom, securityService,applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.translator = Object.resolve(Translator);
        this.securityService = securityService;
        this.applicationEvents = applicationEvents;
        this.isError = null;

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        this.isFmlySelected = null;

        // observables
        this.fmlys = null;
        this.groupprivs = null;
        this.userprivs = null;
        this.groups = null;
        this.users = null;
        this.selectedFmly = null;
        this.canSave = null;

        // server/ajax error message
        //this.errMsg = null;
    }

    var base = Object.inherit(KnockoutViewModel, FmlyPrivViewModel);
    FmlyPrivViewModel.dependsOn = [KnockoutManager, SecurityService,ApplicationEvents];

    // Event model
    FmlyPrivViewModel.prototype.load = function fmlyprivViewModel_load() {
        var dfd = new $.Deferred();
        var self = this;

        this.isError = this.kom.observable(false);
        clearIsDirty(this);
        this.isFmlySelected = this.kom.observable(false);

        this.fmlys = this.kom.observableArray();
        this.groupprivs = this.kom.observableArray();
        this.userprivs = this.kom.observableArray();
        this.groups = this.kom.observableArray();
        this.users = this.kom.observableArray();
        this.selectedFmly = this.kom.observable(new FamilyDTO());

        //this.errMsg = this.kom.observable();

        this.securityService.getGroups(true, true)
            .done(groups_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getUsers(true, true)
            .done(users_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getFamilies()
            .done(fmly_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    FmlyPrivViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;

            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

        };

    FmlyPrivViewModel.prototype.activate = function datasourceViewModel_activate() {
        this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
    };

    FmlyPrivViewModel.prototype.deactivate = function datasourceViewModel_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    FmlyPrivViewModel.prototype.unload = function datasourceViewModel_deactivate() {
        this.kom.disposeObservables();
    };

    // Behavior
    FmlyPrivViewModel.prototype.isSelected = function (data) {
        if (data.key === this.selectedFmly().key) {
            return true;
        }
        else {
            return false;
        }
    };

    FmlyPrivViewModel.prototype.newGroupItem = function () {
        var self = this;
        var priv = new FmlyPrivDTO();
        priv.key = '0';
        priv.familyKey = this.selectedFmly().key;
        priv.groupKey = '0';
        this.groupprivs.unshift(FmlyAdapter.toModelObject(priv));

        //var $nav = $('.top-nav.block-group');
        //var position = $nav.css("position");
        //if (position !== "fixed")
        //    $nav.css("position", "fixed");

        //// Find the last item in the list, which is where we added it, and scroll to it.
        ////var $item = self.region.$element.find('.group-list>.priv-item').last();
        //var $item = $('.priv-panel-group>.priv-list>.priv-item').last();
        //if ($item.position()) {
        //    $item[0].scrollIntoView();
        //}

        //if (position !== "fixed")
        //    $nav.css("position", position);
    };

    FmlyPrivViewModel.prototype.newUserItem = function () {
        var self = this;
        var priv = new FmlyPrivDTO();
        priv.key = '0';
        priv.familyKey = this.selectedFmly().key;
        priv.userKey = '0';
        // this.selectedUser(priv);
        this.userprivs.unshift(FmlyAdapter.toModelObject(priv));

        //var $nav = $('.top-nav.block-group');
        //var position = $nav.css("position");
        //if (position !== "fixed")
        //    $nav.css("position", "fixed");

        //// Find the last item in the list, which is where we added it, and scroll to it.
        //var $item = $('.priv-panel-user>.priv-list>.priv-item').last();
        //if ($item.position()) {
        //    $item[0].scrollIntoView();
        //}

        //if (position !== "fixed")
        //    $nav.css("position", position);
    };

    FmlyPrivViewModel.prototype.saveItem = function () {
        var self = this;
        var i = 0;
        var dfd = new $.Deferred();
        if (!validateGroupPrivs(self)) {
            return;
        }
        if (!validateUserPrivs(self)) {
            return;
        }

        // Groups
        for (i = 0; i < this.groupprivs().length; i++) {
            if (this.groupprivs()[i].isDeleted()) {
                self.securityService.deleteFmlyPriv(this.groupprivs()[i].key())
                    .done(delete_done.bind(null, self, dfd, this.groupprivs()[i]))
                    .fail(handleErrorMsg.bind(null, self));
            } else if (this.groupprivs()[i].key() === '0') {
                this.securityService.postFmlyPriv(FmlyAdapter.toDTO(this.groupprivs()[i]))
                    .done(post_done.bind(null, this, dfd, i))
                    .fail(handleErrorMsg.bind(null, this));
            }
            else {
                this.securityService.putFmlyPriv(FmlyAdapter.toDTO(this.groupprivs()[i]))
                    .done(put_done.bind(null, this, dfd))
                    .fail(handleErrorMsg.bind(null, this));
            }
        }
        // Users
        for (i = 0; i < this.userprivs().length; i++) {
            if (this.userprivs()[i].isDeleted()) {
                self.securityService.deleteFmlyPriv(this.userprivs()[i].key())
                    .done(delete_done.bind(null, self, dfd, this.userprivs()[i]))
                    .fail(handleErrorMsg.bind(null, self));
            } else if (this.userprivs()[i].key() === '0') {
                this.securityService.postFmlyPriv(FmlyAdapter.toDTO(this.userprivs()[i]))
                    .done(post_done.bind(null, this, dfd, i))
                    .fail(handleErrorMsg.bind(null, this));
            }
            else {
                this.securityService.putFmlyPriv(FmlyAdapter.toDTO(this.userprivs()[i]))
                    .done(put_done.bind(null, this, dfd))
                    .fail(handleErrorMsg.bind(null, this));
            }
        }
        clearIsDirty(this);
        return dfd.promise();
    };

    FmlyPrivViewModel.prototype.unDeleteItem = function (data, event) {
        var vm = ko.contextFor(event.target).$root, name;
        data.isDeleted(false);
    };

    FmlyPrivViewModel.prototype.deleteItem = function (data, event) {
        var vm = ko.contextFor(event.target).$root,name;


        var self = vm;
            if (data.groupKey() !== '0') {
                name=data.groupDisplay();
               // vm.groupprivs.remove(data);
            }
            else if (data.userKey() !=='0') {
                name=data.userDisplay();
               // vm.userprivs.remove(data);
            }


        promptDelete(vm, confirmDelete_done.bind(null, vm,data),name);
        //var dfd = new $.Deferred();
        //self.securityService.deleteFmlyPriv(data.key)
        //    .done(delete_done.bind(null, self, dfd, this))
        //    .fail(handleErrorMsg.bind(null, self));
        //return dfd.promise();
    };

    FmlyPrivViewModel.prototype.fmlySelected = function (data) {
        var self = this;
        if (this.isDirty()) {
            // The query has changed, and the user is leaving the query tool.
            MessageBox.showYesNo(this.translate('QUERY_EDITOR_CONF_LOSE_CHANGES'), this.translate('CONFIRM_NAVIGATION'))
                .done(function (buttonClicked) {
                    if (buttonClicked === 1) {
                        return;
                    }
                    else {
                        selectFamily(self, data);
                    }
                });
        }
        else {
            selectFamily(self, data);
        }
    };

    function selectFamily(self, data) {
        self.isFmlySelected(true);
        self.selectedFmly(data);
        var dfd = new $.Deferred();
        self.securityService.getFmlyPrivs(data.key)
            .done(get_done.bind(null, self, dfd))
            .fail(handleErrorMsg.bind(null, self));
    }

    FmlyPrivViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };


    function confirmDelete_done(self,data,clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            data.isDeleted(true);
        }
    }

    // Implementation

    function promptDelete(self, doneCallback, name) {
        var msg = self.translate('FMLYPRIV_CONFIRM_DELETE_MSG').format(name),
                 title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }


    function validateGroupPrivs(self) {
        // Find the new rows then check and see if they already exist.
        var i = 0;
        var j = 0;
        checki:
            for (i = 0; i < self.groupprivs().length; i++) {
                if (self.groupprivs()[i].key() !== '0') {
                    continue checki;
                }
                checkj:
                    for (j = 0; j < self.groupprivs().length; j++) {
                        if (i === j) {
                            continue checkj;
                        }
                        if (self.groupprivs()[i].groupKey() === self.groupprivs()[j].groupKey()) {
                            MessageBox.showOk("Group '" + getGroupCaption(self, self.groupprivs()[j].groupKey()) + "' has been entered more than once.");
                            return false;
                        }
                    }
            }
        for (i = 0; i < self.groupprivs().length; i++) {
            //if (!self.groupprivs()[i].isDirty()) {
            //    continue;
            //}
            var data = self.groupprivs()[i];
            var val = 0;
            if (data.ins()) {
                val += 1;
            }
            if (data.vw()) {
                val += 2;
            }
            if (data.upd()) {
                val += 4;
            }
            if (data.del()) {
                val += 8;
            }
            if (data.groupKey() === '0') {
                MessageBox.showOk(self.translate('SEC_FMLY_PRIV_SELECT_GROUP'));
                return false;
            }
            if (val === 0) {
                MessageBox.showOk(self.translate('SEC_FMLY_PRIV_CHECK_PRIV_TYPE'));
                return false;
            }
            self.groupprivs()[i].privilege(val);
        }
        return true;
    }

    function validateUserPrivs(self) {
        // Find the new rows then check and see if they already exist.
        var i = 0;
        var j = 0;
        checki:
            for (i = 0; i < self.userprivs().length; i++) {
                if (self.userprivs()[i].key() !== '0') {
                    continue checki;
                }
                checkj:
                    for (j = 0; j < self.userprivs().length; j++) {
                        if (i === j) {
                            continue checkj;
                        }
                        if (self.userprivs()[i].userKey() === self.userprivs()[j].userKey()) {
                            MessageBox.showOk("User '" + getUserDisplayName(self, self.userprivs()[j].userKey()) + "' has been entered more than once.");
                            return false;
                        }
                    }
            }
        for (i = 0; i < self.userprivs().length; i++) {
            //if (!self.userprivs()[i].isDirty()) {
            //    continue;
            //}
            var data = self.userprivs()[i];
            var val = 0;
            if (data.ins()) {
                val += 1;
            }
            if (data.vw()) {
                val += 2;
            }
            if (data.upd()) {
                val += 4;
            }
            if (data.del()) {
                val += 8;
            }
            if (data.userKey() === '0') {
                MessageBox.showOk(self.translate('SEC_FMLY_PRIV_SELECT_USER'));
                return false;
            }
            if (val === 0) {
                MessageBox.showOk(self.translate('SEC_FMLY_PRIV_CHECK_PRIV_TYPE'));
                return;
            }
            self.userprivs()[i].privilege(val);
        }
        return true;
    }

    function fmly_done(self, dfd, data) {
        data.sort(comparer);
        self.fmlys(data);
        if (self.selectedFmly() === null) {
            return;
        }
        var key = self.selectedFmly().key;
        for (var i = 0; i < self.fmlys().length; i++) {
            if (self.fmlys()[i].key === key) {
                self.fmlySelected(self.fmlys()[i]);
                break;
            }
        }
        dfd.resolve();
    }

    function get_done(self, dfd, data) {
        var modelData;
        self.groupprivs.splice(0, self.groupprivs().length);
        self.userprivs.splice(0, self.userprivs().length);
        modelData = FmlyAdapter.toModelObjectArray(data);
        if (modelData) {
            for (var i = 0; i < modelData.length; i++) {
                if (modelData[i].groupKey() === undefined || modelData[i].groupKey() === null || modelData[i].groupKey() === '' || modelData[i].groupKey() === '0') {
                    self.userprivs.push(modelData[i]);
                }
                else {
                    self.groupprivs.push(modelData[i]);
                }
            }

            //WI
            self.groupprivs.sort(function (a, b) {
                return a.groupDisplay() < b.groupDisplay() ? -1 : a.groupDisplay() > b.groupDisplay() ? 1 : a.groupDisplay() === b.groupDisplay() ? 0 : 0;
            });
            self.userprivs.sort(function (a, b) {
                return a.userDisplay() < b.userDisplay() ? -1 : a.userDisplay() > b.userDisplay() ? 1 : a.userDisplay() === b.userDisplay() ? 0 : 0;
            });
        }
        dfd.resolve();
        clearIsDirty(self);
    }

    FmlyPrivViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': 'Security Manager', 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    FmlyPrivViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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

    function put_done(self, dfd) {
        clearIsDirty(self);
        dfd.resolve();
    }

    function post_done(self, dfd, idx, data) {
        if (data.groupKey !== '0') {
            self.groupprivs.splice(idx, 1, FmlyAdapter.toModelObject(new FmlyPrivDTO(data)));
        }
        else {
            self.userprivs.splice(idx, 1, FmlyAdapter.toModelObject(new FmlyPrivDTO(data)));
        }
        clearIsDirty(self);
        dfd.resolve();
    }

    function delete_done(self, dfd, data) {
        if (data.groupKey() !== '0') {
            self.groupprivs.remove(data);
        }
        else {
            self.userprivs.remove(data);
        }
        clearIsDirty(self);
        dfd.resolve();
    }

    function clearIsDirty(self) {
        // Clear isDirty().
        self.kom.tracker.markCurrentStateAsClean();
    }

    function groups_done(self, dfd, data) {
        data.sort(comparer);
        self.groups(data);
        var dummy = new GroupDTO();
        dummy.caption = '<' + self.translate('SEC_FMLY_PRIV_SELECT_GROUP') + '>';
        dummy.key = '0';
        self.groups.unshift(dummy);
        dfd.resolve();
    }

    function canSave_read(self) {
        return (self.isDirty());
    }

    function users_done(self, dfd, data) {
        self.users(data);
        var dummy = new UserDTO();
        dummy.displayName = '<' + self.translate('SEC_FMLY_PRIV_SELECT_USER') + '>';
        dummy.key = '0';
        self.users.unshift(dummy);
        dfd.resolve();
    }

    function handleErrorMsg(self, response) {
        MessageBox.showOk(response.statusText);
    }

    function comparer(a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) {
            return -1;
        }
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) {
            return 1;
        }
        return 0;
    }

    function getGroupCaption(self, groupKey) {
        for (var i = 0; i < self.groups().length; i++) {
            if (self.groups()[i].key === groupKey) {
                return self.groups()[i].caption;
            }
        }
    }

    function getUserDisplayName(self, userKey) {
        for (var i = 0; i < self.users().length; i++) {
            if (self.users()[i].key === userKey) {
                return self.users()[i].displayName;
            }
        }
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedFmly) {
            return;
        }

        hashObject = {
            assignedUsers: _.map(self.userprivs(), function (user) {
                return FmlyAdapter.toDTO(user);

            }),
            assignedGroups: _.map(self.groupprivs(), function (group) {
                return FmlyAdapter.toDTO(group);
            })
        };
        return JSON.stringify(hashObject);
    }

    return FmlyPrivViewModel;
});
