define(function () {
    'use strict';

    function LinearScale(inputRange, outputRange) {
        this.inputRange = inputRange;
        this.outputRange = outputRange;
    }

    /**
    * Given a value within the INPUT range, calculates and returns the corresponding value 
    * within the OUTPUT range.
    */
    LinearScale.prototype.calculate = function calculate(inputValue) {
        var ratio = (inputValue - this.inputRange[0]) / (this.inputRange[1] - this.inputRange[0]);
        return ((this.outputRange[1] - this.outputRange[0]) * ratio) + this.outputRange[0];
    };

    /**
    * Given a value within the INPUT range, calculates and returns the corresponding value 
    * within the OUTPUT range, converted to an integer value.
    */
    LinearScale.prototype.calculateInt = function calculateInt(inputValue) {
        return Math.floor(this.calculate(inputValue));
    };

    /**
    * Given a value within the output range, calculates and returns the corresponding value 
    * within the input range.
    */
    LinearScale.prototype.calculateInverse = function calculateInverse(outputRangeValue) {
        var ratio = (outputRangeValue - this.outputRange[0]) / (this.outputRange[1] - this.outputRange[0]);
        return ((this.inputRange[1] - this.inputRange[0]) * ratio) + this.inputRange[0];
    };

    /**
    * Given a value within the output range, calculates and returns the corresponding value 
    * within the input range, converted to an integer value.
    */
    LinearScale.prototype.calculateInverseInt = function calculateInverseInt(outputRangeValue) {
        return Math.floor(this.calculateInverse(outputRangeValue));
    };

    return LinearScale;
});