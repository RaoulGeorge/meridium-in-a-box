define(function definePosition(require) {
    'use strict';

    var _ = require('lodash');

    var Assert = require('mi-assert');

    function Position(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    Position.prototype.update = function update(x, y, z) {
        Assert.isNumber(x, 'x');
        Assert.isNumber(y, 'y');
        Assert.assert(_.isNumber(z) || z === undefined);
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Position.prototype.copy = function copy(otherPosition) {
        if (!otherPosition) { return; }
        Assert.instanceOf(otherPosition, Position);
        this.x = otherPosition.x;
        this.y = otherPosition.y;
        this.z = otherPosition.z;
    };

    Position.prototype.clone = function clone() {
        return new Position(this.x, this.y, this.z);
    };

    Position.prototype.equals = function equals(otherPosition) {
        if (!otherPosition) { return false; }
        Assert.instanceOf(otherPosition, Position);
        if (this.x !== otherPosition.x) { return false; }
        if (this.y !== otherPosition.y) { return false; }
        if (this.z !== otherPosition.z) { return false; }
        return true;
    };

    return Position;
});