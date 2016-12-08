define(function (require) {
    'use strict';

    var TimeZone = require('system/lang/time-zone'),
        Promise = require('bluebird');

    function fromIanaTimeZoneId(timeZoneId) {
        return Promise.resolve()
            .then(constructTimeZone.bind(null, timeZoneId))
            .catch(function (error) {
                throw error;
            });
    }

    function constructTimeZone(timeZoneId) {
        return new TimeZone(timeZoneId);
    }

    return {
        fromIanaTimeZoneId: fromIanaTimeZoneId
    };
});