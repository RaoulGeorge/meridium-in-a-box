define(function(require) {
    'use strict';

    var $ = require('jquery'),
        CatalogService = require('catalog/services/catalog-service'),
        CatalogItemTypes = require('catalog/model/catalog-item-types');

    function CatalogPathResolver() {

    }

    CatalogPathResolver.prototype.getRoute = function(catalogPath) {
        var service = Object.resolve(CatalogService),
            dfd = $.Deferred();

        service.getCatalogItemByPath(catalogPath).done(getCatalogItem_done.bind(null, this, dfd));

        return dfd;
    };

    function getCatalogItem_done(self, dfd, catalogItem) {
        var catalogItemType = getCatalogItemType(catalogItem.itemType);

        dfd.resolve(getRouteString(self, catalogItemType, catalogItem.key));
    }

    function getRouteString(self, catalogItemType, key) {
        return catalogItemType + '/' + key;
    }

    function getCatalogItemType(typeNumber) {
        for (var i = 0; i < CatalogItemTypes.length; i++) {
            if (CatalogItemTypes[i].value === typeNumber) {
                return CatalogItemTypes[i].text.toLowerCase();
            }
        }
    }

    return CatalogPathResolver;
});