define(function (require) {
    'use strict';

    var $ = require('jquery');


    var AjaxClient = require('system/http/ajax-client');
        

    function LoggerService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    LoggerService.dependsOn = [AjaxClient];

    
    
    
    LoggerService.prototype.getlogs = function () {
        
        var logs = [
     { "fileName": "ErrorLog", "number": "1", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "fileName": "ErrorLog", "number": "2", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "fileName": "ErrorLog", "number": "3", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "fileName": "ErrorLog", "number": "4", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "fileName": "ErrorLog", "number": "5", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "fileName": "ErrorLog", "number": "6", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) }
        ];

        return logs;
    };

    LoggerService.prototype.getErrorById = function (id) {

        
        var people = [
     { "id": "1", "errorName": "Bad request", "errorCode": "400", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "id": "2", "errorName": "Unauthorized", "errorCode": "401", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "id": "3", "errorName": "PaymentRequired ", "errorCode": "402", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "id": "4", "errorName": "Forbidden", "errorCode": "403", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "id": "5", "errorName": "Not found", "errorCode": "404", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
     { "id": "6", "errorName": "Internal Error", "errorCode": "500", "date": getdateinmmddyyformat(), "time": formatAMPM(new Date()) },
        ];

        
        
        var result = $.grep(people, function (e)
        {
           
            return e.id === id.logId;
         

        });

        return result;
    };

    function getdateinmmddyyformat() {
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

    return LoggerService;
});