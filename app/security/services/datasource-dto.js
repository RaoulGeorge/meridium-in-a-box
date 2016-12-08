define(function () {
    'use strict';
    var convert = require('system/lang/converter');

    function DatasourceDTO(data) {
        data = data || {};
        this.id = data.id || '';
        this.description = data.description || '';
        this.isDefault = data.isDefault || false;
        this.hostName = data.hostName || '*';
        this.databaseType = convert.toString(data.databaseType) || '';
        this.userId = data.userId || '';
        this.password = data.password || '';
        this.databaseName = data.databaseName || '';
        this.serverName = data.serverName || '';
        this.alias = data.alias || '';
        this.oraclehost = data.oracleHost || '';
        this.oracleport = data.oraclePort || '';
        this.oracleservice = data.oracleService || '';
        this.preloadcache = data.preLoadCache || false;
        this.isOffline = data.isOffline || false;
        this.displayName= this.description.length>0? this.description: this.id;
        this.shortDisplayName= this.description.length>0? this.description.length>25?this.description.substring(0,35) + '...':this.description:this.id.length>25?this.id.substring(0,35) + '...':this.id;
    }

    DatasourceDTO.fromDataCollection = function DatasourceDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new DatasourceDTO(dataCollection[i]);
        }
        return dtos;
    };

    return DatasourceDTO;
});