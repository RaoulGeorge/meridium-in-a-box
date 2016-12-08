define(function(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    /* jshint maxstatements: 100 */
    var ko = require('knockout'),
        view = require('text!../views/refdoc-container.html'),
        RefDocs = require('../models/refdoc-collection'),
        RefDocService = require('../services/service'),
        converter = require('system/lang/converter'),
        MessageBox = require('system/ui/message-box'),
        Translator = require('system/globalization/translator'),
        FeedbackToast = require('logging/feedback-component/feedback-component'),
        SearchFinder = require('search/search-finder'),
        Event = require('system/lang/event'),
        Element = require('system/lang/element'),
        RefDocPathModel = require('../models/refdoc-path-model'),
        RefDocEvents = require('./events'),
        MetadataService = require('platform/metadata/services/metadata'),
        ApplicationContext = require('application/application-context'),
        EntityDTO = require('platform/entity/services/dto/entity-dto'),
        RefDocContainerView = require('../views/ref-doc-container-view'),
        Device = require('system/hardware/device');

    require('ui/elements/tool-bar/view-model');
    require('ui/elements/filter/filter-view-model');

    function RefDocContainerViewModel() {
        this.element = null;
        this.entityKey = null;
        this.siteKey = null;
        this.refDocEntity = null;
        this.familyKey = null;

        this.service = null;
        this.refDocs = null;
        this.translator = null;

        this.toolbar = null;
        this.addButton = null;
        this.searchbox = null;

        this.callback = null;
        this.refDocsUpdated = null;
        this.refDocEvents = null;
        this.refDocPathModel = null;
        this.refDocListContainer = null;

        this.datasheet = null;
        this.datasheetViewModel = null;

        //privilege info
        this.canInsert = false;
        this.canUpdate = false;
        this.canView = false;
        this.canDelete = false;
        this.isSuperUser = false;
        this.isAddAllowed = null;
        this.isUpdateAllowed = null;
        this.isUnlinkAllowed = null;

        this.readonly = null;
        this.showicon = null;
        this.page = null;

        this.failedRefDocLinkCount = 0;
        this.cachedEntity = null;
        this.canOverwriteCache = null;
    }

    RefDocContainerViewModel.prototype = Object.create(HTMLElement.prototype);

    RefDocContainerViewModel.prototype.createdCallback = function() {
        this.element = this;
        this.refDocs = Object.resolve(RefDocs);
        this.service = Object.resolve(RefDocService);
        this.translator = Object.resolve(Translator);

        this.isAddAllowed = ko.observable(true);
        this.isUpdateAllowed = ko.observable(true);
        this.isUnlinkAllowed = ko.observable(true);

        this.refDocsUpdated = new Event();
        this.refDocEvents = new RefDocEvents();

        this.familyKey = 'MI Reference Document';
        this.showicon = this.getAttribute('showicon');
        this.entityKey = this.getAttribute('entitykey');
        this.readonly = this.getAttribute('readonly') ? converter.toBoolean(this.getAttribute('readonly').toLowerCase(), "true") : false;
        this.canOverwriteCache = true; //flag used to prevent overwriting the reference documents view that is set through setState method        
    };

    RefDocContainerViewModel.prototype.attachedCallback = function() {
        this.element.innerHTML = view;
        if (!this.showicon) {
            hideBackButton(this);
        }

        if (this.entityKey) {
            showIndicator(this);
            this.service.getRefDocs(this.entityKey)
                .done(getRefDocs_done.bind(null, this))
                .fail(getRefDocs_fail.bind(null, this));
        }

        this.isSuperUser = ApplicationContext.user.isSuperUser;
        MetadataService.getEntityFamilyByid(this.familyKey)
            .done(getUserPrivileges_done.bind(null, this));

        hookToolbarActions(this);
        setStringToPage(this);
        $(this.element).find('.back').on('click', back.bind(null, this));
    };

    function getUserPrivileges_done(self, data) {
        self.canInsert = data.canInsert;
        self.canView = data.canView;
        self.canUpdate = data.canUpdate;
        self.canDelete = data.canDelete;

        self.isAddAllowed(self.canInsert || self.isSuperUser);
        self.isUnlinkAllowed(self.canDelete || self.isSuperUser);
        self.isUpdateAllowed(self.canUpdate || self.isSuperUser);
        handleAddAccess(self);
    }

    RefDocContainerViewModel.prototype.detachedCallback = function() {
        $(this.element).find('.back').off('click', back.bind(null, this));
    };

    RefDocContainerViewModel.prototype.attributeChangedCallback = function(attrName, oldVal, newVal) {
        if (attrName === 'entitykey') {
            this.entityKey = newVal;
            refreshList(this);
            setStringToPage(this);
        } else if (attrName === 'readonly') {
            this.readonly = newVal;
            if (this.readonly) {
                makeRefdocReadOnly(this);
            } else {
                makeRefdocEditable(this);
            }
        }
    };

    RefDocContainerViewModel.prototype.attachClickHandlers = function() {
        $(this.element).find('.content').on('click', onSectionClicked.bind(null, this));
        $(this.element).find('.edit').on('click', onEditClicked.bind(null, this));
        $(this.element).find('.unlink').on('click', onUnlinkClicked.bind(null, this));
        $(this.element).find('.download').on('click', onDownloadClicked.bind(null, this));
        $(this.element).find('.open').on('click', onOpenClicked.bind(null, this));
    };

    RefDocContainerViewModel.prototype.detachClickHandlers = function() {
        $(this.element).find('section').off('click', onSectionClicked.bind(null, this));
    };

    RefDocContainerViewModel.prototype.refDocCB = function(callback) {
        this.callback = callback;
    };

    RefDocContainerViewModel.prototype.getState = function () {
        return this.element;
    };

    RefDocContainerViewModel.prototype.setState = function (element) {
        var self = this;        
        if (self.page === 'single-refdoc') {
            self.cachedEntity = element.refDocEntity;
            loadRefDocDatasheet(self, self.cachedEntity.key);
            self.canOverwriteCache = false;
        }
        else if (self.page === 'new-refdoc') {
            self.cachedEntity = element.refDocEntity;
            loadNewRefDocDatasheet(self, self.familyKey);
            self.canOverwriteCache = false;
        }
    };

    function setCurrentPage(self, page) {
        self.page = page;
    }

    function hookToolbarActions(self) {
        self.toolbar = $(self.element).find('mi-tool-bar')[0];
        Element.upgrade(self.toolbar);
        hookupSearch(self);
        hookupAdd(self);

        //Hooking up initiating search-finder
        hookupSearchFinder(self);
    }

    function makeRefdocReadOnly(self) {
        $(self.element).find('button.add').prop('disabled', self.readonly);
        $(self.element).find('button.search-finder-btn').prop('disabled', self.readonly);
        $(self.element).find('i.edit').hide();
        $(self.element).find('i.unlink').hide();
    }

    function makeRefdocEditable(self) {
        $(self.element).find('button.add').prop('disabled', false);
        $(self.element).find('button.search-finder-btn').prop('disabled', false);
        $(self.element).find('i.edit').show();
        $(self.element).find('i.unlink').show();
    }

    function hookupSearch(self) {
        self.searchbox = $(self.toolbar).find('mi-searchbox')[0];
        self.searchbox.searchCallback = searchCallback.bind(null, self);
    }

    function hookupAdd(self) {
        self.addButton = $(self.element).find('.add');
        $(self.addButton).off('click').on('click', onAddClicked.bind(null, self));
    }

    function hookupSearchFinder(self) {
        self.addButton = $(self.element).find('.search-finder-btn');
        $(self.addButton).off('click').on('click', onSearchFinderBtnClicked.bind(null, self));
    }

    function throwException(msg, title) {
        MessageBox.showOk(msg, title);
    }

    /*************************************************
                    List of refdocs
    *************************************************/
    function attachView(self, refDocs) {
    
        if (self.canOverwriteCache) {
            var refDocContainerView = new RefDocContainerView(refDocs),
                        refDocContainer = $(self.element).find('.list-refdocs'),
                        view = '';

            //Hide the loading indicator first
            $(self.element).find('center.loading-indicator').get(0).style.display = 'none';

            self.refDocListContainer = refDocContainer;

            view = refDocContainerView.getView();

            refDocContainer.append(view);
            self.attachClickHandlers();
            if (!self.page) {
                setCurrentPage(self, 'list-refdocs');
            }            

            if (self.readonly) {
                makeRefdocReadOnly(self);
            }

            setStringToPage(self);
        }
    }

    function refreshList(self, entity) {
        self.element.innerHTML = view;
        showIndicator(self);
        self.service.getRefDocs(self.entityKey).done(getRefDocs_done.bind(null, self));
        if (!self.showicon) {
            hideBackButton(self);
        }
        $(self.element).find('.back').on('click', back.bind(null, self));
        hookToolbarActions(self);
        handleAddAccess(self);
    }

    function populateCollection(self, data) {
        var dfd = $.Deferred();
        if (data) {
            self.refDocs.populate(data);
            getStoredRefDocSize(self, dfd);
        }
        return dfd.promise();
    }

    function getRefDocs_done(self, data) {
        self.siteKey = (data.item2 && data.item2 !== 0 && data.item2 !== '0') ? data.item2 : null;
        populateCollection(self, data.item1).done(attachView.bind(null, self, self.refDocs.refdocs));
        hideIndicator(self);

        if (data.item1.length === 0) {
            disableSearch(self);
        } else {
            enableSearch(self);
        }
    }

    function getRefDocs_fail(self) {
        populateCollection(self).done(attachView.bind(null, self, self.refDocs.refdocs));
        //attachView(self, self.refDocs.refdocs);
        hideIndicator(self);
    }

    function disableSearch(self) {
        $(self.searchbox).hide();
    }

    function enableSearch(self) {
        $(self.searchbox).show();
    }

    //Retrieve size of all stored reference documents
    function getStoredRefDocSize(self, dfdObj) {
        var i, docCollection, doc, dfdArray = [];
        docCollection = self.refDocs.refdocs;
        for (i = 0; i < docCollection.length; i++) {
            var dfd = $.Deferred();
            dfdArray.push(dfd);
            doc = docCollection[i];
            if (doc.isStoredDocument && doc.docType !== "") {
                self.service.getRefDocSize(doc.key)
                    .done(setSize.bind(null, doc, dfd));
            }
            else {
                doc.size = 'N/A';
                dfd.resolve();
            }            
        }

        $.when.apply($, dfdArray).done(resolveDfd.bind(null, dfdObj));
    }

    function setSize(refDoc, dfd, response) {
        if (response) {
            refDoc.size = response / 1024; //converting bytes to kb
            refDoc.size = refDoc.size.toFixed(2);
        }        
        dfd.resolve();
    }

    function resolveDfd(dfd) {
        dfd.resolve();
    }

    /*************************************************
     * DOM Events
     *************************************************/
    function onSectionClicked(self, e) {
        var target = $(e.target).closest('.content'),
            key = target.data('key');

        $(self.refDocListContainer).find('.active').removeClass('active');
        target.addClass('active');
        $(self.refDocListContainer).find('.section-icon').css('display', 'none');
        $(target).find('.section-icon').css('display', 'block');

        handleUnlinkAccess(self);
        handleEditAccess(self);
    }

    function onEditClicked(self, e) {
        var target = $(e.target).closest('.content'),
            key = target.data('key');

        e.stopPropagation();

        if (key) {
            self.detachClickHandlers();
            loadRefDocDatasheet(self, key);
            setCurrentPage(self, 'single-refdoc');
        }
    }

    function onUnlinkClicked(self, e) {
        var target = $(e.target).closest('.content'),
            key = target.data('key'),
            message = self.translator.translate('REFDOCS_CONFIRM_UNLINK_MSG'),
            title = self.translator.translate('REFDOCS_ALERT');

        e.stopPropagation();

        MessageBox.showOkCancel(message, title)
            .done(showOkCancel_done.bind(null, self, key))
            .fail(showOkCancel_fail.bind(null, self));
    }

    function showOkCancel_done(self, key, buttonClicked) {
        if (buttonClicked === 0) {
            if (key) {
                showIndicator(self);
                self.service.unlinkRefDoc(self.entityKey, key)
                    .done(unlinkRefDoc_done.bind(null, self))
                    .fail(unlinkRefDoc_fail.bind(null, self));
            }
        }
    }

    function unlinkRefDoc_done(self) {
        hideIndicator(self);
        refreshList(self);
        self.refDocsUpdated.raise();
    }

    function unlinkRefDoc_fail(self) {
        throwException(self.translator.translate('REFDOCS_FAILED_TO_UNLINK'), self.translator.translate('REFDOCS_ALERT'));
    }

    function showOkCancel_fail(self) {
        console.log('dialog show ok cancel fail');
    }

    function refDocOpen_fail(self) {
        var toast = new FeedbackToast({
            'closeButton': true,
            'timeOut': '200',
            'hideDuration': '200'
        });

        toast.error({
            code: '0',
            message: self.translator.translate('REFDOCS_FAILED_TO_OPEN_DOCUMENT')
        });
    }

    function onOpenClicked(self, e) {
        var target = $(e.target).closest('.content'),
            key = target.data('key');

        e.stopPropagation();
        showIndicator(self);
        self.service.getRefDocType(key).done(getRefDocTypeForOpen_done.bind(null, self, key));
    }

    function getRefDocTypeForOpen_done(self, key, typeDTO) {
        var temp = typeDTO.type;
        if (typeDTO.type === 'URL') {
            if (typeof cordova !== 'undefined') {
                cordova.InAppBrowser.open(typeDTO.documentPath, '_blank');
            } else {
                window.open(typeDTO.documentPath);
            }
            hideIndicator(self);
        } else {
            self.service.openRefDoc(key, typeDTO)
                .fail(refDocOpen_fail.bind(null, self));
            hideIndicator(self);
        }
    }

    function onDownloadClicked(self, e) {
        var device = new Device();

        if (device.isMobileApp()) {
            onDownloadClickedMobile(self, e);
        } else {
            var target = $(e.target).closest('.content'),
                key = target.data('key'),
                session = JSON.parse(sessionStorage.getItem('meridium-session')),
                sessionId = session.id,
                url = self.service.getBaseUrl() + 'meridium/api/common/referencedocuments/refdocdownload/' + key;

            e.stopPropagation();

            var input = '<input type="hidden" name="data" value="' + encodeURIComponent(JSON.stringify({
                sessionid: sessionId
            })) + '"/>';
            $('<form action="' + url + '" method="post" enctype="application/x-www-form-urlencoded" target="_blank">' + input + '</form>')
                .appendTo('body')
                .submit()
                .remove();
        }
    }

    function onDownloadClickedMobile(self, e) {
        var target = $(e.target).closest('.content'),
            key = target.data('key');

        e.stopPropagation();
        showIndicator(self);
        self.service.getRefDocType(key).done(getRefDocType_done.bind(null, self, key));
    }

    function getRefDocType_done(self, key, typeDTO) {
        if (typeDTO.type === 'URL') {
            cordova.InAppBrowser.open(typeDTO.documentPath, '_blank');
            hideIndicator(self);
        } else {
            self.service.openRefDoc(key, typeDTO)
                .fail(refDocOpen_fail.bind(null, self));
            hideIndicator(self);
        }
    }

    /*************************************************
                    New refdoc
    *************************************************/
    function loadNewRefDocDatasheet(self, key) {
        var options = {
                'containerEl': $(self.element).find('.single-refdoc'),
                'familykey': self.familyKey
            },
            config = {
                'functionsAvailable': ['save'],
                'readOnly': false,
                'canedit': false,
                'showDatasheetSelection': true
            };

        require(['platform/datasheets/datasheet'], function(Datasheet) {
            self.datasheet = new Datasheet(options);
            hideRefDocListContainer(self);
            self.refDocSingleContainer = $(self.element).find('.single-refdoc');
            if (self.cachedEntity) {
                self.datasheet.updateState(self.cachedEntity);
                self.cachedEntity = null;
            }
            self.datasheet.load(config).done(newDatasheet_done.bind(null, self));
        });
    }

    function newDatasheet_done(self) {
        if (!self.showicon) {
            showBackButton(self);
        }
        if (self.siteKey !== undefined) {
            self.datasheet.datasheetManager.layout.siteKey(self.siteKey);
            //setting site selector read only if user is not super user
            if (!self.isSuperUser) {
                self.datasheet.datasheetManager.layout.isSelectedSiteViewOnly(true);
            }
        }
        self.refDocEntity = self.datasheet.datasheetManager.entity;
        self.refDocEntity.entityModified.add(onEntityModified.bind(null, self));
        self.datasheet.entityDeleted.add(onEntityDeleted.bind(null, self));
        self.datasheetViewModel = self.datasheet.datasheetManager.layout;
        self.datasheetViewModel.datasheetSaved.remove(self.datasheet.datasheetManager.onDatasheetSaved, self.datasheet.datasheetManager);
        self.datasheetViewModel.datasheetSaved.add(onNewDatasheetSaved.bind(null, self), self);
    }

    function onNewDatasheetSaved(self, refDocPathModel) {
        showIndicator(self);
        self.refDocPathModel = refDocPathModel;
        self.service.addRefDoc(self.entityKey, self.refDocEntity)
            .done(addRefDoc_done.bind(self.refDocEntity, self))
            .fail(addRefDoc_fail.bind(null, self));
    }

    function addRefDoc_done(self, entity) {
        if (self.refDocPathModel && self.refDocPathModel.isStored()) {
            self.service.uploadRefDoc(self.refDocPathModel.formData, entity.key)
                .done(saveRefDoc_success.bind(null, self, entity))
                .fail(uploadRefDoc_fail.bind(null, self));
        } else {
            saveRefDoc_success(self, entity);
        }
    }

    function uploadRefDoc_fail(self) {
        throwException(self.translator.translate('REFDOCS_FAILED_TO_UPLOAD_REF_DOC'), self.translator.translate('REFDOCS_ALERT'));
        hideIndicator(self);
    }

    function addRefDoc_fail(self) {
        throwException(self.translator.translate('REFDOCS_FAILED_TO_ADD_REF_DOC'), self.translator.translate('REFDOCS_ALERT'));
        hideIndicator(self);
    }

    /*************************************************
                    Edit refdoc
    *************************************************/

    function loadRefDocDatasheet(self, key) {
        var options = {
                'containerEl': $(self.element).find('.single-refdoc'),
                'entityObj': key
            },
            config = {
                'functionsAvailable': ['save', 'delete'],
                'readOnly': false,
                'canedit': false,
                'showDatasheetSelection': true
            };

        require(['platform/datasheets/datasheet'], function(Datasheet) {
            self.datasheet = new Datasheet(options);
            hideRefDocListContainer(self);
            self.refDocSingleContainer = $(self.element).find('.single-refdoc');
            if (self.cachedEntity) {
                self.datasheet.updateState(self.cachedEntity);
                self.cachedEntity = null;
            }
            self.datasheet.load(config).done(loadRefDocDatasheet_done.bind(null, self));
        });
    }

    function loadRefDocDatasheet_done(self) {
        if (!self.showicon) {
            showBackButton(self);
        }

        self.refDocEntity = self.datasheet.datasheetManager.entity;
        self.refDocEntity.entityModified.add(onEntityModified.bind(null, self));
        self.datasheet.entityDeleted.add(onEntityDeleted.bind(null, self));
        self.datasheetViewModel = self.datasheet.datasheetManager.layout;
        self.datasheetViewModel.datasheetSaved.remove(self.datasheet.datasheetManager.onDatasheetSaved, self.datasheet.datasheetManager);
        self.datasheetViewModel.datasheetSaved.add(onEditDatasheetSaved.bind(null, self), self);
    }

    function onEditDatasheetSaved(self, refDocPathModel, foo) {
        showIndicator(self);
        self.refDocPathModel = refDocPathModel;

        //always try to save since id and/or description could have changed
        self.service.saveRefDoc(self.entityKey, self.refDocEntity)
            .done(saveRefDoc_done.bind(self.refDocEntity, self))
            .fail(saveRefDoc_fail.bind(null, self));
    }

    function saveRefDoc_done(self, entity) {
        if (self.refDocPathModel && self.refDocPathModel.path !== undefined && self.refDocPathModel.isStored()) {
            self.service.uploadRefDoc(self.refDocPathModel.formData, entity.key)
                .done(saveRefDoc_success.bind(null, self, entity))
                .fail(uploadRefDoc_fail.bind(null, self));
        } else {
            saveRefDoc_success(self, entity);
        }
    }

    function saveRefDoc_success(self, entity) {
        self.datasheet.datasheetManager.entity._updateSelf(new EntityDTO(entity));
        if (self.refDocPathModel && self.refDocPathModel.path !== undefined) {
            if (!self.refDocPathModel.isStored()) {
                self.datasheet.entity.fields._byId.MI_REF_DOCUMENTS_DOCUM_EXTEN_C.attributes.value = "";

                if (self.refDocPathModel.isUnc() === true) {
                    self.service.refDocServerCredentialsExist()
                        .done(refDocServerCredentialsExist_done.bind(null, self))
                        .fail(refDocServerCredentialsExist_fail.bind(null, self));
                }
            }
        }
        back(self, {
            'saveDone': true
        });
        self.refDocsUpdated.raise(self);
    }

    function refDocServerCredentialsExist_done(self, result) {
        var toast = new FeedbackToast({
            'closeButton': true,
            'timeOut': '200',
            'hideDuration': '200'
        });

        if (result === false) {
            toast.warning(self.translator.translate('REFDOCSERVER_NO_CREDENTIALS'), self.translator.translate('REFDOCSERVER'));
        }
    }

    function refDocServerCredentialsExist_fail(self) {
        var toast = new FeedbackToast({
            'closeButton': true,
            'timeOut': '200',
            'hideDuration': '200'
        });

        toast.error(self.translator.translate('REFDOCSERVER_FAILED_CREDENTIALS'), self.translator.translate('REFDOCSERVER'));
    }

    function saveRefDoc_fail(self) {
        throwException(self.translator.translate('REFDOCS_FAILED_TO_SAVE_REF_DOC'), self.translator.translate('REFDOCS_ALERT'));
        hideIndicator(self);
    }

    /*************************************************
                    Misc Handlers
    *************************************************/
    function onEntityModified(self, a, b) {
        self.refDocEntity = self.datasheet.datasheetManager.entity;
    }

    function onEntityDeleted(self, entity) {
        refreshList(self, self.entityKey);
        self.refDocsUpdated.raise();
    }

    /*************************************************
                        Paging
    *************************************************/

    function back(self, options) {
        var datasheetUnload_promise;
        self.canOverwriteCache = true;
        self.cachedEntity = null;
        if (self.page === 'list-refdocs') {
            if (!self.showicon) {
                hideBackButton(self);
            }
            invokeCallback(self);
        } else if ((self.page === 'single-refdoc') || (self.page === 'new-refdoc')) {
            if (self.datasheet && !options.saveDone) {
                datasheetUnload_promise = self.datasheet.unload();
                datasheetUnload_promise.done(datasheetUnload_promise_done.bind(null, self));
            } else {
                datasheetUnload_promise_done(self);
            }
        }
    }

    function showBackButton(self) {
        $(self.element).find('.back').css('display', 'block');
    }

    function hideBackButton(self) {
        $(self.element).find('.back').css('display', 'none');
    }

    function invokeCallback(self) {
        Object.tryMethod(self, 'callback');
    }

    function showRefDocListContainer(self) {
        $(self.element).find('.single-refdoc').empty();
        //self.refDocListContainer.css('display', 'block');
        $(self.element).find('.list-refdocs').css('display', 'block');
    }

    function hideRefDocListContainer(self) {
        $(self.element).find('.list-refdocs').css('display', 'none');
        //self.refDocListContainer.css('display', 'none');
    }

    function datasheetUnload_promise_done(self) {
        showRefDocListContainer(self);
        if (!self.showicon) {
            hideBackButton(self);
        }
        refreshList(self);
        setCurrentPage(self, 'list-refdocs');
    }

    /*************************************************
                 Misc Event Handlers
    *************************************************/

    function searchCallback(self, searchterm) {
        var filteredRefDocs = [];
        filteredRefDocs = _.filter(self.refDocs.refdocs, function(refdoc) {
            if (refdoc.name.toLowerCase().indexOf(searchterm.toLowerCase()) >= 0) {
                return true;
            }
            if (refdoc.desc.toLowerCase().indexOf(searchterm.toLowerCase()) >= 0) {
                return true;
            }
            if (refdoc.addedBy.toLowerCase().indexOf(searchterm.toLowerCase()) >= 0) {
                return true;
            }
            if (refdoc.addedOn.toLowerCase().indexOf(searchterm.toLowerCase()) >= 0) {
                return true;
            }
        });
        self.refDocListContainer.find('.content').remove();
        attachView(self, filteredRefDocs);
    }

    function onAddClicked(self) {
        loadNewRefDocDatasheet(self, self.familyKey);
        setCurrentPage(self, 'new-refdoc');
    }

    function onSearchFinderBtnClicked(self) {
        var dfd = $.Deferred(),
            finder = new SearchFinder(),
            siteKeys = self.siteKey === null ? [self.siteKey] : [self.siteKey, null],
            options = {
                multiSelect: true,
                selectRelated: false,
                families: ['432783'],
                relationships: [],
                defaultFamily: 432783,
                siteKeys: siteKeys
            };

        dfd.done(refDocLink_done.bind(null, self));

        finder.show(options).done(finderShow_done.bind(null, self, dfd));

        return dfd;
    }

    function finderShow_done(self, dfd, selections) {
        var pendingRefDocLinks = selections.length;

        _.each(selections, linkEachEntity.bind(null, self, pendingRefDocLinks, dfd));
    }

    function linkEachEntity(self, pendingRefDocLinks, dfd, selectedEntity, index) {
        self.failedRefDocLinkCount = 0;

        showIndicator(self);
        self.service.linkRefDocEnntity(self.entityKey, selectedEntity.key)
            .done(refDocLinkEntity_done.bind(null, self, pendingRefDocLinks, dfd, index))
            .fail(refDocLinkEntity_fail.bind(null, self, pendingRefDocLinks, dfd, index));
    }

    function refDocLinkEntity_done(self, pendingRefDocLinks, dfd, index) {
        var allEntitiesLinked = (pendingRefDocLinks === (index + 1));

        if (allEntitiesLinked) {
            dfd.resolve(self.failedRefDocLinkCount);
        }

        self.refDocsUpdated.raise();
        hideIndicator(self);
    }

    function refDocLinkEntity_fail(self, pendingRefDocLinks, dfd, index) {
        var allEntitiesLinked = (pendingRefDocLinks === (index + 1));

        self.failedRefDocLinkCount++;

        if (allEntitiesLinked) {
            dfd.resolve(self.failedRefDocLinkCount);
        }

        hideIndicator(self);
    }

    function refDocLink_done(self) {
        if (self.failedRefDocLinkCount === 0) {
            refreshList(self, self.entityKey);
        } else {
            MessageBox.showOk(self.translator.translate('REFDOCS_FAILED_TO_LINK') + " " + self.failedRefDocLinkCount, self.translator.translate('REFDOCS_FAILED'));
        }
    }

    function handleAddAccess(self) {
        if (!self.isAddAllowed()) {
            $(self.element).find('button.add').addClass('no-access');
            $(self.element).find('button.search-finder-btn').addClass('no-access');
        }
    }

    function handleUnlinkAccess(self) {
        if (!self.isUnlinkAllowed()) {
            $(self.element).find('button.unlink').addClass('no-access');
        }
    }

    function handleEditAccess(self) {
        if (!self.isUpdateAllowed()) {
            $(self.element).find('button.edit').addClass('no-access');
        }
    }

    function setStringToPage(self) {
        $('#ref-doc-id').text(self.translator.translate('REFDOCS_HEADER_ID'));
        $('#ref-doc-desc').text(self.translator.translate('REFDOCS_HEADER_DESCRIPTION'));
        $('#ref-doc-stored').text(self.translator.translate('REFDOCS_HEADER_STORED'));
        $('#ref-doc-size').text(self.translator.translate('REFDOCS_HEADER_SIZE') + ' (KB)');

        $(self.element).find('.refdoc-container').find('button.back').attr('title', self.translator.translate('REFDOCS_BACK'));
        $(self.element).find('.refdoc-container').find('button.add').attr('title', self.translator.translate('REFDOCS_ADD'));
        $(self.element).find('.refdoc-container').find('button.search-finder-btn').attr('title', self.translator.translate('REFDOCS_LINK'));
    }

    function showIndicator(self) {
        $(self.element).find('center.loading-indicator').get(0).style.display = 'block';
    }

    function hideIndicator(self) {
        $(self.element).find('center.loading-indicator').get(0).style.display = 'none';
    }

    Element.registerElement('mi-ref-doc', {
        prototype: RefDocContainerViewModel.prototype
    });

    return RefDocContainerViewModel;
});