define(function (require) {
    'use strict';
    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        view = require('text!./views/empty-page.html');

    function EmptyPageViewModel() {
        base.call(this, view);
    }
    var base = Object.inherit(KnockoutViewModel, EmptyPageViewModel);

    return EmptyPageViewModel;
});