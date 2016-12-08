define(function defineGridLayoutCollectionController(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var ResizeWatcher = require('./resize-watcher'),
        Event = require('system/lang/event'),
        WrapLayoutStrategy = require('./wrap-layout-strategy'),
        Assert = require('mi-assert');

    var SCROLLBAR_WIDTH = 17;

    function GridLayoutCollectionController(element, columns, widths) {
        this.element = element;
        this.columns = columns;
        this.widths = widths;
        this.columnCount = columns.desktop;
        this.items = [];
        this.layerCount = 1;
        this.resizeWatcher = Object.resolve(ResizeWatcher);
        this.currentLayout = '';
        this.resized = Object.resolve(Event);
        this.heightChanged = Object.resolve(Event);
        this.layoutChanged = Object.resolve(Event);
        this.layoutStrategy = Object.resolve(WrapLayoutStrategy, this);
        this.width = 0;
        this.height = 0;
        this.heightCheckValue = { value: 0 };
        this.deferredResize = {
            active: false,
            width: 0,
            height: 0
        };
        this.draggingItem = false;
        this.inEditMode = false;
        this.editModeChanged =  Object.resolve(Event);
    }

    GridLayoutCollectionController.prototype.init = function init() {
        this.resizeWatcher.sizeChanged.add(resized, null, this);
        this.resizeWatcher.watch(document.querySelector('#shell-screen'));
        this.width = this.resizeWatcher.size.width - containerWidthOffset(this);
        evaluateLayout(this, this.width);
    };

    GridLayoutCollectionController.prototype.dispose = function dispose() {
        this.resizeWatcher.stop();
        this.resizeWatcher.sizeChanged.remove(this);
        this.resizeWatcher = null;
        this.layoutStrategy.dispose();
        this.layoutStrategy = null;
        this.resized = null;
        this.element = null;
    };

    GridLayoutCollectionController.prototype.addItem = function addItem(item) {
        Assert.ok(item);
        this.items.push(item);
        this.layerCount = getMaxZIndex(this, this.layout());
    };

    GridLayoutCollectionController.prototype.removeItem = function addItem(item) {
        Assert.ok(item);
        _.remove(this.items, function (otherItem) {
            return otherItem === item;
        });
        this.notifyItemChanged();
    };

    GridLayoutCollectionController.prototype.addLayer = function addLayer() {
        this.layerCount++;
    };

    GridLayoutCollectionController.prototype.notifyDragStarted = function notifyDragStarted(item) {
        this.draggingItem = true;
    };

    GridLayoutCollectionController.prototype.notifyDragEnded = function notifyDragEnded(item) {
        this.draggingItem = false;
        normalizeZIndexes(this);
        completeDeferredResize(this);
    };

    GridLayoutCollectionController.prototype.notifyItemChanged = function notifyItemChanged(item) {
        checkHeights(this);
        if (this.height !== this.heightCheckValue.value) {
            this.height = this.heightCheckValue.value;
            this.heightChanged.raise(this, this.height, this.blockSize());
        }
    };

    function checkHeights(self) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        self.heightCheckValue.value = 0;
        _.each(self.items, checkHeight.bind(null, self));
    }

    function checkHeight(self, item) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        Assert.ok(item, 'item');
        Assert.ok(item.rectangle, 'item.rectangle');
        Assert.isFunction(item.rectangle.bottom, 'item.rectangle.bottom');
        var bottom = item.rectangle.bottom();
        if (self.heightCheckValue.value < bottom) {
            self.heightCheckValue.value = bottom;
        }
    }

    GridLayoutCollectionController.prototype.toPixels = function toPixels(value) {
        Assert.isNumber(value);
        return value * this.blockSize();
    };

    GridLayoutCollectionController.prototype.toBlocks = function toBlocks(value) {
        Assert.isNumber(value);
        return Math.floor(value / this.blockSize());
    };

    GridLayoutCollectionController.prototype.blockSize = function blockSize() {
        return Math.floor(this.width / this.columnCount);
    };

    GridLayoutCollectionController.prototype.layout = function layout() {
        return this.currentLayout;
    };

    GridLayoutCollectionController.prototype.defineRectangle = function defineRectangle(item) {
        Assert.ok(item);
        this.layoutStrategy.items = this.items;
        return this.layoutStrategy.defineRectangle(item);
    };

    GridLayoutCollectionController.prototype.toggleEditMode = function toggleEditMode() {
        this.inEditMode = !this.inEditMode;
        this.editModeChanged.raise(this, this.inEditMode);
    };

    function resized(self, watcher, height, width) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        Assert.isNumber(height);
        Assert.isNumber(width);
        width = width - containerWidthOffset(self);
        if (self.draggingItem) {
            self.deferredResize.active = true;
            self.deferredResize.height = height;
            self.deferredResize.width = width;
        } else {
            tryUpdateWidth(self, width, height);
        }
    }

    function completeDeferredResize(self) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        if (self.deferredResize.active) {
            var width = self.deferredResize.width,
                height = self.deferredResize.height;
            self.deferredResize.active = false;
            self.deferredResize.height = 0;
            self.deferredResize.width = 0;
            tryUpdateWidth(self, width, height);
        }
    }

    function tryUpdateWidth(self, width, height) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        Assert.isNumber(height);
        Assert.isNumber(width);
        if (self.width !== width) {
            self.width = width;
            evaluateLayout(self, width);
            self.resized.raise(self, width, height);
        }
    }

    function evaluateLayout(self, width) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        Assert.isNumber(width);
        if (width <= self.widths.phone) {
            notifyLayoutChanged(self, 'phone');
        } else if (width <= self.widths.smallTablet) {
            notifyLayoutChanged(self, 'smallTablet');
        } else if (width <= self.widths.tablet) {
            notifyLayoutChanged(self, 'tablet');
        } else if (width <= self.widths.desktop) {
            notifyLayoutChanged(self, 'desktop');
        } else {
            notifyLayoutChanged(self, 'hd');
        }
    }

    function notifyLayoutChanged(self, layout) {
        Assert.instanceOf(self, GridLayoutCollectionController);
        Assert.isString(layout);
        self.currentLayout = layout;
        self.columnCount = self.columns[layout];
        self.layerCount = getMaxZIndex(self, layout);
        self.layoutChanged.raise(self, layout);
    }

    function getMaxZIndex(self, layout) {
        return _.reduce(self.items, function (maxZ, item) {
            return Math.max(item.z(), maxZ);
        }, 1);
    }

    function normalizeZIndexes(self) {
        var oldZIndexes = _.invoke(self.items, 'z'),
            lookup = _(self.items).invoke('z').uniq().sort(numericCompare).value(),
            newZIndexes = _.map(oldZIndexes, lookupNewZ.bind(null, lookup));
        _.forEach(self.items, updateZIndex.bind(null, newZIndexes));
    }

    function numericCompare(a, b) {
        return a - b;
    }

    function lookupNewZ(lookup, n) {
        return _.indexOf(lookup, n) + 1;
    }

    function updateZIndex(newZIndexes, item, i) {
        item.updateZ(newZIndexes[i]);
        item.notifyZIndexUpdated();
    }

    function containerWidthOffset(self) {
        var leftNav = $('nav.leftnav'),
            leftNavWidth = leftNav.width();
        return SCROLLBAR_WIDTH + leftNavWidth;
    }

    return GridLayoutCollectionController;
});
