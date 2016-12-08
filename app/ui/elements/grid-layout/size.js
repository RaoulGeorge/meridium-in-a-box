define(function defineSize(require) {
    'use strict';

    var Assert = require('mi-assert');

    function Size(width, height) {
        this.width = width;
        this.height = height;
    }

    Size.prototype.update = function update(width, height) {
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        this.width = width;
        this.height = height;
    };

    Size.prototype.copy = function copy(otherSize) {
        if (!otherSize) { return; }
        Assert.instanceOf(otherSize, Size);
        this.width = otherSize.width;
        this.height = otherSize.height;
    };

    Size.prototype.clone = function clone() {
        return new Size(this.width, this.height);
    };

    Size.prototype.minWidth = function minWidth(width) {
        Assert.isNumber(width);
        return width < this.width ? this.width : width;
    };

    Size.prototype.minHeight = function minHeight(height) {
        Assert.isNumber(height);
        return height < this.height ? this.height : height;
    };

    Size.prototype.equals = function equals(otherSize) {
        if (!otherSize) { return false; }
        Assert.instanceOf(otherSize, Size);
        if (this.height !== otherSize.height) { return false; }
        if (this.width !== otherSize.width) { return false; }
        return true;
    };

    return Size;
});