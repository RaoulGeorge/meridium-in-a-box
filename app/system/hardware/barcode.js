define(function (require) {
    "use strict";

    var $ = require("jquery");


    function Barcode () {
    }

    Barcode.prototype.enabled = function Barcode_enabled() {
        return (typeof cordova !== 'undefined');
    };

    Barcode.prototype.scan = function Barcode_scan() {
        var dfd = $.Deferred();
        if (typeof cordova === 'undefined') {
            dfd.reject();
            return dfd.promise();
        }
        cordova.plugins.barcodeScanner.scan(getBarcode_success.bind(null, dfd), getBarcode_failure.bind(null, dfd));
        return dfd.promise();
    };

    function getBarcode_success (dfd, result) {
        dfd.resolve(result);
    }

    function getBarcode_failure (dfd, error) {
        dfd.reject(error);
    }

    return Barcode;
});
