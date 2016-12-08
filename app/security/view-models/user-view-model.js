define(function (require) {
    'use strict';

    var $ = require('jquery');
    var jQuery = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationContext = require('application/application-context'),
        SecurityService = require('../services/security-service'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        ApplicationEvents = require('application/application-events'),
        UserDTO = require('../services/user-dto'),
        UserModel = require('../model/user-model'),
        userAdapter = require('../adapters/user-adapter'),
        view = require('text!../views/user.html'),
        ko = require('knockout');
    require('system/lang/string');
    require('ui/elements/breadcrumb/view-model');
    require('ui/elements/panel/view-model');

    //ToDo:
    // determine DTO state
    // Localization/Globalization
    // Site Filtering
    function UserViewModel(kom, securityService, applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.region = null;
        this.translator = Object.resolve(Translator);
        this.securityService = securityService;

        // ko events
        this.selectedUserDetailsSub = null;
        this.activeOnlySub = null;
        //this.groupSearchSub = null;

        this.users = null; // list of all users loaded from the data source
        this.filteredUsers = null; // computed: this.users list with filter applied
        this.selectedUser = null; // the user currently selected in the user list display
        this.selectedUserDetails = null; // the user currently bound to the user detail display
        this.userFilter = null; // search term used to filter users in the filteredUsers computed.
        this.activeOnly = null;
        this.sessionId = null;
        this.photoKey = null;
        this.applicationEvents = applicationEvents;

        this.queryPrivileges = null;
        this.uomConversionSets = null;
        this.cultures = null;
        this.timezones = null;
        this.sites = null;
        this.isSaving = null;

        // groups (select)
        this.unassignedGroups = null;
        this.assignedGroups = null;
        this.groupCache = null;

        // server/ajax error message
        this.errMsg = null;

        this.panel = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserViewModel);
    UserViewModel.dependsOn = [KnockoutManager, SecurityService, ApplicationEvents];


    ///////////////////
    // Lifecycle
    ///////////////////

    UserViewModel.prototype.load = function userViewModel_load() {
        var dfd = new $.Deferred();

        this.users = this.kom.observableArray();
        this.userFilter = this.kom.observable();
        this.activeOnly = this.kom.observable(false);
        this.filteredUsers = this.kom.computed(filteredUsers_read.bind(null, this));
        this.selectedUserDetails = this.kom.observable();
        this.selectedUser = this.kom.observable();
        this.queryPrivileges = this.kom.observableArray();
        this.uomConversionSets = this.kom.observableArray();
        this.cultures = this.kom.observableArray();
        this.timezones = this.kom.observableArray();
        this.sites = this.kom.observableArray();
        this.errMsg = this.kom.observable();
        this.sessionId = this.kom.observable(ApplicationContext.session.id);
        this.photoKey = this.kom.observable();

        this.unassignedGroups = this.kom.observableArray();
        this.assignedGroups = this.kom.observableArray();

        this.isSaving = this.kom.observable(false);
        this.securityService.getSystemCodes('MI_QUERY_PRIV')
            .done(this.queryPrivileges)
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getUomConversionSets()
            .done(this.uomConversionSets)
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getCultures()
            .done(this.cultures)
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getTimezones()
            .done(this.timezones)
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getUsers(true, this.activeOnly())
            .done(getUsers_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));
        this.securityService.getGroups(false, true)
            .done(getGroups_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));
        return dfd.promise();
    };

    UserViewModel.prototype.activate = function userViewModel_activate() {
        this.selectedUserDetails(null);
        this.kom.subscribe(this.selectedUser, selectedUser_subscribe.bind(null, this));
        //this.kom.subscribe(this.activeOnly, activeOnly_subscribe.bind(null, this));
        this.kom.subscribe(this.filteredUsers, filteredUsers_subscribe.bind(null, this));



        // Subscribe to changes in parent group selection.
        this.kom.subscribe(this.selectedUser,
            selectedUser_beforeChange.bind(null, this),
            null, 'beforeChange');

        this.kom.subscribe(this.selectedUser,
            selectedUser_change.bind(null, this));
    };

    UserViewModel.prototype.attach = function userViewModel_attach(region) {
        region.attach($(view));
        this.region = region;

        this.panel = this.region.$element.find('mi-panel')[0];
        Element.upgrade(this.panel);
        ko.applyBindingsToDescendants(this, region.element);

        $(this.panel).attr('description', 'displayName');
        $(this.panel).attr('key', 'key');
        $(this.panel).on('change', this.selectUser.bind(this));
        this.panel.loader = this.loadGroup.bind(this);
        this.panel.querySelector('mi-tool-bar mi-searchbox').searchCallback = this.userFilter.bind(this);

        this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
        Element.upgrade(this.breadcrumb);
        this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
        this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

        this.filter = this.region.$element.find('mi-filter-no-ko')[0];
        Element.upgrade(this.filter);
        this.filter.loader = this.consumerloader.bind(null, this);
        this.filter.filterCB(this.filterCB.bind(null, this));
    };

    UserViewModel.prototype.detach = function userViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    UserViewModel.prototype.canUnload = function userViewModel_canUnload() {
        var confirmation = true;

        // If we return false, it should prevent the app from navigating away
        // from the current URL.  This should work for navigation triggered by the
        // app OR by the browser (i.e. refresh, back, forward browser buttons).
        if (this.selectedUserDetails() && this.selectedUserDetails().isDirty()) {
            confirmation = confirm(this.translate('SEC_USER_UNSAVED_CHANGES') +
                                 '\n\n' +
                                 this.translate('ARE_YOU_SURE_CONTINUE'));
        }

        return confirmation;
    };

    UserViewModel.prototype.deactivate = function userViewModel_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    UserViewModel.prototype.unload = function userViewModel_unload() {
        this.kom.disposeObservables();
    };

    /////////////////////
    // Behavior
    /////////////////////

    UserViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
			{ 'text': 'Security Manager', 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    UserViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
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

    UserViewModel.prototype.changeDetail = function userViewModel_changeDetail(data) {
        if (event.target.id === 'chkinactive')
        {
            data.isActive(event.target.checked);
        }
        if (event.target.id === 'chksuperuser') {
            data.isSuperUser(event.target.checked);
        }
        if (!data.isDirty()) {
            data.isDirty(true);
        }
    };

    UserViewModel.prototype.setFilter = function userViewModel_setFilter() {
        if (this.selectedUserDetails() && this.selectedUserDetails().isDirty()) {
            var retVal = confirm(this.translate('SEC_USER_UNSAVED_CHANGES') +
                                 '\n\n' +
                                 this.translate('ARE_YOU_SURE_CONTINUE'));
            if (retVal === false) {
                return false;
            } else {
                this.selectedUserDetails().isActive((this.selectedUser().isActive() === '' ? false : Boolean(this.selectedUser().isActive())));
                this.selectedUserDetails().firstName(this.selectedUser().firstName());
                this.selectedUserDetails().lastName(this.selectedUser().lastName());
                this.selectedUserDetails().isDirty(false);
            }
        }
        if (event.target.id === 'activeonly') {
            this.activeOnly(true);
        } else {
            this.activeOnly(false);
        }
    };

    UserViewModel.prototype.saveUser = function userViewModel_saveUser() {
        var self = this,
            dfd = new $.Deferred(),
            dto,
            i = 0;

        if (this.selectedUserDetails().id() === undefined || this.selectedUserDetails().id() === '') {
            alert(this.translate('SEC_USER_ENTER_USER_ID')); return;
        }
        if (this.selectedUserDetails().lastName() === undefined || this.selectedUserDetails().lastName() === '') {
            alert(this.translate('SEC_USER_ENTER_LAST_NAME')); return;
        }
        self.errMsg(this.translate('PENDING'));
        dto = userAdapter.toDTO(this.selectedUserDetails());
        dto.groups = this.assignedGroups();
        if (this.selectedUserDetails().key === undefined ||
            this.selectedUserDetails().key === '' ||
            this.selectedUserDetails().key === '0') {
            if (this.selectedUserDetails().newPassword() === undefined || this.selectedUserDetails().newPassword() === '') {
                alert(this.translate('PASSWORD_REQUIRED'));
                return;
            }
            //check user is already present in observable array or not.  LastName, FirstName does NOT have to be unique!
            for (i = 0; i < this.filteredUsers().length; i++) {
                if ((jQuery.trim(this.filteredUsers()[i].id()) === jQuery.trim(this.selectedUserDetails().id()))) { // || (jQuery.trim(this.filteredUsers()[i].displayName()) === jQuery.trim(this.selectedUserDetails().displayName()))) {
                    self.errMsg('');
                    alert(self.translate('SEC_USER_ALREADY_PRESENT'));
                    return;
                }
            }
            this.isSaving(true);
            this.securityService.postUser(dto)
                .done(postUser_done.bind(null, self, dfd))
                .fail(handleErrorMsg.bind(null, self));
        } else {
            this.isSaving(true);
            this.securityService.putUser(dto)
                .done(putUser_done.bind(null, self, dfd, dto))
                .fail(handleErrorMsg.bind(null, self));
        }

        return dfd.promise();
    };

    UserViewModel.prototype.newUser = function userViewModel_newUser() {
        this.errMsg('');
        if (this.selectedUserDetails() && this.selectedUserDetails().isDirty()) {
            var retVal = confirm(this.translate('SEC_USER_UNSAVED_CHANGES') +
                                 '\n\n' +
                                 this.translate('ARE_YOU_SURE_CONTINUE'));
            if (retVal === false) {
                return false;
            }
        }
        var newUser = constructUser();
        var model = userAdapter.toModelObject(newUser);
        this.selectedUserDetails(model);
        this.selectedUser(model);
        if (this.assignedGroups && this.assignedGroups()) {
            this.assignedGroups.splice(0, this.assignedGroups().length);
            syncGroupAssignment(this);
        }

        //moved to first user in list
        this.scrollToActiveUserListItem();

        $('#browsePhoto').css('display', 'none');
        $('#deletePhoto').css('display', 'none');
        $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src=""/>');
    };

    UserViewModel.prototype.browsePhoto = function userViewModel_browsePhoto(data, event) {
        var inputControl = $('input#uploadFile')[0];
        var files = !!inputControl.files ? inputControl.files : [];
        if (!files.length || !window.FileReader) {
            return; // no file selected, or no FileReader support
        }
        if (/^image/.test(files[0].type)) { // only image file
            var reader = new FileReader(), // instance of the FileReader
                vm = ko.contextFor(event.target).$root;

            reader.readAsDataURL(files[0]); // read the local file
            reader.onloadend = function () {
                $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src="' + this.result + '"/>');
                $('#browsePhoto').css('display', 'none');
                $('#deletePhoto').css('display', 'inline-block');
                vm.selectedUserDetails().isDirty(true);
                vm.selectedUserDetails().hasThumbnailPhoto(true);
                savePhoto(vm, vm.selectedUserDetails().key);
            };
        }
    };

    UserViewModel.prototype.deletePhoto = function userViewModel_deletePhoto(data, event) {
        var vm = ko.contextFor(event.target).$root;

        var retVal = confirm(vm.translate('SEC_USER_DELETE_PHOTO_PROMPT') +
                            '\n\n' +
                            vm.translate('ARE_YOU_SURE_CONTINUE'));
        if (retVal === false) {
            return false;
        }

        $('#browsePhoto').css('display', 'inline-block');
        $('#deletePhoto').css('display', 'none');
        $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src=""/>');
        $('#uploadFile').val('');

       // var vm = ko.contextFor(event.target).$root;
        if (vm.selectedUserDetails().hasThumbnailPhoto() || vm.selectedUserDetails().hasThumbnailPhoto === 'true') {
            vm.selectedUserDetails().hasThumbnailPhoto(false);
            vm.securityService.deletePhoto(vm.selectedUserDetails().key);
        }
    };

    UserViewModel.prototype.selectUser = function userViewModel_selectUser(event) {
        this.errMsg('');
        if (this.selectedUserDetails() && this.selectedUserDetails().isDirty()) {
            var retVal = confirm(this.translate('SEC_USER_UNSAVED_CHANGES') +
                             '\n\n' +
                             this.translate('ARE_YOU_SURE_CONTINUE'));
            if (retVal === false) {
                return false;
            }
            else {
                this.selectedUserDetails().isDirty(false);
            }
        }
        var smallUser = event.target.value;
        if (!smallUser || !(smallUser instanceof UserModel)) {
            return;
        }
        // Set the currently selected group observable to the clicked item.
        this.selectedUser(smallUser);
    };

    UserViewModel.prototype.copyUser = function userViewModel_copyUser() {
        var copyUser = userAdapter.toDTO(this.selectedUserDetails());
        copyUser.groups = this.assignedGroups();
        copyUser.id = '';
        copyUser.lastName = '';
        copyUser.initial = '';
        copyUser.firstName = '';
        copyUser.email = '';
        copyUser.password = '';
        copyUser.newPassword = '';
        copyUser.key = '0';
        copyUser.isActive = true;
        copyUser.isSuperUser = false;

        var model = userAdapter.toModelObject(copyUser);
        this.selectedUserDetails(model);
        this.selectedUser(model);

        //moved to first user in list
        this.scrollToActiveUserListItem();
        $('#browsePhoto').css('display', 'none');
        $('#deletePhoto').css('display', 'none');
        $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src=""/>');
    };

    UserViewModel.prototype.assignedSelected = function (group) {
        this.unassignedGroups.push(this.assignedGroups.remove(group)[0]);
        this.unassignedGroups.sort(groupComparer);
        this.selectedUserDetails().isDirty(true);
    };

    UserViewModel.prototype.unassignedSelected = function (group) {
        this.assignedGroups.push(this.unassignedGroups.remove(group)[0]);
        this.assignedGroups.sort(groupComparer);
        this.selectedUserDetails().isDirty(true);
    };

    UserViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserViewModel.prototype.scrollToActiveUserListItem =
        function scrollToActiveUserListItem() {
            var $item = this.region.$element.find('.user-list>.list-group-item.selected').first(),
                $list = $item.closest('.user-list'),
                position = $item.position(),
                scrollTop = $list.scrollTop();

            if (!position) {
                return;
            }

            $list.scrollTop(scrollTop + position.top);
        };

    UserViewModel.prototype.loadGroup = function loadGroup() {
        var dfd = $.Deferred();
        dfd.resolve(this.filteredUsers());
        return dfd.promise();
    };

    function postUser_done(self, dfd, data) {
        var dto = new UserDTO(data);
        var model = userAdapter.toModelObject(dto);
        self.selectedUserDetails(model);
        self.users.push(self.selectedUserDetails());
        self.selectedUser(self.selectedUserDetails());

        if (self.selectedUserDetails().isDirty()) {
            self.selectedUserDetails().isDirty(false);
        }

        //moved to added user
        self.errMsg(self.translate('SUCCESS'));
        self.isSaving(false);
        //if list is active and user is not active then only refresh list
        //refresh list with all
        if (self.activeOnly() && (Boolean(self.selectedUserDetails().isActive()) === false || self.selectedUserDetails().isActive() === '')) {
            activeOnly_subscribe(self);
            self.selectedUserDetails(null);
        }

        resolvePhoto(self, data);
        self.scrollToActiveUserListItem();

        dfd.resolve();
    }

    function putUser_done(self, dfd, dto) {
        if (self.selectedUserDetails().isDirty()) {
            self.selectedUserDetails().isDirty(false);
        }

        self.selectedUser().firstName(self.selectedUserDetails().firstName());
        self.selectedUser().lastName(self.selectedUserDetails().lastName());


        self.errMsg(self.translate('SUCCESS'));
        self.isSaving(false);
        //if list is active and user is not active then only refresh list
        if (self.activeOnly() && (Boolean(self.selectedUserDetails().isActive()) === false || self.selectedUserDetails().isActive() === '')) {
            activeOnly_subscribe(self);
            self.selectedUserDetails(null);
        }

        resolvePhoto(self, dto);
        self.scrollToActiveUserListItem();

        dfd.resolve();
    }

    function savePhoto(self, key) {
        var inputControl = $('input#uploadFile')[0];
        if (inputControl === undefined) {
            return;
        }
        var files = !!inputControl.files ? inputControl.files : [];
        if (files === undefined) {
            return;
        }
        if (!files.length || !window.FileReader) {
            return;
        }
        self.photoKey(key);
        var url = $('form').attr('action');
        $('form').submit();
    }

    function resolvePhoto(self, dto) {
        var hasPhoto = dto.hasThumbnailPhoto;

        self.photoKey(dto.key);

        if (dto.hasThumbnailPhoto || dto.hasThumbnailPhoto === 'true') {
        $('#browsePhoto').css('display', 'none');
        $('#deletePhoto').css('display', 'inline-block');
            var url = 'api/mibin/image?sessionId=' + self.sessionId() + '&key=' + dto.key;
            $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src="' + url + '"/>');
        } else {
            $('#browsePhoto').css('display', 'inline-block');
            $('#deletePhoto').css('display', 'none');
            $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src=""/>');
        }
    }

    function selectedUser_subscribe(self, smallUser) {
        var dfd = new $.Deferred();
        if (smallUser === undefined) {
            return;
        }
        if (smallUser.key === '0') {
            //self.user(constructUser());
            return;
        }
        self.securityService.getUser(smallUser.key)
            .done(getUser_done.bind(null, self, dfd))
            .fail(handleErrorMsg.bind(null, self));
    }

    function selectedUser_beforeChange(self, oldValue) {
        if (!oldValue) {
            return;
        }
        oldValue.isSelected(false);
        var elements = $('.user-list > li.user-list-item.active').first();
        if (elements.length > 0){
            elements.removeClass('active');
        }
    }

    function selectedUser_change(self, newValue) {
        if (!newValue || !newValue.key) {
           // self.selectedUserDetails(null);
        } else {
            newValue.isSelected(true);
        }
    }

    function activeOnly_subscribe(self) {
        var dfd = new $.Deferred();
        self.securityService.getUsers(true, self.activeOnly())
            .done(getUsers_done.bind(null, self, dfd))
            .fail(handleErrorMsg.bind(null, self));
        dfd.resolve();
    }

    function filteredUsers_subscribe(self) {

        if (self.selectedUserDetails() !== null && self.selectedUserDetails !== undefined) {
            //special case
            //if list is active and user is not active then only refresh list
            if (self.activeOnly() && (Boolean(self.selectedUserDetails().isActive()) === false || self.selectedUserDetails().isActive() === '')) {
                self.selectedUserDetails(null);
            } else {
                //set pointer to earlier select user from list
                if (Boolean(self.selectedUserDetails().isActive()) === true) {

                    if (self.selectedUser() === null || self.selectedUser === undefined) {
                        self.selectedUser(self.selectedUserDetails());
                    }

                    //moved to first user in list
                    setTimeout(function () {
                        self.scrollToActiveUserListItem();
                    }, 1);
                    //scrollToActiveUserListItem(self);
                }
            }
        }
        self.panel.reload.call(self.panel);
    }

    function getUsers_done(self, dfd, data) {
        var dtos = UserDTO.fromDataCollection(data);
        self.users(userAdapter.toModelObjectArray(dtos));

        if (self.selectedUserDetails()) {
            //special case
            //if list is active and user is not active then only refresh list
            if (self.activeOnly() && (Boolean(self.selectedUserDetails().isActive() ) === false || self.selectedUserDetails().isActive() === '')) {
                self.selectedUserDetails(null);
            } else {
                 //set pointer to earlier select user from list
                if (Boolean(self.selectedUserDetails().isActive()) === true) {
                    self.selectedUser(self.selectedUserDetails());
                    //moved to first user in list
                    self.scrollToActiveUserListItem();
                }
            }
        }
        dfd.resolve();
    }

    function getUser_done(self, dfd, data) {
        var dto = new UserDTO(data),
            model = userAdapter.toModelObject(dto);

        self.sites([{ key: '0', name: 'None' }]);
        if (dto.sites) {
            for (var i = 0; i < dto.sites.length; i++) {
                self.sites.push(dto.sites[i]);
            }
        }

        self.selectedUserDetails(model);

        resolvePhoto(self, data);

        //special case
        //if list is active and user is not active then only refresh list
        if (self.activeOnly() && (Boolean(self.selectedUserDetails().isActive()) === false || self.selectedUserDetails().isActive() === '')) {
            self.selectedUserDetails(null);
        }

        if (dto.groups) {
            self.assignedGroups(dto.groups);
            self.assignedGroups.sort(groupComparer);
        }
        else {
            self.assignedGroups([]);
        }

        syncGroupAssignment(self);
        dfd.resolve();
    }

    function getGroups_done(self, dfd, data) {
        self.groupCache = data;
        self.groupCache.sort(groupComparer);
        dfd.resolve();
    }

    function filteredUsers_read(self) {
        var filter,
            retValues,
            values;

        if (self.activeOnly()) {
            values = ko.utils.arrayFilter(self.users(), function (u) {
                return JSON.parse(u.isActive());
            });
        } else {
            values = self.users();
        }

        // TODO: refactor this into a named function.
        if (!self.userFilter()) {
            retValues = values;
            //return self.users();
        } else {
            filter = self.userFilter().toLowerCase();
            values = ko.utils.arrayFilter(values, function (u) {
                return u.firstName().toLowerCase().startsWith(filter) ||
                    u.lastName().toLowerCase().startsWith(filter);
            });
            retValues = values;
            //return values;
        }
        retValues.sort(userComparer.bind(null));
        return retValues;
    }

    function userComparer(left, right) {
        return left.displayName().toLowerCase() === right.displayName().toLowerCase() ? 0
            : (left.displayName().toLowerCase() < right.displayName().toLowerCase() ? -1
            : 1);
    }

    function constructUser() {
        var newUser = new UserDTO();
        newUser.id = '';
        newUser.lastName = '';
        newUser.firstName = '';
        newUser.key = '0';
        newUser.isActive = true;
        newUser.isSuperUser = false;
        newUser.hasThumbnailPhoto = false;
        return newUser;
    }

    function handleErrorMsg(self, response) {
        self.isSaving(false);
        self.errMsg(response.statusText);
    }

    function groupComparer(a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) {
            return -1;
        }
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) {
            return 1;
        }
        return 0;
    }

    function syncGroupAssignment(self) {
        var i = 0;

        for (i = 0; i < self.groupCache.length; i++) {
            if (self.unassignedGroups.indexOf(self.groupCache[i]) < 0) {
                self.unassignedGroups.push(self.groupCache[i]);
            }
        }
        self.unassignedGroups.sort(groupComparer);
        if (self.assignedGroups() !== undefined) {
            for (i = 0; i < self.assignedGroups().length; i++) {
                for (var j = 0; j < self.unassignedGroups().length; j++) {
                    if (self.unassignedGroups()[j].id === self.assignedGroups()[i].id) {
                        self.unassignedGroups.splice(j, 1);
                        break;
                    }
                }
            }
        }
    }

    return UserViewModel;
});
