define(function (require) {
    'use strict';

    var $ = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        DatasourceService = require('security/services/datasource-service'),
        datasourceAdapter = require('../adapters/datasource-adapter'),        
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        DatasourceDTO = require('security/services/datasource-dto'),
        ErrorMessage = require('system/error/error-message'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context'),
        OperationsManagerEvents = require('operations-manager/operations-manager-events'),
        MessageBox = require('system/ui/message-box'),
        view = require('text!../views/datasource.html');

    function DatasourceViewModel(kom, datasourceService, applicationEvents) {
        base.call(this, view);
        this.kom = kom;
        this.translator = Object.resolve(Translator);
        this.datasourceService = datasourceService;
        this.applicationEvents = applicationEvents;
        this.apiServer = this.kom.observable(location.host);
        // Manually "select" the datasource based on some user action
        this.selectDatasource = false;

        // observables
        this.datasources = null;        
        this.selectedDataSource = null;
        this.selectedDataSourcedto = null;
        this.isOracle = null;
        this.isManaged = null;
        this.isAlias = false;
        this.isSqlServer = null;
        this.isNew = null;
        this.isInitial = null;
        this.isDirty = null;
        this.isLoading = null;
        this.titleChanged = Object.resolve(OperationsManagerEvents).titleChanged;
    }

    var base = Object.inherit(KnockoutViewModel, DatasourceViewModel);
    DatasourceViewModel.dependsOn = [KnockoutManager, DatasourceService, ApplicationEvents];

    DatasourceViewModel.prototype.open =
        function viewModel_open() {
            this.titleChanged.raise(this.translator.translate('SEC_SHELL_DATA_SOURCES'));
        };

    DatasourceViewModel.prototype.load = function datasourceViewModel_load() {
        var dfd = new $.Deferred();

        this.datasources = this.kom.observableArray();
        this.isOracle = this.kom.observable(false);
        this.isManaged = this.kom.observable(false);
        this.isAlias = this.kom.observable(false);
        this.isSqlServer = this.kom.observable(false);
        this.isNew = this.kom.observable(true);
        this.isInitial = this.kom.observable(true);
        this.isDirty = this.kom.observable(false);
        this.selectedDataSourcedto = this.kom.observable();
        this.selectedDataSource = this.kom.observable();
        this.selectedDataSource(datasourceAdapter.toModelObject( new DatasourceDTO()));
        this.selectedDataSource().hostName("*");
        this.isLoading = this.kom.observable();

        this.datasourceService.getFullFilteredDatasources(this.apiServer())
            .done(get_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));

        return dfd.promise();
    };

    DatasourceViewModel.prototype.activate = function datasourceViewModel_activate() {
        ApplicationContext.help.isAdmin = true;
        ApplicationContext.help.helpContext = '../Subsystems/Operations/Content/DataSources.htm';
    };

    DatasourceViewModel.prototype.deactivate = function datasourceViewModel_deactivate() {
        this.kom.disposeSubscriptions();
        this.kom.disposeComputeds();
    };

    DatasourceViewModel.prototype.unload = function datasourceViewModel_deactivate() {
        this.kom.disposeObservables();
    };

    DatasourceViewModel.prototype.canUnload = function canUnload() {     
        var dfd = $.Deferred();
        // If we return false, it should prevent the app from navigating away
        // from the current URL.  This should work for navigation triggered by the
        // app OR by the browser (i.e. refresh, back, forward browser buttons).
        if (this.isDirty()) {
            // Prompt the user to lose changes.
            promptLoseChanges(this, confirmTabUnload_done.bind(null, this, dfd));
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    };

    DatasourceViewModel.prototype.attach =
        function roleViewModel_attach(region) {
            base.prototype.attach.call(this, region);
            this.region = region;



            this.breadcrumb = region.$element.find('mi-breadcrumb')[0];
            Element.upgrade(this.breadcrumb);
            this.breadcrumb.loader = this.breadcrumbLoader.bind(this);
            this.breadcrumb.selectedCallback = this.breadcrumbSelectedCallback.bind(this);

        };

    DatasourceViewModel.prototype.detach =
        function roleViewModel_detach(region) {
            base.prototype.detach.call(this, region);

        };
    // Behavior
    DatasourceViewModel.prototype.newItem = function datasourceViewModel_new() {
        var self = this;      
        this.selectedDataSource(datasourceAdapter.toModelObject(new DatasourceDTO()));
        this.selectedDataSource().hostName("*");
        this.selectedDataSourcedto(new DatasourceDTO());
        this.isNew(true);
        this.isInitial(false);
        this.isDirty(true);
    };

    DatasourceViewModel.prototype.saveItem = function datasourceViewModel_save() {
        var self = this;
        var dfd = new $.Deferred();

        if (this.selectedDataSource().databaseType() === "1") {
            if (this.selectedDataSource().serverName().trim() === "") {
                MessageBox.showOk(this.translate("DATASOURCE_SERVERNAME_REQUIRED"), this.translate("ERROR"));
                return;
            }
            if (this.selectedDataSource().databaseName().trim() === "") {
                MessageBox.showOk(this.translate("DATASOURCE_DATABASENAME_REQUIRED"), this.translate("ERROR"));
                return;
            }
        }
        else {
            if (this.selectedDataSource().alias().trim() === "") {
                if (this.selectedDataSource().oraclehost().trim() === "" ||
                    this.selectedDataSource().oracleport().trim() === "" ||
                    this.selectedDataSource().oracleservice().trim() === "") {
                    MessageBox.showOk(this.translate("DATASOURCE_ALIASOROTHERS_REQUIRED"), this.translate("ERROR"));
                    return;
                }
            }
        }

        if (this.selectedDataSource().isOffline()) {
            if (ApplicationContext.session.datasourceId === this.selectedDataSource().id) {
                MessageBox.showOk(this.translate("DATASOURCE_CANNOTOFFLINE_INUSE"), this.translate("ERROR"));
                return;
            }
        }

        this.selectedDataSource().id = this.selectedDataSource().id.trim();        
        this.selectedDataSource().description(this.selectedDataSource().description().trim());
        this.selectedDataSource().hostName(this.selectedDataSource().hostName().trim());
        this.selectedDataSource().userId(this.selectedDataSource().userId().trim());
        this.selectedDataSource().serverName(this.selectedDataSource().serverName().trim());
        this.selectedDataSource().databaseName(this.selectedDataSource().databaseName().trim());
        this.selectedDataSource().alias(this.selectedDataSource().alias().trim());
        this.selectedDataSource().oraclehost(this.selectedDataSource().oraclehost().trim());
        this.selectedDataSource().oracleport(this.selectedDataSource().oracleport().trim());
        this.selectedDataSource().oracleservice(this.selectedDataSource().oracleservice().trim());

        if (this.selectedDataSource().hostName() === "") {
            this.selectedDataSource().hostName("*");
        }
        this.selectDatasource = true;
        this.isLoading(true);
        if (self.isNew()) {
            this.datasourceService.postDatasource( datasourceAdapter.toDTO(this.selectedDataSource()))
                .done(post_done.bind(null, this, dfd))
                .fail(handleErrorMsg.bind(null, this));
        }
        else {
          
            this.datasourceService.putDatasource(datasourceAdapter.toDTO(this.selectedDataSource()))
                .done(put_done.bind(null, this, dfd))
                .fail(handleErrorMsg.bind(null, this));
        }
        return dfd.promise();
    };

    DatasourceViewModel.prototype.revertItem = function (data, event) {
        var self = this;
        var dfd = new $.Deferred();

        this.datasourceService.getFullFilteredDatasources(this.apiServer())
            .done(get_done.bind(null, this, dfd))
            .fail(handleErrorMsg.bind(null, this));
              
        this.selectedDataSource(datasourceAdapter.toModelObject(new DatasourceDTO()));
        this.selectedDataSource().hostName("*");

        this.isNew(true);

        return dfd.promise();
    };

    DatasourceViewModel.prototype.deleteItem = function () {

        if (this.isNew()) {
            this.isNew(false);
            this.isInitial(true);
            this.isDirty(false);
            return;
        }

        if (ApplicationContext.session.datasourceId === this.selectedDataSource().id.trim()) {
            MessageBox.showOk(this.translate("DATASOURCE_CANNOTDELETE_INUSE"), this.translate("ERROR"));
            return;
        }

        var self = this;
        var title = self.translate('DATASOURCE_CAPTION');
        var dfd = new $.Deferred();

        var confirmMsg = this.translator.translate('DATA_SOURCE_CONFIRM_DELETE');

        MessageBox.showYesNo(confirmMsg, title).done(function (buttonClicked) {
            if (buttonClicked === 0) {
                self.datasourceService.deleteDatasource(datasourceAdapter.toDTO(self.selectedDataSource()))
                .done(delete_done.bind(null, self, dfd, datasourceAdapter))
                .fail(handleErrorMsg.bind(null, self));
            }
        });

        return dfd.promise();
    };    
    DatasourceViewModel.prototype.onChanges = function () {
        this.isDirty(true);
    };

    DatasourceViewModel.prototype.onAliasChanged = function () {
        this.isDirty(true);
        setOracle(this);
    };

    DatasourceViewModel.prototype.onManagedChanged = function () {
        this.isDirty(true);
        setOracle(this);
    };

    DatasourceViewModel.prototype.testItem = function () {
        var self = this;

        var dfd = new $.Deferred();
        this.datasourceService.testDatasource(datasourceAdapter.toDTO(this.selectedDataSource()))
            .done(test_done.bind(null, self, dfd))
            .fail(handleErrorMsg.bind(null, self));

        return dfd.promise();
    };
    function datasourceSelection_done(self, data, buttonClicked) {
        if (buttonClicked === 0) {
            if (data.databaseType === "") {
                data.databaseType = "0";
            }            
            self.selectedDataSource(datasourceAdapter.toModelObject(data));
            self.selectedDataSourcedto(data);
            self.isInitial(false);
            self.isDirty(false);
            self.isNew(false);
            self.isOracle(data.databaseType.toString() === '0');
            self.isSqlServer(data.databaseType.toString() === '1');
        }
    }
    DatasourceViewModel.prototype.datasourceSelected = function (data) {
        if (!this.isDirty()) {          
            datasourceSelection_done(this, data, 0);
        }
        else {
            MessageBox.showYesNo(this.translate('ARE_YOU_SURE_CONTINUE'), this.translate('UNSAVED_CHANGES_TITLE')).done(datasourceSelection_done.bind(null, this, data));
        }
    };

    DatasourceViewModel.prototype.breadcrumbLoader = function breadcrumbLoader() {
        var dfd = $.Deferred();
        this.breadcrumbData = [
            { 'text': this.translate('OPERATIONS_MANAGER'), 'value': '1' }
        ];
        dfd.resolve(this.breadcrumbData);
        return dfd.promise();
    };

    DatasourceViewModel.prototype.breadcrumbSelectedCallback = function breadcrumbSelectedCallback(data) {
        var value = data.value,
            i,
            index;

        //this.region.$element.find('.breadcrumb-notification-area').html('<kbd>' + JSON.stringify(data) + '</kbd>');

        for (i = 0; i < this.breadcrumb.items.length; i++) {
            if (this.breadcrumb.items[i].value === value) {
                index = i + 1;
                break;
            }
        }
        this.breadcrumbData.splice(index, this.breadcrumbData.length - index);
        this.breadcrumb.items = this.breadcrumbData;
        if (data.value === '1') {
            this.applicationEvents.navigate.raise('admin-menu/operations-manager');
        }
    };

    DatasourceViewModel.prototype.selectedType = function (data) {
        this.onChanges();
        var type = this.selectedDataSource().databaseType();

        if (type === undefined) {
            return;
        }
        if (type === '0') {
            this.isSqlServer(false);
            this.isOracle(true);
            this.isAlias(false);
            this.isManaged(false);
        }
        else {
            this.isSqlServer(true);
            this.isOracle(false);
            this.isAlias(true);
            this.isManaged(true);
        }
    };

    DatasourceViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    // Implementation

    function setOracle(self) {
        if (self.isOracle()) {
            if (self.selectedDataSource().alias().trim() === "" &&
                self.selectedDataSource().oraclehost().trim() === "" &&
                self.selectedDataSource().oracleport().trim() === "" &&
                self.selectedDataSource().oracleservice().trim() === "") {
                self.isAlias(false);
                self.isManaged(false);
            }
            else if (self.selectedDataSource().alias().trim() !== "") {
                self.isAlias(true);
                self.isManaged(false);
            }
            else if (self.selectedDataSource().oraclehost().trim() !== "" ||
                self.selectedDataSource().oracleport().trim() !== "" ||
                self.selectedDataSource().oracleservice().trim() !== "") {
                self.isManaged(true);
                self.isAlias(false);
            }
        }
    }

    function refreshDatasources(self, selectDto) {
        var dfd = new $.Deferred();
        self.datasourceService.getFullFilteredDatasources(self.apiServer())
            .done(get_done.bind(null, self, dfd))
            .fail(handleErrorMsg.bind(null, self));
        return dfd.promise();
    }

    function put_done(self, dfd) {
        refreshDatasources(self, true);
        self.isNew(false);
        self.isDirty(false);
        self.isLoading(false);
        dfd.resolve();
    }

    function post_done(self, dfd) {
        refreshDatasources(self, false);
        self.isNew(false);
        self.isDirty(false);
        dfd.resolve();
    }

    function get_done(self, dfd, data) {
        self.datasources(data);
        if (self.selectDatasource) {
            self.selectDatasource = false;                    
            var id = self.selectedDataSource().id;
            for (var i = 0; i < self.datasources().length; i++) {
                if (self.datasources()[i].id === id) {
                    self.datasourceSelected(self.datasources()[i]);
                    break;
                }
            }
        }
        dfd.resolve();
    }

    function delete_done(self, dfd, datasourceAdapter) {
        refreshDatasources(self, false);        
        self.selectedDataSource(datasourceAdapter.toModelObject(new DatasourceDTO()));
        self.selectedDataSource().hostName("*");

        self.isInitial(true);
        self.isDirty(false);
        dfd.resolve();
    }

    function test_done(self, dfd, data) {
        var msg = self.translate('SEC_DATASOURCE_TEST_FAIL'),
            title = self.translate('DATASOURCE_CAPTION');
        if (data === undefined) {
            MessageBox.showOk(msg, title);
            //alert(self.translate('SEC_DATASOURCE_TEST_FAIL'));
        }
        else if (data === false) {
            //alert(self.translate('SEC_DATASOURCE_TEST_FAIL'));
            MessageBox.showOk(msg, title);
        }
        else {
            //alert(self.translate('SEC_DATASOURCE_TEST_SUCCESS'));
            msg = self.translate('SEC_DATASOURCE_TEST_SUCCESS');
            MessageBox.showOk(msg, title);
        }
        dfd.resolve();
    }

    function handleErrorMsg(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    //Promtps
    function promptLoseChanges(self, doneCallback) {
        var msg = self.translator.translate('ARE_YOU_SURE_CONTINUE') ,
            title = self.translator.translate('UNSAVED_CHANGES_TITLE');


        
        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }


    // end prompts

    // misc
    function confirmTabUnload_done(self, dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    }

    return DatasourceViewModel;
});
