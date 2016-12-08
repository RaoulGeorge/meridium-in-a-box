define(function (require) {
    'use strict';

    var ko = require('knockout');

    ko.components.register("manage-privileges", {
        viewModel: { require: 'ui/elements/manage-privileges/manage-privileges-view-model' },
        template: { require: 'text!ui/elements/manage-privileges/manage-privileges-view.html' }
    });

});