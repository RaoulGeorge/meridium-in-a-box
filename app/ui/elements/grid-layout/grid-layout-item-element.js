define(function defineGridLayoutItemElement(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var GridLayoutItemElement = {},
        GridLayoutItemController = require('./grid-layout-item-controller'),
        interact = require('interact'),
        Assert = require('mi-assert');

    var TRANSFORM = 'transform' in document.body.style ?
        'transform' : 'webkitTransform' in document.body.style ?
        'webkitTransform' : 'mozTransform' in document.body.style ?
        'mozTransform' : 'oTransform' in document.body.style ?
        'oTransform' : 'msTransform';

    GridLayoutItemElement.sortByDisplayIndex = function (items) {
        Assert.isArray(items);
        return _.sortBy(items, GridLayoutItemElement.displayIndex);
    };

    GridLayoutItemElement.displayIndex = function displayIndex(item) {
        Assert.instanceOf(item, HTMLElement);
        Assert.isFunction(item.displayIndex);
        return item.displayIndex();
    };

    GridLayoutItemElement.create = function (parent, minWidth, minHeight, layouts) {
        Assert.instanceOf(parent, HTMLElement);
        Assert.isNumber(minWidth, 'minWidth');
        Assert.isNumber(minWidth, 'minHeight');
        Assert.isObject(layouts);
        var element = Element.build('mi-grid-layout-item', null, null, {
            'min-width': minWidth,
            'min-height': minHeight
        });
        _.each(layouts, setLayoutAttributes.bind(null, element));
        parent.appendChild(element);
        return element;
    };

    function setLayoutAttributes(element, layout, layoutType) {
        Assert.instanceOf(element, HTMLElement);
        Assert.isObject(layout);
        Assert.isNumber(layout.x, 'layout.x');
        Assert.isNumber(layout.y, 'layout.y');
        Assert.isNumber(layout.width, 'layout.width');
        Assert.isNumber(layout.height, 'layout.height');
        Assert.isString(layoutType);
        element.setPositionAttributes(layoutType, layout.x, layout.y, layout.z || 1);
        element.setSizeAttributes(layoutType, layout.width, layout.height);
    }

    GridLayoutItemElement.prototype = Object.create(HTMLElement.prototype);

    GridLayoutItemElement.prototype.createdCallback = function () {
        this.controller = null;
        this.interactable = null;
        this.resizeHandleInteractable = null;
        this.parent_resized = null;
        this.drag_started = drag_started.bind(null, this);
        this.drag_moved = drag_moved.bind(null, this);
        this.drag_ended = drag_ended.bind(null, this);
        this.resize_started = resize_started.bind(null, this);
        this.resize_moved = resize_moved.bind(null, this);
        this.resize_ended = resize_ended.bind(null, this);
        this.resizeHandle = null;
    };

    function drag_started(self, e) {
        Assert.instanceOf(self, HTMLElement);
        self.controller.notifyDragStarted();
        self.controller.bringToFront();
        $(self).addClass('dragging');

    }

    function drag_moved(self, e) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isObject(e);
        Assert.isNumber(e.dx, 'e.dx');
        Assert.isNumber(e.dy, 'e.dy');
        self.controller.move(e.dx, e.dy);
    }

    function drag_ended(self, e) {
        Assert.instanceOf(self, HTMLElement);
        setPositionAttributes(self, self.controller.layout());
        self.controller.notifyDragEnded();
        $(self).removeClass('dragging');
    }

    function resize_started(self, e) {
        Assert.instanceOf(self, HTMLElement);
        self.controller.notifyDragStarted();
        self.controller.bringToFront();
        $(self).addClass('resizing');
    }

    function resize_moved(self, e) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isObject(e);
        Assert.isNumber(e.dx, 'e.dx');
        Assert.isNumber(e.dy, 'e.dy');
        self.controller.resize(e.dx, e.dy);
    }

    function resize_ended(self, e) {
        Assert.instanceOf(self, HTMLElement);
        setPositionAttributes(self, self.controller.layout());
        setSizeAttributes(self, self.controller.layout());
        self.controller.notifyDragEnded();
        $(self).removeClass('resizing');
    }

    function setPositionAttributes(self, layout) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isString(layout);
        var x_blocks = self.controller.x_blocks(),
            y_blocks = self.controller.y_blocks(),
            z = self.controller.z();
        self.setPositionAttributes(layout, x_blocks, y_blocks, z);
        notifyChanged(self);
    }

    function notifyChanged(self) {
        Assert.instanceOf(self, HTMLElement);
        Element.raiseEvent(self, 'change', {
            layout: self.controller.layout(),
            x: self.controller.x_blocks(),
            y: self.controller.y_blocks(),
            z: self.controller.z(),
            width: self.controller.width_blocks(),
            height: self.controller.height_blocks()
        });
    }

    function setSizeAttributes(self, layout) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isString(layout);
        var width_blocks = self.controller.width_blocks(),
            height_blocks = self.controller.height_blocks();
        self.setSizeAttributes(layout, width_blocks, height_blocks);
        notifyChanged(self);
    }

    GridLayoutItemElement.prototype.attachedCallback = function () {
        this.resizeHandle = Element.build('i', this, ['icon-tree-expand', 'resize-handle']);
        createController(this);
        initializeController(this);
        listenToParent(this);
        enableInteractable(this);
    };

    function createController(self) {
        Assert.instanceOf(self, HTMLElement);
        self.controller = new GridLayoutItemController(self.parentNode.controller);
    }

    function initializeController(self) {
        Assert.instanceOf(self, HTMLElement);
        var attributes = getAttributes(self);
        self.controller.moved.add(controller_moved, null, self);
        self.controller.resized.add(controller_resized, null, self);
        self.controller.layoutCreated.add(controller_layoutCreated, null, self);
        self.controller.editModeChanged.add(controller_editModeChanged, null, self);
        self.controller.zIndexUpdated.add(controller_zIndexUpdated, null, self);
        self.controller.init(attributes);
        setInitialEditMode(self);
        setPositionAttributes(self, self.controller.layout());
        setSizeAttributes(self, self.controller.layout());
    }

    function controller_moved(self, sender, x, y, z) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isNumber(x, 'x');
        Assert.isNumber(y, 'y');
        Assert.isNumber(z, 'z');
        self.style[TRANSFORM] = translate(x, y);
        self.style.zIndex = z;
    }

    function translate(x, y) {
        Assert.isNumber(x, 'x');
        Assert.isNumber(y, 'y');
        return 'translate(' + x + 'px, ' + y + 'px)';
    }

    function controller_resized(self, sender, width, height) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isNumber(width, 'width');
        Assert.isNumber(height, 'height');
        width -= horizontalMargin(self);
        height -= verticalMargin(self);
        self.style.width = width + 'px';
        self.style.height = height + 'px';
        Element.raiseEvent(self, 'element-resized', { width: width, height: height });
    }

    function horizontalMargin(self) {
        var $self = $(self);
        return $self.outerWidth(true) - $self.outerWidth();
    }

    function verticalMargin(self) {
        var $self = $(self);
        return $self.outerHeight(true) - $self.outerHeight();
    }

    function controller_layoutCreated(self, sender) {
        Assert.instanceOf(self, HTMLElement);
        setPositionAttributes(self, self.controller.layout());
        setSizeAttributes(self, self.controller.layout());
    }

    function controller_editModeChanged(self, sender, inEditMode) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isBoolean(inEditMode);
        if (inEditMode) {
            enableInteractable(self);
            self.classList.add('editable');
        } else {
            disableInteractable(self);
            self.classList.remove('editable');
        }
    }

    function enableInteractable(self) {
        Assert.instanceOf(self, HTMLElement);
        if (self.controller.inEditMode) {
            enableDraggables(self);
            enableResizeHandle(self);
        }
    }

    function enableDraggables(self) {
        Assert.instanceOf(self, HTMLElement);
        _.defer(defer_enableDraggables.bind(null, self));
    }

    function defer_enableDraggables(self) {
        var children = draggableChildren(self);
        if (children.length) {
            enableDraggableChildren(self, children);
        } else {
            enableDraggable(self, self);
        }
    }

    function draggableChildren(self) {
        return self.querySelectorAll('.grid-layout-draggable');
    }

    function enableDraggableChildren(self, children) {
        _.each(children, enableDraggable.bind(null, self));
    }

    function enableDraggable(self, element) {
        element.interactable = interact(element)
            .draggable(true)
            .snap(snapConfig(self))
            .restrict(restrictConfig(self))
            .preventDefault(true)
            .on('dragstart', self.drag_started)
            .on('dragmove', self.drag_moved)
            .on('dragend', self.drag_ended);
    }

    function enableResizeHandle(self) {
        self.resizeHandle.interactable = interact(self.resizeHandle)
            .draggable(true)
            .snap(handleSnapConfig(self))
            .restrict(restrictConfig(self))
            .preventDefault(true)
            .on('dragstart', self.resize_started)
            .on('dragmove', self.resize_moved)
            .on('dragend', self.resize_ended);
    }

    function snapConfig(self) {
        Assert.instanceOf(self, HTMLElement);
        var blockSize = self.controller.blockSize();
        return {
            actions: ['drag', 'resizex', 'resizey', 'resizexy', 'resize'],
            mode: 'grid',
            range: Infinity,
            grid: { x: blockSize, y: blockSize },
            gridOffset: { x: 0, y: 0 }
        };
    }

    function restrictConfig(self) {
        Assert.instanceOf(self, HTMLElement);
        return {
            drag: self.parentNode,
            resize: self.parentNode
        };
    }

    function handleSnapConfig(self) {
        Assert.instanceOf(self, HTMLElement);
        var blockSize = self.controller.blockSize();
        return {
            actions: ['drag'],
            mode: 'grid',
            range: Infinity,
            grid: { x: blockSize, y: blockSize },
            gridOffset: { x: 0, y: 0 }
        };
    }

    function disableInteractable(self, final) {
        Assert.instanceOf(self, HTMLElement);
        disableDraggableChildren(self, final);
        disableDraggable(self, final, self);
        disableResizeHandle(self, final);
    }

    function disableDraggableChildren(self, final) {
        _.each(draggableChildren(self), disableDraggable.bind(null, self, final));
    }

    function disableDraggable(self, final, element) {
        if (element.interactable) {
            element.interactable
                .draggable(false)
                .off('dragstart', self.drag_started)
                .off('dragmove', self.drag_moved)
                .off('dragend', self.drag_ended);
            if (final) {
                element.interactable.unset();
            }
        }
    }

    function disableResizeHandle(self, final) {
        if (self.resizeHandle.interactable) {
            self.resizeHandle.interactable = interact(self.resizeHandle)
                .draggable(false)
                .off('dragstart', self.resize_started)
                .off('dragmove', self.resize_moved)
                .off('dragend', self.resize_ended);
            if (final) {
                self.resizeHandle.interactable.unset();
            }
        }
    }

    function controller_zIndexUpdated(self, sender) {
        Assert.instanceOf(self, HTMLElement);
        setPositionAttributes(self, self.controller.layout());
    }

    function setInitialEditMode(self) {
        if (self.parentNode.controller.inEditMode) {
            self.controller.toggleEditMode();
        }
    }

    function listenToParent(self) {
        Assert.instanceOf(self, HTMLElement);
        self.parent_resized = parent_resized.bind(null, self);
        listenToParentResize(self);
    }

    function parent_resized(self, e) {
        Assert.instanceOf(self, HTMLElement);
        stopListeningToParentResize(self);

        if(self.controller) {
            var layout = self.controller.layout(),
                attributes = getAttributes(self),
                x, y, z, width, height;

            attributes = addHdAttributes(layout, attributes);
            x = attributes[layout].x;
            y = attributes[layout].y;
            z = attributes[layout].z;
            width = attributes[layout].width;
            height = attributes[layout].height;
            self.controller.updateBlockPosition(x, y, z);
            self.controller.updateBlockSize(width, height);
            disableInteractable(self);
            enableInteractable(self);
        }

        listenToParentResize(self);
    }

    function addHdAttributes(layout, attributes) {
        if (layout === 'hd' && !hasLayout(attributes)) {
            attributes.hd = {
                x: attributes.desktop.x,
                y: attributes.desktop.y,
                z: attributes.desktop.z,
                width: attributes.desktop.width,
                height: attributes.desktop.height
            };
        }

        return attributes;
    }

    function hasLayout(attributes) {
        return attributes.width && attributes.height;
    }

    function stopListeningToParentResize(self) {
        if (self.parentNode) {
            self.parentNode.removeEventListener('collection-element-resized', self.parent_resized);
        }
    }

    function getAttributes(self) {
        Assert.instanceOf(self, HTMLElement);
        var attributes = {};
        attributes.phone = createLayoutAttributes(self, 'phone'),
            attributes.smallTablet = createLayoutAttributes(self, 'small-tablet'),
            attributes.tablet = createLayoutAttributes(self, 'tablet'),
            attributes.desktop = createLayoutAttributes(self, 'desktop'),
            attributes.hd = createLayoutAttributes(self, 'hd'),
            attributes.minWidth = Element.intAttribute(self, 'min-width');
        attributes.minHeight = Element.intAttribute(self, 'min-height');
        return attributes;
    }

    function createLayoutAttributes(self, attributePrefix) {
        Assert.instanceOf(self, HTMLElement);
        Assert.isString(attributePrefix);
        var attributes = {};
        attributes.x = Element.intAttribute(self, attributePrefix + '-x', null);
        attributes.y = Element.intAttribute(self, attributePrefix + '-y', null);
        attributes.z = Element.intAttribute(self, attributePrefix + '-z', null);
        attributes.width = Element.intAttribute(self, attributePrefix + '-width', null);
        attributes.height = Element.intAttribute(self, attributePrefix + '-height', null);
        return attributes;
    }

    function listenToParentResize(self) {
        if (self.parentNode) {
            self.parentNode.addEventListener('collection-element-resized', self.parent_resized);
        }
    }

    GridLayoutItemElement.prototype.detachedCallback = function () {
        disableInteractable(this, true);
        stopListeningToParentResize(this);
        this.controller.dispose();
        if (this.resizeHandle) {
            this.removeChild(this.resizeHandle);
        }
        this.parent_resized = null;
        this.interactable = null;
        this.controller = null;
    };

    GridLayoutItemElement.prototype.getChangedAttributes = function () {
        return {
            layout: this.controller.layout(),
            x: this.controller.x_blocks(),
            y: this.controller.y_blocks(),
            z: this.controller.z(),
            width: this.controller.width_blocks(),
            height: this.controller.height_blocks()
        };
    };

    GridLayoutItemElement.prototype.serialize = function () {
        var attributes = getAttributes(this);
        delete attributes.minWidth;
        delete attributes.minHeight;
        return attributes;
    };

    GridLayoutItemElement.prototype.setPositionAttributes = function (layout, x_blocks, y_blocks, z) {
        Assert.isString(layout);
        Assert.isNumber(x_blocks, 'x_blocks');
        Assert.isNumber(y_blocks, 'y_blocks');
        Assert.isNumber(z, 'z');
        layout = formatLayoutAttribute(layout);
        this.setAttribute(layout + '-x', x_blocks);
        this.setAttribute(layout + '-y', y_blocks);
        this.setAttribute(layout + '-z', z);
    };

    function formatLayoutAttribute(name) {
        Assert.isString(name);
        return name === 'smallTablet' ? 'small-tablet' : name;
    }

    GridLayoutItemElement.prototype.setSizeAttributes = function (layout, width_blocks, height_blocks) {
        Assert.isString(layout);
        Assert.isNumber(width_blocks, 'width_blocks');
        Assert.isNumber(height_blocks, 'height_blocks');
        layout = formatLayoutAttribute(layout);
        this.setAttribute(layout + '-width', width_blocks);
        this.setAttribute(layout + '-height', height_blocks);
    };

    GridLayoutItemElement.prototype.displayIndex = function () {
        return this.controller.displayIndex();
    };

    GridLayoutItemElement.prototype.toggleEditMode = function () {
        if (this.controller) {
            this.controller.toggleEditMode();
        }
    };

    Element.registerElement('mi-grid-layout-item', { prototype: GridLayoutItemElement.prototype });
    return GridLayoutItemElement;
});
