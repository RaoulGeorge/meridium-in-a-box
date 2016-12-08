define(function (require) {
    'use strict';

    var toastr = require('toastr');

    function Toast(options) {
        if (options) { toastr.options = options; }
    }

    Toast.prototype.info = function toast_info(message, title) {
        toastr.info(message,title);
    };

    Toast.prototype.warning = function toast_warning(message, title) {
        toastr.warning(message, title);
    };

    Toast.prototype.success = function toast_success(message, title) {
        toastr.success(message, title);
    };

    Toast.prototype.error = function toast_error(message, title) {
        toastr.error(message, title);
    };

    Toast.prototype.clear = function toast_clear() {
        toastr.clear();
    };

    return Toast;
});