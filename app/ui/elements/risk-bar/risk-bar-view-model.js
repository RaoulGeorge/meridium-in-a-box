define(function (require) {
    'use strict';

    var ko = require('knockout'),
        R = require('ramda'),
        _ = require('lodash'),
        $ = require('jquery'),
        CONTAINER_SELECTOR = '.risk-bar-container';

    function RiskBarViewModel (params, componentInfo) {
        this.width = params.width || '150px';
        this.isLogarithmic = params.isLogarithmic || false;
        this.min = 0.05;
        this.maxRiskRank = params.maxRiskRank;
        this.thresholds = params.thresholds;
        this.mitigated = params.mitigated;
        this.unmitigated = params.unmitigated;

        this.$container = $(componentInfo.element).children(CONTAINER_SELECTOR);
        this.$container.width(ko.unwrap(this.width));
        this.containerWidth = ko.observable(this.$container.width())
                                .extend({ rateLimit: 100 });
        this.boundWindowResized = windowResized.bind(null, this);
        $(window).on('resize', this.boundWindowResized);

        this.scaledMax = ko.computed(scaleValue.bind(null, this.maxRiskRank, this.isLogarithmic));
        this.scaledMin = scaleValue(this.min, this.isLogarithmic);

        this.scaledMitigated = ko.computed(computeScaledRisk.bind(null, this, this.mitigated));
        this.scaledUnmitigated = ko.computed(computeScaledRisk.bind(null, this, this.unmitigated));
        
        this.showUnmitigated = ko.pureComputed(computeShowUnmitigated.bind(null, this));
        this.showMitigated = ko.pureComputed(computeShowMitigated.bind(null, this));
        
        this.sizedThresholds = ko.pureComputed(computeSizedThresholds.bind(null, this));
        this.unmitigatedRiskMarginLeft = ko.computed(computeUnmitigatedRiskMarginLeft.bind(null, this));
        this.mitigatedRiskMarginLeft = ko.computed(computeMitigatedRiskMarginLeft.bind(null, this));
    }

    function windowResized(self) {
        self.containerWidth(self.$container.width());
    }

    function computeScaledRisk(self, risk) {
        var scaledRisk = scaleValue(risk, self.isLogarithmic, self.scaledMin);

        return Math.min(scaledRisk, self.scaledMax());
    }

    function computeUnmitigatedRiskMarginLeft(self) {
        return calcRiskMarginLeft(self.scaledMin, self.scaledMax(), self.scaledUnmitigated(), self.sizedThresholds());
    }

    function computeMitigatedRiskMarginLeft(self) {
        return calcRiskMarginLeft(self.scaledMin, self.scaledMax(), self.scaledMitigated(), self.sizedThresholds());
    }

    function gteValueProp(value) {
        return R.compose(R.gte(value), R.prop('leftBound'));
    }

    function calcRiskMarginLeft(min, max, risk, thresholds) {
        var leftOffset = calcRelativePercent(min, risk, max - min),
            threshIdx = R.findLastIndex(gteValueProp(risk), thresholds),
            threshold,
            pxOffset;

        if(threshIdx < 0) {
            return null;
        }

        threshold = thresholds[threshIdx];
        pxOffset = interpolate(threshold.leftOffset,
                               threshold.rightOffset,
                               threshold.leftBound,
                               threshold.rightBound,
                               risk);
                
        return calcPctPlusPx(leftOffset, pxOffset);
    }

    function calcPctPlusPx(pct, px) {
        return 'calc(' + pct + '% + ' + px + 'px)';
    }

    function interpolate(y0, y1, x0, x1, x) {
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }

    function computeShowUnmitigated(self) {
        return !isNaN(parseFloat(ko.unwrap(self.unmitigated)));
    }

    function computeShowMitigated(self) {
        return !isNaN(parseFloat(ko.unwrap(self.mitigated))) &&
               ko.unwrap(self.mitigated) < ko.unwrap(self.unmitigated);
    }

    function scaleValue(value, isLogarithmic, min) {
        var val = parseFloat(ko.unwrap(value)),
            scaled;

        min = min || Number.MIN_VALUE;

        if (ko.unwrap(isLogarithmic)) {
            scaled = Math.log(Math.max(val, 0)) / Math.LN10;
            if (scaled === -Infinity) {
                scaled = min;
            }
            return scaled;
        }
        return val;
    }
                
    //              x1      x2     
    //      |-------|-------|-------|
    //      |<--------length------->|
    function calcRelativePercent(x1, x2, length) {
        var percent = (x2 - x1) / length * 100;
        return Math.min(Math.max(percent, 0), 100);
    }

    function computeSizedThresholds(self) {
        var thresholds = ko.unwrap(self.thresholds);
        return calculateSegmentPlacement(thresholds, self.containerWidth(), self.scaledMin, self.scaledMax(), self.isLogarithmic);
    }

    function calculateSegmentPlacement(thresholds, containerWidth, min, max, isLog) {
        var segments = [],
            length = max - min,
            pxRatio = 1 / containerWidth,
            pxPercent = pxRatio * 100,
            clippedPixels = 0,
            clippedCount = 0,
            spacerCount = thresholds.length - 1,
            deadPixels,
            adjustmentRatio,
            adjLength,
            leftOffset,
            finishedCalculation = false,
            clippingAdjustment,
            clippingAdjustmentsSoFar;

        while (!finishedCalculation) {
            finishedCalculation = true;
            deadPixels = spacerCount - 1 + clippedPixels;
            adjustmentRatio = deadPixels * pxRatio;
            adjLength = length - (length * adjustmentRatio);
            clippingAdjustmentsSoFar = 0;
            clippingAdjustment = clippedPixels / (thresholds.length - clippedCount);
        
            leftOffset = 0;

            for (var i = 0; i < thresholds.length; i++) {
                var thresholdValue = scaleValue(thresholds[i].value, isLog, min),
                    nextValue = i + 1 === thresholds.length ? max : scaleValue(thresholds[i + 1].value, isLog, min),
                    width = calcRelativePercent(thresholdValue, nextValue, length),
                    clipped = false,
                    segment;

                if (!segments[i]) {
                    segment = {};
                    segments.push(segment);
                } else {
                    segment = segments[i];
                }

                //  Check to see if the width of the section has fallen below the 1px minimum.
                if (width < pxPercent) {
                    if (segment.clipped) {
                        width = pxPercent;
                    } else {
                        segment.clipped = true;
                        clippedCount++;
                        clippedPixels += ((pxPercent - width) / pxPercent);
                        finishedCalculation = false;
                        break;
                    }
                }

                segment.color = thresholds[i].color;
                segment.rightOffset = -1 * ((width / 100 * spacerCount) + (segment.clipped ? 0 : clippingAdjustment));
                segment.width = calcPctPlusPx(width, segment.rightOffset);
                segment.leftBound = thresholdValue;
                segment.rightBound = nextValue;
                segment.leftOffset = i - (leftOffset / 100 * spacerCount) - (clippingAdjustment * clippingAdjustmentsSoFar);
                segment.left = calcPctPlusPx(leftOffset, segment.leftOffset);

                if (!segment.clipped) {
                    clippingAdjustmentsSoFar++;
                }

                leftOffset += width;
            }
        }

        return segments;
    }

    RiskBarViewModel.prototype.dispose = function() {
        this.scaledMitigated.dispose();
        this.scaledUnmitigated.dispose();
        this.scaledMax.dispose();

        $(window).off('resize', this.boundWindowResized);
    };

    return RiskBarViewModel;
});