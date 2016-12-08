define(function (require) {
    'use strict';

    var ko = require('knockout');   

    ko.components.register("mi-schedule-editor", {
        viewModel: { require: 'ui/elements/schedule-editor/schedule-editor-view-model' },
        template: { require: 'text!ui/elements/schedule-editor/schedule-editor-view.html' }
    });

    ko.components.register("mi-schedule-summary", {
        viewModel: { require: 'ui/elements/schedule-editor/schedule-summary-view-model' },
        template: { require: 'text!ui/elements/schedule-editor/schedule-summary-view.html' }
    });
});