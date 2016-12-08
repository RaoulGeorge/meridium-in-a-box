define(function (require) {
    'use strict';

    var ko = require('knockout'),
        kpiWidgetVm = require('ui/elements/kpi-widget/kpi-widget-view-model');


    ko.components.register("kpi-widget", {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                return new kpiWidgetVm(params, componentInfo.element);
            }
        },
        template: { require: 'text!ui/elements/kpi-widget/kpi-widget-view.html' }
    });

});