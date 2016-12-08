define(function defineGridLayoutItemController(require) {
    'use strict';

    var Event = require('system/lang/event'),
        Rectangle = require('./rectangle'),
        Size = require('./size'),
        Assert = require('mi-assert');

    function GridLayoutItemController(parent) {
        this.parent = parent;
        this.moved = Object.resolve(Event);
        this.resized = Object.resolve(Event);
        this.layoutCreated = Object.resolve(Event);
        this.zIndexUpdated = Object.resolve(Event);
        this.rectangles = {};
        this.rectangle = null;
        this.minSize = null;
        this.inEditMode = false;
        this.editModeChanged =  Object.resolve(Event);
    }

    GridLayoutItemController.prototype.init = function init(attributes) {
        Assert.isObject(attributes);
        this.minSize = newMinSize(this, attributes.minWidth || 1, attributes.minHeight || 1);
        this.rectangle = initRectangles(this, attributes);
        this.parent.addItem(this);
        this.parent.layoutChanged.add(parent_layoutChanged, null, this);
        onMoved(this);
        onResized(this);
    };

    GridLayoutItemController.prototype.dispose = function dispose() {
        this.resized.remove();
        this.moved.remove();
        this.layoutCreated.remove();
        this.zIndexUpdated.remove();
        this.minSize = null;
        this.rectangle = null;
        this.resized = null;
        this.moved = null;
        this.parent.removeItem(this);
        this.parent = null;
    };

    GridLayoutItemController.prototype.x = function x() {
        return this.rectangle.x();
    };

    GridLayoutItemController.prototype.x_blocks = function x_blocks() {
        return toBlocks(this, this.x());
    };

    GridLayoutItemController.prototype.y = function y() {
        return this.rectangle.y();
    };

    GridLayoutItemController.prototype.y_blocks = function y_blocks() {
        return toBlocks(this, this.y());
    };

    GridLayoutItemController.prototype.z = function z() {
        return this.rectangle.z();
    };

    GridLayoutItemController.prototype.width = function width() {
        return this.rectangle.width();
    };

    GridLayoutItemController.prototype.width_blocks = function width_blocks() {
        return toBlocks(this, this.width());
    };

    GridLayoutItemController.prototype.height = function height() {
        return this.rectangle.height();
    };

    GridLayoutItemController.prototype.height_blocks = function height_blocks() {
        return toBlocks(this, this.height());
    };

    GridLayoutItemController.prototype.blockSize = function blockSize() {
        return this.parent.blockSize();
    };

    GridLayoutItemController.prototype.bringToFront = function bringToFront() {
        this.parent.addLayer();
        this.updateZ(layerCount(this));
    };

    GridLayoutItemController.prototype.updateZ = function updateZ(z) {
        updatePixelPosition(this, this.x(), this.y(), z);
    };

    GridLayoutItemController.prototype.move = function move(dx, dy) {
        var x = snapToGrid(this, Math.max(this.x() + dx, 0)),
            y = snapToGrid(this, Math.max(this.y() + dy, 0)),
            z = this.z();
        x = preventMoveOffRightEdge(this, x);
        updatePixelPosition(this, x, y, z);
    };

    GridLayoutItemController.prototype.resize = function resize(dx, dy) {
        var newWidth = (this.width() + dx),
            newHeight = (this.height() + dy),
            minWidth = toPixels(this, this.minSize.width),
            minHeight = toPixels(this, this.minSize.height);
        newWidth = Math.max(newWidth, minWidth);
        newHeight = Math.max(newHeight, minHeight);
        newWidth = preventResizeOffRightEdge(this, newWidth);
        if (newWidth !== this.width() || newHeight !== this.height()) {
            updatePixelSize(this, newWidth, newHeight);
        }
    };

    GridLayoutItemController.prototype.updateBlockPosition = function updateBlockPosition(x, y, z) {
        Assert.isNumber(x, 'x');
        Assert.isNumber(y, 'y');
        Assert.isNumber(z, 'z');
        updatePixelPosition(this, toPixels(this, x), toPixels(this, y), z);
    };

    GridLayoutItemController.prototype.updateBlockSize = function updateBlockSize(width, height) {
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        updatePixelSize(this, toPixels(this, width), toPixels(this, height));
    };

    GridLayoutItemController.prototype.notifyDragStarted = function notifyDragStarted() {
        this.parent.notifyDragStarted(this);
    };

    GridLayoutItemController.prototype.notifyDragEnded = function notifyDragEnded() {
        this.parent.notifyDragEnded(this);
    };

    GridLayoutItemController.prototype.notifyZIndexUpdated = function notifyZIndexUpdated() {
        this.zIndexUpdated.raise(this);
    };

    GridLayoutItemController.prototype.layout = function layout() {
        return this.parent.layout();
    };

    GridLayoutItemController.prototype.displayIndex = function displayIndex() {
        return (this.y_blocks() * 100000) + this.x_blocks();
    };

    GridLayoutItemController.prototype.toggleEditMode = function toggleEditMode() {
        this.inEditMode = !this.inEditMode;
        this.editModeChanged.raise(this, this.inEditMode);
    };

    GridLayoutItemController.prototype.toString = function toString() {
        return 'GridLayoutItemController: ' + JSON.stringify({
            x: this.rectangle ? this.x_blocks() : null,
            y: this.rectangle ? this.y_blocks() : null,
            z: this.rectangle ? this.z() : null,
            height: this.rectangle ? this.height_blocks() : null,
            width: this.rectangle ? this.width_blocks() : null
        });
    };

    function initRectangles(self, attributes) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isObject(attributes);
        if (hasLayout(attributes.desktop) && !hasLayout(attributes.hd)) {
            attributes.hd = {
                x: attributes.desktop.x,
                y: attributes.desktop.y,
                z: attributes.desktop.z,
                width: attributes.desktop.width,
                height: attributes.desktop.height
            };
        }

        self.rectangles = {
            phone: newRectangle(self, attributes.phone),
            smallTablet: newRectangle(self, attributes.smallTablet),
            tablet: newRectangle(self, attributes.tablet),
            desktop: newRectangle(self, attributes.desktop),
            hd: newRectangle(self, attributes.hd)
        };
        if (!self.rectangles[self.layout()]) {
            self.rectangles[self.layout()] = newRectangle(self, createNewLayout(self, self.layout()));
        }
        return self.rectangles[self.layout()];
    }

    function hasLayout(attributes) {
        return attributes.width && attributes.height;
    }

    function newRectangle(self, attributes) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isObject(attributes);
        if (attributes.width && attributes.height) {
            return Rectangle.deserialize({
                x: toPixels(self, attributes.x || 0),
                y: toPixels(self, attributes.y || 0),
                z: attributes.z || 1,
                width: toPixels(self, attributes.width),
                height: toPixels(self, attributes.height)
            });
        } else {
            return null;
        }
    }

    function newMinSize(self, width, height) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        return new Size(width, height);
    }

    function updatePixelPosition(self, x, y, z) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isNumber(x, 'x');
        Assert.isNumber(y, 'y');
        Assert.isNumber(z, 'z');
        self.rectangle.updatePosition(x, y, z);
        onMoved(self);
    }

    function onMoved(self) {
        Assert.instanceOf(self, GridLayoutItemController);
        if(self.moved) {
            self.moved.raise(self, self.x(), self.y(), self.z());
            self.parent.notifyItemChanged(self);
        }
    }

    function updatePixelSize(self, width, height) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        self.rectangle.updateSize(width, height);
        onResized(self);
    }

    function onResized(self) {
        Assert.instanceOf(self, GridLayoutItemController);
        if (self.resized && self.parent) {
            self.resized.raise(self, self.width(), self.height());
            self.parent.notifyItemChanged(self);
        }
    }

    function toPixels(self, value) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isNumber(value);
        return self.parent.toPixels(value);
    }

    function toBlocks(self, value) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isNumber(value);
        return self.parent.toBlocks(value);
    }

    function parent_layoutChanged(self, sender, layout) {
        Assert.instanceOf(self, GridLayoutItemController);
        Assert.isString(layout);
        if (self.rectangles[layout]) {
            self.rectangle = self.rectangles[layout];
        } else {
            raiseLayoutCreatedEventWithNewRectangle(self, layout);
        }
        onMoved(self);
        onResized(self);
    }

    function raiseLayoutCreatedEventWithNewRectangle(self, layout) {
        if(self.parent) {
            self.rectangles[layout] = newRectangle(self, createNewLayout(self, layout));
            self.rectangle = self.rectangles[layout];
            self.layoutCreated.raise(self);
        }
    }

    function layerCount(self) {
        Assert.instanceOf(self, GridLayoutItemController);
        return self.parent.layerCount;
    }

    function createNewLayout(self, layout) {
        Assert.instanceOf(self, GridLayoutItemController);
        var rectangle = self.parent.defineRectangle(self);
        return rectangle.serialize();
    }

    function snapToGrid(self, value) {
        return Math.floor(value / self.blockSize()) * self.blockSize();
    }

    function preventMoveOffRightEdge(self, x) {
        if (x + self.width() > self.parent.width) {
            return snapToGrid(self, self.parent.width - self.width());
        }
        return x;
    }

    function preventResizeOffRightEdge(self, newWidth) {
        if (self.x() + newWidth > self.parent.width) {
            return snapToGrid(self, self.parent.width - self.x());
        }
        return newWidth;
    }

    return GridLayoutItemController;
});
