define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ApplicationContext = require('application/application-context'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        view = require('text!./views/shell.html'),
        NavigationViewModel = require('./navigation-view-model'),
        ApplicationMenuViewModel = require('./application-menu-view-model'),
        StatusBarViewModel = require('./status-bar-view-model'),
        LeftnavViewModel = require('./leftnav-view-model'),
        Region = require('spa/region'),
        ScreenSize = require('ui/screen-size'),
        Conductor = require('spa/conductor');

    function ShellViewModel(conductor) {
        base.call(this, view);
        this.navigationViewModel = Object.resolve(NavigationViewModel);
        this.applicationMenuViewModel = Object.resolve(ApplicationMenuViewModel);
        this.statusBarViewModel = Object.resolve(StatusBarViewModel);
        this.leftnavViewModel = Object.resolve(LeftnavViewModel);
        this.screenSize = Object.resolve(ScreenSize);
        this.conductor = conductor;
        this.navigationRegion = new Region();
        this.applicationMenuRegion = new Region();
        this.statusBarRegion = new Region();
        this.leftnavRegion = new Region();
    }

    var base = Object.inherit(KnockoutViewModel, ShellViewModel);
    ShellViewModel.dependsOn = [Conductor];

    ShellViewModel.prototype.attach = function shellViewModel_attach(region) {
        base.prototype.attach.call(this, region);
        this.navigationRegion.setElement($('nav.tab'));
        this.conductor.changeScreen(this.navigationViewModel, this.navigationRegion);
        this.applicationMenuRegion.setElement($('nav.app'));
        this.conductor.changeScreen(this.applicationMenuViewModel, this.applicationMenuRegion);
        this.statusBarRegion.setElement($('nav.status-bar'));
        this.conductor.changeScreen(this.statusBarViewModel, this.statusBarRegion);
        this.leftnavRegion.setElement($('nav.leftnav'));
        this.conductor.changeScreen(this.leftnavViewModel, this.leftnavRegion);

        $('#radio01').click(function () {
            $('#radio01').attr('checked', true);
            $('.dx-datagrid, body').addClass('tight');
            $('#radio02').attr('checked', false);
        });
        $('#radio02').click(function () {
            $('#radio02').attr('checked', true);
            $('.dx-datagrid, body').removeClass('tight');
            $('#radio01').attr('checked', false);
        });

        if (this.screenSize.isTooSmallForAllPages()) {
            screen.lockOrientation && screen.lockOrientation('portrait');
        }

        $('#radio01').click(function () {
            $('#radio01').attr('checked', true);
            $('.dx-datagrid').addClass('tight');
            $('#radio02').attr('checked', false);
        });
        $('#radio02').click(function () {
            $('#radio02').attr('checked', true);
            $('.dx-datagrid').removeClass('tight');
            $('#radio01').attr('checked', false);
        });
    };

    ShellViewModel.prototype.reuse = function shellViewModel_reuse() {
    };

    ShellViewModel.prototype.deactivate = function () {
        base.prototype.deactivate.call(this);
        this.shellEvents.newTab.remove();
        this.shellEvents.logOff.remove();
    };

    ShellViewModel.prototype.user = function shellViewModel_user() {
        return ApplicationContext.user;
    };

    ShellViewModel.prototype.session = function shellViewModel_session() {
        return ApplicationContext.session;
    };

    return ShellViewModel;
});
