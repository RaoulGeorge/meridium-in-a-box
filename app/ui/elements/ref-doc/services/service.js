define(function (require) {
    'use strict';

    var $ = require('jquery');

    require('system/lang/object');

    var AjaxClient = require('system/http/ajax-client'),
        REF_DOC_API_URL = '/meridium/api/common/referencedocuments/',
        METADATA_API_URL = '/meridium/api/core/metadata/',
        ENTITY_API_URL = '/meridium/api/core/entity/';

    function RefDocService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    RefDocService.dependsOn = [AjaxClient];

    //GET all refdocs
    RefDocService.prototype.getRefDocs = function (key) {
            var deferred = $.Deferred(),
                path = ENTITY_API_URL + 'refdoc/' + key;

            this.ajaxClient.get(path, {}).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err.statusText);
            });
            return deferred.promise();
        };

    //Unlink a refdoc from an entity
    RefDocService.prototype.unlinkRefDoc = function (entity, key) {
            var deferred = $.Deferred(),
                path = ENTITY_API_URL + 'refdocunlink/' + entity + '/' + key;

            this.ajaxClient.delete(path, {}).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err.statusText);
            });
            return deferred.promise();
        };

    //Add and link a refdoc to an entity
    RefDocService.prototype.addRefDoc = function (key, refdoc) {
            var deferred = $.Deferred(),
                path = ENTITY_API_URL + 'refdocinsertnlink/' + key,
                body = { 'refDoc': refdoc }, entity = refdoc;
            entity.entityModified = null;
            entity.entitySaved = null;
            entity.entityDeleted = null;
            this.ajaxClient.post(path, entity).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err.statusText);
            });
            return deferred.promise();
        };

    //Link a entity to refdoc
    RefDocService.prototype.linkRefDocEnntity = function (entityKey, RefDocKey) {
        var deferred = $.Deferred(),
                path = ENTITY_API_URL + 'refdoclink/' + entityKey + '/' + RefDocKey;

        this.ajaxClient.post(path).done(function (result) {
            deferred.resolve(result);
        }).fail(function (err) {
            deferred.reject(err.statusText);
        });
        return deferred.promise();
    };

    RefDocService.prototype.openRefDoc = function (key, refDocTypeDTO) {
        var dfd = $.Deferred(),
            path = REF_DOC_API_URL + 'refdocopen/' + key;

        this.ajaxClient.getBinary(path)
            .done(getRef_done.bind(null, refDocTypeDTO))
            .fail(getRef_fail.bind(null, dfd));

        return dfd.promise();
    };

    function getRef_done(refDocTypeDTO, data) {
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveOrOpenBlob(data, refDocTypeDTO.documentPath);
        } else if (typeof cordova !== 'undefined') {//mobile
            var fileName = extractFileName(refDocTypeDTO.documentPath);
            cordova.writeBinaryToLocalFile(data, fileName, cordova.openLocalFile.bind(null, fileName));
        } else {
            var testurl = window.URL.createObjectURL(data);
            window.open(testurl);
        }
    }

    function extractFileName(documentPath) {
        var splitArray = documentPath.split('\\');
        var fileName = splitArray[splitArray.length -1];
        return fileName;
    }

    function getRef_fail(dfd, e) {
        console.log(e);
        dfd.reject(e);
    }

    function open(strData, strMimeType) {
        var newdata = "data:" + strMimeType + ";base64," + escape(strData);
        //To open in new window
        window.open(newdata, "_blank");
        return true;
    }

    RefDocService.prototype.getRefDocType = function (key) {
            var deferred = $.Deferred(),
                path = REF_DOC_API_URL + 'refdoctype/' + key;

            this.ajaxClient.get(path, {}).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err.statusText);
            });
            return deferred.promise();
        };

    RefDocService.prototype.saveRefDoc = function (key, refdoc) {
            var deferred = $.Deferred(),
                path = ENTITY_API_URL, entity = refdoc;
            entity.entityModified = null;
            entity.entitySaved = null;
            entity.entityDeleted = null;
            this.ajaxClient.put(path, entity).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err.statusText);
            });
            return deferred.promise();
        };

    //Upload a ref doc attachment
    RefDocService.prototype.uploadRefDoc = function (refdocData, key) {
        var deferred = $.Deferred(),
            sessionId = JSON.parse(sessionStorage.getItem('meridium-session')).id,
            path = REF_DOC_API_URL + 'refdocupload/' + key,
            options;

        refdocData.append('sessionid', sessionId);

        options = { type: 'POST',
                    url: this.ajaxClient.baseUrl() + REF_DOC_API_URL + 'refdocupload/' + key,
                    data: refdocData,
                    cache: false,
                    contentType: false,
                    processData: false
        };

        $.ajax(options).done(function (response) {
            deferred.resolve(response);
        }).fail(function (jqXHR, status, errorThrown) {
            deferred.reject(status);
        });

        return deferred.promise();
    };



    RefDocService.prototype.getBaseUrl = function () {
        return this.ajaxClient.baseUrl();
    };

    RefDocService.prototype.refDocServerCredentialsExist = function () {
        var dfd = $.Deferred(),
                path = '/meridium/api/refdoc-server/config';

        this.ajaxClient.get(path)
                .done(getRefDocServerCredentials_done.bind(null, dfd))
                .fail(getRefDocServerCredentials_fail.bind(null, dfd));

        return dfd.promise();
    };

    //Get size of the stored reference document
    RefDocService.prototype.getRefDocSize = function RefDocService_getRefDocSize(key) {
        var dfd = $.Deferred();

        this.ajaxClient.get(REF_DOC_API_URL + 'refdocsize/' + key)
            .done(function (result) {
                dfd.resolve(result);
            })
            .fail(function () {
                dfd.reject();
            });

        return dfd.promise();
    };

    function getRefDocServerCredentials_done(dfd, data) {
        var result = false;
        if (data.userName !== "" && data.userPassword !== "") {
            result = true;
        }
        dfd.resolve(result);
    }

    function getRefDocServerCredentials_fail(dfd, data) {
        dfd.reject(data);
    }

    return RefDocService;
});
