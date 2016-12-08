define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function RefDocPathDTO(data) {
        data = data || {};

        this.isStored = convert.toBoolean(data.isStored);
        this.isUrl = convert.toBoolean(data.isUrl);
        this.isUnc = convert.toBoolean(data.isUnc);
        this.path = convert.toString(data.path);
        this.formData = convert.toObject(data.formData, null);
    }

    return RefDocPathDTO;
});