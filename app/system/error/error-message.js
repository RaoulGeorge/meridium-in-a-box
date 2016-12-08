define(["require", "exports"], function (require, exports) {
    "use strict";
    var ErrorMessage = (function () {
        function ErrorMessage(code, message, detail) {
            if (detail === void 0) { detail = null; }
            this.code = code;
            this.message = message;
            this.detail = detail;
        }
        return ErrorMessage;
    }());
    return ErrorMessage;
});
