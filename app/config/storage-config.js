define(["require", "exports", "application/application-context"], function (require, exports, ApplicationContext) {
    "use strict";
    function documentStorage() {
        var session = ApplicationContext.session;
        var server = session.apiServer.toUpperCase();
        var datasource = session.datasourceId.toUpperCase();
        var userId = session.userId.toUpperCase();
        var name = 'Meridium APM(' + server + ', ' + datasource + ', ' + userId + ')';
        return { name: name, description: name };
    }
    exports.documentStorage = documentStorage;
});
