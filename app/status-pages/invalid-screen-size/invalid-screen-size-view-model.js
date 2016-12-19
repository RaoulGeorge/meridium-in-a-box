define(function (require) {
    'use strict';

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        ResizeWatcher = require('ui/elements/grid-layout/resize-watcher'),
        ScreenSize = require('ui/screen-size'),
        UrlManager = require('spa/url-manager'),
        view = require('text!./views/invalid-screen-size.html'),
        Translator = require('system/globalization/translator');

    function InvalidScreenSizeViewModel(appEvents) {
        base.call(this, view);
        this.translator = Object.resolve(Translator);
        this.resizeWatcher = Object.resolve(ResizeWatcher);
        this.screenSize = Object.resolve(ScreenSize);
        this.urlManager = Object.resolve(UrlManager);
        this.titleChanged = appEvents.titleChanged;
        this.iconChanged = appEvents.iconChanged;
        this.isSmallScreenAllowed = false;
        this.usingInvalidScreenSizeRoute = false;
    }

    InvalidScreenSizeViewModel.dependsOn = [ApplicationEvents];

    var base = Object.inherit(KnockoutViewModel, InvalidScreenSizeViewModel);

    InvalidScreenSizeViewModel.prototype.open = function InvalidScreenSizeViewModel_open() {
        this.titleChanged.raise(this.translator.translate('INVALID_SCREEN_SIZE'), this);
    };

    InvalidScreenSizeViewModel.prototype.attach = function (region) {
        base.prototype.attach.call(this, region);
        if (!this.usingInvalidScreenSizeRoute) {
            this.resizeWatcher.sizeChanged.add(checkForReload, null, this);
            this.resizeWatcher.watch(document.querySelector('#shell-screen'));
            checkForReload(this);
        }
    };

    function checkForReload(self) {
        var tryReload = !isScreenTooSmall(self);
        if (tryReload) {
            self.resizeWatcher.stop();
            self.urlManager.refresh();
        }
    }

    function isScreenTooSmall(self) {
        if (self.isSmallScreenAllowed) {
            return self.screenSize.isTooSmallForAllPages();
        } else {
            return self.screenSize.isTooSmallForSomePages();
        }
    }

    InvalidScreenSizeViewModel.prototype.detach = function (region) {
        if (!this.usingInvalidScreenSizeRoute) {
            this.resizeWatcher.stop();
            this.resizeWatcher.sizeChanged.remove(this);
        }
        base.prototype.detach.call(this, region);
    };

    InvalidScreenSizeViewModel.prototype.translateText = function InvalidScreenSizeViewModel_translateText(key) {
        return this.translator.translate(key);
    };

    return InvalidScreenSizeViewModel;
});