define(function (require) {
    'use strict';

    var $ = require('jquery'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        view = require('text!./views/application-menu.html'),
        // SearchScreenModel = require('search/search-screen'),
        // AddRecordScreenModel = require('record-manager-v2/add-record-screen'),
        Translator = require('system/globalization/translator'),
        Region = require('spa/region'),
        // HelpScreen = require('help/view-models/help-screen'),
        Conductor = require('spa/conductor');

    // require('strategy/recommendations/recommendation-control');

    function ApplicationMenuViewModel(kom, appEvents, conductor) {
        base.call(this, view);
        this.kom = kom;
        this.appEvents = appEvents;
        this.translator = Object.resolve(Translator);
        // this.searchScreenModel = Object.resolve(SearchScreenModel);
        this.searchScreenRegion = new Region();
        this.conductor = conductor;
        this.isSearchVisible = kom.observable(false);
        this.hideSearch = false;
        this.searchInput = null;

        // this.addRecordScreenModel = Object.resolve(AddRecordScreenModel);
        this.addRecordScreenRegion = new Region();
        this.addRecordInput = null;
        this.isAddRecordVisible = kom.observable(false);
        this.hideAddRecord = false;
        this.isThemeSettingsVisible = kom.observable(false);
        this.hideThemeSettings = false;
    }

    var base = Object.inherit(KnockoutViewModel, ApplicationMenuViewModel);
    ApplicationMenuViewModel.dependsOn = [KnockoutManager, ApplicationEvents, Conductor];

    ApplicationMenuViewModel.prototype.deactivate = function applicationMenuViewModel_deactivate() {
        base.prototype.deactivate.call(this);
        this.kom.dispose();
    };

    ApplicationMenuViewModel.prototype.attach = function applicationMenuViewModel_attach(region) {
        base.prototype.attach.call(this, region);
        this.appEvents.windowClicked.add(this.closeSearch, this);
        this.appEvents.windowClicked.add(this.closeAddRecord, this);
        this.appEvents.windowClicked.add(this.closeThemeSettings, this);

        this.searchScreenRegion.setElement($('div.search-overlay'));
        // this.conductor.changeScreen(this.searchScreenModel, this.searchScreenRegion);
        this.searchInput = $('nav.app div.search-overlay input');

        this.addRecordScreenRegion.setElement($('div.add-record-overlay'));
        // this.conductor.changeScreen(this.addRecordScreenModel, this.addRecordScreenRegion);
        this.addRecordInput = $('nav.app div.add-record-overlay input');

        this.preventSearchClose(this);
        this.preventAddRecordClose(this);
        this.preventThemeSettingsClose(this);
    };

    ApplicationMenuViewModel.prototype.toggleSearch = function applicationMenuViewModel_toggleSearch() {
        this.isSearchVisible(!this.isSearchVisible());
        if(this.isSearchVisible() === true) {
            this.isAddRecordVisible(false);
            this.isThemeSettingsVisible(false);
            this.searchInput.focus();
        }
    };

    ApplicationMenuViewModel.prototype.toggleAddRecord = function applicationMenuViewModel_toggleAddRecord() {
        this.isAddRecordVisible(!this.isAddRecordVisible());
        if (this.isAddRecordVisible() === true) {
            this.isSearchVisible(false);
            this.isThemeSettingsVisible(false);
            this.addRecordInput.focus();
        }
    };

    ApplicationMenuViewModel.prototype.toggleThemeSettings = function applicationMenuViewModel_toggleThemeSettings() {
        this.isThemeSettingsVisible(!this.isThemeSettingsVisible());
        if (this.isThemeSettingsVisible() === true) {
            this.isAddRecordVisible(false);
            this.isSearchVisible(false);
            //this.searchInput.focus();
        }
    };

    ApplicationMenuViewModel.prototype.closeSearch = function applicationMenuViewModel_closeSearch() {
        if (this.isSearchVisible() === true && this.hideSearch === true) {
            this.toggleSearch();
        }
    };

    ApplicationMenuViewModel.prototype.closeAddRecord = function applicationMenuViewModel_closeAddRecord() {
        if (this.isAddRecordVisible() === true && this.hideAddRecord === true) {
            this.toggleAddRecord();
        }
    };
    ApplicationMenuViewModel.prototype.closeThemeSettings = function applicationMenuViewModel_ThemeSettings() {
        if (this.isThemeSettingsVisible() === true && this.hideThemeSettings === true) {
            this.toggleThemeSettings();
        }
    };

    ApplicationMenuViewModel.prototype.preventSearchClose = function (self) {
        var searchObjs = $('nav.app div.search-overlay, nav.app a.search-icon'),
            searchOverlay = $('nav.app div.search-overlay');

        searchObjs.on('touchstart', self, onSearchTouchStart);
        searchObjs.on('mouseover', self, onSearchMouseOver);
        searchObjs.on('mouseleave', self, onSearchMouseLeave);

        searchOverlay.on('click', self, onSearchOverlayClick);
        searchOverlay.on('mouseleave', 'mi-select', self, onSearchOverlaySelectMouseLeave);
    };

    ApplicationMenuViewModel.prototype.preventThemeSettingsClose = function (self) {
        var themeSettingsObjs = $('nav.app div.themeSettings-overlay, nav.app a.search-icon'),
            themeSettingsOverlay = $('nav.app div.themeSettings-overlay');

        themeSettingsObjs.on('touchstart', self, onThemeSettingsTouchStart);
        themeSettingsObjs.on('mouseover', self, onThemeSettingsMouseOver);
        themeSettingsObjs.on('mouseleave', self, onThemeSettingsMouseLeave);
        themeSettingsOverlay.on('click', self, onThemeSettingsOverlayClick);
    };

    ApplicationMenuViewModel.prototype.preventAddRecordClose = function (self) {
        var addRecordObjs = $('nav.app div.add-record-overlay, nav.app a.add-record-icon'),
            addRecordOverlay = $('nav.app div.add-record-overlay');

        addRecordObjs.on('touchstart', self, onAddRecordTouchStart);
        addRecordObjs.on('mouseover', self, onAddRecordMouseOver);
        addRecordObjs.on('mouseleave', self, onAddRecordMouseLeave);

        addRecordOverlay.on('click', self, onAddRecordOverlayClick);
    };

    ApplicationMenuViewModel.prototype.openHelp = function () {
        // var helpScreen = new HelpScreen();
        // helpScreen.open();
        // this.isSearchVisible(false);
        // this.isAddRecordVisible(false);
        // this.isThemeSettingsVisible(false);
    };

    function onSearchTouchStart (e) {
        var self = e.data;
        self.hideSearch = false;
        self.hideAddRecord = true;
        self.hideThemeSettings = true;
    }

    function onSearchMouseOver (e) {
        e.data.hideSearch = false;
    }

    function onSearchMouseLeave (e) {
        e.data.hideSearch = true;
    }

    function onSearchOverlayClick (e) {
        if (e.target.tagName === 'A' && e.target.hasAttribute('target')) {
            e.data.hideSearch = true;
        }
    }

    function onSearchOverlaySelectMouseLeave (e) {
        e.stopPropagation();
        e.data.hideSearch = false;
    }

    function onAddRecordTouchStart (e) {
        var self = e.data;
        self.hideSearch = true;
        self.hideAddRecord = false;
    }

    function onAddRecordMouseOver (e) {
        e.data.hideAddRecord = false;
    }

    function onAddRecordMouseLeave (e) {
        e.data.hideAddRecord = true;
    }

    function onAddRecordOverlayClick (e) {
        if (e.target.tagName === 'A') {
            e.data.hideAddRecord = true;
        }
    }

    function onThemeSettingsTouchStart (e) {
        var self = e.data;
        self.hideSearch = true;
        self.hideAddRecord = true;
        self.hideThemeSettings = false;
    }

    function onThemeSettingsMouseOver (e) {
        e.data.hideThemeSettings = false;
    }

    function onThemeSettingsMouseLeave(e) {
        e.data.hideThemeSettings = true;
    }

    function onThemeSettingsOverlayClick(e) {
        if (e.target.tagName === 'A') {
            e.data.hideThemeSettings = true;
        }
    }
    return ApplicationMenuViewModel;
});
