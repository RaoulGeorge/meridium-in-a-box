define(function (require) {
    'use strict';

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ko = require('knockout'),
        view = require('text!./popup-editor-view.html!strip');

    require('system/lang/object');

    function LongTextPopupViewModel(value, placeholder) {
        base.call(this, view);

        this.region = null;
        this.value = ko.observable(value);
        this.placeholderText = ko.observable(placeholder);
    }
    var base = Object.inherit(KnockoutViewModel, LongTextPopupViewModel);

    LongTextPopupViewModel.prototype.attach = function (region) {
        this.region = region;
        base.prototype.attach.apply(this, arguments);

        this.region.$element.find('textarea').focus();
    };
    
    LongTextPopupViewModel.prototype.done = function () {
        return this.value();
    };
    
    return LongTextPopupViewModel;
});