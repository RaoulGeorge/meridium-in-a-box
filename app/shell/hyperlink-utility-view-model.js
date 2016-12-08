define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        Translator = require('system/globalization/translator'),
        ApplicationContext = require('application/application-context'),
        AjaxClient = require('system/http/ajax-client'),
        view = require('text!./views/hyperlink-utility-popup.html');

    function HyperlinkUtilityViewModel() {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.ajaxClient = Object.resolve(AjaxClient);
        this.hashurl = null;
        this.fullurl = null;
    }

    var base = Object.inherit(KnockoutViewModel, HyperlinkUtilityViewModel);

    HyperlinkUtilityViewModel.prototype.load = function HyperlinkUtilityViewModel_load() {
        this.hashurl = ko.observable();
        this.fullurl = ko.observable();
    };

    HyperlinkUtilityViewModel.prototype.attach = function HyperlinkUtilityViewModel_attach(region) {
        base.prototype.attach.call(this, region);

        var windowLocation = window.location,
            hash = '#' + ApplicationContext.navigation.activeRoute,
            pathName = 'meridium/',
            url = this.ajaxClient.baseUrl() + pathName + hash;

        this.hashurl(hash);
        this.fullurl(url);
    };

    HyperlinkUtilityViewModel.prototype.unload = function HyperlinkUtilityViewModel_unload() {
        this.hashurl = null;
        this.fullurl = null;
    };

    return HyperlinkUtilityViewModel;
});
