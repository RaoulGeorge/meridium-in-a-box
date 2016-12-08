define(["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    var KnockoutViewModel = (function () {
        function KnockoutViewModel(view) {
            this.view = view;
            this.subscriptions = [];
            this.preserveContext = false;
        }
        KnockoutViewModel.prototype.attach = function (region) {
            region.attach($(this.view));
            var regionNode = region.element;
            if (ko.contextFor(regionNode) && this.preserveContext) {
                var childBindingContext = ko.contextFor(regionNode).createChildContext(this);
                ko.applyBindingsToDescendants(childBindingContext, regionNode);
            }
            else {
                ko.applyBindingsToDescendants(this, regionNode);
            }
        };
        KnockoutViewModel.prototype.detach = function (region) {
            ko.cleanNode(region.element);
            region.clear();
        };
        return KnockoutViewModel;
    }());
    return KnockoutViewModel;
});
