define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
    ApplicationEvents = require('application/application-events'),
    ApplicationContext = require('application/application-context'),
    Translator = require('system/globalization/translator'),
    ErrorMessage = require('system/error/error-message'),
    MessageBox = require('system/ui/message-box'),
    KnockoutViewModel = require('spa/ko/knockout-view-model'),
    KnockoutManager = require('system/knockout/knockout-manager'),
    SecurityService = require('../services/security-service'),
        LdapService=require('../services/ldap-service'),
    Region = require('spa/region'),
    DomainDTO = require('../services/domain-dto'),
    LdapPropertyDTO=require('../services/ldap-property-dto'),
    domainAdapter = require('../adapters/domain-adapter'),
    ldapPropertyAdapter = require('../adapters/ldap-property-adapter'),
     ldapUserAdapter = require('../adapters/domain-user-adapter'),
    LdapEvents = require('./ldap-events'),
     ChangeTracker = require('system/knockout/change-tracker'),
    view = require('text!../views/ldap-domain.html');

    require('ui/elements/tab-group/view-model');
    require('ui/elements/tab-group-item/view-model');
    require('ui/elements/combobox/view-model');

    function LdapDomainViewModel(kom, applicationEvents, securityService, ldapEvents,ldapservice) {
        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.ldapService=ldapservice;
        this.events = ldapEvents;
        this.translator = Object.resolve(Translator);
        this.region = null;

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        this.canShowFieldMappings = null;
        this.canShowUsers = null;
        this.panel = null;
        this.roleList = ko.observableArray();

        // knockout observables
        this.isLoading = null;
        this.canSave = null;
        this.canAddMapping = null;
        this.canDelete = null;
        this.selectedDomain = null;
        this.showAddMappingFields = null;
        this.newLdapName = null;
        this.newApmName = null;
        this.canShowAddMappingFields = null;
        this.selectedProperty = null;
        
    }

    var base = Object.inherit(KnockoutViewModel, LdapDomainViewModel);
    LdapDomainViewModel.dependsOn = [KnockoutManager, ApplicationEvents, SecurityService,LdapEvents,LdapService];

    ///////////////////
    // Lifecycle
    ///////////////////

    LdapDomainViewModel.prototype.load =
        function ldapDomainViewModel_load(routeArgs) {
            var self = this,
                dfd = new $.Deferred();

            // Set up our observables.
            this.isLoading = this.kom.observable();
            this.selectedDomain = this.kom.observable();
            this.selectedProperty = this.kom.observable();
            this.canShowFieldMappings = this.kom.observable(true);
            this.canShowUsers = this.kom.observable(false);
            this.showAddMappingFields = this.kom.observable(false);
            this.newLdapName = this.kom.observable();
            this.newApmName = this.kom.observable();

            // Clear isDirty().
            clearIsDirty(this);

            this.service.getRoles().done(getRoles_done.bind(null, this, dfd)).fail(handleAjaxRequestError.bind(null, this));
          

            return dfd.promise();
        };

    LdapDomainViewModel.prototype.activate =
        function ldapDomainViewModel_activate() {
            // Set up our computed observables.
            this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));
            this.canAddMapping = this.kom.pureComputed(canAddMapping_read.bind(null, this));
            this.canDelete = this.kom.pureComputed(canDelete_read.bind(null, this));
            this.canShowAddMappingFields = this.kom.pureComputed(canShowAddMappingFields_read.bind(null, this));

            ApplicationContext.help.isAdmin = true;
            ApplicationContext.help.helpContext = '../Subsystems/SecurityManager/Content/LDAP.htm';
        };

    LdapDomainViewModel.prototype.attach =
        function ldapDomainViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;
            Element.upgrade(region.$element.find('mi-tab-group'));
        };

    LdapDomainViewModel.prototype.detach =
        function ldapDomainViewModel_detach(region) {
            base.prototype.detach.call(this, region);
        };

    LdapDomainViewModel.prototype.canUnload =
        function ldapDomainViewModel_canUnload() {
            return !this.isDirty() && !this.isLoading();
        };

    LdapDomainViewModel.prototype.deactivate =
        function ldapDomainViewModel_deactivate() {
            this.kom.disposeSubscriptions();
            this.kom.disposeComputeds();
        };

    LdapDomainViewModel.prototype.unload =
        function ldapDomainViewModel_unload() {
            this.kom.disposeObservables();
        };
    

    /////////////////////
    // Behavior
    /////////////////////




    LdapDomainViewModel.prototype.save =
        function ldapDomainViewModel_save() {

            var domain;

            domain = domainAdapter.toDTO(this.selectedDomain());

            this.isLoading(true);
            if (domain.key === '0') {
                this.service.postDomain(domain)
                    .done(postDomain_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            } else {
                this.service.putDomain(domain)
                    .done(putDomain_done.bind(null, this))
                    .fail(handleAjaxRequestError.bind(null, this));
            }
        };

    LdapDomainViewModel.prototype.cancelNewMapping =
       function ldapDomainViewModel_saveNewMapping(data, event) {
           var vm = ko.contextFor(event.target).$root;
           vm.newApmName("");
           vm.newApmName("");
           vm.showAddMappingFields(false);
       };

    LdapDomainViewModel.prototype.deleteMapping =
   function ldapDomainViewModel_saveNewMapping(data, event) {
       var vm = ko.contextFor(event.target).$root;
      vm.selectedProperty = data;
      promptDeleteProperty(vm, confirmDeleteProperty_done.bind(null, vm));
   };

    LdapDomainViewModel.prototype.saveNewMapping =
        function ldapDomainViewModel_saveNewMapping(data, event) {
            var vm = ko.contextFor(event.target).$root,tempProps;
            var newProp = new LdapPropertyDTO();

            newProp.key = '0';
            newProp.ldapName = vm.newLdapName();
            newProp.apmName = vm.newApmName();
            tempProps = vm.selectedDomain().propertyMappings();
            tempProps.push(ldapPropertyAdapter.toModelObject(newProp));
            vm.selectedDomain().propertyMappings(tempProps);
            vm.newApmName("");
            vm.newApmName("");
            vm.showAddMappingFields(false);
            vm.ldapService.postLdapProperty(vm.selectedDomain().key(), newProp)
          .done(postProperty_done.bind(null, vm))
          .fail(handleAjaxRequestError.bind(null, vm));
        };

    LdapDomainViewModel.prototype.deleteDomain =
        function ldapDomainViewModel_delete(data, event) {
            var vm = ko.contextFor(event.target).$root;
            promptDelete(vm, confirmDelete_done.bind(null, vm));
        };

    LdapDomainViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    LdapDomainViewModel.prototype.showFieldMappings = function showFieldMappings() {
        var vm = ko.contextFor(event.target).$root;
        vm.canShowFieldMappings(true);
        vm.canShowUsers(null);
    };

    LdapDomainViewModel.prototype.addMappings = function addMappings() {
        var vm = ko.contextFor(event.target).$root;
        vm.showAddMappingFields(true);
    };

    LdapDomainViewModel.prototype.showUsers = function showusers() {
        var vm = ko.contextFor(event.target).$root;
        vm.canShowFieldMappings(null);
        vm.canShowUsers(true);
    };

    LdapDomainViewModel.prototype.updateSelectedDomain = function updateSelectedDomain(domain) {
        var dfd = new $.Deferred();
        
        this.selectedDomain(domain);
        this.canShowFieldMappings(true);
        this.canShowUsers(null);
        if (domain) {
            this.selectedDomain().users(sortByDisplayName(this.selectedDomain().users()));
            
            if (!_.contains(this.roleList(), this.selectedDomain().domainNetBiosName()) && this.selectedDomain().domainNetBiosName().length > 0) {
                this.selectedDomain().domainNetBiosName('');
                clearIsDirty(this);
            }
            if (domain.key() !== '0') {
                clearIsDirty(this);
            }
        } else {
            clearIsDirty(this);
        }
    };

    LdapDomainViewModel.prototype.hasChanges = function hasChanges() {
        return this.isDirty();
    };

    LdapDomainViewModel.prototype.clearDirty = function hasChanges() {
        clearIsDirty(this);
    };

    //////////////////////
    // Implementation
    //////////////////////

    function getRoles_done(self, dfd, dtos) {

        self.roleList(_.map(sortBy(dtos), function (x) { return x.id; }));
        self.roleList().unshift('');
        dfd.resolve();
       
    }

    function sortBy(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'id'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }

    function sortByDisplayName(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitiveObservable.bind(null, 'displayName'));
    }


    function sortByCaseInsensitiveObservable(property, item) {
        return item[property]().toLowerCase();
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

    function postDomain_done(self, dto) {
        self.selectedDomain(domainAdapter.toModelObject(dto));
        clearIsDirty(self);
        self.isLoading(false);
        self.events.folderUpdated.raise(self.selectedDomain());
    }
    
    function canSave_read(self) {
        return self.isDirty() && self.selectedDomain() && !self.isLoading();
    }


    function postProperty_done(self, dto) {
        clearIsDirty(self);
        self.isLoading(false);
        self.events.folderUpdated.raise(self.selectedDomain());
    }

    function canAddMapping_read(self) {
        return self.selectedDomain() && !self.isLoading();
    }

    function canShowAddMappingFields_read(self) {
        return self.showAddMappingFields();
    }

    function canDelete_read(self) {
        return self.selectedDomain() && !self.isLoading()  && self.selectedDomain().key()!=='0';
    }

    function promptDelete(self, doneCallback) {
        var msg = self.translate('DOMAIN_CONFIRM_DELETE_MSG'),
                 title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function promptDeleteProperty(self, doneCallback) {
        var msg = self.translate('LDAPPPROP_CONFIRM_DELETE_MSG'),
            title = self.translate('CONFIRM_DELETE');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }
    
    function deleteDomainProperty_done(self) {
        self.isLoading(false);
        clearIsDirty(self);
        self.events.folderUpdated.raise(self.selectedDomain());
    }

    function confirmDeleteProperty_done(self, clickedButtonIndex) {

        if (clickedButtonIndex === 0) {
            self.isLoading(true);
            self.ldapService.deleteLdapProperty(self.selectedProperty.key())
                .done(deleteDomainProperty_done.bind(null, self))
                .fail(handleAjaxRequestError.bind(null, self));
        }
    }
    
  

    function confirmDelete_done(self, clickedButtonIndex) {

        if (clickedButtonIndex === 0) {
            self.isLoading(true);
            self.service.deleteDomain(self.selectedDomain().key())
                            .done(deleteDomain_done.bind(null, self))
                            .fail(handleAjaxRequestError.bind(null, self));
        }
    }

    function deleteDomain_done(self) {
        self.isLoading(false);
        self.events.folderDeleted.raise(self.selectedDomain());
        self.selectedDomain(null);
        clearIsDirty(self);
    }

    function putDomain_done(self) {
        clearIsDirty(self);
        self.isLoading(false);
        self.events.folderUpdated.raise(self.selectedDomain());
    }

    function createHash(self) {
        var hashObject;

        if (!self.selectedDomain()) {
            hashObject = {
                key: '',
                allUserFilter: '',
                singleUserFilter:'',
                domainName:'',
                rootCaption: '',
                domainNetBiosName: '',
                domainCaption: '',
                domainGroupFilter: '',
                propertyMappings: []
            };
            return JSON.stringify(hashObject);
        }

        hashObject = {
            key: self.selectedDomain().key(),
            allUserFilter: self.selectedDomain().allUserFilter(),
            singleUserFilter:self.selectedDomain().singleUserFilter(),
            domainName: self.selectedDomain().domainName(),
            rootCaption: self.selectedDomain().rootCaption(),
            domainNetBiosName: self.selectedDomain().domainNetBiosName(),
            domainCaption: self.selectedDomain().domainCaption(),
            domainGroupFilter: self.selectedDomain().domainGroupFilter(),
            propertyMappings: _.map(self.selectedDomain().propertyMappings(),function (mapping) {
                return ldapPropertyAdapter.toDTO(mapping);
            })
        };
        return JSON.stringify(hashObject);
    }
    
    return LdapDomainViewModel;
});
