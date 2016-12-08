define(function(require) {
    'use strict';

    var $ = require('jquery'),
        R = require('ramda'),
        _ = require('lodash'),
        QueryExecutionEngine = require('query/execution/query-execution-engine'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        ErrorMessage = require('system/error/error-message'),
        Translator = require('system/globalization/translator'),
        ApplicationEvents = require('application/application-events'),
        MessageBox = require('system/ui/message-box'),
        ProcessStandardChart = require('ui/elements/chart/models/process-standard-chart'),
        ProcessPieChart = require('ui/elements/chart/models/process-pie-chart'),
        ProcessScatterChart = require('ui/elements/chart/models/process-scatter-chart'),
        ProcessHeatMapChart = require('ui/elements/chart/models/process-heat-map-chart');

    function ProcessQuery(queryKey, parameters, isFiltered) {
        this.queryKey = (_.has(queryKey, 'queryKey') ? queryKey.queryKey : '');
        this.dataset = (_.has(queryKey, 'dataset') ? queryKey.dataset : '');
        this.queryEngine = null;
        this.queryContainer = null;
        this.translator = Object.resolve(Translator);
        this.errorOccured = Object.resolve(ApplicationEvents).errorOccured;
        this.deferred = null;
        this.chartUtilities = new ChartUtilities();
        this.parameters = parameters || null;
        this.missingParams = true;
        this.isFiltered = isFiltered || false;
        this.outOfPieColors = false;
        this.resetPieSeries = true;
    }

    ProcessQuery.prototype.load = function (config) {

        this.deferred = $.Deferred();

        config = config || {};
        if(this.dataset){
            formatDataset(this, this.dataset, config);
        }else{
            this.queryKey = config.queryKey || this.queryKey;
            handleQuery(this, config);
        }
        return this.deferred.promise();
    };

    function handleQuery(self, config){
        if(_.has(self.parameters, 'queryString')) {
            self.queryEngine = Object.resolve(QueryExecutionEngine, {catalogItemKey: self.queryKey});
            self.queryEngine.compile()
                .done(compile_done.bind(null, self, config));
        }else{
            compile_done(self, config);
        }
    }

    function compile_done(self, config, queryContainer) {

        var options = {},
            exec = { pageSize: -1},
            queryParams, idx;

        if(_.has(self.parameters, 'queryString')){
            queryParams = queryContainer.parmContainer;
            if(queryParams.parmDesigns) {
                for (idx = 0; idx < queryParams.parmDesigns.length; idx++) {
                    queryParams.parmDesigns[idx] =
                        checkQueryStrParams(self.parameters.queryStrParams, queryParams.parmDesigns[idx], idx);
                }
                if(Object.keys(self.parameters.queryStrParams).length < queryParams.parmDesigns.length &&
                    self.missingParams){
                    assignMissingParams(self, config, queryParams);
                    return;
                }else {
                    self.parameters = queryParams;
                }
            }else{
                self.parameters = null;
            }

        }else if(!self.parameters){
            self.parameters = null;
        }

        if (self.queryKey || self.queryContainer) {
            if (self.queryContainer) {
                options.queryContainer = self.queryContainer;
            } else {
                options.catalogItemKey = self.queryKey;
            }

            if(self.isFiltered || self.parameters){
                exec.suppressPrompts = true;
            }

            if(self.parameters){
                exec.parameters = self.parameters;
            }

            self.queryEngine = new QueryExecutionEngine(options);
            self.queryEngine.execute(exec)
                .done(query_done.bind(null, self, config))
                .fail(error.bind(null, self));

            if(config.evalMobile){
                var mobileEval = new QueryExecutionEngine(options),
                    mobileExec = $.extend(true, {}, exec);
                mobileExec.evalOnly = true;
                mobileEval.execute(mobileExec)
                    .done(mobile_exec_done.bind(null, self))
                    .fail(error.bind(null, self));
            }
        }
    }

    function mobile_exec_done(self, data){
        if(data.rowCount > 500){
            MessageBox.showOk(self.translator.translate("CHART_MOBILE_WARNING_MSG"),self.translator.translate("WARNING"));
        }
    }

    function assignMissingParams(self, config, queryParams){
        var queryStrParams = self.parameters.queryStrParams,
            parameters = {
                hasDependencies: false,
                parmDesigns: []
            },
            idx,
            query = Object.resolve(QueryExecutionEngine, { catalogItemKey: self.queryKey });

        for (idx = 0; idx < queryParams.parmDesigns.length; idx++) {
            if(queryStrParams[queryParams.parmDesigns[idx].id]){
                queryParams.parmDesigns[idx] =
                    checkQueryStrParams(queryStrParams, queryParams.parmDesigns[idx], idx);

            }
            parameters.parmDesigns.push(queryParams.parmDesigns[idx]);
        }
        query.prompt({ parameters: parameters })
            .done(prompt_done.bind(null, self, config));
    }

    function prompt_done(self, config, queryContainer) {
        self.missingParams = false;
        compile_done(self, config, queryContainer);
    }

    function checkQueryStrParams(queryStr, containerParam, index){
        checkQueryStrParam(containerParam.id, queryStr, containerParam);
        checkQueryStrParam('p' + index, queryStr, containerParam);        
        return containerParam;
    }

    function checkQueryStrParam(parameterName, queryStr, containerParam) {
        var value = queryStr[parameterName];
        if (value) {
            containerParam.parmPrompts = [value];
        }
    }

    function query_done (self, config, data) {
        var result = {};
        self.queryContainer = data.queryContainer;
        config.formattedQuery = data.queryContainer.isFormatted;
        result.rawData = data.rowset;
        formatTranslatedAlias(result, config);
        self.processData(result, config);
        self.deferred.resolve(result);
    }

    function formatDataset(self, dataset, config){
        var result = {};
        result.rawData = ChartUtilities.formatDataset(dataset);
        self.processData(result, config);
        self.deferred.resolve(result);
    }

    ProcessQuery.prototype.processData = function (result, config) {
        var columns = result.rawData.columns,
            sliceIndexes = mapColumnsToIndexes(columns, config.series),
            categoryIndexes = mapColumnsToIndexes(columns, [{ name: config.categoryProperty }]),
            hyperlinkIndexes = mapHyperlinksToIndexes(columns, config.series),
            colorArray = [],
            rows = result.rawData.rows,
            idx, categoryValue,
            horizontalAxisProperty, sizeProperty, pieSeriesCategories = [], heatmapSeries = [];

        result.totalRows = rows.length;
        result.gridData = { data: [] };
        result.chartData = [];

        colorArray.push.apply(colorArray, this.chartUtilities.CHART_COLORS);

        if (config.chartType === 'scatter' || config.chartType === 'bubble') {
            horizontalAxisProperty = mapColumnsToIndexes(columns, [{ name: config.horizontalAxisProperty }]);
            if (config.chartType === 'bubble') {
                sizeProperty = mapColumnsToIndexes(columns, [{ name: config.sizeProperty }]);
            }
        } else {
            result.categoryArray = [];
        }

        if(config.chartType === 'heatmap'){
            var columnName;
            config.heatmap.yAxis = [];
            heatmapSeries = config.heatmap.colorSeries;
            config.heatmap.colorSeries = [];
            for(idx = 0; idx < sliceIndexes.length; idx++) {
                columnName = (columns[sliceIndexes[idx]].alias ?
                    columns[sliceIndexes[idx]].alias : columns[sliceIndexes[idx]].uniqueId);
                config.heatmap.yAxis.push(columnName);
            }
        }

        for (idx = 0; idx < rows.length; idx++) {
            categoryValue = rows[idx].columnValues[categoryIndexes[0]];
            if (config.chartType === 'scatter' || config.chartType === 'bubble') {
                ProcessScatterChart.processData(
                    this,
                    result,
                    config,
                    sliceIndexes,
                    categoryValue,
                    horizontalAxisProperty,
                    sizeProperty,
                    rows[idx],
                    hyperlinkIndexes
                );
            } else if (config.chartType === 'heatmap'){
                result.categoryArray[result.categoryArray.length] = categoryValue;
                ProcessHeatMapChart.processData(this, result, config, sliceIndexes, heatmapSeries, rows[idx]);
            } else if (config.chartType === 'pie' || config.chartType === 'donut'|| config.chartType === 'pyramid'){
                result.categoryArray[result.categoryArray.length] = categoryValue;
                ProcessPieChart.processData(
                    this,
                    result,
                    config,
                    sliceIndexes,
                    rows[idx],
                    colorArray,
                    pieSeriesCategories,
                    categoryIndexes[0]
                );
            } else {
                result.categoryArray[result.categoryArray.length] = categoryValue;
                ProcessStandardChart.processData(this, result, config, sliceIndexes, rows[idx], hyperlinkIndexes);
            }
        }
    };

    function error(self, xhr, text, message) {
        var errorMessage;

        if (!message) {
            self.deferred.resolve({});
            return;
        }
        errorMessage= new ErrorMessage('AG1', message, new Error().stack);
        self.errorOccured.raise(self, errorMessage);
    }

    function mapColumnsToIndexes (columns, properties) {
        var indexes = [], columnIdx, propertyIdx;

        if (properties) {
            for (propertyIdx = 0; propertyIdx < properties.length; propertyIdx++) {
                for (columnIdx = 0; columnIdx < columns.length; columnIdx++) {
                    if (properties[propertyIdx].name === columns[columnIdx].alias ||
                        properties[propertyIdx].name === columns[columnIdx].uniqueId) {
                        indexes[indexes.length] = columnIdx;
                        break;
                    }
                }
            }
        }

        return indexes;
    }

    function mapHyperlinksToIndexes (columns, properties) {
        var indexes = [], columnIdx, propertyIdx;

        if (properties) {
            for (propertyIdx = 0; propertyIdx < properties.length; propertyIdx++) {
                for (columnIdx = 0; columnIdx < columns.length; columnIdx++) {
                    if (properties[propertyIdx].hyperlink === columns[columnIdx].alias ||
                        properties[propertyIdx].hyperlink === columns[columnIdx].uniqueId) {
                        indexes[indexes.length] = columnIdx;
                        break;
                    }else if(properties[propertyIdx].hyperlink === 'None'){
                        indexes[indexes.length] = -1;
                        break;
                    }
                }
            }
        }
        return indexes;
    }

    function shouldSetSeriesAlias(column, series, prop, propAlias){
        if (series[prop] === column.alias ||
            series[prop] === column.defaultAlias ||
            series[prop] === column.uniqueId) {
            return true;
        }else if((series[propAlias] === column.defaultAlias) &&
            column.defaultAlias !== ''){
            return true;
        }
        return false;
    }

    var formatTranslatedAliasForEachSeries = R.curry(function formatTranslatedAliasForEachSeries(column, series){
        var setSeriesAlias = shouldSetSeriesAlias(column, series, 'name', 'defaultAlias'),
            setHyperlinkAlias = shouldSetSeriesAlias(column, series, 'hyperlink', 'hyperlinkAlias');

        if(setSeriesAlias){
            series.name = column.alias ? column.alias : column.uniqueId;
            series.alias = column.alias ? column.alias : column.uniqueId;
            series.defaultAlias = column.defaultAlias ? column.defaultAlias : '';
            series.uniqueId = column.uniqueId;
        }

        if(setHyperlinkAlias && series.hyperlink !== 'None'){
            series.hyperlink = column.alias ? column.alias : column.uniqueId;
            series.hyperlinkAlias = column.defaultAlias ? column.defaultAlias : column.uniqueId;
        }
    });

    var formatTranslatedAliasForEachColumns = R.curry(function formatTranslatedAliasForEachColumns(config, column){
        R.forEach(formatTranslatedAliasForEachSeries(column), config.series);
        formatPropertyAlias(config, column, 'categoryProperty', 'categoryPropertyAlias');
        formatPropertyAlias(config, column, 'horizontalAxisProperty', 'horizontalAxisPropertyAlias');
        formatPropertyAlias(config, column, 'sizeProperty', 'sizePropertyAlias');
    });

    function formatPropertyAlias(config, column, prop, aliasProp){
        var setAlias = false;
        if(config[prop] === column.alias ||
            config[prop]=== column.defaultAlias ||
            config[prop] === column.uniqueId){
            setAlias = true;
        }else if((config[aliasProp] === column.defaultAlias) && column.defaultAlias !== ''){
            setAlias = true;
        }

        if(setAlias){
            config[prop] = column.alias ? column.alias : column.uniqueId;
            config[aliasProp] = column.defaultAlias ? column.defaultAlias : column.uniqueId;
        }
    }

    function formatTranslatedAlias(result, config){
        var columns = result.rawData.columns;
        R.forEach(formatTranslatedAliasForEachColumns(config), columns);
    }

    return ProcessQuery;

});