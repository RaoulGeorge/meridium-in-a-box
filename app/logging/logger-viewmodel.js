define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        KnockoutRouteScreen = require('spa/ko/knockout-route-screen'),
        ApplicationEvents = require('application/application-events'),
        Broker = require('system/notifications/broker'),
        view = require('text!./ui/views/logger.html');
    
        require('ui/elements/panel/view-model');
        

    

    function LoggerViewModel(appEvents, loggerService) {

        var routes = [
            {
                url: '@logId',
                module: 'logging/logger-detail-viewmodel'
            }

        ];


        this.navigate = appEvents.navigate;
        this.broker = Object.resolve(Broker);
        base.call(this, view, routes, '.shell');
        $('mi-panel').height = '363px';
        this.titleChanged = appEvents.titleChanged;
        this.errorslog = ko.observableArray();

    }

    LoggerViewModel.dependsOn = [ApplicationEvents, Broker];

    var base = Object.inherit(KnockoutRouteScreen, LoggerViewModel);

    //The open method is called shortly after creating an instance of the screen passing in the route parameters.
    LoggerViewModel.prototype.open = function LoggerViewModel_open() {
        this.titleChanged.raise('Error Logs : Admin', this);
    };

    //The attach method is where the Screen is added to the DOM
    LoggerViewModel.prototype.attach = function LoggerViewModel_attach(region, url) {
        
        //$(':button:hidden.more-options-icon.btn.btn-primary.btn-icon.dropdown-toggle').remove();
        base.prototype.attach.call(this, region);
        var shellScreenHeight = region.$element.find('mi-panel').parents('#shell-screen').height();
        //region.$element.find('button.more-options-icon').css("visibility", "hidden");
        //region.$element.find('button.more-options-icon.btn.btn-primary.btn-icon.dropdown-toggle').css("visibility", "hidden");
        region.$element.find('icon.icon-options').remove();
        region.$element.find('mi-panel').css('height', shellScreenHeight);
        
        this.resolveSubRoute(url);
    };

    //The load method is called before the screen is to become active for the first time passing in the route parameters
    LoggerViewModel.prototype.load = function LoggerViewModel_load(args) {
        
        this.errorslog(this.broker.notificationPanel.getErrorsLog());
        console.log(this.errorslog());
        
        if (window.location.href.indexOf('logging') >= 0)
        {
            this.navigate.raise("#errorlog/" + "1");
            

        }
        
    };

    

    LoggerViewModel.prototype.tabHandler = function LoggerViewModel_tabHandler(data, url) {

        this.navigate.raise(url + data.number);
    };

    //The detach method is where you remove your HTML code from the DOM 
    LoggerViewModel.prototype.detach = function LoggerViewModel_detach(region) {
        base.prototype.detach.call(this, region);
    };

    

    return LoggerViewModel;
});