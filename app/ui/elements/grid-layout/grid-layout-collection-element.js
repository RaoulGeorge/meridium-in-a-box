define(function defineGridLayoutCollectionElement(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var GridLayoutCollectionElement = {},
        GridLayoutCollectionController = require('./grid-layout-collection-controller'),
        Assert = require('mi-assert');

    GridLayoutCollectionElement.prototype = Object.create(HTMLElement.prototype);

    GridLayoutCollectionElement.create = function create(parent, phone, smallTablet, tablet, desktop, hd) {
        var element = Element.build('mi-grid-layout-collection', parent, null, {
            'phone-columns': phone,
            'small-tablet-columns': smallTablet,
            'tablet-columns': tablet,
            'desktop-columns': desktop,
            'hd-columns': hd
        });
        return element;
    };

    GridLayoutCollectionElement.prototype.createdCallback = function createdCallback() {
        createController(this);
    };

    function createController(self) {
        var SHELL_WIDTH = 117,
            PHONE_WIDTH = 599 - SHELL_WIDTH,
            SMALL_TABLET_WIDTH = 767 - SHELL_WIDTH,
            TABLET__WIDTH = 1023 - SHELL_WIDTH,
            DESKTOP_WIDTH = 1800 - SHELL_WIDTH;
        var columns = {
            phone: Element.intAttribute(self, 'phone-columns', 4),
            smallTablet: Element.intAttribute(self, 'small-tablet-columns', 8),
            tablet: Element.intAttribute(self, 'tablet-columns', 12),
            desktop: Element.intAttribute(self, 'desktop-columns', 24),
            hd: Element.intAttribute(self, 'hd-columns', 24)
        };
        var widths = {
            phone: Element.intAttribute(self, 'phone-width', PHONE_WIDTH),
            smallTablet: Element.intAttribute(self, 'small-tablet-width', SMALL_TABLET_WIDTH),
            tablet: Element.intAttribute(self, 'tablet-width', TABLET__WIDTH),
            desktop: Element.intAttribute(self, 'desktop-width', DESKTOP_WIDTH)
        };
        self.controller = new GridLayoutCollectionController(self, columns, widths);
    }

    GridLayoutCollectionElement.prototype.attachedCallback = function attachedCallback() {
        initializeController(this);
    };

    function initializeController(self) {
        self.controller.resized.add(controller_resized, null, self);
        self.controller.heightChanged.add(controller_heightChanged, null, self);
        self.controller.editModeChanged.add(controller_editModeChanged, null, self);
        setInitialEditMode(self);
        self.controller.init();
    }

    function controller_resized(self, layout, width, height) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        Element.raiseEvent(self, 'collection-element-resized', { height: height, width: width });
    }

    function controller_heightChanged(self, layout, height, blockSize) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isNumber(height, 'height');
        var MARGIN_OFFSET = 16;
        setHeight(self, height + MARGIN_OFFSET);
        if (self.controller && self.controller.inEditMode) {
            appendGrid(self);
        }
    }

    function setHeight(self, height) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isNumber(height, 'height');
        self.style.height = height + 'px';
    }

    function appendGrid(self) {
        Assert.instanceOf(self, HTMLElement);
        var blockSize = self.controller.blockSize(),
            x = blockSize,
            y = blockSize;
        destroyGrid(self);

        while (x < self.controller.width) {
            Element.build('div', self, ['v-line'], { style: 'left: ' + x + 'px;' });
            x += blockSize;
        }

        while (y < self.controller.height) {
            Element.build('div', self, ['h-line'], { style: 'top: ' + y + 'px;' });
            y += blockSize;
        }
    }

    function destroyGrid(self) {
        $('div.v-line', self).remove();
        $('div.h-line', self).remove();
    }

    function controller_editModeChanged(self, controller, inEditMode) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isBoolean(inEditMode);
        if (inEditMode) {
            appendGrid(self);
            self.classList.add('editable');
        } else {
            destroyGrid(self);
            self.classList.remove('editable');
        }

        _.invoke(self.querySelectorAll('mi-grid-layout-item'), 'toggleEditMode');
    }

    function setInitialEditMode(self) {
        if (self.controller.inEditMode) {
            controller_editModeChanged(self, self, self.controller.inEditMode);
        }
    }

    GridLayoutCollectionElement.prototype.detachedCallback = function detachedCallback() {
        this.controller.dispose();
        this.controller = null;
    };

    GridLayoutCollectionElement.prototype.currentLayout = function currentLayout() {
        return this.controller.currentLayout;
    };

    GridLayoutCollectionElement.prototype.toggleEditMode = function toggleEditMode() {
        this.controller.toggleEditMode();
    };

    Element.registerElement('mi-grid-layout-collection', { prototype: GridLayoutCollectionElement.prototype });
    return GridLayoutCollectionElement;
});
