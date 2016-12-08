define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');


    var m = require('mithril'),
        MithrilViewModel = require('spa/mithril/mithril-view-model'),
        Localization = require('../models/localization'),
        LocalizationService = require('../services/localization-service'),
        Translator = require('system/globalization/translator'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        view = require('../views/localize-dialog-view'),
        AjaxError = require('system/http/ajax-error'),
        Assert = require('mi-assert');

    function LocalizeDialogViewModel(type, phrase, key, context) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.service = Object.resolve(LocalizationService);
        this.localization = new Localization([], type, phrase, key, context);
        this.working = m.prop(true);
    }

    var base = Object.inherit(MithrilViewModel, LocalizeDialogViewModel);

    LocalizeDialogViewModel.prototype.load = function load() {
        try {
            startWork(this);
            getLanguages(this)                
                .then(updateLocalizationCultures.bind(null, this))
                .then(getLocalizedValues.bind(null, this))
                .then(updateLocalizedValues.bind(null, this))
                .then(endWork.bind(null, this))
                .then(checkLicenses.bind(null, this))
                .catch(handleError)
                .catch(endWork.bind(null, this));
        } catch (error) {
            handleError(error);
        }
    };

    function checkLicenses(self, languages) {
        if(self.localization.cultures().length === 0) {
            var dialogSaveButton = document.querySelector('.btn-localize-save');

            dialogSaveButton.className = dialogSaveButton.className + ' disabled';
        }
    }

    function startWork(self) {
        self.working(true);
        m.redraw();
    }

    function getLanguages(self) {
        return self.service.getLanguages();
    }

    function updateLocalizationCultures(self, cultures) {
        self.localization.updateCultures(cultures);
    }

    function getLocalizedValues(self) {
        return self.service.getTranslationValues(type(self), phrase(self), key(self), context(self));
    }

    function type(self) {
        return self.localization.type();
    }

    function phrase(self) {
        return self.localization.phrase();
    }

    function key(self) {
        return self.localization.key();
    }

    function context(self) {
        return self.localization.context();
    }

    function updateLocalizedValues(self, data) {
        self.localization.addAll(data);
    }

    function handleError(error) {
        if (error.response) {
            error = new AjaxError(error.response, error.request).toError();
        }
        if (error.stack) {
            logger.error(error.stack);
        } else {
            logger.error(error);
        }
        throw error;
    }

    function endWork(self) {
        self.working(false);
        m.redraw();
    }

    LocalizeDialogViewModel.prototype.save = function save() {
        try {
            var dfd = $.Deferred();
            startWork(this);
            saveLocalizedValues(this)
                .then(dfd.resolve.bind(dfd))
                .then(endWork.bind(null, this))
                .catch(saveFailed.bind(null, dfd))
                .catch(endWork.bind(null, this));
            return dfd.promise();
        } catch (error) {
            handleError(error);
        }
    };

    function saveLocalizedValues(self) {
        return self.service.saveTranslationValues(type(self), phrase(self), key(self), context(self), values(self));
    }

    function values(self) {
        return self.localization.values();
    }

    function saveFailed(dfd, error) {
        handleError(error);
        dfd.reject();
    }

    LocalizeDialogViewModel.prototype.title = function title() {
        return this.text('LOCALIZE_PHRASE').replace('{0}', this.localization.phrase());
    };

    LocalizeDialogViewModel.prototype.text = function text(key) {
        Assert.stringNotEmpty(key, 'key');
        return this.translator.translate(key);
    };

    return LocalizeDialogViewModel;
});