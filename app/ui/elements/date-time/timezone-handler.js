define(function (require) {
    'use strict';

    var TzFactory = require('system/lang/time-zone-factory');
    var ApplicationContext = require('application/application-context');
    var Promise = require('bluebird');

    function TimezoneHandler() {
        this.timezone = null;
    }
    TimezoneHandler.singleton = true;
    var prototype = TimezoneHandler.prototype;

    prototype.getTimezone = function () {
        var self = this, getTimezone;
        if (self.timezone) {
            return Promise.resolve(setTimezone(self, self.timezone))
                    .catch(throwErr);
        } else {
            getTimezone = TzFactory.fromIanaTimeZoneId(ApplicationContext.user.ianaTimezoneId);

            return Promise.resolve(getTimezone)
                .catch(throwErr)
                .then(setTimezone.bind(null, self))
                .catch(throwErr);
        }
    };

    prototype.getUserTzDate = function (dateValue) {
        var self = this, getTimezone;

        if (self.timezone) {
            return Promise.resolve(getTimezoneDate(self, dateValue))
                    .catch(throwErr);
        } else {
            getTimezone = TzFactory.fromIanaTimeZoneId(ApplicationContext.user.ianaTimezoneId);

            return Promise.resolve(getTimezone)
                .catch(throwErr)
                .then(setTimezone.bind(null, self))
                .then(getTimezoneDate.bind(null, self, dateValue))
                .catch(throwErr);
        }
    };

    function setTimezone(self, timezone) {
        self.timezone = timezone;
        return timezone;
    }

    function getTimezoneDate(self, dateValue) {
        return self.timezone.applyUtcOffset(dateValue);
    }

    function throwErr(message) {
        throw message;
    }
    return TimezoneHandler;
});

