define(function defineSimpleLayoutStrategy(require) {
    'use strict';

    var _ = require('lodash');

    var Rectangle = require('./rectangle'),
        Assert = require('mi-assert');

    function SimpleLayoutStrategy(grid) {
        this.grid = grid;
        this.maxY = 0;
        this.items = this.grid.items;
    }

    SimpleLayoutStrategy.prototype.defineRectangle = function defineRectangle(item) {
        var r = new Rectangle();
        setSize(this, r, item);
        setPosition(this, r, item);
        return r;
    };

    SimpleLayoutStrategy.prototype.dispose = function dispose() {
        this.items = null;
        this.grid = null;
    };

    function setSize(self, r, item) {
        Assert.instanceOf(self, SimpleLayoutStrategy, 'self');
        Assert.instanceOf(r, Rectangle, 'r');
        Assert.isObject(item, 'item');
        var width = calculateWidth(self),
            height = calculateHeight(self);
        r.updateSize(width, height);
    }

    function calculateWidth(self) {
        var width = self.grid.columnCount >= 16 ? 8 : 6;
        return Math.min(width, self.grid.columnCount);
    }

    function calculateHeight(self) {
        return Math.min(6, self.grid.columnCount);
    }

    function setPosition(self, r, item) {
        Assert.instanceOf(self, SimpleLayoutStrategy, 'self');
        Assert.instanceOf(r, Rectangle, 'r');
        Assert.isObject(item, 'item');
        var otherItems, itemsOnSameRow;
        otherItems = getAllItemsExceptCurrent(self, item);
        r.position.y = calculateYPosition(self, otherItems);
        itemsOnSameRow = getItemsOnSameRow(self, otherItems, r);
        r.position.x = calculateXPosition(self, itemsOnSameRow);
        if (needsToWrap(self, r)) {
            wrap(self, itemsOnSameRow, r);
        }
    }

    function getAllItemsExceptCurrent(self, currentItem) {
        return _.filter(self.items, excludeItem.bind(null, currentItem));
    }

    function excludeItem(item, otherItem) {
        return otherItem !== item;
    }

    function calculateYPosition(self, otherItems) {
        return _.reduce(otherItems, findMaxY.bind(null, self), 0);
    }

    function findMaxY(self, y, otherItem) {
        return Math.max(y, y_blocks(self, otherItem));
    }

    function getItemsOnSameRow(self, otherItems, r) {
        return _.filter(otherItems, areOnSameRow.bind(null, self, r));
    }

    function areOnSameRow(self, r, otherItem) {
        return r.position.y === y_blocks(self, otherItem);
    }

    function calculateXPosition(self, itemsOnSameRow) {
        return _.reduce(itemsOnSameRow, findMaxRightEdge.bind(null, self), 0);
    }

    function findMaxRightEdge(self, x, otherItem) {
        return Math.max(x, x_blocks(self, otherItem) + width_blocks(self, otherItem));
    }

    function needsToWrap(self, r) {
        Assert.instanceOf(self, SimpleLayoutStrategy, 'self');
        Assert.instanceOf(r, Rectangle, 'r');
        return r.x() > (self.grid.columnCount - r.width());
    }

    function wrap(self, itemsOnSameRow, r) {
        r.position.x = 0;
        r.position.y = calculateNewRow(self, itemsOnSameRow);
    }

    function calculateNewRow(self, itemsOnSameRow) {
        return _.reduce(itemsOnSameRow, findMaxBottom.bind(null, self), 0);
    }

    function findMaxBottom(self, y, otherItem) {
        return Math.max(y, y_blocks(self, otherItem) + height_blocks(self, otherItem));
    }

    function position_blocks(self, item, property) {
        var rectangle = item.rectangles[self.grid.currentLayout];
        if (rectangle) {
            return self.grid.toBlocks(rectangle.position[property]);
        } else {
            return 0;
        }
    }

    function size_blocks(self, item, property) {
        var rectangle = item.rectangles[self.grid.currentLayout];
        if (rectangle) {
            return self.grid.toBlocks(rectangle.size[property]);
        } else {
            return 0;
        }
    }

    function y_blocks(self, item) {
        return position_blocks(self, item, 'y');
    }

    function x_blocks(self, item) {
        return position_blocks(self, item, 'x');
    }

    function width_blocks(self, item) {
        return size_blocks(self, item, 'width');
    }

    function height_blocks(self, item) {
        return size_blocks(self, item, 'height');
    }

    return SimpleLayoutStrategy;
});