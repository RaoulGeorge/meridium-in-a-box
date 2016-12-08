define(function(require) {
    'use strict';

    var _private = require('system/lang/private'),
        Forward = require('system/lang/forward'),
        mx = require('system/mithril/mithril-extensions'),
        Map = require('./map'),
        FeatureCollectionDiffer = require('./feature-collection-differ');

    function GISMapViewModel(attrs) {
        this.autofit = false;
        this.position = null;
        this.zoomlevel = null;
        this.bounds = null;
        this.featureCollection = null;
        this.onchange = null;
        this.onzoom = null;
        this.onmove = null;
        this.setState(attrs);
        _private(this).map = new Map(attrs.options);
        _private(this).differ = new FeatureCollectionDiffer();
    }

    var prototype = GISMapViewModel.prototype;

    prototype.setState = function (attrs) {
        this.autofit = attrs.autofit || false;
        this.position = attrs.position;
        this.zoomlevel = attrs.zoomlevel;
        this.featureCollection = attrs.featureCollection;
        this.onzoom = attrs.onzoom;
        this.onmove = attrs.onmove;
    };

    prototype.attachMapToElement = function (element) {
        getMap(this).zoomed.add(mapZoomed.bind(null, this), this);
        getMap(this).moved.add(mapMoved.bind(null, this), this);
        getMap(this).attachToElement(element, this.position, this.zoomlevel);
    };

    function mapZoomed(self, map, zoomlevel) {
        self.zoomlevel = zoomlevel;
        onZoomChange(self);
    }

    function onZoomChange(self) {
        if (!self.onzoom) { return; }
        self.onzoom(mx.event(self));
    }

    function mapMoved(self, map, args) {
        self.position = args.position;
        self.bounds = args.bounds;
        //self.position = [center.lng, center.lat];
        onMapMoved(self);
    }

    function onMapMoved(self) {
        if (!self.onmove) { return; }
        self.onmove(mx.event(self, {
            position: self.position,
            bounds: self.bounds
        }));
    }

    prototype.updateMap = function () {
        if (!hasFeatureCollection(this)) { return; }
        if (!hasMap(this)) { return; }
        detectFeatureCollectionChange(this);
        drawIfNewFeatures(this);
    };

    function hasFeatureCollection(self) {
        return !!self.featureCollection;
    }

    function hasMap(self) {
        return getMap(self).hasLeafletMap();
    }

    function detectFeatureCollectionChange(self) {
        var differ = getDiffer(self);
        if (differ.isNewFeatureCollection(self.featureCollection)) {
            differ.setFeatureCollection(self.featureCollection);
            getMap(self).clearLayers();
        }
    }

    function getDiffer(self) {
        return _private(self).differ;
    }

    function drawIfNewFeatures(self) {
        var newFeatures = getDiffer(self).diff(self.featureCollection);
        if (newFeatures.length()) {
            getMap(self).addFeatureCollectionLayer(newFeatures);
            if (self.autofit) {
                getMap(self).updateAutoFit(newFeatures);
            }
        }
    }

    function getMap(self) {
        return _private(self).map;
    }

    prototype.dispose = function () {
        getMap(this).zoomed.remove(this);
        getMap(this).moved.remove(this);
        getMap(this).dispose();
    };

    prototype.isFirstDraw = Forward.toMethod('isFirstDraw', getDiffer);

    return GISMapViewModel;
});
