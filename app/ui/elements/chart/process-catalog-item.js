define(function(require) {
	'use strict';

    var $ = require('jquery');


	var ChartService = require('ui/elements/chart/services/chart-service'),
		ChartConfigAdapter = require('ui/elements/chart/models/chart-config-adapter'),
		ProcessQuery = require('ui/elements/chart/process-query'),
		ErrorMessage = require('system/error/error-message'),
		DatasetService = require('dataset/services/dataset-services'),
		ApplicationEvents = require('application/application-events');


	function ProcessCatalogItem (catalogItem, parameters, isFiltered) {
		this.chartService = Object.resolve(ChartService);
		this.errorOccured = Object.resolve(ApplicationEvents).errorOccured;
		this.datasetService = Object.resolve(DatasetService);
		this.deferred = null;
		this.processQuery = null;
		this.catalogItem = catalogItem;
		this.config = null;
        this.parameters = parameters || null;
        this.isFiltered = isFiltered || false;
		this.reload = false;
	}

	ProcessCatalogItem.prototype.load = function (config, reload, clearPrompts) {
	    var dfd;

	    this.deferred = $.Deferred();
		
		if(config){
			this.config = config;
		}
		if(reload){
			this.reload = true;
			this.processQuery = null;
		}
		if(clearPrompts){
			this.parameters = null;
		}

		if(this.catalogItem.graph && this.config.datasetKey){
			this.catalogItem.graph.queryKey = null;
			this.catalogItem.graph.datasetKey = this.config.datasetKey;
		}

		if (this.catalogItem.graph && this.catalogItem.graph.queryKey) {
			dfd = $.Deferred();
			dfd.resolve();
		}else if (this.catalogItem.graph && this.catalogItem.graph.datasetKey) {
			dfd = this.datasetService.fetchDatasetKey(this.catalogItem.graph.datasetKey);
		} else if (this.catalogItem.key) {
			dfd = this.chartService.getByKey(this.catalogItem.key);
		} else if (this.catalogItem.path) {
			dfd = this.chartService.getByPath(this.catalogItem.path);
		}
		dfd.done(catalogItemLoaded.bind(null, this))
			.fail(error.bind(null, this));
        
		return this.deferred.promise();
	};

	ProcessCatalogItem.prototype.processData = function (result, config) {
		this.processQuery.processData(result, config);
	};

	function error(self, xhr, text, message) {
	    self.deferred.reject(xhr, text, message);
	}

	function catalogItemLoaded(self, data) {
	    if (!data && (typeof self.catalogItem.key === 'undefined' || self.catalogItem.key === null)) {
	        error(self, { status: 404 });

	        return;
        }

		if(data && data.resultGrid && self.config.datasetKey) {
			self.catalogItem.graph.dataset = data.resultGrid;
		} else if (data) {
			self.catalogItem = data;
		}

		if (self.catalogItem.graph && self.reload === false) {
			self.config = ChartConfigAdapter.deserialize(self.catalogItem.graph.config);
		}

		if(self.catalogItem.graph && !self.catalogItem.graph.datasetKey && self.config.datasetKey){
			self.catalogItem.graph.datasetKey = self.config.datasetKey;
			self.catalogItem.graph.queryKey = '';

			self.datasetService.fetchDatasetKey(self.catalogItem.graph.datasetKey)
				.done(catalogItemLoaded.bind(null, self))
				.fail(error.bind(null, self));

		}else if (!self.processQuery || self.processQuery.queryKey !== self.catalogItem.graph.queryKey) {
			self.processQuery = new ProcessQuery(self.catalogItem.graph, self.parameters, self.isFiltered);
		}
		if (self.config.queryKey) {
			self.config.queryKey = null;
		}
		if(self.processQuery) {
			self.processQuery.load(self.config)
				.done(queryLoadDone.bind(null, self));
		}
	}

	function queryLoadDone (self, data) {
		data.config = self.config;
		data.catalogItem = self.catalogItem;
		self.deferred.resolve(data);
	}

	return ProcessCatalogItem;
});
