define(function (require) {
    'use strict';

    var _ = require('lodash');
    var KnockoutViewModel = require('./knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        ErrorNotificationHandler = require('logging/error-notification-handler');

    function ManagedViewModel(view, changeTrackerCallback) {
        Object.abstractClass(this, ManagedViewModel);
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager, changeTrackerCallback || _.noop);
        this.translator = Object.resolve(Translator);
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
        this.region = null;
    }

    var base = Object.inherit(KnockoutViewModel, ManagedViewModel);

    ManagedViewModel.prototype.attach = function (region) {
        Object.tryMethod(this, 'beforeAttach', region);
        base.prototype.attach.call(this, region);
        this.region = region;
        Object.tryMethod(this, 'afterAttach', region);
    };

    ManagedViewModel.prototype.detach = function (region) {
        Object.tryMethod(this, 'beforeDetach', region);
        base.prototype.detach.call(this, region);
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
        this.region = null;
        Object.tryMethod(this, 'afterDetach', region);
    };

    ManagedViewModel.prototype.unload = function () {
        Object.tryMethod(this, 'beforeUnload');
        this.kom.dispose();
        Object.tryMethod(this, 'afterUnload');
    };

    ManagedViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    ManagedViewModel.prototype.reportError = function (error, logger, code) {
        if (logger) {
            logger.error(error.stack);
        }
        this.errorNotificationHandler.addError({
            errorCode: code || null,
            errorMessage: error.message,
            errorDetail: error.stack
        });
    };

    return ManagedViewModel;
});