define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        ErrorNotificationHandler = require('logging/error-notification-handler'),
        view = require('text!logging/ui/views/error-badge-view.html');

    function ErrorNotificationScreen(translator, appEvents) {
        base.call(this, view);
        this.translator = translator;
        this.titleChanged = appEvents.titleChanged;
        this.element = null;
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
        this.appEvents = appEvents;

        this.errorslog = ko.observableArray();
        this.errorslogCount = ko.observableArray();

        // Attach event handler
        this.errorNotificationHandler.addErrorEvent.add(onError.bind(null, this));
    }
    var base = Object.inherit(KnockoutViewModel, ErrorNotificationScreen);
    ErrorNotificationScreen.dependsOn = [Translator, ApplicationEvents];

    ErrorNotificationScreen.prototype.load = function (args) {

    };

    ErrorNotificationScreen.prototype.open = function () {
        
    };

    ErrorNotificationScreen.prototype.attach = function (region) {

        region.attach($(view));
        base.prototype.attach.call(this, region);
        this.element = region.element;
      
    };

    
    ErrorNotificationScreen.prototype.tabHandler = function applicationMenuViewModel_tabHandler(data, url) {

        this.appEvents.navigate.raise(url + data.number, { tab: true });
    };

    function onError(self, errorsLog) {
        self.errorslog(errorsLog);
        self.errorslogCount(self.errorslog().length);
    }



    return ErrorNotificationScreen;
});
