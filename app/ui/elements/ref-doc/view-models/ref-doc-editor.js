define(function (require) {
    'use strict';

    var $ = require('jquery'),
        FeedbackToast = require('logging/feedback-component/feedback-component'),
        view = require('text!../views/refdoc-container.html'),
        EntityDTO = require('platform/entity/services/dto/entity-dto'),
        MessageBox = require('system/ui/message-box');

    function RefDocEditor() {

    }

    RefDocEditor.prototype.loadNewRefDocDatasheet = function(refDocElement, familyKey) {
        var options = {
                'containerEl': $(refDocElement).find('.single-refdoc'),
                'familykey': familyKey
            },
            config = {
                'functionsAvailable': ['save'],
                'readOnly': false,
                'canedit': false,
                'showDatasheetSelection': true
            };

        require(['platform/datasheets/datasheet'], function(Datasheet) {
            refDocElement.datasheet = new Datasheet(options);
            hideRefDocListContainer(refDocElement);
            refDocElement.refDocSingleContainer = $(refDocElement).find('.single-refdoc');
            refDocElement.datasheet.load(config).done(newDatasheet_done.bind(null, refDocElement));
        });
    };

    function newDatasheet_done(self) {
        if (!self.showicon) {
            showBackButton(self);
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

        hideIndicator(self);

        //move paging out into its own view model
        //this may be what i need to hide the indicator
        // back(self, {
        //     'saveDone': true
        // });
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

    function hideRefDocListContainer(self) {
        self.refDocListContainer.css('display', 'none');
    }

    function showBackButton(self) {
        $(self.element).find('.back').css('display', 'block');
    }

    function onEntityModified(self) {
        self.refDocEntity = self.datasheet.datasheetManager.entity;
    }

    function onEntityDeleted(self, entity) {
        //refreshList(self, self.entityKey); //call in viewmodel
        self.refDocsUpdated.raise();
    }

    function showIndicator(self) {
        $(self.element).find('center.loading-indicator').get(0).style.display = 'block';
    }

    function throwException(msg, title) {
        MessageBox.showOk(msg, title);
    }

    function hideIndicator(self) {
        $(self.element).find('center.loading-indicator').get(0).style.display = 'none';
    }

    return RefDocEditor;
});
