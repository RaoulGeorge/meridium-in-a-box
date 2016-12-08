(function main() {
    'use strict';
    var THIRD_PARTY_GLOBALS = ['bluebird'],
        APPLICATION_GLOBALS = ['system/lang/object', 'system/lang/element', 'bootstrap'];

    function onThirdPartyGlobalsRequired(bluebird) {
        initializeThirdPartyGlobals(bluebird);
        require(APPLICATION_GLOBALS, onApplicationGlobalsRequired);
    }

    function initializeThirdPartyGlobals(bluebird) {
        bluebird.config({
            warnings: false
        });
        window.Promise = bluebird;
    }

    function onApplicationGlobalsRequired() {
        require([
            'application/application'
        ], initializeApplication);
    }

    function initializeApplication(Application) {
        var application = Object.resolve(Application);
        application.activate()
            .then(attachApplication.bind(null, application));
    }

    function attachApplication(application) {
        application.attach(document.querySelector('body'));
    }

    require(THIRD_PARTY_GLOBALS, onThirdPartyGlobalsRequired);
}());
