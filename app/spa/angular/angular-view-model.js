define(function(require) {
    "use strict";

    var ko = require('knockout');
        function AngularViewModel(view) {
            this.view = view;
            this.subscriptions = [];
            this.preserveContext = false;
        }
        AngularViewModel.prototype.attach = function (region) {
            region.angularAttach($(this.view));

            

            var regionNode = region.element;
            // if (ko.contextFor(regionNode) && this.preserveContext) {
            //     var childBindingContext = ko.contextFor(regionNode).createChildContext(this);
            //     ko.applyBindingsToDescendants(childBindingContext, regionNode);
            // }
            // else {
            //     ko.applyBindingsToDescendants(this, regionNode);
            // }
        };
        AngularViewModel.prototype.detach = function (region) {
            // ko.cleanNode(region.element);
            region.clear();
        };

    return AngularViewModel;
});
