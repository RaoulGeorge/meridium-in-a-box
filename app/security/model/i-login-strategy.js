define(function (require, exports, module) {
    'use strict';

    var Interface = require('system/lang/interface');

    return new Interface(module.id,
        [
            'start',
            'showPrompt',
            'login',
            'dispose',
            'getMeridiumResource',
            'setAjaxClientServerFromVm',
            'changePassword'],
        ['meridiumResourceLoaded', 'loginDeferred']);
});