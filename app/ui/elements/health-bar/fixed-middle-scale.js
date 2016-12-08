define(function() {
    'use strict';

    function FixedMiddleScale (inputRange, outputRange) {
        this.inputRange = inputRange;
        this.outputRange = outputRange;
    }

    // Always returns the 1/2 way point
    FixedMiddleScale.prototype.calculate = function() {
        return ((this.outputRange[1] - this.outputRange[0]) / 2) + this.outputRange[0];
    };

    FixedMiddleScale.prototype.calculateInt = function() {
        return Math.floor(this.calculate());
    };

    return FixedMiddleScale;
});
