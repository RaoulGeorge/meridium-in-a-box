define(function (require) {
    'use strict';

    var ko = require('knockout'),
        RiskBarViewModel = require('ui/elements/risk-bar/risk-bar-view-model');

    ko.components.register("mi-risk-bar", {
        template: { require: 'text!ui/elements/risk-bar/risk-bar.html' },
        viewModel: {
            createViewModel: function(params, componentInfo) {
                return new RiskBarViewModel(params, componentInfo);
            }
        }        
    });

});