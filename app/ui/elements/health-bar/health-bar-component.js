define(function(require) {
    'use strict';

    var Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        HealthBarViewModel = require('./health-bar-view-model'),
        HealthBarComponent = {};

    require('system/lang/object');

    HealthBarComponent.prototype = Object.create(HTMLElement.prototype);

    HealthBarComponent.prototype.createdCallback = function () {
        this.attached = false;
        this.conductor = Object.resolve(Conductor);
        this.region = new Region();
        this.viewModel = new HealthBarViewModel();

        this.settingsStr = Element.stringAttribute(this, 'settings');
    };

    HealthBarComponent.prototype.attachedCallback = function () {
        this.attached = true;
        Element.clearDom(this);

        var regionElement = Element.build('section', this, ['fill'], {
            'data-bind': 'halt-bindings: {}'
        });

        this.region.setElement(regionElement);
        this.conductor.changeScreen(this.viewModel, this.region);

        this.settingsStr = Element.stringAttribute(this, 'settings');
        this.viewModel.loadSettings(this.settingsStr);
    };

    HealthBarComponent.prototype.detachedCallback = function () {
        this.attached = false;
        this.conductor.clearScreen(this.region);
    };

    HealthBarComponent.prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
        Object.tryMethod(this, attrName + 'Changed', oldValue, newValue);
    };

    HealthBarComponent.prototype.settingsChanged = function(oldValue, newValue) {
        this.viewModel.loadSettings(newValue);
    };

    document.registerElement('mi-health-bar', { prototype: HealthBarComponent.prototype });
    return HealthBarComponent;
});
