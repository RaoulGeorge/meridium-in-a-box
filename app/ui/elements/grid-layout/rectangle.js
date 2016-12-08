define(function defineRectangle(require) {
    'use strict';

    var Position = require('./position'),
        Size = require('./size'),
        Assert = require('mi-assert');

    function Rectangle(position, size) {
        this.position = position ? position.clone() : new Position(0, 0);
        this.size = size ? size.clone() : new Size(0, 0);
    }

    Rectangle.deserialize = function deserialize(object) {
        Assert.isObject(object);
        var r = new Rectangle();
        r.updatePosition(object.x || 0, object.y || 0, object.z || 1);
        r.updateSize(object.width || 0, object.height || 0);
        return r;
    };

    Rectangle.prototype.x = function x() {
        return this.position.x;
    };

    Rectangle.prototype.y = function y() {
        return this.position.y;
    };

    Rectangle.prototype.z = function z() {
        return this.position.z;
    };

    Rectangle.prototype.width = function width() {
        return this.size.width;
    };

    Rectangle.prototype.height = function height() {
        return this.size.height;
    };

    Rectangle.prototype.left = function left() {
        return this.x();
    };

    Rectangle.prototype.right = function right() {
        return this.left() + this.width();
    };

    Rectangle.prototype.top = function top() {
        return this.y();
    };

    Rectangle.prototype.bottom = function bottom() {
        return this.top() + this.height();
    };

    Rectangle.prototype.updatePosition = function updatePosition(x, y, z) {
        Assert.isNumber(x, 'x');
        Assert.isNumber(y, 'y');
        Assert.isNumber(z, 'z');
        this.position.update(x, y, z);
    };

    Rectangle.prototype.updateSize = function updateSize(width, height) {
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        this.size.update(width, height);
    };

    Rectangle.prototype.copy = function copy(otherRectangle) {
        if (!otherRectangle) { return; }
        Assert.instanceOf(otherRectangle, Rectangle);
        this.position.copy(otherRectangle.position);
        this.size.copy(otherRectangle.size);
    };

    Rectangle.prototype.equals = function equals(otherRectangle) {
        if (!otherRectangle) { return false; }
        Assert.instanceOf(otherRectangle, Rectangle);
        if (!otherRectangle.position) { return false; }
        if (!otherRectangle.size) { return false; }
        return this.position.equals(otherRectangle.position) &&
            this.size.equals(otherRectangle.size);
    };

    Rectangle.prototype.serialize = function serialize() {
        return {
            x: this.x(),
            y: this.y(),
            width: this.width(),
            height: this.height()
        };
    };

    return Rectangle;
});