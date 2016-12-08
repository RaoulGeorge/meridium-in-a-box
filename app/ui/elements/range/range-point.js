define(function(require) {
    'use strict';

    var ko = require('knockout'),
        SLIDE_HANDLE_SIZE = 24;

    function RangePoint(config) {
        config = config || {};

        this.barColorBefore = ko.observable(ko.unwrap(config.barColorBefore));
        this.barColorAfter = ko.observable(ko.unwrap(config.barColorAfter));
        this.allowCrossPoints = ko.observable(ko.unwrap(config.allowCrossPoints === true));

        this.color = ko.observable(ko.unwrap(config.color));
        this.cssClass = ko.observable(ko.unwrap(config.cssClass));

        this.name = ko.observable(ko.unwrap(config.name));
        this.value = ko.observable(ko.unwrap(config.value));

        this.landscape = ko.observable(ko.unwrap(config.landscape));

        this.position = ko.observable(ko.unwrap(config.position));
        this.handlePosition = ko.pureComputed(handlePosition_read.bind(null, this));

        this.zIndex = ko.observable(config.zIndex || 1);
    }

    /**
    * Handle position is offset by half its width so that the middle of the handle 
    * lines up with the start/end of the bar and the color ranges if defined.
    */
    function handlePosition_read(self) {
        var value = self.position() - Math.floor(SLIDE_HANDLE_SIZE / 2);

        //if (self.landscape()) {
        //    value = value * -1;
        //}

        return value + 'px';
    }

    RangePoint.prototype.getTransform = function(isLandscape) {
        var transform = 'translate(' + (isLandscape ? this.handlePosition() : '0px') +
            ', ' + (!isLandscape ? this.handlePosition() : '0px') + ')';

        return transform;
    };

    RangePoint.prototype.getLabelTransform = function (isLandscape) {
        var position = this.position() - SLIDE_HANDLE_SIZE,
            transform = 'translate(' + (isLandscape ? position + 'px' : '0px') +
            ', ' + (!isLandscape ? position + 'px' : '0px') + ')';

        return transform;
    };

    return RangePoint;
});