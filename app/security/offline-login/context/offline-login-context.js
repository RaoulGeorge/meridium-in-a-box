define(function() {
    'use strict';

    function OfflineLoginContext() {
        initialize(this);
    }

    function initialize(self) {
        self.user = {
            password: null
        };

        self.datasources = null;
        self.locale = null;
    }

    OfflineLoginContext.prototype.reset = function() {
        initialize(this);
    };

    return new OfflineLoginContext();
});