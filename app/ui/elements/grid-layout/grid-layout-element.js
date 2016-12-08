define(function defineGridLayoutElement(require) {
    'use strict';

    var Assert = require('mi-assert');
    var GridLayoutElement = {};

    GridLayoutElement.prototype = Object.create(HTMLElement.prototype);

    GridLayoutElement.create = function create(parent) {
        Assert.instanceOf(parent, HTMLElement);
        var element = Element.build('mi-grid-layout', parent);
        Element.upgrade(element);
        return element;
    };

    Element.registerElement('mi-grid-layout', { prototype: GridLayoutElement.prototype });
    return GridLayoutElement;
});