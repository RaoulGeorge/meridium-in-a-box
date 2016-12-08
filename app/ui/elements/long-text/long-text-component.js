define(function (require) {
    'use strict';
    var Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        LongTextViewModel = require('./long-text-view-model'),
        LongTextComponent = {};

    require('system/lang/object');

    LongTextComponent.prototype = Object.create(HTMLElement.prototype);

    LongTextComponent.prototype.createdCallback = function () {
        this.attached = false;
        this.conductor = Object.resolve(Conductor);
        this.region = new Region();
        this.viewModel = new LongTextViewModel();

        var self = this;

        Element.defineProperty(this, 'value', {
            get: this.viewModel.value,
            set: this.viewModel.value
        });

        this.viewModel.value.subscribe(value_changed.bind(null, this));

        // Load initial state of attributes.
        this.viewModel.isDisabled(self.hasAttribute('isDisabled'));
        this.viewModel.cssClass(self.getAttribute('cssClass'));
        this.viewModel.isValid(!self.hasAttribute('invalid'));
        this.viewModel.placeholderText(self.getAttribute('placeholderText'));
        this.viewModel.caption(self.getAttribute('caption'));

    };

    function value_changed(self, value) {
        Element.raiseEvent(self, 'change');
    }

    LongTextComponent.prototype.attachedCallback = function () {
        this.attached = true;
        Element.clearDom(this);

        var regionElement = Element.build('section', this, ['fill'], {
            'data-bind': 'halt-bindings: {}'
        });

        this.region.setElement(regionElement);
        this.conductor.changeScreen(this.viewModel, this.region);
    };

    LongTextComponent.prototype.detachedCallback = function () {
        this.attached = false;
        this.conductor.clearScreen(this.region);
    };

    LongTextComponent.prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
        switch (attrName.toLocaleLowerCase()) {
            case 'isdisabled':
                this.viewModel.isDisabled(this.hasAttribute('isDisabled'));
                break;
            case 'invalid':
                this.viewModel.isValid(!this.hasAttribute('invalid'));
                break;
            case 'cssclass':
                this.viewModel.cssClass(newValue);
                break;
            case 'placeholdertext':
                this.viewModel.placeholderText(newValue);
                break;
            case 'caption':
                this.viewModel.caption(newValue);
                break;
        }
    };

    Element.registerElement('mi-long-text', { prototype: LongTextComponent.prototype });
    return LongTextComponent;
});