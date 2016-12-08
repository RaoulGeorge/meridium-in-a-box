define(function(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        formatter = Object.resolve(require('system/text/formatter')),
        LinearScale = require('system/drawing/linear-scale'),
        RangePoint = require('./range-point'),
        Event = require('system/lang/event'),
        view = require('text!./view.html!strip');

    require('system/lang/object');

    var SLIDE_HANDLE_DEFAULT_COLOR = '#CCC',
        RANGE_BAR_DEFAULT_COLOR = '#CCC';

    function RangeViewModel() {
        base.call(this, view);
        this.appEvents = Object.resolve(ApplicationEvents);

        this.min = ko.observable(0);
        this.max = ko.observable(100);
        this.step = ko.observable();

        this.barStartColor = ko.observable(RANGE_BAR_DEFAULT_COLOR);
        this.barEndColor = ko.observable(RANGE_BAR_DEFAULT_COLOR);

        this.region = null;
        this.componentSize = ko.observable(200);
        this.valueFormat = ko.observable('n0');

        this.value = ko.observable();
        this.points = ko.pureComputed(points_read.bind(null, this));

        this.landscape = ko.observable(true);
        this.landscape.subscribe(updateComponentSize.bind(null, this));
        this.barGradient = ko.pureComputed(barGradient_read.bind(null, this));

        this.rtl = ko.observable(false);
        this.scale = ko.computed(scale_read.bind(null, this));
        this.scale.subscribe(scale_changed.bind(null, this));
        this.nextZIndex = 2;

        this.dragData = null;
        this.rangeBarClicked = new Event();
        this.afterPointMoved = new Event();
    }

    var base = Object.inherit(KnockoutViewModel, RangeViewModel);

    // returns either the width or height of the component (depending on orientation)
    function updateComponentSize(self) {
        if (!self.region) {
            return 0;
        }

        var size = self.landscape() ? self.region.$element.width() : self.region.$element.height();
        self.componentSize(size);
    }

    function scale_read(self) {
        var min = self.min(),
            max = self.max(),
            size = self.componentSize();

        if (shouldReverseScale(self)) {
            return new LinearScale([max, min], [0, size]);
        } else {
            return new LinearScale([min, max], [0, size]);
        }
    }
    function shouldReverseScale(self) {
        var landscape = self.landscape(),
            rtl = self.rtl();

        return (rtl && landscape) || (!rtl && !landscape);
    }

    function barGradient_read(self) {
        if (shouldReverseScale(self)) {
            return buildGradientStringBackward(self);
        }

        return buildGradientStringForward(self);
    }
    function buildGradientStringForward(self) {
        var color = self.barStartColor() || RANGE_BAR_DEFAULT_COLOR,
            direction = self.landscape() ? 'to right, ' : '',
            gradient = 'linear-gradient(' + direction + color;

        _.each(self.points(), function(point) {

            if (point.barColorBefore()) {
                color = point.barColorBefore();
                gradient += ', ' + color + ' ' + point.position() + 'px';
            }

            if (point.barColorAfter()) {
                color = point.barColorAfter();
                gradient += ', ' + color + ' ' + point.position() + 'px';
            }

        });

        color = self.barEndColor() ? self.barEndColor() : RANGE_BAR_DEFAULT_COLOR;
        gradient += ', ' + color + ')';

        return gradient;
    }
    function buildGradientStringBackward(self) {
        // builds a css gradient string starting from the end of the bar and working back to the start
        var color = self.barEndColor() || RANGE_BAR_DEFAULT_COLOR,
            direction = self.landscape() ? 'to right, ' : '',
            gradient = 'linear-gradient(' + direction + color,
            points;

        points = self.points().slice(0).reverse();

        _.each(points, function(point) {
            if (point.barColorAfter()) {
                color = point.barColorAfter();
                gradient += ', ' + color + ' ' + point.position() + 'px';
            }

            if (point.barColorBefore()) {
                color = point.barColorBefore();
                gradient += ', ' + color + ' ' + point.position() + 'px';
            }

        });

        color = self.barStartColor() ? self.barStartColor() : RANGE_BAR_DEFAULT_COLOR;
        gradient += ', ' + color + ')';

        return gradient;
    }

    function scale_changed(self, newScale) {
         _.each(self.points(), function(point) {
            point.position(newScale.calculate(point.value()));
        });
    }

    function points_read(self) {
        if (!self.value()) {
            return [];
        }

        return _.map(self.value(), mapPoint.bind(null, self));
    }

    function mapPoint(self, point) {
        var pointConfig = {
            color: SLIDE_HANDLE_DEFAULT_COLOR,
            landscape: self.landscape()
        };

        if (_.isObject(point)) {
            pointConfig = $.extend(pointConfig, point);
        } else if (!isNaN(point)) {
            pointConfig.value = point;
        } else {
            pointConfig.value = self.min();
        }

        pointConfig.value = parseFloat(pointConfig.value);

        if (pointConfig.value < parseFloat(self.min())) {
            pointConfig.value = parseFloat(self.min());
        }

        if (pointConfig.value > parseFloat(self.max())) {
            pointConfig.value = parseFloat(self.max());
        }

        pointConfig.position = self.scale().calculate(pointConfig.value);

        return new RangePoint(pointConfig);
    }

    RangeViewModel.prototype.attach = function(region) {
        this.region = region;
        updateComponentSize(this);
        base.prototype.attach.apply(this, arguments);

        this.debouncedResize = _.debounce(this.windowResized.bind(this), 250);
        this.appEvents.windowResized.add(this.debouncedResize, this);
    };

    RangeViewModel.prototype.windowResized = function() {
        updateComponentSize(this);
    };

    RangeViewModel.prototype.detach = function() {
        this.appEvents.windowResized.remove(this);
    };

    RangeViewModel.prototype.onBarClicked = function(rangeViewModel, event) {
        var positionClicked = this.landscape() ? event.offsetX : event.offsetY,
            valueAtPosition = this.scale().calculateInverse(positionClicked);

        valueAtPosition = snapValueToStepIncrement(this.step(), valueAtPosition);
        this.rangeBarClicked.raise(valueAtPosition);
    };

    RangeViewModel.prototype.onPointDragStart = function(rangePoint, event) {
        var index = _.indexOf(this.points(), rangePoint),
            len = this.points().length;

        this.dragData = {
            index: index,
            previousPoint: _(this.points()).slice(0, index).where(pointsCannotCross).last(),
            nextPoint: _(this.points()).slice(index + 1).where(pointsCannotCross).first()
        };

        this.nextZIndex++;
        rangePoint.zIndex(this.nextZIndex);
    };

    function pointsCannotCross(point) {
        return !point.allowCrossPoints();
    }

    RangeViewModel.prototype.onPointMoved = function(rangePoint, event) {
        var delta = this.landscape() ? event.dx : event.dy,
            newValue = rangePoint.value() + (this.scale().calculateInverse(delta) - this.scale().inputRange[0]),
            newPosition;

        newValue = restrictValueToBarRange(this, newValue);
        newValue = restrictValueToSurroundingPoints(this, rangePoint, newValue);

        newPosition = this.scale().calculate(newValue);
        rangePoint.position(newPosition);
        rangePoint.value(newValue);
    };

    function restrictValueToBarRange(self, value) {
        if (value < self.min()) {
            value = self.min();
        } else if (value > self.max()) {
            value = self.max();
        }

        return value;
    }
    // ensure that this point hasn't been moved past other points around it
    function restrictValueToSurroundingPoints(self, rangePoint, value) {
        if (rangePoint.allowCrossPoints()) {
            return value;
        }

        value = restrictValueToSurroundingPoints_previousPoint(self, value);
        value = restrictValueToSurroundingPoints_nextPoint(self, value);

        return value;
    }
    function restrictValueToSurroundingPoints_previousPoint(self, value) {
        if (self.dragData.index > 0) {
            if (self.dragData.previousPoint) {
                if (value < self.dragData.previousPoint.value()) {
                    value = self.dragData.previousPoint.value();
                }
            }
        }
        return value;
    }
    function restrictValueToSurroundingPoints_nextPoint(self, value) {
        if (self.dragData.index < self.points().length - 1) {
            if (self.dragData.nextPoint) {
                if (value > self.dragData.nextPoint.value()) {
                    value = self.dragData.nextPoint.value();
                }
            }
        }
        return value;
    }

    RangeViewModel.prototype.onPointDragEnd = function(rangePoint, event) {
        var step = this.step(),
            newValue,
            newPosition;

        //rangePoint.zIndex(1);

        //Snap value to ranges defined by "step" value
        if (step) {
            newValue = snapValueToStepIncrement(step, rangePoint.value());
            newPosition = this.scale().calculate(newValue);
            rangePoint.position(newPosition);
            rangePoint.value(newValue);
        }

        this.afterPointMoved.raise(ko.toJS(rangePoint));

        this.dragData = null;
        updateControlValue(this);
    };

    function snapValueToStepIncrement(step, value) {
        var snappedValue = value;

        if (step) {
            snappedValue = Math.round(value / step) * step;
        }
        return snappedValue;
    }

    function updateControlValue(self) {
        var newValue = [];

        _.each(self.points(), function(point, index) {
            var val;

            /// need to match format of value in original array
            if (_.isObject(self.value()[index])) {
                //val = _.clone(self.value()[index]);
                val = self.value()[index];

                if (ko.isObservable(val.value)) {
                    val.value(point.value());
                } else {
                    val.value = point.value();
                }

                if (ko.isObservable(val.zIndex)) {
                    val.zIndex(point.zIndex());
                } else {
                    val.zIndex = point.zIndex();
                }

                newValue.push(val);
            } else {
                // if not an object should be just a number
                newValue.push(point.value());
            }
        });

        self.value(newValue);
    }

    RangeViewModel.prototype.formatValue = function(value) {
        return formatter.format(value, this.valueFormat());
    };

    RangeViewModel.prototype.getDisplayValue = function (value) {
        return this.formatValue(snapValueToStepIncrement(this.step(), value));
    };

    return RangeViewModel;
});