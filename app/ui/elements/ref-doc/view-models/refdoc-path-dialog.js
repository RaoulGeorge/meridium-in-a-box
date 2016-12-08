define(function(require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        DialogViewModel = require('system/ui/dialog-view-model'),
        Translator = require('system/globalization/translator'),
        MessageBox = require('system/ui/message-box'),
        RefDocPathAdapter = require('../models/refdoc-path-adapter'),
        PathValidator = require('../models/path-validator'),
        UnsavedMessageBox = require('system/ui/unsaved-changes-message-box'),
        view = require('text!../views/refdoc-path-dialog.html');

    require('system/lang/object');
    require('system/knockout/knockout-helpers');
    require('ui/elements/radio/radio-view-model');

    function RefDocPathEditorDialog() {
        base.call(this, view);

        this.kom = null;
        this.translator = null;
        this.validator = null;
        this.isLoading = false;
        this.validationMessage = null;
        this.docType = null;
        this.browsePath = null;
        this.linkPath = null;
        this.fileName = null;
        this.outputPath = null;
        this.pathModel = null;
        this.isDirty = null;
        this.canSave = null;
    }

    var base = Object.inherit(KnockoutViewModel, RefDocPathEditorDialog);

    RefDocPathEditorDialog.prototype.show = function show(dto) {
        this.dfd = $.Deferred();

        this.loadDialog(dto);

        this.dialog = new DialogViewModel(this, this.translator.translate('REFDOCS_EDIT_DOCUMENT_PATH_TITLE'), {
            height: '50%',
            width: '600px'
        });
        this.dialog.show();

        return this.dfd.promise();
    };

    RefDocPathEditorDialog.prototype.unload = function unload() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.kom = null;
        this.translator = null;
        this.validator = null;
    };

    RefDocPathEditorDialog.prototype.loadDialog = function loadDialog(dto) {
        this.isLoading = true;
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.validator = Object.resolve(PathValidator);

        this.docType = this.kom.observable();
        this.browsePath = this.kom.observable();
        this.linkPath = this.kom.observable();
        /* jshint ignore:start */
        this.validationMessage = this.kom.observable(this.translator.translate('REFDOCS_EDIT_DOCUMENT_INVALID_PATH_CAPTION') + ' ' + this.translator.translate('REFDOCS_EDIT_DOCUMENT_INVALID_PATH_URL') + ' ' + this.translator.translate('REFDOCS_EDIT_DOCUMENT_INVALID_PATH_OR') + ' ' + this.translator.translate('REFDOCS_EDIT_DOCUMENT_INVALID_PATH_SHARED'));
        /* jshint ignore:end */
        this.fileName = this.kom.observable();
        this.outputPath = this.kom.pureComputed(processPath.bind(null, this));
        this.pathModel = this.kom.observable();

        this.docType.subscribe(onDocTypeChanged.bind(null, this), this);
        this.browsePath.subscribe(onBrowsePathChanged.bind(null, this), this);
        this.linkPath.extend({
            validate: validateLinkPath.bind(null, this)
        });

        // isDirty implementation.
        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;
        this.canSave = this.kom.pureComputed(canSave_read.bind(null, this));

        this.loadDialogFields(dto);
        this.isLoading = false;
    };

    RefDocPathEditorDialog.prototype.loadDialogFields = function loadDialogFields(dto) {
        dto = dto ? dto : {};

        this.pathModel(RefDocPathAdapter.toModel(dto));

        if (this.pathModel().path() !== "") {
            if (this.pathModel().isStored()) {
                this.docType('upload');
                this.fileName(this.pathModel().path());
            } else {
                this.docType('link');
                this.linkPath(this.pathModel().path());
            }
        } else {
            this.docType('upload');
        }

        clearIsDirty(this);
    };

    RefDocPathEditorDialog.prototype.onSaveClicked = function onSaveClicked() {
        this.pathModel().isStored(this.docType() === 'upload');
        this.pathModel().path(this.outputPath());
        if (this.pathModel().isStored()) {
            this.pathModel().formData = new FormData($(document).find('.refdoc-form')[0]);
        }

        this.dialog.closeDialog();
        this.dfd.resolve(RefDocPathAdapter.toDTO(this.pathModel()));
    };

    RefDocPathEditorDialog.prototype.onCancelClicked = function onCancelClicked() {
        if (this.kom.isDirty()) {
            UnsavedMessageBox.show().done(unsavedMessageBoxShow_done.bind(null, this));
        } else {
            this.dialog.closeDialog();
            this.dfd.reject();
        }
    };

    function unsavedMessageBoxShow_done(self) {
        self.dialog.closeDialog();
        self.dfd.reject();
    }

    function onBrowsePathChanged(self, newVal) {
        var file = '';

        if (newVal !== '') {
            var str = newVal.split('\\');
            file = str[str.length - 1];
        }

        self.fileName(file);
    }

    function onDocTypeChanged(self, newVal) {
        if (!self.isLoading) {
            if (newVal === 'upload') {
                self.linkPath('');
                self.pathModel().isUrl(false);
                self.pathModel().isUnc(false);
            } else if (newVal === 'link') {
                self.fileName('');
                self.linkPath('');
                self.browsePath('');
            }
        }
    }

    function processPath(self) {
        if (self.docType() === 'upload') {
            return self.fileName();
        } else if (self.docType() === 'link') {
            return self.linkPath();
        }
        return "";
    }

    function validateLinkPath(self) {
        if (self.isLoading || self.docType() === 'upload') {
            return true;
        }

        if (self.validator.isValidUrl(self.linkPath())) {
            self.pathModel().isUrl(true);
            self.pathModel().isUnc(false);

            return true;
        }
        
        if (self.validator.isValidUncPath(self.linkPath())) {
            self.pathModel().isUrl(false);
            self.pathModel().isUnc(true);

            return true;
        }

        self.pathModel().isUrl(false);
        self.pathModel().isUnc(false);

        return false;
    }

    function canSave_read(self) {
        return self.isDirty() && !self.isLoading && !self.linkPath.invalid() && self.outputPath() && self.outputPath() !== "";
    }

    function clearIsDirty(self) {
        self.kom.tracker.markCurrentStateAsClean();
    }

    function createHash(self) {
        var hashObject;

        hashObject = {
            outputPath: self.outputPath()
        };

        return JSON.stringify(hashObject);
    }

    return RefDocPathEditorDialog;
});