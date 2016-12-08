define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var Promise = require('bluebird');
    var StaticHelper = require('./static-helper');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter),
        ApplicationContext = require('application/application-context');

    var QueryContainerDTO = require('query/services/dto/query-container-dto'),
        ParameterContainerDTO = require('query/services/dto/parameter-container-dto'),
        QueryExecutionEngine = require('query/execution/query-execution-engine');

    var QueryDataAdapter = require('../adapters/query-data-adapter');

    function QueryHelper() {

        this.queryDataAdapter = Object.resolve(QueryDataAdapter);

    }

    var base = Object.inherit(StaticHelper, QueryHelper);

    /********************************************************************************************
                            DataSource Handling
    **********************************************************************************************/

    QueryHelper.prototype.handleDatasource = function QueryHelper_handleDatasource(self) {
        var queryHelper = this;

        var dataSource = {
            load: handleQueryLoad.bind(null, self, queryHelper),
            totalCount: handleQueryTotalCount.bind(null, self),
            paginate: true,
            pageSize: self.pageSize()// 100
        };
        return dataSource;
    };

    function handleQueryLoad(self, queryHelper, loadOptions) {
        var dfd = new $.Deferred();
        var filterOptions = loadOptions.filter ? loadOptions.filter.join(",") : "";   //Getting filter options
        var sortOptions = loadOptions.sort ? JSON.stringify(loadOptions.sort) : "";  //Getting sort options
        //skip and take are used for paging
        var skip = loadOptions.skip; //A number of records that should be skipped 
        var take = loadOptions.take; //A number of records that should be taken
        var colIdx;
        var optionsObj = {
            filter: filterOptions,
            sort: sortOptions,
            skip: self.gridInstance ? self.gridInstance.pageIndex() * self.pageSize() : 0,
            take: self.pageSize()
        };

        var canApplyFilter = !(loadOptions.hasOwnProperty('filter') && loadOptions.filter === undefined);

        self.gridInstance && self.gridInstance.clearSelection();

        //For no data specified case
        if (self.data() === null || self.data() === undefined) {

            dfd.resolve([]);

        } else if (self.data() === 'static') {
            //For Data as static and module should need to call the API and return results
            optionsObj.skip = skip;
            optionsObj.take = take;
            queryHelper.handleStaticDataLoad(self, optionsObj, dfd);


        } else {

            //For general query API calling case

            if (self.currentFilter !== optionsObj.filter) {

                self.currentFilter = optionsObj.filter;

                colIdx = $('.dx-datagrid-filter-row .dx-editor-cell').index($('.dx-editor-cell.dx-focused'));
                self.filterElIndex = colIdx !== -1 ? colIdx : self.filterElIndex;

                handleQueryExecution(self, optionsObj, canApplyFilter)
                    .done(handleQueryExecutionDone.bind(null, self, queryHelper, optionsObj, dfd, true))
                    .fail(handleQueryExecutionFail.bind(null, self, queryHelper, dfd));

            } else {

                handleQueryExecution(self, optionsObj, canApplyFilter)
                    .done(handleQueryExecutionDone.bind(null, self, queryHelper, optionsObj, dfd, false));
            }


        }

        return dfd.promise();
    }

    function handleQueryTotalCount(self, loadOptions) {
        var dfd = $.Deferred();
        var optionsObj = {};

        if (self.data() === 'static' && self.totalCountCallback) {
            Object.tryMethod(self, 'totalCountCallback', dfd, optionsObj);
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    }

    function handleQueryExecutionDone(self, queryHelper, optionsObj, dfd, setFocus, data) {
        var modData;      
        self.rawQueryData = data.result;
        modData = queryDataToObject(self, queryHelper, data);

        //queryDataColumns property used by modules to set hasCellTemplate property
        self.queryDataColumns = modData.columns; //queryHelper.queryDataAdapter.getColumnsData(data.result.getColumns());
        Object.tryMethod(self, 'queryExecutedCB', data, optionsObj);

        dfd.resolve(modData.dataRows);
        setFocus && setFilterElFocus(self.filterElIndex);
    }

    function handleQueryExecutionFail(self, queryHelper, dfd) {
        var modData = queryDataToObject(self, queryHelper, self.rawQueryData);
        dfd.resolve(modData.dataRows);
        setFilterElFocus(self.filterElIndex);
    }

    function queryDataToObject(resultgridVM, queryHelper, data) {

        var queryData = data.result;
        var queryDataRows = queryData.getRows();
        var queryDataColumns = queryData.getColumns();

        var columns = queryHelper.queryDataAdapter.getColumnInfos(queryDataColumns);
        var rows = queryHelper.queryDataAdapter.getRows(resultgridVM, queryDataRows, columns);

        return { dataRows: rows, columns: columns };
    }

    function setFilterElFocus(index) {
        $($('.dx-datagrid-filter-row .dx-editor-cell')[index]).find('input').focus();
    }

    function handleQueryExecution(self, constraints, canApplyFilter) {
        var dfd = $.Deferred();
        if (typeof self.data === 'function' && (self.data() === null || self.data() === undefined)) {
            return;
        }

        var options = {};

        //For handling Page filter operations
        if (self.aggregateQueryParams) {
            self.queryParams && addAggregateParam(self);
            options.parameters = self.aggregateQueryParams;
            options.suppressPrompts = true;

        } else if (self.queryParams) {
            options.parameters = self.queryParams;
            options.suppressPrompts = true;

        } else {
            options.suppressPrompts = self.suppressPrompts();
        }
        /*
            After DevEx 16.1 update Spinner Dialog Box appended diretly to body tag,
            previous style override fix won't work now, so decreasing spinner z-index
            when resultgrid not loaded in Dialog/popup.
        */
        if (!options.suppressPrompts) {
            if (!$('.dialog-wrapper').find('mi-resultgrid').length) {
                $('.dx-overlay-wrapper').addClass('suppressSpinner');
            }
        }

        options.evalOnly = false;
        options.pageSize = self.pageSize();
        options.startPage = self.pageNumber !== 0 ? self.pageNumber : '0';

        if (self.cachedQueryContainer) {
            options.queryContainer = new QueryContainerDTO($.parseJSON(JSON.stringify(self.cachedQueryContainer)));

            if (canApplyFilter) {
                if (constraints.sort) {
                    options.queryContainer = updateQueryContainer(self, options.queryContainer, constraints.sort);
                }

                if (self.prevFilter !== undefined && self.prevFilter !== constraints.filter) {
                    options.startPage = '0';
                    self.pageNumber = 0;
                    self.getTotalCount = true;
                }

                if (constraints.filter !== "" && self.prevFilter === undefined) {
                    self.getTotalCount = true;
                }

                self.prevFilter = constraints.filter;
                options.queryContainer = updateQueryContainerWithFilter(self, options.queryContainer, constraints.filter);
            }
            executeQueryExecutionEngine(self, options, dfd);
            return dfd;
        }

        if (self.queryExecutionMode() === 'catalogItemPath') {
            self.catalogService.getCatalogItemKey(self.data()).done(function getCatalogItemKeyDone(catalogKey) {
                options.catalogItemKey = catalogKey;
                executeQueryExecutionEngine(self, options, dfd);
            });
        } else {
            switch (self.queryExecutionMode()) {
                case 'catalogItemKey': options.catalogItemKey = self.data(); break;
                case 'queryContainer': options.queryContainer = self.queryContainerObject; options.suppressPrompts = self.suppressPrompts(); break;
                case 'sqlStatement': options.sqlStatement = self.data(); break;
                case 'catalogItem': options.catalogItem = self.data(); break;
            }
            executeQueryExecutionEngine(self, options, dfd);
        }

        return dfd;
    }

    function executeQueryExecutionEngine(self, options, dfd) {
        self.queyExecutionEngine = new QueryExecutionEngine(options);
        options.sync = true; //Sync will return resultset dto
        self.queyExecutionEngine.execute(options)
            .done(queryExecutionEngineExecuteDone.bind(null, self, dfd))
            .fail(hideLoadingIndicator);
    }

    function queryExecutionEngineExecuteDone(self, dfd, data) {
        self.cachedQueryContainer = data.queryContainer;
        self._totalCount(data.result.getRows().length);
        //removes the items if there are morethan the pagesize
        data.result.getRows().splice(self.pageSize(), self.pageSize());
        dfd.resolve(data);
    }

    function hideLoadingIndicator() {
        $('.dx-loadindicator').hide();
    }

    /*******************************************************************************************************
                                            QueryContainer ColumnDesigns helpers
    ********************************************************************************************************/

    //For updating query container sorting


    function updateQueryContainer(self, cachedQueryContainer, sortOptions) {
        var options = JSON.parse(sortOptions);
        var queryContainer = cachedQueryContainer;

        //Reset sort order and index
        for (var k = 0; k < queryContainer.columnDesigns.length; k++) {
            queryContainer.columnDesigns[k].sortOrder = "None";
            queryContainer.columnDesigns[k].sortIndex = 0;
        }

        //update sort order and index
        for (var i = 0; i < options.length; i++) {
            for (var j = 0; queryContainer.columnDesigns && j < queryContainer.columnDesigns.length; j++) {
                var colUniqueID = queryContainer.columnDesigns[j].alias || getBracketsLessCaption(queryContainer.columnDesigns[j].id);
                
                if (options[i].selector === colUniqueID) {
                    queryContainer.columnDesigns[j].sortOrder = options[i].desc ? "Descending" : "Ascending";
                    queryContainer.columnDesigns[j].sortIndex = i + 1;
                    break;
                }
            }
        }
        return queryContainer;
    }

    //For updating querycontainer filters
    function updateQueryContainerWithFilter(self, cachedQueryContainer, filterOptions) {
        var allColFilterOptions = filterOptions.split(',and,');
        var queryContainer = cachedQueryContainer;
        var options, idx;

        clearAllFilters(self, queryContainer, allColFilterOptions);

        var prevSelc = '';
        for (var k = 0; allColFilterOptions[0] !== "" && k < allColFilterOptions.length; k++) {
            idx = 0;
            options = {
                selector: allColFilterOptions[k].split(',')[idx],
                query: getSearchQueryParam(allColFilterOptions[k])
            };
            if (options.selector) {
                if (prevSelc !== options.selector) {
                    traverseColumnDesigns(self, queryContainer, options.selector, pushFilter.bind(self, self, queryContainer, options));
                }
                prevSelc = options.selector;
            }
        }


        return queryContainer;
    }

    function pushFilter(self, queryContainer, options, j) {

        //pushing new filter into filters array
        if (options.query) {    
            queryContainer.columnDesigns[j].resultFilterExpression = getFilterExpression(self, queryContainer.columnDesigns[j], options);
        }
    }

    function getFilterExpression(self, columnDesign, options) {
        var filter = '';
        var systemDateField = (columnDesign.id === 'LAST_UPDT_DT' || columnDesign.id === 'CRT_DT');
        var dataType = getDataTypeFromQueryDataColumn(self, columnDesign); //columnDesign.dataType.toLowerCase() === 'date';
        var isNotFormattedDate = self.formColumnArr.indexOf(columnDesign.alias) === -1;

        //REVISIT
        //Date field condition need to be removed since in sub select query case columndisign will have dataType as "Unknown"
        if ((dataType === 'date' && isNotFormattedDate) || systemDateField) {
            //Handling date filtering
            var filterDate = new Date(options.query);

            //Get start date value and end date value from filterDate
            var filterStartDate = new Date(filterDate);
            filterStartDate.setHours(0, 0, 0, 0);
            var filterEndDate = new Date(filterDate);
            filterEndDate.setHours(23, 59, 59, 999);

            //Apply offset to filter start and end dates
            var startOffsetDate = self.timezone.removeUtcOffset(filterStartDate);
            var endOffsetDate = self.timezone.removeUtcOffset(filterEndDate);

            var startOffsetDateStr = Formatter.format(startOffsetDate, 'yyyy-MM-dd HH:mm:ss');
            var endOffsetDateStr = Formatter.format(endOffsetDate, 'yyyy-MM-dd HH:mm:ss');

            var startDateQueryStr = "(>=(# :dt :utc '" + startOffsetDateStr + "')";
            var endDateQueryStr = "<=(# :dt :utc '" + endOffsetDateStr + "'))";

            filter = startDateQueryStr + " And " + endDateQueryStr;

            self.filtersArr.push(startDateQueryStr);
            self.filtersArr.push(endDateQueryStr);
        } else if (dataType === 'boolean') {
            if (options.query === "true") {
                filter = "'Y'";
            } else if (options.query === "false") {
                filter = "'N'";
            } else {
                filter = '';
            }
            self.filtersArr.push(filter);
        } else {
            filter = '(Like ' + "'%" + options.query + "%'" + ')';
            self.filtersArr.push(filter);
        }
        return filter;
    }

    function clearAllFilters(self, queryContainer, allColFilterOptions) {
        traverseColumnDesigns(self, queryContainer, null, null, clearFilterCriteria.bind(self, self, queryContainer));
        self.filtersArr = [];
    }

    function clearFilterCriteria(self, queryContainer, q) {

        queryContainer.columnDesigns[q].resultFilterExpression = '';

    }

    function getSearchQueryParam(filterStr) {
        var query = "";
        var filterStrArr = filterStr.split(',');
        var filterValLen = filterStrArr.length;
        if (filterValLen > 2 && filterStrArr[1] === 'contains') {
            var Fst = filterStr.indexOf(",");
            var Snd = filterStr.indexOf(",", Fst + 1);
            query = filterStr.substring(Snd + 1).trim();
        } else {
            query = filterStrArr[2] === undefined ? filterStrArr[2] : filterStrArr[2].trim();
        }
        return query;
    }

    function traverseColumnDesigns(self, queryContainer, selector, callback, allCallback) {
        for (var j = 0; queryContainer.columnDesigns && j < queryContainer.columnDesigns.length; j++) {
            if (callback) {
                var colUniqueID = queryContainer.columnDesigns[j].alias || getBracketsLessCaption(queryContainer.columnDesigns[j].id);
                if (selector === colUniqueID && callback) {
                    callback.call(self, j);
                }
            }

            if (allCallback) {
                allCallback.call(self, j);
            }
        }
    }

    function getDataTypeFromQueryDataColumn(self, columnDesign) {
       var queryColumn = _.find(self.queryDataColumns, function (column) {
            return column.columnDesignKey.toString() === columnDesign.key.toString();
       });
       
       return queryColumn && queryColumn.dataType ? queryColumn.dataType : columnDesign.dataType.toLowerCase();
    }

    /********************************************************************************************
                                Tooling
    *********************************************************************************************/

    function excludeFirstLastChars(str) {
        return str.substring(1, str.length - 1);
    }

    function getBracketsLessCaption(str) {
        return str.indexOf('[') > -1 ? excludeFirstLastChars(str) : str;
    }

    function hasAchorTag(str) {
        return str.toString().indexOf('<a') !== -1;
    }

    function getStrCopy(str) {
        //substring helps to avoid reference update
        return str ? str.substring(0, str.length) : '';
    }

    /********************************************************************************************
                           Customizing Columns
   **********************************************************************************************/

    /* 
    Costimizing columns needs since we are not passing the columns initially in case of query or static data loading
    */
    QueryHelper.prototype.customizeColumns = function QueryHelper_customizeColumns(self, columns) {
        if (self.data() === 'static') {
            return this.getStaticColumns(self, columns);
        }

        //Handling query data
        var queryData = self.rawQueryData;
        var queryDataRows = queryData.getRows();
        var queryDataColumns = queryData.getColumns();
        var queryDataColumn, gridColumn;

        var queryContainer = self.cachedQueryContainer;
        var format = ApplicationContext.user.formats.shortDate;


        for (var i = 0; i < columns.length; i++) {

            queryDataColumn = queryDataColumns[i];
            gridColumn = columns[i];

            queryDataColumn.setFieldId(getBracketsLessCaption(queryDataColumn.getFieldId()));

            gridColumn.dataField = queryDataColumn.getAlias() || queryDataColumn.getFieldId();
            gridColumn.caption = getGridColumnCaption(queryDataColumn);
            gridColumn.encodeHtml = false;

            handleGridColumnCellTemplate(this, self, i, gridColumn);
            handleGridColumnByTypeName(this, self, queryContainer, queryDataColumn, gridColumn);
            handleGridColumnByQueryContainer(queryContainer, gridColumn);

            //if (queryDataColumn.getBackColor()) {
            //    self.queryHasBackgroundColor(true);
            //    gridColumn.cssClass = queryDataColumn.getBackColor();
            //}

        }
        //setFormatAndCssClass(self, queryData, columns);

    };

    function handleGridColumnCellTemplate(self, resultgridVM, colIndx, gridColumn) {
        var cellTemplate;
        if (resultgridVM.queryDataColumns[colIndx].hasCellTemplate && resultgridVM.queryDataColumns[colIndx].hasCellTemplate.toString() === 'true') {
            cellTemplate = self.handleCustomCellTemplate.bind(null, resultgridVM);
            gridColumn.cellTemplate = cellTemplate;
        }
        return cellTemplate;
    }

    function getGridColumnCaption(queryDataColumn) {
        var caption = '';
        //Setting Caption
        if (queryDataColumn.getAlias() !== undefined && queryDataColumn.getAlias() !== '') {
            caption = queryDataColumn.getAlias();
        } else {
            caption = queryDataColumn.getId();
        }

        return caption;
    }

    function handleGridColumnByQueryContainer(queryContainer, gridColumn) {
        //Setting Caption, Visibility and sort allow
        if (queryContainer.columnDesigns !== null && queryContainer.columnDesigns !== undefined) {

            for (var j = 0; j < queryContainer.columnDesigns.length; j++) {

                var columnDesign = queryContainer.columnDesigns[j];

                //get copy of columndesign id if alias not there 
                var columnDesignCaption = columnDesign.alias || getStrCopy(columnDesign.id);

                if (gridColumn.caption === columnDesignCaption) {
                    gridColumn.caption = setCaptionFromColumnDesign(columnDesign, columnDesignCaption);
                    gridColumn.visible = columnDesign.display;
                    //Assign datatype string for hyperlink columns
                    gridColumn.dataType = columnDesign.hyperlink ? 'string' : gridColumn.dataType;
                }

                gridColumn = disableSortOfConsColumn(columnDesign, gridColumn);
            }
        }

        return gridColumn;
    }

    function handleGridColumnByTypeName(self, resultgridVM, queryContainer, queryDataColumn, gridColumn) {
        //DataType setting
        switch (queryDataColumn.getTypeName()) {
            case 'System.DateTime':
                gridColumn.dataType = 'date';
                if (resultgridVM.formColumnArr.indexOf(queryDataColumn.getFieldId()) === -1) {
                    gridColumn.format = { formatter: formatDateValue };
                } else {
                    gridColumn.dataType = 'string';
                }
                break;
            case 'System.Boolean':
                gridColumn.dataType = 'boolean';
                break;
            case 'System.Double':
                if (!queryContainer.isFormatted) {
                    gridColumn.dataType = 'number';
                    gridColumn.customizeText = self.formatNumberValue;
                }
                break;
        }

        return gridColumn;
    }

    function formatDateValue(format, value) {
        var formatToSet = ApplicationContext.user.formats.shortDate;
        if (value === undefined) {
            value = format;
        } else {
            formatToSet = format;
        }
        return Formatter.format(value, formatToSet);
    }

    //NOT REQUIRED , SINCE RESULTSET DTO HAVING EVERYTHING IN CELL LEVEL
    function setFormatAndCssClass(self, queryData, columns) {
        for (var k = 0; k < queryData.rows.length; k++) {
            for (var l = 0; l < columns.length; l++) {
                if (queryData.rows[k].displayInfos && queryData.rows[k].displayInfos[l] && queryData.rows[k].displayInfos[l].backColor) {
                    self.queryHasBackgroundColor(true);
                    columns[l].cssClass = queryData.rows[k].displayInfos[l].backColor;
                }
                if (queryData.rows[k].displayInfos && queryData.rows[k].displayInfos[l] && queryData.rows[k].displayInfos[l].format) {
                    columns[l].format = { formatter: formatDateValue.bind(null, queryData.rows[k].displayInfos[l].format) }; //queryData.rows[k].displayInfos[l].format;
                }
            }
        }
    }

    //Function to check column is Constant and disable the sorting
    function disableSortOfConsColumn(colDesign, column) {
        var expressionText = colDesign.expressionText;
        var isFound = expressionText && expressionText.match(/^'.*'$/);
        if (colDesign.dataType === 'Unknown' && isFound) {
            column.allowSorting = false;
            column.cssClass = 'disable-cursor';
        }

        return column;
    }


    function setCaptionFromColumnDesign(columnDesign, captionToSet) {
        if (columnDesign.alias === '' && columnDesign.caption) {
            //revisit later
            columnDesign.caption = getBracketsLessCaption(columnDesign.caption);
            captionToSet = columnDesign.caption;
        }
        return captionToSet;
    }

    /********************************************************************************************
                           Events
   **********************************************************************************************/

    QueryHelper.prototype.handleCellPreparedForQueryResult = function QueryHelper_handleCellPreparedForQueryResult(self, dataObject) {

        if (dataObject.rowType !== 'data') {
            return;
        }

        var options = dataObject;
        var container = dataObject.cellElement;

        var fieldData = options.value,
            fieldHtml = fieldData;


        var column = _.find(self.rawQueryData.columns, function (item) {
            return item.alias === options.column.caption;
        });
        if (column && column.hasCellTemplate) {
            return;
        }
        if (fieldData && typeof fieldData !== 'boolean' && hasAchorTag(fieldData)) {
            container.empty().append(fieldHtml);
        }

        if ($(container).attr('class') && self.queryHasBackgroundColor()) {
            var style = $(container).attr('style');
            style += 'background: ' + $(container).attr('class') + ';';
            $(container).attr('style', style);
        }
        var hyperlink = $(container).find('a');
        if (hyperlink.length && isHTML(fieldData)) {
            if (self._openHyperLinkInNewTab !== false) {
                hyperlink.attr('target', 'tab');
            }
        }
    };

    function isHTML(str) {
        return /<[a-z\][\s\S]*>/i.test(str);
    }

    QueryHelper.prototype.handleContentReadyAction = function QueryHelper_handleContentReadyAction(self) {
        var dataGridInstance = $(self.element).find('.gridContainer').dxDataGrid('instance');
        $(self.element).find('.rg-controls').show();
        $(self.element).find('.rg-header').show();

        setHeightBasedOnTotalCount(self, dataGridInstance);

        self.gridInstance = dataGridInstance;
        Object.tryMethod(self, 'gridLoadedCallback', dataGridInstance);

        if (self.scrollType() === 'standard') {
            if (self.getTotalCount) {
                this.getMenuPaging(self);
            }

        } else if (self.scrollType() === 'standard' && self.data() === 'static' && !self.currentFilter) {
            var ttlCount = dataGridInstance.totalCount() > 0 ? dataGridInstance.totalCount() : 0;
            $(self.element).find('.dxDataGridTotalCount').html(ttlCount + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        }
        //handleGridHeight(self);
        $(self.element).find('.dx-datagrid-pager.dx-pager').hide();

        $(self.element).find('.dx-datagrid-pager.dx-pager').append($(self.element).find('.dxDataGridTotalCount'));

        //CSS style overrides for showGridBorder property
        if (self.showGridBorder && $(self.element).find('.grid-border').length === 0) {
            $(self.element).find('#gridContainer').wrap("<div class='grid-border' />");
            var containerHeight = $(self.element).find('#gridContainer').height();
            $(self.element).find('.grid-border').height(containerHeight);
        }
    };


    function setHeightBasedOnTotalCount(self, instance) {
        var controlHeightBasedOnTotalCount = self.showRowFilter() ? 'calc(100% - 65px)' : 'calc(100% - 25px)';
        var containerEl = $(self.element).find('.gridContainer');
        if (instance.totalCount() <= self.pageSize()) {
            containerEl.css({ height: controlHeightBasedOnTotalCount });
            //instance.repaint();
        }
        //To disable Rowfilter Button if 1 or no records found in first Load
        // and disable sorting
        if (self.isFirstLoad) {
            self.isFirstLoad = false;
            if (instance.totalCount() <= 1) {
                $(self.element).find('.rg-filter').attr('disabled', true);
                instance.option({
                    sorting: { mode: 'none' }
                });
            }
        }
    }


    QueryHelper.prototype.handleSelectionChanged = function QueryHelper_handleSelectionChanged(self, selecteditems) {
        var data;
        if (self.selectionMode() === 'single') {
            data = selecteditems.selectedRowsData[0];
            Object.tryMethod(self, 'callback', data);
        } else {
            data = selecteditems.selectedRowsData;
            Object.tryMethod(self, 'multiSelectCallback', data);
        }
    };

    QueryHelper.prototype.handleEditorPreparedForQuery = function QueryHelper_handleEditorPreparedForQuery(options) {
        var self = this;
        if (options.parentType === 'filterRow' && options.dataType === 'number') {
            options.editorElement.dxNumberBox({ 'showSpinButtons': true });
        } else if (options.parentType === 'dataRow' && options.dataType === 'number') {
            var numerBox = options.editorElement.dxNumberBox({
                value: self.formatNumberValue(options),
                onValueChanged: function (e) {
                    options.setValue(Parser.parseFloat(e.value));
                }
            });
        }
    };
    /********************************************************************************************
                           Page filter handler
   **********************************************************************************************/

    QueryHelper.prototype.pageFilterHandler = function QueryHelper_filter(self, parameters) {
        if (parameters && parameters.parmDesigns && parameters.parmDesigns.length) {
            self.aggregateQueryParams = new ParameterContainerDTO($.parseJSON(JSON.stringify(parameters)));

            if (self.queryParams && self.queryParams.parmDesigns) {
                for (var i = 0; i < self.queryParams.parmDesigns.length; i++) {
                    for (var j = 0; j < parameters.parmDesigns.length; j++) {
                        if (self.queryParams.parmDesigns[i].id === parameters.parmDesigns[j].id) {
                            self.queryParams.parmDesigns.splice(i);
                            break;
                        }
                    }
                }

                for (var k = 0; k < self.queryParams.parmDesigns.length; k++) {
                    self.aggregateQueryParams.parmDesigns.push(self.queryParams.parmDesigns[k]);
                }
            }
        }

        if (self.data()) {
            self.refresh(self.data());
        }
    };


    function addAggregateParam(self) {
        //Getting Aggreagate Query Param Id Separate
        var aggreParamIds = [];
        var aggregateLength = self.aggregateQueryParams.parmDesigns.length;
        for (var i = 0; i < aggregateLength; i++) {
            aggreParamIds.push(self.aggregateQueryParams.parmDesigns[i].id);
        }

        //If aggregate query param Id matching with queryParams id we are replacing the paramDesign else we will add
        //new value to the aggregate param
        var queryParamLength = self.queryParams.parmDesigns.length;
        for (var j = 0; j < queryParamLength; j++) {
            if (aggreParamIds.indexOf(self.queryParams.parmDesigns[j].id) > -1) {
                for (var k = 0; k < aggregateLength; k++) {
                    if (self.aggregateQueryParams.parmDesigns[k].id === self.queryParams.parmDesigns[j].id) {
                        self.aggregateQueryParams.parmDesigns[k] = self.queryParams.parmDesigns[j];
                    }
                }
            } else {
                self.aggregateQueryParams.parmDesigns.push(self.queryParams.parmDesigns[j]);
            }
        }
    }

    //NEED TO RIVISIT
    /*function addAggregateParam(self) {
        //Getting Aggreagate Query Param Id Separate
        //var aggreParamIds = [];
        //var aggreParmDesigns = self.aggregateQueryParams.parmDesigns;

        //aggreParamIds = _.pluck(aggreParmDesigns, 'id');

        //If aggregate query param Id matching with queryParams id we are replacing the paramDesign else we will add
        //new value to the aggregate param
        //var queryParmDesigns = self.queryParams.parmDesigns;
        //var queryParamLength = self.queryParams.parmDesigns.length;

        //for (var j = 0; j < queryParamLength; j++) {
        //    if (aggreParamIds.indexOf(queryParmDesigns[j].id) > -1) {
        //        for (var k = 0; k < aggregateLength; k++) {
        //            if (aggreParmDesigns[k].id === queryParmDesigns[j].id) {
        //                aggreParmDesigns[k] = queryParmDesigns[j];
        //            }
        //        }
        //    } else {
        //        aggreParmDesigns.push(queryParmDesigns[j]);
        //    }
        //}

        return mergeCollectionsBy(self.aggregateQueryParams.parmDesigns, self.queryParams.parmDesigns, 'id');
    }*/


    function mergeCollectionsBy(arr1, arr2, prop) {
        var arrPropValues = _.pluck(arr1, prop);
        var arr1Length = arr1.length;
        var arr2Length = arr2.length;

        for (var i = 0; i < arr2Length; i++) {
            if (arrPropValues.indexOf(arr2[i][prop] > -1)) {
                for (var j = 0; j < arr1Length; j++) {
                    if (arr1[j][prop] === arr2[i][prop]) {
                        arr1[j] = arr2[i];
                    }
                }
            } else {
                arr1.push(arr2[i]);
            }
        }
        return arr2;
    }


    /********************************************************************************************
                           UNUSED FUNCTIONS
   **********************************************************************************************/

    function getOriginalCriteria(existingFilters, criteria) {
        if (!existingFilters.length || !criteria) {
            return criteria;
        } else {
            var criteriaArr = criteria.split(' And ');
            var lastCriteria = criteriaArr[criteriaArr.length - 1].toString().trim();
            var criteriaIndex = $.inArray(lastCriteria, existingFilters);
            if (criteriaIndex !== -1) {
                if (criteriaHasDate(lastCriteria)) {
                    return removeLastCriterias(criteria, 2).trim();
                } else {
                    return criteria.substring(0, criteria.lastIndexOf(' And ')).trim();
                }
            } else {
                return criteria;
            }
        }
    }

    function criteriaHasDate(criteria) {
        var escaped = criteria.replace('(>=(# :dt :utc ', '').replace(' 00:00:00', "").replace(/\)/g, '')
            .replace(' 23:59:59', "").replace('<=(# :dt :utc ', '').replace(/'/g, "");
        return new Date(escaped).toString() !== 'Invalid Date';
    }

    function removeLastCriterias(str, times) {
        var newStr = str;
        for (var i = 0; i < times; i++) {
            newStr = newStr.substring(0, newStr.lastIndexOf(str));
        }
        return newStr;
    }

    return QueryHelper;
});