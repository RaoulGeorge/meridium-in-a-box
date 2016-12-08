define(function () {
    'use strict';

    var $ = require('jquery');

    function throwError(originalError) {
        setTimeout(function () {
            throw originalError;
        }, 1);
    }

    var members = {
        throw: throwError
    };

    $.extend(Error, members);
    return members;
});