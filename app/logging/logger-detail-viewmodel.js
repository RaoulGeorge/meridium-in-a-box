define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        Broker = require('system/notifications/broker'),
        view = require('text!./ui/views/logger-detail.html'),
        ApplicationEvents = require('application/application-events');
    require('ui/elements/header/header-view-model');
    require('ui/elements/list-group/view-model');
        
        

    function LoggerDetailViewModel(applicationEvents) {
        base.call(this, view);
        this.broker = Object.resolve(Broker);
        this.titleChanged = applicationEvents.titleChanged;
        this.errorDetails = ko.observable();
        
    }

    var base = Object.inherit(KnockoutViewModel, LoggerDetailViewModel);

    LoggerDetailViewModel.dependsOn = [ApplicationEvents];

    LoggerDetailViewModel.prototype.open = function LoggerDetailViewModel_open() {
        this.titleChanged.raise('Sandbox', this);
    };

    LoggerDetailViewModel.prototype.attach = function LoggerDetailViewModel_attach(region, url) {
        
        base.prototype.attach.call(this, region);
        
    };


    LoggerDetailViewModel.prototype.load = function LoggerDetailViewModel_load(url) {

        this.errorDetails(this.broker.notificationPanel.getErrorById(url));
        


    };
    return LoggerDetailViewModel;
});