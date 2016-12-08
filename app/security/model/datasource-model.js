define(function (require) {
    'use strict';

    var ko = require('knockout');
        
    function DataSourceModel(dto) {
        var self = this;
        dto = dto || {};
        this.id = dto.id;
        this.description = ko.observable(dto.description);
        this.isDefault = ko.observable(dto.isDefault);
        this.hostName = ko.observable(dto.hostName);
        this.databaseType = ko.observable(dto.databaseType);      
        
        this.userId = ko.observable(dto.userId);
        this.password = ko.observable(dto.password);
        this.databaseName = ko.observable(dto.databaseName);
        this.serverName = ko.observable(dto.serverName);
        this.alias = ko.observable(dto.alias);

        this.oraclehost = ko.observable(dto.oraclehost);
        this.oracleport = ko.observable(dto.oracleport);
        this.oracleservice = ko.observable(dto.oracleservice);
        this.preloadcache = ko.observable(dto.preloadcache);
        this.isOffline = ko.observable(dto.isOffline);
    }  

    return DataSourceModel;
});