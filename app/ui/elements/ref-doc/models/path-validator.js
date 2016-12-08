define(function (require) {
    'use strict';

    require('system/lang/object');

    function PathValidator(){

    }

    PathValidator.prototype.isValidUrl = function isValidUrl(testStr) {
        var regexHTTP = /^http:\/\//;
        var regexHTTPS = /^https:\/\//;

        // Validate overall length
        if ((testStr === null) || (testStr === undefined) || (testStr === "") || (testStr.length === 0)) {
            return false;
        }
        else if (regexHTTP.test(testStr) || regexHTTPS.test(testStr)) {
            return true;
        }
        else {
            // Does not start with http:// or https://
            return false;
        }
    };

    PathValidator.prototype.isValidUncPath = function isValidUncPath(testStr) {
        var regexUncStart = /^\\\\/;

        if ((testStr === null) || (testStr === undefined) || (testStr === "") || (testStr.length === 0)) {
                return false;
        }

        // Validate overall length
        if ((testStr === "") || (testStr.length === 0) || (testStr.length > 32767)) {
            return false;
        }
        else if (regexUncStart.test(testStr)) {
            // At this point we know it at least starts with \\
            // Trim off the \\
            var workingStr = testStr.replace(/^(\\\\)/, "");

            // Check for missing Hostname
            if (workingStr.length === 0) {
                return false;
            }

            // Path cannot end with a space, period, or a backslash
            var regexInvalidEnding = /[. \\]$/;
            if (regexInvalidEnding.test(workingStr)) {
                return false;
            }

            // Split the remaining string on slashes \
            var splitOnSlashesArray = workingStr.split("\\");
            if (splitOnSlashesArray.length === 0) {
                // Hostname was missing
                return false;
            }

            // Validate the hostname name can be NETBIOS name, fully qualified domain name, server name, or IP address
            // It cannot contain any of the following reserved characters < > : " / | ? *
            var hostname = splitOnSlashesArray[0];
            var reservedChars = /[<>:"/|?*]/;
            if (reservedChars.test(hostname)) {
                return false;
            }

            // Validate each subfolder for file name
            splitOnSlashesArray.splice(0, 1);
            for (var i = 0; i < splitOnSlashesArray.length; i++) {
                // They cannot contain any of the following reserved characters < > : " / | ? * either
                var folderOrFilename = splitOnSlashesArray[i];
                if (reservedChars.test(folderOrFilename)) {
                    return false;
                }
            }

            // Everything checks out good
            return true;
        }
        else {
            // Does not start with \\
            return false;
        }
    };

    return PathValidator;
});