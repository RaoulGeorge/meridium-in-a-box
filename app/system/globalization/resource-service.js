define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ResourceFile = require('./resource-file'),
        AjaxClient = require('system/http/ajax-client'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        GlobalizeResourceFile = require('./globalize-resource-file'),
        DateTimeResourceFile = require('./datetime-resource-file'),
        MERIDIUM_RESOURCES_PATH = 'i18n/resources',
        GLOBALIZE_RESOURCES_PATH = 'i18n/globalize',
        DATETIME_RESOURCES_PATH = 'i18n/datetime';

    function ResourceService(meridiumResourcePath, libraryResourcePaths) {
        this.meridiumResourcePath = meridiumResourcePath || '';
        this.libraryResourcePaths = libraryResourcePaths || {};
    }

    ResourceService.factory = function () {
        return new ResourceService(MERIDIUM_RESOURCES_PATH, {
            globalize: GLOBALIZE_RESOURCES_PATH,
            datetime: DATETIME_RESOURCES_PATH
        });
    };

    ResourceService.prototype.getMeridiumResource = function (cultureList, dfd) {
        var resourceFile = new ResourceFile(cultureList.next());
        dfd = dfd || $.Deferred();
        getMeridiumResourceFile(this, resourceFile)
            .done(getMeridiumResourceFile_done.bind(null, this, dfd, cultureList, resourceFile))
            .fail(getMeridiumResourceFile_fail.bind(null, this, dfd, cultureList, resourceFile));
        return dfd.promise();
    };

    ResourceService.prototype.getGlobalizeResource = function (cultureList, dfd) {
        var resourceFile = new GlobalizeResourceFile(cultureList.next());
        dfd = dfd || $.Deferred();
        if (resourceFile.culture !== '' && resourceFile.culture !== 'en') {
            getGlobalizeResourceFile(this, resourceFile)
                .done(function () {
                    logger.debug('Loaded resource file', resourceFile.name());
                    dfd.resolve(resourceFile.culture);
                })
                .fail(getGlobalizeResourceFile_fail.bind(null, this, dfd, cultureList, resourceFile));
        } else {
            dfd.resolve('en');
        }

        return dfd.promise();
    };

    ResourceService.prototype.getDateTimeResource = function (cultureList, dfd) {
        var resourceFile = new DateTimeResourceFile(cultureList.next());
        dfd = dfd || $.Deferred();
        if (resourceFile.culture !== '' && resourceFile.culture !== 'en') {
            getDateTimeResourceFile(this, resourceFile)
                .done(function () {
                    logger.debug('Loaded resource file', resourceFile.name());
                    dfd.resolve(resourceFile.culture);
                })
                .fail(getDateTimeResourceFile_fail.bind(null, this, dfd, cultureList, resourceFile));
        } else {
            dfd.resolve('en');
        }

        return dfd.promise();
    };

    function getMeridiumResourceFile(self, resourceFile) {
        var ajaxClient = Object.resolve(AjaxClient),
            path = ajaxClient.baseUrl();
        path = path ? path + 'meridium/' + self.meridiumResourcePath : self.meridiumResourcePath;
        return $.ajax({
            url: resourceFile.url(path),
            type: 'GET',
            dataType: 'json',
            timeout: 30000,
            cache: true
        });
    }

    function getMeridiumResourceFile_done(self, dfd, cultureList, resourceFile, response) {
        if (_.isObject(response)) {
            logger.debug('Loaded resource file', resourceFile.name());
            dfd.resolve(response);
        } else {
            getMeridiumResourceFile_fail(self, dfd, cultureList, resourceFile);
        }
    }

    function getMeridiumResourceFile_fail(self, dfd, cultureList, resourceFile) {
        logger.debug('Could not find resource file', resourceFile.name());
        if (cultureList.cultures.length) {
            self.getMeridiumResource(cultureList, dfd);
        } else {
            dfd.reject('No resource file found');
        }
    }

    function getGlobalizeResourceFile(self, resourceFile) {
        return $.ajax({
            url: resourceFile.url(self.libraryResourcePaths.globalize),
            dataType: 'script',
            cache: true
        });
    }

    function getGlobalizeResourceFile_fail(self, dfd, cultureList, resourceFile) {
        logger.debug('Could not find resource file', resourceFile.name());
        if (cultureList.cultures.length) {
            self.getGlobalizeResource(cultureList, dfd);
        } else {
            dfd.reject('No resource file found');
        }
    }

    function getDateTimeResourceFile(self, resourceFile) {
        var dfd = $.Deferred();
        require([resourceFile.url(self.libraryResourcePaths.datetime)], function () {
            dfd.resolve();
        }, function () {
            dfd.reject();
        });
        return dfd.promise();
    }

    function getDateTimeResourceFile_fail(self, dfd, cultureList, resourceFile) {
        logger.debug('Could not find resource file', resourceFile.name());
        if (cultureList.cultures.length) {
            self.getDateTimeResource(cultureList, dfd);
        } else {
            dfd.reject('No resource file found');
        }
    }

    return ResourceService;
});