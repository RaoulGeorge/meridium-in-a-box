define(function (require, exports, module) {
    'use strict';

    var Interface = require('system/lang/interface');
    return new Interface(module.id, ['activate', 'resolve', 'deactivate'], ['routerConfig', 'matchedRoute']);
});