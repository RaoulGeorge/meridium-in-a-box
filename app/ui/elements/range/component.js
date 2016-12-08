define(function (require) {
    'use strict';
    var Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        RangeViewModel = require('./view-model'),
        RangeComponent = {};

    require('system/lang/object');
    require('./drag-binding');

    RangeComponent.prototype = Object.create(HTMLElement.prototype);

    RangeComponent.prototype.createdCallback = function () {
        this.attached = false;
        this.conductor = Object.resolve(Conductor);
        this.region = new Region();
        this.viewModel = new RangeViewModel();

        var self = this;

        Element.defineProperty(this, 'min', {
            get: this.viewModel.min,
            set: validateAndSetNumericValue.bind(null, this.viewModel.min)
        });

        Element.defineProperty(this, 'max', {
            get: this.viewModel.max,
            set: validateAndSetNumericValue.bind(null, this.viewModel.max)
        });

        Element.defineProperty(this, 'step', {
            get: this.viewModel.step,
            set: validateAndSetNumericValue.bind(null, this.viewModel.step)
        });

        Element.defineProperty(this, 'valueFormat', {
            get: this.viewModel.valueFormat,
            set: this.viewModel.valueFormat
        });

        Element.defineProperty(this, 'barStartColor', {
            get: this.viewModel.barStartColor,
            set: this.viewModel.barStartColor
        });

        Element.defineProperty(this, 'barEndColor', {
            get: this.viewModel.barEndColor,
            set: this.viewModel.barEndColor
        });

        Element.defineProperty(this, 'landscape', {
            get: this.viewModel.landscape,
            set: function(newValue) {

                if (newValue === undefined || newValue === null) {
                    return;
                }

                self.viewModel.landscape(newValue);
            }
        });

        Element.defineProperty(this, 'rtl', {
            get: this.viewModel.rtl,
            set: function (newValue) {

                if (newValue === undefined || newValue === null) {
                    return;
                }

                self.viewModel.rtl(newValue);
            }
        });

        Element.defineProperty(this, 'value', {
            get: this.viewModel.value,
            set: this.viewModel.value
        });

        this.viewModel.value.subscribe(value_changed.bind(null, this));
    };

    function validateAndSetNumericValue(observableToSet, newValue) {
        var val = newValue;

        if (isNaN(val)) {
            val = 0;
        }

        observableToSet(val);
    }

    function value_changed(self, value) {
        Element.raiseEvent(self, 'change');
    }

    RangeComponent.prototype.attachedCallback = function () {
        this.attached = true;
        Element.clearDom(this);

        var regionElement = Element.build('section', this, ['fill'], {
            'data-bind': 'halt-bindings: {}'
        });

        this.region.setElement(regionElement);
        this.conductor.changeScreen(this.viewModel, this.region);

        this.viewModel.afterPointMoved.add(this.afterPointMoved, this);
        this.viewModel.rangeBarClicked.add(this.rangeBarClicked, this);
    };

    RangeComponent.prototype.afterPointMoved = function(rangePoint) {
        Element.raiseEvent(this, 'afterPointMoved', {
            point: rangePoint
        });
    };
    RangeComponent.prototype.rangeBarClicked = function(value) {
        Element.raiseEvent(this, 'rangeBarClicked', {
            valueAtPoint: value
        });
    };

    RangeComponent.prototype.detachedCallback = function () {
        this.viewModel.afterPointMoved.remove(this);
        this.viewModel.rangeBarClicked.remove(this);

        this.attached = false;
        this.conductor.clearScreen(this.region);
    };

    RangeComponent.prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
        Object.tryMethod(this, attrName + 'Changed', oldValue, newValue);
    };

    Element.registerElement('mi-range', { prototype: RangeComponent.prototype });
    return RangeComponent;
});