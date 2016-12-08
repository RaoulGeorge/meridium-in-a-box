define(function(require) {
    'use strict';

    var $ = require('jquery'),
        Assert = require('mi-assert'),
        _private = require('system/lang/private'),
        ProviderAdapter = require('gis/providers/provider-adapter'),
        GisConfigService = require('gis/configuration/services/gis-config-service');
    require('leaflet-providers');

    function TileProvider(map) {
        _private(this).map = map;
        this.gisConfigService = Object.resolve(GisConfigService);
    }

    var prototype = TileProvider.prototype;

    prototype.load = function () {
        getGisProvider(this).done(getGisProvider_done.bind(null, this));
    };

    function getGisProvider(self) {
        var dfd = $.Deferred();
        self.gisConfigService.getConfig().done(getConfig_done.bind(null, self, dfd));
        return dfd.promise();
    }

    function getConfig_done(self, dfd, data) {
        dfd.resolve(data);
    }

    function getGisProvider_done(self, data) {
        for(var i = 0; i < data.gisConfigurations.length; i++) {
            var provider = data.gisConfigurations[i].gisProvider,
                authenticationString = data.gisConfigurations[i].gisAuthenticationString,
                customUrl = data.gisConfigurations[i].gisCustomUrl,
                providerAdapter = new ProviderAdapter(getMap(self).getLeafletMap(), provider, authenticationString, customUrl);

            providerAdapter.setTileProvider();
        }
    }

    function getMap(self) {
        return _private(self).map;
    }

    return TileProvider;
});