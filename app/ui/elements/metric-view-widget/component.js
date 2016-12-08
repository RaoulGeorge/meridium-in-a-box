define(function (require) {
    'use strict';

    var ko = require('knockout'),
        metricsWidgetVm = require('ui/elements/metric-view-widget/metric-widget-view-model');


    ko.components.register("metrics-widget", {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                return new metricsWidgetVm(params, componentInfo.element);
            }
        },
        template: { require: 'text!ui/elements/metric-view-widget/metric-widget-view.html' }
    });

});