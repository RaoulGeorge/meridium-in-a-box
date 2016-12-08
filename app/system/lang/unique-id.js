define(function (require) {
    'use strict';

    var uuid = require('uuid');

    function createV1() {
        return uuid.v1();
    }

    function createV4() {
        return uuid.v4();
    }

    return {
        createV1: createV1,
        createV4: createV4
    };
});