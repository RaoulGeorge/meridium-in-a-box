define(function (require) {
    'use strict';

    var ko = require('knockout');

    function FieldModel(type, caption) {
        this.type = ko.observable(type);
        this.caption = ko.observable(caption);
        this.value = ko.observable();
    }

    return FieldModel;
});