define(function(require) {
    'use strict';

    var _ = require('lodash'),
        ApplicationEvents = require('application/application-events'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ko = require('knockout'),
        LinearScale = require('system/drawing/linear-scale'),
        FixedMiddleScale = require('./fixed-middle-scale'),
        translator = Object.resolve(require('system/globalization/translator')),
        RANGE_ZONE = require('./range-zone'),
        parser = require('system/text/parser'),
        converter = require('system/lang/converter'),
        view = require('text!./health-bar-view.html');

    var INVALID_RANGE_CLASS = 'invalid-zone',
        NORMAL_RANGE_CLASS = 'normal-zone',
        WARNING_RANGE_CLASS = 'warning-zone',
        ALERT_RANGE_CLASS = 'alert-zone',
        IndicatorType = {
            CHARACTER: 'c',
            NUMERIC: 'n'
        };

    function HealthBarViewModel(){
        base.call(this, view);
        this.appEvents = Object.resolve(ApplicationEvents);
        this.translator = translator;
        this.componentSize = ko.observable(200);
        this.resizeCheckTimeout = null;

        this.latestValue = ko.observable();
        this.valueType = ko.observable(IndicatorType.NUMERIC);

        this.lowerLevel3 = ko.observable();
        this.lowerLevel2 = ko.observable();
        this.lowerLevel1 = ko.observable();
        this.upperLevel1 = ko.observable();
        this.upperLevel2 = ko.observable();
        this.upperLevel3 = ko.observable();

        this.lowerAlertZoneClass = ko.pureComputed(lowerAlertZoneClass_read.bind(null, this));
        this.lowerWarningZoneClass = ko.pureComputed(lowerWarningZoneClass_read.bind(null, this));
        this.normalZoneClass = ko.pureComputed(normalZoneClass_read.bind(null, this));
        this.upperWarningZoneClass = ko.pureComputed(upperWarningZoneClass_read.bind(null, this));
        this.upperAlertZoneClass = ko.pureComputed(upperAlertZoneClass_read.bind(null, this));

        this.valueFallsInRange = ko.pureComputed(valueFallsInRange_read.bind(null, this));
        this.valuePosition = ko.pureComputed(valuePosition_read.bind(null, this));

        this.valueIsOutOfBoundsLow = ko.pureComputed(valueIsOutOfBoundsLow_read.bind(null, this));
        this.valueIsOutOfBoundsHigh = ko.pureComputed(valueIsOutOfBoundsHigh_read.bind(null, this));
        this.valueIsOutOfBounds = ko.pureComputed(valueIsOutOfBounds_read.bind(null, this));

        this.noValueSet = ko.pureComputed(noValueSet_read.bind(null, this));
        this.healthBarClass = ko.pureComputed(healthBarClass_read.bind(null, this));
    }

    var base = Object.inherit(KnockoutViewModel, HealthBarViewModel);

    function appendHighlightClass(cssClass) {
        return (cssClass || '') + ' highlight';
    }

    function lowerAlertZoneClass_read(self) {
        var range = self.valueFallsInRange();

        if (self.valueType() === IndicatorType.CHARACTER) {
            if (range === RANGE_ZONE.LOWER_ALERT) {
                return appendHighlightClass(ALERT_RANGE_CLASS);
            }
            return ALERT_RANGE_CLASS;
        }

        if (!areAnyLimitsSet(self)) {
            return appendHighlightClass(INVALID_RANGE_CLASS);
        }
        if (!areAnyLowerLimitsSet(self)) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        if (isValueSet(self, self.lowerLevel2())) {
            if (range === RANGE_ZONE.LOWER_ALERT) {
                return appendHighlightClass(ALERT_RANGE_CLASS);
            }
            return ALERT_RANGE_CLASS;
        }
        if (isValueSet(self, self.lowerLevel1())) {
            if (range === RANGE_ZONE.LOWER_WARNING) {
                return appendHighlightClass(WARNING_RANGE_CLASS);
            }

            return WARNING_RANGE_CLASS;
        }

        if (isValueSet(self, self.lowerLevel3())) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        return INVALID_RANGE_CLASS;
    }
    function lowerWarningZoneClass_read(self) {
        var range = self.valueFallsInRange();

        if (self.valueType() === IndicatorType.CHARACTER) {
            if (range === RANGE_ZONE.LOWER_WARNING) {
                return appendHighlightClass(WARNING_RANGE_CLASS);
            }
            return WARNING_RANGE_CLASS;
        }

        if (!areAnyLimitsSet(self)) {
            return appendHighlightClass(INVALID_RANGE_CLASS);
        }
        if (!areAnyLowerLimitsSet(self)) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        if (isValueSet(self, self.lowerLevel1())) {
            if (range === RANGE_ZONE.LOWER_WARNING) {
                return appendHighlightClass(WARNING_RANGE_CLASS);
            }
            return WARNING_RANGE_CLASS;
        }

        if (range === RANGE_ZONE.NORMAL) {
            return appendHighlightClass(NORMAL_RANGE_CLASS);
        }
        return NORMAL_RANGE_CLASS;
    }
    function normalZoneClass_read(self) {
        var range = self.valueFallsInRange();

        if (self.valueType() === IndicatorType.CHARACTER) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        if (!areAnyLimitsSet(self)) {
            return appendHighlightClass(INVALID_RANGE_CLASS);
        }

        if (range === RANGE_ZONE.NORMAL) {
            return appendHighlightClass(NORMAL_RANGE_CLASS);
        }
        return NORMAL_RANGE_CLASS;
    }
    function upperWarningZoneClass_read(self) {
        var range = self.valueFallsInRange();

        if (self.valueType() === IndicatorType.CHARACTER) {
            if (range === RANGE_ZONE.UPPER_WARNING) {
                return appendHighlightClass(WARNING_RANGE_CLASS);
            }
            return WARNING_RANGE_CLASS;
        }

        if (!areAnyLimitsSet(self)) {
            return appendHighlightClass(INVALID_RANGE_CLASS);
        }
        if (!areAnyUpperLimitsSet(self)) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        if (isValueSet(self, self.upperLevel1())) {
            if (range === RANGE_ZONE.UPPER_WARNING) {
                return appendHighlightClass(WARNING_RANGE_CLASS);
            }
            return WARNING_RANGE_CLASS;
        }

        if (range === RANGE_ZONE.NORMAL) {
            return appendHighlightClass(NORMAL_RANGE_CLASS);
        }
        return NORMAL_RANGE_CLASS;
    }
    function upperAlertZoneClass_read(self) {
        var range = self.valueFallsInRange();

        if (self.valueType() === IndicatorType.CHARACTER) {
            if (range === RANGE_ZONE.UPPER_ALERT) {
                return appendHighlightClass(ALERT_RANGE_CLASS);
            }
            return ALERT_RANGE_CLASS;
        }

        if (!areAnyLimitsSet(self)) {
            return appendHighlightClass(INVALID_RANGE_CLASS);
        }
        if (!areAnyUpperLimitsSet(self)) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        if (isValueSet(self, self.upperLevel2())) {
            if (range === RANGE_ZONE.UPPER_ALERT) {
                return appendHighlightClass(ALERT_RANGE_CLASS);
            }
            return ALERT_RANGE_CLASS;
        }
        if (isValueSet(self, self.upperLevel1())) {
            if (range === RANGE_ZONE.UPPER_WARNING) {
                return appendHighlightClass(WARNING_RANGE_CLASS);
            }
            return WARNING_RANGE_CLASS;
        }

        if (isValueSet(self, self.upperLevel3())) {
            if (range === RANGE_ZONE.NORMAL) {
                return appendHighlightClass(NORMAL_RANGE_CLASS);
            }
            return NORMAL_RANGE_CLASS;
        }

        return INVALID_RANGE_CLASS;
    }

    function isValueSet(self, limitValue) {
        if (limitValue === null || limitValue === undefined || limitValue === '') {
            return false;
        }

        if (self.valueType() === IndicatorType.NUMERIC) {
            return !isNaN(limitValue);
        }
        
        return !!limitValue;
    }

    function areAnyLowerLimitsSet(self) {
        return _.any([self.lowerLevel3(),
                 self.lowerLevel2(),
                 self.lowerLevel1()], isValueSet.bind(null, self));
    }
    function areAnyUpperLimitsSet(self) {
        return _.any([self.upperLevel3(),
            self.upperLevel2(),
            self.upperLevel1()], isValueSet.bind(null, self));
    }
    function areAnyLimitsSet(self) {
        return areAnyLowerLimitsSet(self) || areAnyUpperLimitsSet(self);
    }

    function valueFallsInRange_read(self) {
        var isCharacter = self.valueType() === IndicatorType.CHARACTER,
            currentValue = self.latestValue(),
            lowerLevel3 = self.lowerLevel3(),
            lowerLevel2 = self.lowerLevel2(),
            lowerLevel1 = self.lowerLevel1(),
            upperLevel1 = self.upperLevel1(),
            upperLevel2 = self.upperLevel2(),
            upperLevel3 = self.upperLevel3();

        if (currentValue === undefined || currentValue === null || currentValue === '') {
            return RANGE_ZONE.INDETERMINATE;
        }

        if (isCharacter) {
            return checkRangesCharacter(
                currentValue,
                lowerLevel3,
                lowerLevel2,
                lowerLevel1,
                upperLevel1,
                upperLevel2,
                upperLevel3);
        }

        return checkRangesNumeric(
            self,
            currentValue,
            lowerLevel3,
            lowerLevel2,
            lowerLevel1,
            upperLevel1,
            upperLevel2,
            upperLevel3);
    }
    function checkRangesNumeric(self, currentValue, lowerLevel3, lowerLevel2, lowerLevel1, upperLevel1, upperLevel2, upperLevel3) {
        var isInRange = numericRangeComparison.bind(null, self, currentValue),
            areAnyUpperLimitsDefined = areAnyUpperLimitsSet(self),
            areAnyLowerLimitsDefined = areAnyLowerLimitsSet(self);


        if (self.valueIsOutOfBounds()) {
            return RANGE_ZONE.OUT_OF_BOUNDS;
        }

        if (isInRange(null, lowerLevel2)) {
            return RANGE_ZONE.LOWER_ALERT;
        }
        if (isInRange(lowerLevel2, lowerLevel1) && isValueSet(self, lowerLevel1)) {
            return RANGE_ZONE.LOWER_WARNING;
        }
        if (isInRange(lowerLevel1, upperLevel1) && isValueSet(self, upperLevel1)) {
            return RANGE_ZONE.NORMAL;
        }
        if (isInRange(upperLevel1, upperLevel2)) {
            if (!isValueSet(self, upperLevel1)) {
                return RANGE_ZONE.NORMAL;
            }
            return RANGE_ZONE.UPPER_WARNING;
        }
        if (isInRange(upperLevel2, null)) {
            return RANGE_ZONE.UPPER_ALERT;
        }

        if ((isValueSet(self, lowerLevel3) || isValueSet(self, lowerLevel2)) && !areAnyUpperLimitsDefined) {
            return RANGE_ZONE.NORMAL;
        }
        if ((isValueSet(self, upperLevel3) || isValueSet(self, upperLevel2)) && !areAnyLowerLimitsDefined) {
            return RANGE_ZONE.NORMAL;
        }

        if (areAnyLowerLimitsDefined && areAnyUpperLimitsDefined) {
            return RANGE_ZONE.NORMAL;
        }

        return RANGE_ZONE.INDETERMINATE;
    }
    function checkRangesCharacter(currentValue, lowerLevel3, lowerLevel2, lowerLevel1, upperLevel1, upperLevel2, upperLevel3) {
        if (currentValue === lowerLevel3 || currentValue === lowerLevel2) {
            return RANGE_ZONE.LOWER_ALERT;
        }
        if (currentValue === lowerLevel1) {
            return RANGE_ZONE.LOWER_WARNING;
        }

        if (currentValue === upperLevel1) {
            return RANGE_ZONE.UPPER_WARNING;
        }
        if (currentValue === upperLevel2 || currentValue === upperLevel3) {
            return RANGE_ZONE.UPPER_ALERT;
        }

        return RANGE_ZONE.NORMAL;
    }
    function numericRangeComparison(self, value, min, max) {
        var isInRange = true;

        if (value !== 0 && !value) {
            return false;
        }

        if (isValueSet(self, min) && value < min) {
            isInRange = false;
        }
        if (isValueSet(self, max) && value >= max) {
            isInRange = false;
        }

        if (!isValueSet(self, min) && !isValueSet(self, max)) {
            isInRange = false;
        }

        return isInRange;
    }

    function valuePosition_read(self) {
        var scale = getScale(self);
        return Math.round(scale.calculateInt(self.latestValue()));
    }
    function getScale(self) {
        var isNumeric = self.valueType() === IndicatorType.NUMERIC,
            min,
            max,
            offsetPixels,
            offsetPercent,
            overallSize = self.componentSize(),
            zoneWidthPixels,
            zoneWidthPercent,
            zone = self.valueFallsInRange();

        switch (zone) {
            case RANGE_ZONE.LOWER_ALERT:
                zoneWidthPercent = 0.20;
                offsetPercent = 0;
                min = self.lowerLevel3();
                max = self.lowerLevel2();
                break;
            case RANGE_ZONE.LOWER_WARNING:
                zoneWidthPercent = 0.15;
                offsetPercent = 0.20;
                min = self.lowerLevel2();
                max = self.lowerLevel1();

                if (isNumeric && !isValueSet(self, min)) {
                    zoneWidthPercent = 0.35;
                    offsetPercent = 0;

                    min = self.lowerLevel3();
                }
                break;
            case RANGE_ZONE.NORMAL:
                zoneWidthPercent = 0.30;
                offsetPercent = 0.35;
                min = self.lowerLevel1();
                max = self.upperLevel1();

                if (isNumeric && !isValueSet(self, min)) {
                    zoneWidthPercent += 0.15;
                    offsetPercent = 0.20;
                    min = self.lowerLevel2();

                    if (!isValueSet(self, self.lowerLevel2())) {
                        zoneWidthPercent += 0.20;
                        offsetPercent = 0;
                        min = self.lowerLevel3();
                    }
                }

                if (isNumeric && !isValueSet(self, max)) {
                    zoneWidthPercent += 0.15;
                    max = self.upperLevel2();

                    if (!isValueSet(self, self.upperLevel2())) {
                        zoneWidthPercent += 0.20;
                        max = self.upperLevel3();
                    }
                }

                break;
            case RANGE_ZONE.UPPER_WARNING:
                zoneWidthPercent = 0.15;
                offsetPercent = 0.65;
                min = self.upperLevel1();
                max = self.upperLevel2();

                if (isNumeric && !isValueSet(self, max)) {
                    zoneWidthPercent = 0.35;
                    max = self.upperLevel3();
                }
                break;
            case RANGE_ZONE.UPPER_ALERT:
                zoneWidthPercent = 0.20;
                offsetPercent = 0.80;
                min = self.upperLevel2();
                max = self.upperLevel3();
                break;
            default:
                zoneWidthPercent = 1.0;
                offsetPercent = 0.0;
                min = null;
                max = null;
        }

        zoneWidthPixels = overallSize * zoneWidthPercent;
        offsetPixels = overallSize * offsetPercent;

        if (shouldUseFixedScale(self, min, max)) {
            return new FixedMiddleScale([min, max], [offsetPixels, offsetPixels + zoneWidthPixels]);
        }

        return new LinearScale([min, max], [offsetPixels, offsetPixels + zoneWidthPixels]);
    }
    function shouldUseFixedScale(self, min, max) {
        return ((!isValueSet(self, min) || !isValueSet(self, max)) ||
            self.valueType() === IndicatorType.CHARACTER);
    }

    function valueIsOutOfBoundsLow_read(self) {
        var ll3 = self.lowerLevel3(),
            value = self.latestValue(),
            indicatorType = self.valueType();

        if (indicatorType === IndicatorType.NUMERIC) {
            if (isValueSet(self, ll3) && isValueSet(self, value) && value < ll3) {
                return true;
            }
        }

        return false;
    }
    function valueIsOutOfBoundsHigh_read(self) {
        var ul3 = self.upperLevel3(),
            value = self.latestValue(),
            indicatorType = self.valueType();

        if (indicatorType === IndicatorType.NUMERIC) {
            if (isValueSet(self, ul3) && isValueSet(self, value) && value > ul3) {
                return true;
            }
        }

        return false;
    }
    function valueIsOutOfBounds_read(self) {
        var isOOBLow = self.valueIsOutOfBoundsLow(),
            isOOBHigh = self.valueIsOutOfBoundsHigh();

        return isOOBLow || isOOBHigh;
    }

    function noValueSet_read(self) {
        return !isValueSet(self, self.latestValue());
    }
    function healthBarClass_read(self) {
        var isNumeric = self.valueType() === IndicatorType.NUMERIC,
            cssClass = [];

        if (self.noValueSet()) {
            cssClass.push('no-readings');
        }
        if (isNumeric && !areAnyLimitsSet(self)) {
            cssClass.push('no-limits');
        }
        if (self.valueType() === IndicatorType.CHARACTER) {
            cssClass.push('character');
        } else {
            cssClass.push('numeric');
        }

        return cssClass.join(' ');
    }

    HealthBarViewModel.prototype.attach = function(region) {
        this.region = region;
        base.prototype.attach.apply(this, arguments);
        updateComponentSize(this);

        this.appEvents.windowResized.add(this.windowResized, this);
        this.resizeCheckTimeout = setTimeout(checkForResize.bind(null, this), 500);
    };
    function updateComponentSize(self) {
        if (!self.region) {
            return 0;
        }

        var oldWidth = self.componentSize(),
            newWidth = Math.floor(self.region.$element.width() * 0.90);

        if (oldWidth !== newWidth) {
            self.componentSize(newWidth);
        }
    }
    function checkForResize(self) {
        updateComponentSize(self);

        self.resizeCheckTimeout = setTimeout(checkForResize.bind(null, self), 500);
    }
    HealthBarViewModel.prototype.windowResized = function() {
        updateComponentSize(this);
    };

    HealthBarViewModel.prototype.loadSettings = function(settingsStr) {
        if (!settingsStr) {
            return;
        }

        var settings = JSON.parse(settingsStr);

        this.valueType(settings.valueType);

        if (settings.valueType === IndicatorType.CHARACTER) {
            this.lowerLevel3(settings.lowerLevel3);
            this.lowerLevel2(settings.lowerLevel2);
            this.lowerLevel1(settings.lowerLevel1);
            this.upperLevel1(settings.upperLevel1);
            this.upperLevel2(settings.upperLevel2);
            this.upperLevel3(settings.upperLevel3);

            this.latestValue(settings.latestValue);
        } else {
            this.lowerLevel3(convertToNumberIfValid(this, settings.lowerLevel3));
            this.lowerLevel2(convertToNumberIfValid(this, settings.lowerLevel2));
            this.lowerLevel1(convertToNumberIfValid(this, settings.lowerLevel1));
            this.upperLevel1(convertToNumberIfValid(this, settings.upperLevel1));
            this.upperLevel2(convertToNumberIfValid(this, settings.upperLevel2));
            this.upperLevel3(convertToNumberIfValid(this, settings.upperLevel3));

            this.latestValue(convertToNumberIfValid(this, settings.latestValue));
        }
    };
    function convertToNumberIfValid(self, settingValue) {
        if (isValueSet(self, settingValue)) {
            return Number(settingValue);
        }
        return settingValue;
    }

    HealthBarViewModel.prototype.detach = function() {
        this.appEvents.windowResized.remove(this);
        this.debouncedResize = null;
        if (this.resizeCheckTimeout) {
            clearTimeout(this.resizeCheckTimeout);
        }
    };

    return HealthBarViewModel;
});