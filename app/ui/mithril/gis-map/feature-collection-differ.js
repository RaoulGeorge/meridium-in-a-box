define(function(require) {
    'use strict';

    var Assert = require('mi-assert'),
        _private = require('system/lang/private'),
        FeatureCollection = require('gis/models/feature-collection');
    
    function FeatureCollectionDiffer() {
        _private(this).drawnFeatureCount = 0;
        _private(this).drawnFeatureCollection = null;
    }
    
    var prototype = FeatureCollectionDiffer.prototype;

    prototype.isFirstDraw = function () {
        return getFeatureCount(this) === 0;
    };

    function getFeatureCount(self) {
        return _private(self).drawnFeatureCount;
    }

    prototype.setFeatureCollection = function (featureCollection) {
        Assert.instanceOf(featureCollection, FeatureCollection, 'featureCollection');
        _private(this).drawnFeatureCollection = featureCollection;
        setFeatureCount(this, 0);
    };

    function setFeatureCount(self , value) {
        Assert.isNumber(value, 'value');
        _private(self).drawnFeatureCount = value;
    }

    prototype.isNewFeatureCollection = function (featureCollection) {
        Assert.instanceOf(featureCollection, FeatureCollection, 'featureCollection');
        return featureCollection !== getFeatureCollection(this);
    };

    function getFeatureCollection(self) {
        return _private(self).drawnFeatureCollection;
    }

    prototype.diff = function (featureCollection) {
        Assert.instanceOf(featureCollection, FeatureCollection, 'featureCollection');
        var newFeatureCollection,
            featureCount = getFeatureCount(this);
        if (noDifference(this, featureCollection)) {
            newFeatureCollection = new FeatureCollection();
        } else if (featureCount > 0) {
            newFeatureCollection = featureCollection.slice(featureCount - 1);
        } else {
            newFeatureCollection = featureCollection;
        }
        setFeatureCount(this, featureCollection.length());
        return newFeatureCollection;
    };

    function noDifference(self, featureCollection) {
        return getFeatureCount(self) === featureCollection.length();
    }
    
    return FeatureCollectionDiffer;
});