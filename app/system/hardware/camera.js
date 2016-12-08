define(function (require) {
    "use strict";

    var $ = require("jquery");


    function CameraAPI () {
        if (navigator.camera !== undefined) {
            this.option = {
                cameraDirection: Camera.Direction.BACK,
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL
            };
        }
    }

    CameraAPI.prototype.enabled = function CameraAPI_enabled() {
        return navigator.camera !== undefined;
    };

    CameraAPI.prototype.getPicture = function CameraAPI_getPicture() {
        var dfd = $.Deferred();
        if (navigator.camera === undefined) {
            dfd.reject();
            return dfd.promise();
        }
        navigator.camera.getPicture(getPicture_success.bind(null, dfd), getPicture_failure.bind(null, dfd), this.option);
        return dfd.promise();
    };

    function getPicture_success (dfd, image) {
        dfd.resolve(image);
    }

    function getPicture_failure (dfd, message) {
        dfd.reject(message);
    }

    return CameraAPI;
});
