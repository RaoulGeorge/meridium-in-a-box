define(function (require) {
    'use strict';

    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        DialogViewModel = require('system/ui/dialog-view-model'),
        view = require('text!./views/error-accumulator-view.html'),
        Translator = require('system/globalization/translator');

    function ErrorAccumulator() {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.errorArray = ko.observableArray();
    }

    var base = Object.inherit(KnockoutViewModel, ErrorAccumulator);

    ErrorAccumulator.prototype.registerError = function ErrorAccumulator_registerError(newError) {
        this.addError(newError);
        this.updateView();
    };

    ErrorAccumulator.prototype.addError = function ErrorAccumulator_addError(newError) {
        newError.expand = ko.observable(false);
        this.errorArray.unshift(newError);
    };

    ErrorAccumulator.prototype.toggleTitleClick = function ErrorAccumulator_toggleTitleClick(self, data, e) {
        data.expand(!data.expand());
    };
    ErrorAccumulator.prototype.closePopup = function ErrorAccumulator_closePopup() {
        if (this.dialog) {
            this.dialog.closeDialog();
            this.dialog = null;
        }      
        
        this.errorArray([]);
    };
    ErrorAccumulator.prototype.updateView = function ErrorAccumulator_updateView() {
        if (!this.dialog) {

            this.dialog = new DialogViewModel(this, this.translator.translate('ERRORS'));

            this.dialog.show();
        }
    };


    return ErrorAccumulator;
}); 