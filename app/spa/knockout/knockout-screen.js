define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout');

    function KnockoutScreen(vm, view) {
        this.vm = vm;
        this.view = view;
    }

    KnockoutScreen.prototype.load = function userScreen_activate() {
        // do nothing
    };

    KnockoutScreen.prototype.activate = function userScreen_activate() {
        // do nothing
    };

    KnockoutScreen.prototype.attach = function userScreen_attach(region) {
        region.attach($(this.view));
        ko.applyBindingsToDescendants(this.vm, region.element);
    };

    KnockoutScreen.prototype.detach = function userScreen_detach(region) {
        ko.cleanNode(region.element);
        region.clear();
    };

    KnockoutScreen.prototype.deactivate = function userScreen_deactivate() {
        // do nothing
    };

    return KnockoutScreen;
});