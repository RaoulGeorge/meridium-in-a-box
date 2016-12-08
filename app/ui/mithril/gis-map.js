define(function (require) {
    'use strict';

    var GISMapViewModel = require('./gis-map/gis-map-view-model'),
        GISMapView = require('./gis-map/gis-map-view');

    return {
        controller: GISMapViewModel,
        view: GISMapView
    };
});
