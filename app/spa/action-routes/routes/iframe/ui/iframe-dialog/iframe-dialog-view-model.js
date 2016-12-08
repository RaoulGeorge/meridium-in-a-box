define(function (require) {
    'use strict';

    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        view = require('text!./iframe-dialog-view.html');

    function IFrameDialogViewModel(url) {
        base.call(this, view);
        this.region = null;
        this.dialog = null;
        this.url = url;
    }

    var base = Object.inherit(KnockoutViewModel, IFrameDialogViewModel);

    IFrameDialogViewModel.prototype.attach = function IFrameDialogViewModel_attach(region) {
        base.prototype.attach.call(this, region);
        this.region = region;
    };

    return IFrameDialogViewModel;
});