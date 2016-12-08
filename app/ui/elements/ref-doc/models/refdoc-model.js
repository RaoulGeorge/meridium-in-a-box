define(function (require) {
    'use strict';
    var ko = require('knockout');

    function RefDoc(options) {
        options = options || {};
        this.name = options.name;
        this.desc = options.desc;
        this.addedBy = options.addedBy || '-';
        this.addedOn = options.addedOn || '-';
    }

    return RefDoc;
});