define(function (require) {
    'use strict';

    var $ = require('jquery');

    var R = require('ramda'),
        ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        Region = require('spa/region'),
        UserEvents = require('./user-events'),
        ApplicationContext = require('application/application-context'),
        ImageUploader = require('./image-uploader'),
        DialogBox = require('system/ui/dialog-box'),
        DialogScreen = require('./user-detail-confirm-password-dialog-view-model'),
        UserSiteDTO = require('../../services/usersite-dto'),
        UserSiteAdapter = require('../../adapters/usersite-adapter'),
        view = require('text!../views/user-detail.html');

    require('ui/elements/tab-group/view-model');
    require('ui/elements/tab-group-item/view-model');
    require('ui/elements/combobox/view-model');

    function UserDetailViewModel(kom, applicationEvents, securityService,imageUploader,imageUploaderRegion,userEvents) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.translator = Object.resolve(Translator);
        this.region = null;
        this.imageUploader = imageUploader;
        this.imageUploaderRegion = imageUploaderRegion;
        this.confirmPasswordDialog = Object.resolve(DialogScreen);
        this.events = userEvents;
        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.selectedUser = null;
        this.sessionId = null;
        this.photoKey = null;
        this.sites = null;
        this.photoDeleted=null;
        this.uomConversionSets = null;
        this.timezones = null;
        this.cultures = null;
        this.counter=1;
        this.queryPrivileges = null;
        this.canDeletePhoto = null;
        this.canUploadPhoto = null;
        // knockout observables
        this.isLoading = null;
        this.newPassword = null;
        this.defaultTimezone = null;
    }

    var base = Object.inherit(KnockoutViewModel, UserDetailViewModel);
    UserDetailViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService, ImageUploader,Region,UserEvents];

    ///////////////////
    // Lifecycle
    ///////////////////

    UserDetailViewModel.prototype.load =
        function userDetailViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred(),
                dfdSc = new $.Deferred(),
                dfdUom = new $.Deferred(),
                dfdTz = new $.Deferred(),
                dfdCl = new $.Deferred(),
                dfdUd = new $.Deferred();

            // Set up our observables.
            this.newPassword=this.kom.observable();
            this.isLoading = this.kom.observable();
            this.photoDeleted=this.kom.observable(false);
            this.selectedUser = this.kom.observable();
            this.sessionId = this.kom.observable(ApplicationContext.session.id);
            this.photoKey = this.kom.observable();
            this.sites = this.kom.observableArray();
            this.uomConversionSets = this.kom.observableArray();
            this.timezones = this.kom.observableArray();
            this.cultures = this.kom.observableArray();
            this.queryPrivileges = this.kom.observableArray();

            this.service.getSystemCodes('MI_QUERY_PRIV')
                .done(getSystemCodes_done.bind(null, this, dfdSc))
                .fail(handleAjaxRequestError.bind(null, this));

            this.service.getUomConversionSets()
                .done(getUomConversionSets_done.bind(null, this, dfdUom))
                .fail(handleAjaxRequestError.bind(null, this));

            this.service.getTimezones()
                .done(getTimezones_done.bind(null, this, dfdTz))
                .fail(handleAjaxRequestError.bind(null, this));

            this.service.getCultures()
                .done(getCultures_done.bind(null, this, dfdCl))
                .fail(handleAjaxRequestError.bind(null, this));

            this.service.getUserDefaults()
                .done(getUserDefaults_done.bind(null, this, dfdUd))
                .fail(handleAjaxRequestError.bind(null, self));

            $.when(dfdSc, dfdUom, dfdTz, dfdCl, dfdUd)
                .done(clearIsDirty.bind(null, this));

            return dfd.promise();
        };

    UserDetailViewModel.prototype.activate =
        function userDetailViewModel_activate() {
            var self=this;
            // Set up our computed observables.
            this.canDeletePhoto = this.kom.pureComputed(canDeletePhoto_read.bind(null, this));
            this.canUploadPhoto = this.kom.pureComputed(canUploadPhoto_read.bind(null, this));
            this.events.userSelected.add(this.selectUser, this);
            this.events.userSitesChanged.add(this.userSitesChanged, this);
            this.kom.subscribe(this.isDirty, isDirtyChanged.bind(null, this));
            this.newPassword.subscribe(function (newValue) {
                if (newValue) {
                    if (self.selectedUser()) {
                        self.changePassword(newValue);
                    }
                } else {
                    self.selectedUser().newPassword('');
                }
            });
        };

    UserDetailViewModel.prototype.attach =
        function userDetailViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
            this.imageUploaderRegion.setElement(this.region.$element.find('div.image-uploader-container'));
            this.imageUploader.attach(this.imageUploaderRegion);
        };

    UserDetailViewModel.prototype.detach =
        function userDetailViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    //UserDetailViewModel.prototype.canUnload =
    //    function userDetailViewModel_canUnload() {
    //        return !this.isDirty() && !this.isLoading();
    //    };

    UserDetailViewModel.prototype.deactivate =
        function userDetailViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
            this.events.userSelected.remove(this);
            this.events.userSitesChanged.remove(this);
        };

    UserDetailViewModel.prototype.unload =
        function userDetailViewModel_unload() {
            this.kom.disposeObservables();
        };

    UserDetailViewModel.prototype.userAdded =
        function userDetailViewModel_userAdded() {
            if (this.selectedUser().key !== '0') {
                this.kom.tracker.markCurrentStateAsClean();
            }
        };

    /////////////////////
    // Behavior
    /////////////////////
    
    UserDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserDetailViewModel.prototype.save = function save() {
        savePhoto(this, this.selectedUser().key);
        if (this.photoDeleted()) {
            this.service.deletePhoto(this.selectedUser().key);
            this.photoDeleted(false);
            this.imageUploader.selectedFile(null);
            this.imageUploader.setImage(null);
        }
    };

    UserDetailViewModel.prototype.selectUser = function selectUser(selectedUser) {
        var defaultSiteKey;

        if (selectedUser) {
            this.photoDeleted(false);
            this.imageUploader.selectedFile(null);
            this.imageUploader.setImage(null);

            // We have knockout binding "issues" w/re to sites, defaultSiteKey, nav and update...
            defaultSiteKey = selectedUser.defaultSiteKey();

            this.sites = this.kom.observableArray();
            if (selectedUser.sites()) {
                for (var i = 0; i < selectedUser.sites().length; i++) {
                    if (selectedUser.sites()[i].viewOnly) {
                        continue;
                    }
                    if (!this.sites()) {
                        this.sites([selectedUser.sites()[i]]);
                    }
                    else {
                        this.sites.push(selectedUser.sites()[i]);
                    }
                }
            }
            if (selectedUser.sites().length === 0) {
                this.sites([{ siteKey: "0", siteName: "None" }]);
            }
            this.selectedUser(selectedUser);

            // Manage the "issues" above...
            this.selectedUser().defaultSiteKey(defaultSiteKey);

            this.newPassword();
            resolvePhoto(this, this.selectedUser());
            if (this.selectedUser().key !== '0') {
                clearIsDirty(this);
            } else {
                if (this.selectedUser().timezoneId()==='Dateline Standard Time') {
                    this.selectedUser().timezoneId(this.defaultTimezone);
                }
            }
        }
    };

    UserDetailViewModel.prototype.getUser = function getUser() {
        return this.selectedUser();
    };

    UserDetailViewModel.prototype.deletePhoto = function userViewModel_deletePhoto(data, event) {
        var vm = ko.contextFor(event.target).$root;
        promptDeletePhoto(this, deletePhoto.bind(null, this));

    };

    UserDetailViewModel.prototype.changePassword = function ExportImport_export(newPassword) {
        var self = this;
        self.newPassword('');
        this.confirmPasswordDialog.show().done(function (data) {
            if (data) {
                if (newPassword!==data) {
                    MessageBox.showOk(self.translate('PASSWORDS_DONT_MATCH'),self.translate('CONFIRM_PASSWORD'));
                } else {
                    self.selectedUser().newPassword(data);
                }
            }
            });
        };

    UserDetailViewModel.prototype.defaultSiteChanged = function defaultSiteChanged(data, event) {
        if (!data || !data.defaultSiteKey || !data.defaultSiteKey() || !event || !event.target) {
            return;
        }
        if (data.defaultSiteKey() === '0') {
            return;
        }
        var vm = ko.contextFor(event.target).$root;
        vm.events.defaultSiteChanged.raise(data.defaultSiteKey());
    };

    // Whenever the array of UserSites changes on the Sites tab, this event is triggered.  These
    // changes include adding a row, deleting a row and changing the default UserSite.
    UserDetailViewModel.prototype.userSitesChanged = function userSitesChanged(userSites) {
        var dtos, defaultIdx = -1, i, j;

        // If you don't need to be here, leave.
        if (!userSites || userSites.length === 0) {
            this.sites([{ siteKey: "0", siteName: "None" }]);
            return;
        }

        // Find the default site before you start to avoid reference "issues".
        for (i = 0; i < userSites.length; i++) {
            if (userSites[i].defaultSite()) {
                defaultIdx = i;
                break;
            }
        }

        // You're getting models but the user model has an array of dtos.  Not ideal...
        dtos = UserSiteAdapter.toDTOArray(userSites);

        // Add the "no default site" instance to the array.
        //this.sites([{ siteKey: "0", siteName: "None" }]);

        // Add the arg UserSites TO THE INSTANCE observable.  UserSite model has the defaultSite
        // observable, the dto does not (since this is not persisted).  And don't load a view only
        // site as it cannot be the default.
        for (i = 0; i < dtos.length; i++) {
            if (dtos[i].viewOnly) {
                continue;
            }

            var foundIt = false;
            for (j = 0; j < this.sites().length; j++) {
                if (this.sites()[j].siteKey === dtos[i].siteKey) {
                    foundIt = true;
                    break;
                }
            }
            if (!foundIt) {
                this.sites.push(dtos[i]);
            }

            if (i === defaultIdx) {
                this.selectedUser().defaultSiteKey(dtos[i].siteKey);
            }
        }
    };

    //////////////////////
    // Implementation
    //////////////////////

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
       
    function promptDeletePhoto(self, doneCallback) {
        var msg = self.translate('SEC_USER_DELETE_PHOTO_PROMPT'),
                 title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }


    function deletePhoto(self, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            self.photoDeleted(true);
            self.selectedUser().hasThumbnailPhoto(false);
            self.imageUploader.setImage(null);
            self.imageUploader.selectedFile(null);
        }
    }

    function resolvePhoto(self, dto) {
        var hasPhoto = dto.hasThumbnailPhoto();
        if (hasPhoto) {
            self.imageUploader.setImage(null);
            self.imageUploader.selectedFile(null);
            // Need the cachebuster, as the browser will cache the URL and won't go back to the server to get updated photo.
            self.imageUploader.setImage('api/mibin/image?sessionId=' + self.sessionId() + '&key=' + dto.key + "&cachebuster=" + self.counter);
            self.counter=self.counter+1;
        } else {
            self.imageUploader.setImage(null);
        }
    }

    function savePhoto(self, key) {
        var fileContents = self.imageUploader.fileData;
        if (self.imageUploader.selectedFile()) {
            self.service.postPhoto2(self.sessionId(), key, fileContents, new Date().getTime());
            self.selectedUser().hasThumbnailPhoto(true);
            //resolvePhoto(self,self.selectedUser());
        }
    }

    function canDeletePhoto_read(self) {

        if (self.selectedUser()) {
            return self.selectedUser().key!=='0' && self.selectedUser().hasThumbnailPhoto();
        }
        return false;
    }

    function canUploadPhoto_read(self) {

        if (self.selectedUser()) {
            return self.selectedUser().key !== '0';
        }
        return false;
    }

    function getSystemCodes_done(self, dfd, data) {
        self.queryPrivileges = data;
        dfd.resolve();
    }

    function getUomConversionSets_done(self, dfd, data) {
        self.uomConversionSets = data;
        dfd.resolve();
    }

    function getTimezones_done(self, dfd, data) {
        self.timezones = data;
        dfd.resolve();
    }

    function getCultures_done(self, dfd, data) {
        self.cultures = data;
        dfd.resolve();
    }

    function getUserDefaults_done(self, dfd, data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].name === 'DefaultTimezone') {
                self.defaultTimezone = data[i].value;
                break;
            }
        }
        dfd.resolve();
    }

    function isDirtyChanged(self, newValue) {
        self.events.isUserDirty.raise(newValue);
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedUser()) {
            return;
        }

        hashObject = {
            key: self.selectedUser().key,
            firstName: self.selectedUser().firstName(),
            lastName: self.selectedUser().lastName(),
            hasThumbnailPhoto: self.selectedUser().hasThumbnailPhoto(),
            initial: self.selectedUser().initial(),
            company: self.selectedUser().company(),
            isSuperUser: self.selectedUser().isSuperUser(),
            isActive: self.selectedUser().isActive(),
            isLocked: self.selectedUser().isLocked(),
            changePassword:self.selectedUser().mustChangePassword(),
            title: self.selectedUser().title(),
            address1: self.selectedUser().address1(),
            address2: self.selectedUser().address2(),
            city: self.selectedUser().city(),
            state: self.selectedUser().state(),
            postalCode: self.selectedUser().postalCode(),
            country: self.selectedUser().country(),
            phoneNumber: self.selectedUser().phoneNumber(),
            phoneNumber2: self.selectedUser().phoneNumber2(),
            faxNumber: self.selectedUser().faxNumber(),
            id: self.selectedUser().id(),
            newPassword: self.selectedUser().newPassword(),
            email: self.selectedUser().email(),
            domain: self.selectedUser().domain(),
            uomConversionSetId: self.selectedUser().uomConversionSetId(),
            defaultSiteKey: self.selectedUser().defaultSiteKey(),
            timezoneId: self.selectedUser().timezoneId(),
            cultureId: self.selectedUser().cultureId(),
            queryPrivilege: self.selectedUser().queryPrivilege(),
            facility: self.selectedUser().facility(),
            businessUnit: self.selectedUser().businessUnit(),
            areaOfResponsibility: self.selectedUser().areaOfResponsibility(),
            department: self.selectedUser().department(),
            comments: self.selectedUser().comments(),
            hasFile: self.imageUploader.selectedFile()
        };
        return JSON.stringify(hashObject);
    }

    return UserDetailViewModel;
});
