define(function (require) {
    'use strict';

    var $ = require('jquery');

    var hyperlinkDTO = require('./hyperlink-dto');

    var AjaxClient = require('system/http/ajax-client'),
        EntityDTO = require('platform/entity/services/dto/entity-dto'),
        CORE_ENTY_URL = 'meridium/api/core/entity',
        ASSOCIATEDPAGES_API_URL = 'meridium/api/core/entity/Urls/';

    function AssociatedPagesService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    AssociatedPagesService.dependsOn = [AjaxClient];

    AssociatedPagesService.prototype.getAssocPages = function AssociatedPagesService_getAssocPages(familykey) {

        var i;
        var path = ASSOCIATEDPAGES_API_URL + familykey,
               deferred = $.Deferred();
        this.ajaxClient.get(path)
            .done(function (result) {
                var mappedDTOs = [];

                for (i = 0; i < result.length; i++) {
                    mappedDTOs.push(new hyperlinkDTO(result[i]));
                }

                deferred.resolve(mappedDTOs);
            })
            .fail(function (err) {
                deferred.reject(err.responseText);
            });

        return deferred.promise();
    };

    AssociatedPagesService.prototype.getDataSheetDetails = function associatedPagesService_getDataSheetDetails(entityKey) {
        var dfd = $.Deferred();
        this.ajaxClient
            .get(CORE_ENTY_URL + '/' + entityKey)
            .done(function (data) {
                dfd.resolve(new EntityDTO(data));
            }).fail(function (response) {
                dfd.reject(response);
            });

        return dfd.promise();
    };

    return AssociatedPagesService;
});