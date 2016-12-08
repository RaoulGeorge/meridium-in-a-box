define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ApplicationEvents = require('application/application-events'),
        LeftnavViewModel = require('shell/leftnav-view-model'),
        Popover = require('system/ui/popover');

    function PopoverSampleViewModel(applicationEvents) {
        this.titleChanged = applicationEvents.titleChanged;
        this.leftnavViewModel = Object.resolve(LeftnavViewModel);
        this.popoverOne = null;
        this.popoverTwo = null;
    }

    PopoverSampleViewModel.dependsOn = [ApplicationEvents];

    PopoverSampleViewModel.prototype.open = function PopoverSampleViewModel_open() {
        this.titleChanged.raise('Popover Sample', this);
    };

    PopoverSampleViewModel.prototype.attach = function PopoverSampleViewModel_attach(region) {
        region.attach($(
            '<div class="popover-sample-screen" style="height:100%">' +
            '<div style="float:left; width: 100%;">' +
                '<div style="float:left; width:50%;"><button id="popover1" class="btn btn-primary" style="">Popover with HTML' +
                '</button></div>' +
                '<div style="float:left; width:50%;"><button id="popover2" class="btn btn-primary" style="">Popover with a View Model' +
                '</button></div>' +
            '</div>' +
            '</div>'));

        var popoverHTML = '<div>This is a popover that uses HTML.<br/><br/>   Lorem ipsum dolor sit amet, consectetur adipisicing elit,' +
            'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud' +
            'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit ' +
            'in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,' +
            'sunt in culpa qui officia deserunt mollit anim id est laborum</div>',
            self;

            this.popoverOne = new Popover(popoverHTML, $('#popover1')[0]);
            this.popoverTwo = new Popover(this.leftnavViewModel, $('#popover2')[0]),
            self = this;

        $('#popover1').click(function () {
            self.popoverOne.toggle();
        });

        $('#popover2').click(function () {
            self.popoverTwo.toggle();
        });
    };

    PopoverSampleViewModel.prototype.detach = function PopoverSampleViewModel_detach(region) {
        this.popoverOne.hide();
        this.popoverTwo.hide();
    };

    return PopoverSampleViewModel;
});