define(function (require) {
    'use strict';

    var WidgetControlPanel = require('dashboard/view-models/widget-control-panel'),
        Conductor = require('spa/conductor'),
        Region = require('spa/region'),
        Assert = require('mi-assert'),
        Property = require('system/lang/property');

    function WidgetControlPanelComponent() {
        Property.readOnly(this, 'viewModel', Object.resolve(WidgetControlPanel));
        Property.readOnly(this, 'conductor', Object.resolve(Conductor));
        Property.readOnly(this, 'region', Object.resolve(Region));
        Property.readOnly(this, 'widgetAdded', this.viewModel.widgetAdded);
        Property.readOnly(this, 'widgetUnhidden', this.viewModel.widgetUnhidden);
    }

    WidgetControlPanelComponent.prototype.bindToElement = function bindToElement(element) {
        Assert.instanceOf(element, HTMLElement);
        this.region.setElement(element);
    };

    WidgetControlPanelComponent.prototype.init = function init(dashboardContainer) {
        Assert.ok(dashboardContainer);
        this.conductor.changeScreen(this.viewModel, this.region, { positional: [dashboardContainer] });
    };

    WidgetControlPanelComponent.prototype.dispose = function dispose() {
        this.conductor.clearScreen(this.region);
    };

    WidgetControlPanelComponent.prototype.addHyperlinksWidget = function addHyperlinksWidget() {

    };

    return WidgetControlPanelComponent;
});