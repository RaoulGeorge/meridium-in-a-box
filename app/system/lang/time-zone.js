define(function (require) {
    'use strict';

    var moment = require('moment-timezone'),
        _private = require('system/lang/private'),
        invalidTimeZoneIdentifier = 'Invalid time zone identifier',
        expectedDate = 'Expected a date to be passed';

    // NOTE: Do not call the constructor directly!
    // Use the TimeZoneFactory, instead.
    function TimeZone(timeZoneId) {
        validateTimeZoneId(timeZoneId);
        _private(this).timeZoneId = timeZoneId;
    }

    function validateTimeZoneId(timeZoneId) {
        var zone = moment.tz.zone(timeZoneId);
        if (!zone) {
            throw (invalidTimeZoneIdentifier);
        }
    }

    var prototype = TimeZone.prototype;

    prototype.getTimeZoneId = function () {
        return _private(this).timeZoneId;
    };

    prototype.applyUtcOffset = function (dateValue) {
        var timeZoneId, timestamp, offset;

        validateDate(dateValue);
        timeZoneId = _private(this).timeZoneId;
        timestamp = toUtcTimestamp(dateValue);
        offset = -moment.tz.zone(timeZoneId).offset(timestamp);
        return applyOffset(offset, dateValue);
    };

    function toUtcTimestamp(dateValue) {
        return Date.UTC(
            dateValue.getFullYear(),
            dateValue.getMonth(),
            dateValue.getDate(),
            dateValue.getHours(),
            dateValue.getMinutes(),
            dateValue.getSeconds(),
            dateValue.getMilliseconds()
        );
    }

    function applyOffset(offset, dateValue) {
        dateValue.setMinutes(dateValue.getMinutes() + offset);
        return dateValue;
    }

    prototype.removeUtcOffset = function (dateValue) {
        var timeZoneId, timestamp, offset;
        validateDate(dateValue);
        timeZoneId = _private(this).timeZoneId;
        timestamp = toUtcTimestamp(dateValue);
        offset = moment.tz.zone(timeZoneId).parse(timestamp);
        return applyOffset(offset, dateValue);
    };

    function validateDate(dateValue) {
        if (!(dateValue instanceof Date)) { throw expectedDate; }
    }

    return TimeZone;
});