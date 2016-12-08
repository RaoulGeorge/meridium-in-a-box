define(function (require) {
    'use strict';

    var ko = require('knockout'),
        RiskActionCardViewModel = require('ui/elements/risk-action-card/risk-action-card-view-model');

    ko.components.register("mi-risk-action-card", {
        template: { require: 'text!ui/elements/risk-action-card/risk-action-card.html' },
        viewModel: {
            createViewModel: function(params, componentInfo) {
                return new RiskActionCardViewModel(params, componentInfo);
            }
        }        
    });

});