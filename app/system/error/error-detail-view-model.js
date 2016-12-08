define(function (require) {
    'use strict';

    var view = require('text!./views/error-detail-view.html'),
        Translator = require('system/globalization/translator'),
        KnockoutViewModel = require('spa/ko/knockout-view-model');

    function ErrorDetailViewModel(errorMessage) {
        base.call(this, view);
        this.errorMessage = errorMessage;
        this.translator = Object.resolve(Translator);
    }

    var base = Object.inherit(KnockoutViewModel, ErrorDetailViewModel);

    ErrorDetailViewModel.prototype.attach = function errorDetail_attach(region) {
        this.code = this.errorMessage.code;
        this.message = this.errorMessage.message;
        try{
            this.detail = formatToObjectStructure(handleSpecialChars(this.errorMessage.detail)) || null;
        }catch(error){
            this.detail = this.errorMessage.detail || null;
        }
        base.prototype.attach.call(this, region);
    };

    ErrorDetailViewModel.prototype.detach = function errorDetail_detach(region) {
        base.prototype.detach.call(this, region);
    };

    ErrorDetailViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    function formatToObjectStructure(str) {
        return JSON.stringify(JSON.parse(str), null, '\t');
    }

    function handleSpecialChars(str){
        return str.split('<').join('&lt;').split('<').join('&gt;').split('\\r\\n').join('<br/>').split('\\n').join('<br/>');
    }

    return ErrorDetailViewModel;
});