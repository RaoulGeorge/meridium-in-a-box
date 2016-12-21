//The Hello-World module is used to introduce new developers to the v4 framework.

define(function (require) {
    'use strict';
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/hello-world-view.html');

    function HelloWorld(appEvents) {
        base.call(this, view);

        this.name = null;
        this.welcomeMessage = null;
        this.titleChanged = appEvents.titleChanged;
    }

    HelloWorld.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, HelloWorld);

    //The open method is called shortly after creating an instance of the screen passing in the route parameters.
    HelloWorld.prototype.open = function HelloWorld_open() {
        this.titleChanged.raise('Hello World', this);
    };

    //The attach method is where the Screen is added to the DOM
    HelloWorld.prototype.attach = function HelloWorld_attach(region) {
        base.prototype.attach.call(this, region);
    };

    //The load method is called before the screen is to become active for the first time passing in the route parameters
    HelloWorld.prototype.load = function HelloWorld_load(args) {
        this.name = ko.observable();
        this.welcomeMessage = ko.computed(computeWelcomeMessage.bind(null, this));
    };

    //The detach method is where you remove your HTML code from the DOM 
    HelloWorld.prototype.detach = function HelloWorld_detach(region) {
        base.prototype.detach.call(this, region);
    };


    //The unload method is where you do all of your final data clean up.
    HelloWorld.prototype.unload = function HelloWorld_unload() {
        this.welcomeMessage.dispose();
        this.welcomeMessage = null;
        this.name = null;
    };

    function computeWelcomeMessage(self) {
        if (self.name()) {
            return 'Hello ' + self.name() + ',';
        }
    }

    return HelloWorld;
});