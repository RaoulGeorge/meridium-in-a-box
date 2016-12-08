/* global define */
define(function(require, exports, module) {
    "use strict";
    var LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        whitelistedPlatformsJson = require('text!system/hardware/browser-sniffer/config/whitelisted-platforms.json'),
        supportedPlatformsJson = require('text!system/hardware/browser-sniffer/config/supported-platforms.json'),
        Detect = require('../../../../lib/detect'),
        Device = require('system/hardware/device');

    function BrowserSniffer(userAgent) {
        this.userAgent = userAgent;
        this.parsedUserAgent = Detect.parse(this.userAgent);
    }

    BrowserSniffer.prototype.isSupportedPlatform = function() {
        if (searchForSupportedPlatforms(this)) {
            return true;
        }

        if (searchForWhitlistedPlatforms(this)) {
            return true;
        }

        logUnsupportedBrowser(this);

        return false;
    };

    function searchForSupportedPlatforms(self) {
        var supportedPlatformsObject = JSON.parse(supportedPlatformsJson),
            supportedPlatforms = supportedPlatformsObject.platforms;

        for (var i = 0; i < supportedPlatforms.length; i++) {
            if (hasPlatformSupport(self, supportedPlatforms[i])) {
                return true;
            }
        }
    }

    function searchForWhitlistedPlatforms(self) {
        var whitelistedPlatformsObject = JSON.parse(whitelistedPlatformsJson),
            whitelistedPlatforms = whitelistedPlatformsObject.platforms;

        for (var i = 0; i < whitelistedPlatforms.length; i++) {
            if (userAgentIsWhitelisted(self, whitelistedPlatforms[i])) {
                return true;
            }
        }
    }

    function hasPlatformSupport(self, supportedPlatform) {
        var platform = supportedPlatform.platform,
            version = supportedPlatform.version,
            isSupported = userAgentMatchesPlatform(self, platform, version);

        return isSupported;
    }

    function userAgentIsWhitelisted(self, platform) {
        if (platform) {
            var userAgent = platform.userAgent,
                isSupported = (userAgent === self.userAgent);

            return isSupported;
        }

        return false;
    }

    function userAgentMatchesPlatform(self, platform, version) {
        var device = new Device();

        if (device.isMobileApp() && !device.isWindowsApp()) {
            return hasPlatformMatch(platform, version, self.parsedUserAgent.os);
        } else {
            return hasPlatformMatch(platform, version, self.parsedUserAgent.browser);
        }
    }

    function hasPlatformMatch(platform, version, parsedUserAgentPlatform) {
        if (userAgentHasVersionAndFamily(parsedUserAgentPlatform)) {
            return detectHasMatchingPlatform(platform, version, parsedUserAgentPlatform);
        }

        //detect.js can't find platform version or platform family in the user agent string, assume that user has a supported platform
        return true;
    }

    function userAgentHasVersionAndFamily(parsedPlatformObject) {
        return parsedPlatformObject.version && parsedPlatformObject.family;
    }

    function detectHasMatchingPlatform(platform, version, parsedPlatformObject) {
        return detectHasMatchingFamily(platform, parsedPlatformObject.family) && detectHasMatchingVersion(version, parsedPlatformObject.version);
    }

    function detectHasMatchingFamily(platform, family) {
        return family.toUpperCase() === platform.toUpperCase();
    }

    function detectHasMatchingVersion(supportedVersion, currentBrowserVersion) {
        return parseFloat(supportedVersion) <= parseFloat(currentBrowserVersion);
    }

    function logUnsupportedBrowser(self) {
        logger.error('Unsupported browser.  User Agent: ' + self.userAgent);
    }

    return BrowserSniffer;
});