define(function (require) {
    'use strict';

    var $ = require('jquery');


    require('system/lang/object');

    var AjaxClient = require('system/http/ajax-client');

    function ResultGridService(ajaxClient) {
        this.ajaxClient = ajaxClient;
        this.API_URL = 'meridium/api/core/command/query';
    }

    ResultGridService.dependsOn = [AjaxClient];

    //GET JSON Data
    ResultGridService.prototype.getData =
        function (queryObject) {          
            var deferred = $.Deferred(),
                path = this.API_URL;

            var queryObj = {
                "CommandText": queryObject.query,
                "Parameters": [],
                "StartRow": queryObject.startRow,
                "MaxRows": queryObject.maxRows
            };

            this.ajaxClient.post(path, queryObj).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err.statusText);
            });
            return deferred.promise();
        };
    return ResultGridService;
});