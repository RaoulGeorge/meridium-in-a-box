define(function (require) {
    'use strict';

    var $ = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        DatasourceService = require('security/services/datasource-service'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        DatasourceDTO = require('security/services/datasource-dto'),
        ErrorMessage = require('system/error/error-message'),
        ApplicationEvents = require('application/application-events'),
        DialogViewModel = require('system/ui/dialog-view-model'),
        view = require('text!../views/create-datasource-dialog.html');

    function CreateDatasourceDialog(kom, datasourceService, applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.translator = Object.resolve(Translator);
        this.datasourceService = datasourceService;
        this.applicationEvents = applicationEvents;
        this.dialog = null;

        // observables
        this.datasource = null;
        this.isOracle = null;
        this.isSqlServer = null;
        this.isNew = null;
    }

    var base = Object.inherit(KnockoutViewModel, CreateDatasourceDialog);
    CreateDatasourceDialog.dependsOn = [KnockoutManager, DatasourceService, ApplicationEvents];

    CreateDatasourceDialog.prototype.load = function createDatasourceDialog_load() {
        var dfd = new $.Deferred();

        this.datasource = this.kom.observable();
        this.isOracle = this.kom.observable(true);
        this.isSqlServer = this.kom.observable(false);
        this.isNew = this.kom.observable(true);
        this.datasource(new DatasourceDTO());
        return dfd.promise();
    };

    CreateDatasourceDialog.prototype.activate = function createDatasourceDialog_activate() {
    };

    CreateDatasourceDialog.prototype.deactivate = function createDatasourceDialog_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    CreateDatasourceDialog.prototype.unload = function createDatasourceDialog_deactivate() {
        this.kom.disposeObservables();
    };

    ////////////////////
    // API
    ////////////////////

    CreateDatasourceDialog.prototype.show =
        function CreateDatasourceDialog_show() {
            var options = { height: '80%', width: '80%' };

            this.dfd = $.Deferred();

            this.dialog = new DialogViewModel(this, this.translate('CREATE_DATASOURCE_DLG_TITLE'), options);
            this.dialog.show();

            return this.dfd.promise();
        };

    CreateDatasourceDialog.prototype.close =
        function CreateDatasourceDialog_close() {
            // Provides a way to close the dialog from code.
            this.dialog = null;
        };

    // Behavior

    CreateDatasourceDialog.prototype.saveItem = function createDatasourceDialog_save() {
        var self = this;
        var dfd = this.dfd;

        self.datasource().id = self.datasource().id.trim();
        self.datasource().description = self.datasource().description.trim();
        self.datasource().hostName = self.datasource().hostName.trim();
        self.datasource().userId = self.datasource().userId.trim();
        self.datasource().serverName = self.datasource().serverName.trim();
        self.datasource().databaseName = self.datasource().databaseName.trim();
        self.datasource().alias = self.datasource().alias.trim();
        self.datasource().oraclehost = self.datasource().oraclehost.trim();
        self.datasource().oracleport = self.datasource().oracleport.trim();
        self.datasource().oracleservice = self.datasource().oracleservice.trim();

        if (self.isNew()) {
            if (self.datasource().hostName === "") {
                self.datasource().hostName = "*";
            }
            self.datasourceService.postAndTestDatasource(self.datasource())
                .done(post_done.bind(null, self, dfd))
                .fail(handleErrorMsg.bind(null, self));
        }
        return dfd.promise();
    };

    CreateDatasourceDialog.prototype.selectedType = function (data) {
        var type = this.datasource().databaseType;
        if (type === undefined) {
            return;
        }
        //WI 79448        
        this.isOracle( type === '0');
        this.isSqlServer(type === '1');        
    };

    CreateDatasourceDialog.prototype.cancel =
        function CreateDatasourceDialog_cancel() {
            this.dialog.closeDialog();
        };

    CreateDatasourceDialog.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    // Implementation

    function post_done(self) {
        self.isNew(false);
        self.dfd.resolve();
        self.dialog.closeDialog();
    }

    function handleErrorMsg(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    return CreateDatasourceDialog;
});
