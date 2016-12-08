define(function () {
    'use strict';

    function SessionDTO(data, apiServer) {
        this.datasourceId = data.datasourceId || '';
        this.cultureId = data.cultureId || '';
        this.userKey = data.userKey || '';
        this.id = data.sessionId;
        this.userId = data.userId;
        this.apiServer = apiServer;
        this.licensedCultureId = data.licensedCultureId;
        this.sessionTimeout = data.sessionTimeout;
        this.userSites = data.userSites;
        this.mustChangePassword = data.mustChangePassword;
    }

    return SessionDTO;
});