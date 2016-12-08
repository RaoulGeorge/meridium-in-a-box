define(function (require) {
    'use strict';

    var $ = require('jquery');


    
    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        Event = require('system/lang/event');

    var errorsLog = [];

    function ErrorNotificationHandler() {
        base.call(this);
        
    }

    var base = Object.inherit(KnockoutViewModel, ErrorNotificationHandler);

    ErrorNotificationHandler.prototype.addError = function addError(log) {
        //Add error to log   
        if (log) {
            log.errorCode = log.errorCode || "";
            log.errorMessage = log.errorMessage || "";
            log.errorDetail = log.errorDetail || "";
            log.date = log.date || getDateInMMDDYYFormat();
            log.time = log.time || formatAMPM(new Date());
        }
       
    };

    ErrorNotificationHandler.prototype.getErrorsLog = function getErrorsLog(message, title) {

        return errorsLog;
    };

    ErrorNotificationHandler.prototype.getErrorById = function getErrorById(id) {


        var result = $.grep(errorsLog, function (e) {

            return e.number === parseInt(id.logId);


        });

        return result;
    };


    function getDateInMMDDYYFormat() {
        var date = new Date(),

             dateString = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear().toString().substr(2, 2);

        return dateString;
    }

    function formatAMPM(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    ErrorNotificationHandler.singleton = true;

    return  ErrorNotificationHandler;
});