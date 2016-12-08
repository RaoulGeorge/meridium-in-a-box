define(function(require) {
    'use strict';

    var L = require('leaflet'),
        R = require('ramda'),
        _private = require('system/lang/private'),
        Event = require('system/lang/event'),
        BoundingBox = require('gis/models/bounding-box'),
        BoundingBoxSerializer = require('gis/serializers/leaflet/bounding-box-serializer'),
        PositionParser = require('gis/parsers/leaflet/position-parser'),
        BoundingBoxParser = require('gis/parsers/leaflet/bounding-box-parser'),
        LeafletSerializer = require('gis/serializers/leaflet/leaflet-serializer'),
        TileProvider = require('./tile-provider');

    var MAP_BOUNDARY = L.latLngBounds(L.latLng(-90, -540), L.latLng(90, 540)),
        DEFAULT_BOUNDS = L.latLngBounds(L.latLng(-60, 0), L.latLng(60, 0)),
        MAP_MIN_ZOOM = 2;

    function Map(options) {
        _private(this).leafletMap = null;
        _private(this).options = options;
        _private(this).leafletSerializer = new LeafletSerializer(options);
        _private(this).boundingBoxSerialzier = new BoundingBoxSerializer(options);
        _private(this).positionParser = new PositionParser();
        _private(this).boundingBoxParser = new BoundingBoxParser();
        _private(this).boundingBox = null;
        _private(this).tileProvider = new TileProvider(this);

        _private(this).position = null;
        _private(this).bounds = null;

        this.zoomed = new Event();
        this.moved = new Event();
    }

    var prototype = Map.prototype;

    //  prototype.getLeafletMap :: L.Map
    prototype.getLeafletMap = function () {
        return getLeafletMap(this);
    };

    //  getLeafletMap :: Map -> L.Map
    function getLeafletMap(self) {
        return _private(self).leafletMap;
    }

    //  prototype.attachToElement :: (HtmlElement, BasePosition, Number) -> L.Map
    prototype.attachToElement = function (element, initialPosition, initialZoomLevel) {
        var mapOptions = {
            maxBounds: MAP_BOUNDARY,
            minZoom: MAP_MIN_ZOOM
        };
        setLeafletMap(this, L.map(element, mapOptions));
        _private(this).tileProvider.load();
        initializeMapView(this, initialPosition, initialZoomLevel);
        getLeafletMap(this).on('zoomend', zoomed.bind(null, this));
        getLeafletMap(this).on('moveend', moved.bind(null, this));
        return getLeafletMap(this);
    };

    //  initializeMapView :: (Map, BasePosition, Number) -> L.Map
    function initializeMapView(self, initialPosition, initialZoomLevel) {
        if (initialPosition && initialZoomLevel) {
            getLeafletMap(self).setView(toLeafletPosition(initialPosition), initialZoomLevel);
        } else {
            getLeafletMap(self).fitBounds(DEFAULT_BOUNDS);
        }
        return getLeafletMap(self);
    }

    //  toLeafletPosition :: BasePosition -> L.LatLng
    function toLeafletPosition(position) {
        // We cannot use the Leaflet Serializer here because do not want to pick up styling or events.
        // We want a one-to-one conversion from a GeoPosition to a Leaflet LatLng
        return new L.latLng(position.getLatitude().valueOf(), position.getLongitude().getOverflowValue());
    }

    //  zoomed :: (Map, Event) -> L.Map
    function zoomed(self, e) {
        self.zoomed.raise(self, e.target.getZoom());
        return e.target;
    }

    //  moved :: (Map, Event) -> L.Map
    function moved(self, e) {
        var newPosition = parseLatLng(self, e.target.getCenter()),
            newBounds = parseLatLngBounds(self, e.target.getBounds()),
            positionChanged = !newPosition.equals(_private(self).position),
            boundsChanged = !newBounds.equals(_private(self).bounds);
        if (positionChanged || boundsChanged) {
            _private(self).position = newPosition;
            _private(self).bounds = newBounds;
            self.moved.raise(self, {
                position: newPosition,
                bounds: newBounds
            });
        }
        return e.target;
    }

    //  parseLatLng :: (Map, L.LatLng) -> BasePosition
    function parseLatLng(self, latLng) {
        return _private(self).positionParser.parse(latLng);
    }

    //  parseLatLngBounds :: (Map, L.LatLngBounds) -> BoundingBox
    function parseLatLngBounds(self, latLngBounds) {
        return _private(self).boundingBoxParser.parse(latLngBounds);
    }

    // setLeafletMap :: (Map, L.Map) -> Map
    function setLeafletMap(self, map) {
        _private(self).leafletMap = map;
        getOptions(self).setLeafletMap(map);
        return self;
    }

    //  getOptions :: Map -> Object
    function getOptions(self) {
        return _private(self).options;
    }

    //  prototype.updateAutoFit :: FeatureCollection -> Map
    prototype.updateAutoFit = function (featureCollection) {
        if (!hasMap(this)) { return; }  // updateAutoFit may fire after page is unloaded
        updateBoundingBox(this, featureCollection);
        fitMapToBoundingBox(this);
        return this;
    };

    //  hasMap :: Map -> Boolean
    function hasMap(self) {
        return !!self.hasLeafletMap();
    }

    //  updateBoundingBox :: (Map, FeatureCollection) -> BoundingBox
    function updateBoundingBox(self, featureCollection) {
        return setBoundingBox(self, BoundingBox.append(getBoundingBox(self), featureCollection));
    }

    //  getBoundingBox :: Map -> BoundingBox
    function getBoundingBox(self) {
        return _private(self).boundingBox;
    }

    //  setBoundingBox :: (Map, BoundingBox) -> BoundingBox
    function setBoundingBox(self, boundingBox) {
        _private(self).boundingBox = boundingBox;
        return _private(self).boundingBox;
    }

    //  fitMapToBoundingBox :: Map -> Map
    function fitMapToBoundingBox(self) {
        self.fitToBoundingBox(getBoundingBox(self));
        return self;
    }

    //  prototype.fitToBoundingBox :: BoundingBox -> L.Map
    prototype.fitToBoundingBox = function (boundingBox) {
        return getLeafletMap(this).fitBounds(toLeafletBounds(this, boundingBox));
    };

    //  toLeafletBounds :: (Map, BoundingBox) -> LatLngBounds
    function toLeafletBounds(self, boundingBox) {
        return _private(self).boundingBoxSerialzier.serialize(boundingBox);
    }

    //  prototype.addFeatureCollectionLayer :: FeatureCollection -> L.ILayer
    prototype.addFeatureCollectionLayer = function (featureCollection) {
        var layer = toLeafletLayer(this, featureCollection);
        return layer.addTo(this.getLeafletMap());
    };

    //  toLeafletLayer :: (Map, Geometry) -> L.ILayer
    function toLeafletLayer(self, geometry) {
        return _private(self).leafletSerializer.serialize(geometry);
    }

    //  prototype.clearLayers :: L.Map
    prototype.clearLayers = function () {
        var map = getLeafletMap(this),
            layers = map._layers;
        for (var id in layers) {
            if (layers.hasOwnProperty(id)) {
                if (isFeatureLayer(layers[id])) {
                    clearLayer(map, layers[id]);
                }
            }
        }
        return map;
    };

    function isFeatureLayer(layer) {
        if (!layer.options) { return false; }
        var hasSelectedEvent = !!layer.options.featureSelected,
            hasIcon = !!layer.options.icon;
        return hasSelectedEvent || hasIcon;
    }

    //  clearLayer :: L.Map -> L.ILayer -> L.ILayer
    var clearLayer = R.curry(function clearLayer(map, layer) {
        layer.clearAllEventListeners();
        map.removeLayer(layer);
        return layer;
    });

    //  prototype.dispose :: Map
    prototype.dispose = function () {
        this.zoomed.remove();
        this.moved.remove();
        getLeafletMap(this).off('zoomend');
        getLeafletMap(this).off('moveend');
        getLeafletMap(this).remove();
        setLeafletMap(this, null);
        return this;
    };

    //  prototype.hasLeafletMap :: Boolean
    prototype.hasLeafletMap = function () {
        return !!_private(this).leafletMap;
    };

    return Map;
});