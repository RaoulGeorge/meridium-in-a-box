define(function (require) {
    'use strict';

    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationContext = require('application/application-context'),
        AssetContextService = require('assets/services/asset-context-service'),
        Promise = require('bluebird');

    function AssetContextTask() {
        Assert.implementsInterface(this, ITask, 'this');
        this.service = Object.resolve(AssetContextService);
    }

    AssetContextTask.prototype.execute = function () {
        getAssetHierarchyPreference(this)
            .then(setContext);
    };

    function setContext (newContext) {
        ApplicationContext.assetcontext = newContext;
    }

    function getAssetHierarchyPreference (self) {
        return Promise.resolve(self.service.getAssetContextPreference());
    }

    return AssetContextTask;
});
