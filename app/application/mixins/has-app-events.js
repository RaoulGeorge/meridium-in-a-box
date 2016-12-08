define(function(require) {
    'use strict';

    var R = require('ramda'),
        Event = require('system/lang/event'),
        ApplicationEvents = require('application/application-events'),
        Mixin = require('system/lang/mixin'),
        _private = require('system/lang/private');

    function HasAppEvents() {
        _private(this).appEvents = Object.resolve(ApplicationEvents);
    }

    HasAppEvents.prototype.getAppEvents = function () {
        return _private(this).appEvents;
    };

    HasAppEvents.prototype.setApplicationTitle = function (title) {
        this.getAppEvents().titleChanged.raise(title, this);
    };

    HasAppEvents.prototype.reportError = function (error, logger) {
        if (logger) {
            logger.error(error.stack);
        }
        this.getAppEvents().errorOccured.raise(this, {
            code: error.name || '',
            message: error.message,
            detail: error.stack || ''
        });
    };

    HasAppEvents.prototype.removeFromAppEvents = function () {
        R.forEach(remove(this), events(this));
    };

    var remove = R.invoker(1, 'remove');

    function events(self) {
        var propertyValues = values(self.getAppEvents());
        return R.filter(R.is(Event), propertyValues);
    }

    function values(object) {
        return R.props(R.keys(object), object);
    }

    HasAppEvents.prototype.navigate = function (url, options) {
        this.getAppEvents().navigate.raise(url, options);
    };

    return Mixin.create(HasAppEvents);
});