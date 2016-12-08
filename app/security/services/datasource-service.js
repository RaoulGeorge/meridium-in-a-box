define(function (require) {
    'use strict';

    var $ = require('jquery');

    var AjaxClient = require('system/http/ajax-client'),
        DatasourceDTO = require('./datasource-dto'),
        HostDTO = require('./host-dto'),
        HOST_URL = 'meridium/api/core/hostname',
        HOST_FILTERED_URL = 'meridium/api/core/hostname/filtered',
        DATASOURCE_URL = 'meridium/api/core/datasource',
        FULL_FILTEREDDATASOURCE_URL = 'meridium/api/core/datasourceFullFiltered',
        FILTEREDDATASOURCE_URL = 'meridium/api/core/datasourceFiltered';

    function DatasourceService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }
    
    DatasourceService.dependsOn = [AjaxClient];

    DatasourceService.prototype.getFilteredDatasources = function (host) {
        var hostName = host.toLowerCase().replace('https://', '').replace('http://', '');
        var querystring= host===undefined?'?host=*':'?host=' + hostName;
        var dfd = $.Deferred(), url = FILTEREDDATASOURCE_URL + querystring;
        this.ajaxClient.get(url
            ).done(function (data) {
                dfd.resolve(DatasourceDTO.fromDataCollection(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    DatasourceService.prototype.getFullFilteredDatasources = function (host) {
        // var querystring = loadFactor === undefined ? '?host-' + host + '' : '?loadFactor=1&host=' + host + '';
        var querystring= host===undefined?'?host=*':'?host=' + host;
        var dfd = $.Deferred(), url = FULL_FILTEREDDATASOURCE_URL + querystring;
        this.ajaxClient.get(url
        ).done(function (data) {
                dfd.resolve(DatasourceDTO.fromDataCollection(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };



    DatasourceService.prototype.getDatasources = function (loadFactor) {
         var querystring = loadFactor === undefined ? '': '?loadFactor=1';
        var dfd = $.Deferred(), url = DATASOURCE_URL + querystring;
        this.ajaxClient.get(url
        ).done(function (data) {
                dfd.resolve(DatasourceDTO.fromDataCollection(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    DatasourceService.prototype.getHosts = function (loadFactor) {
        var dfd = $.Deferred(), url = HOST_URL;
        this.ajaxClient.get(url
        ).done(function (data) {
            dfd.resolve(HostDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.getFilteredHost = function (hostName) {
        var querystring = '?host=' + hostName;
        var dfd = $.Deferred(), url = HOST_FILTERED_URL +  querystring;
        this.ajaxClient.get(url
        ).done(function (data) {
            dfd.resolve(HostDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.getHost = function (hostName) {
        var querystring = '?id=' + hostName;
        var dfd = $.Deferred(), url = HOST_URL + querystring;
        this.ajaxClient.get(url
            ).done(function (data) {
                dfd.resolve(new HostDTO(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    DatasourceService.prototype.putHost = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.put(HOST_URL, data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.deleteHost = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(HOST_URL + '?id=' + data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.testDatasource = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.post(DATASOURCE_URL + '/test', data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.postDatasource = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.post(DATASOURCE_URL, data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.postAndTestDatasource = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.post(DATASOURCE_URL + '/createandtest', data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.putDatasource = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.put(DATASOURCE_URL, data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    DatasourceService.prototype.deleteDatasource = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(DATASOURCE_URL + '?id=' + data.id
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    return DatasourceService;
});
