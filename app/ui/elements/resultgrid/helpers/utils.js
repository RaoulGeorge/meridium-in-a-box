define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    var MessageBox = require('system/ui/message-box');

    var QueryContainerDTO = require('query/services/dto/query-container-dto'),
        QueryExecutionEngine = require('query/execution/query-execution-engine');

    function ResultGridUtils() {

    }

    ResultGridUtils.prototype.handleRowPrepared = function ResultGridUtils_handleRowPrepared(self, rowElement, rowInfo) {
        if (rowElement.rowType !== "data") {
            return;
        }
        Object.tryMethod(self, 'rowPreparedCallback', rowElement, rowElement);
    };

    ResultGridUtils.prototype.handleCellTemplateForActionColumn = function ResultGridUtils_handleCellTemplateForActionColumn(self, container, options) {

        try {
            var el = $(options.value);
            var data = el.data() || {};

            data.hyperlinkText = el.text();
            data.hyperlinkUrl = el.attr('href');

            el.addClass('dx-link').on('click', function (e) {
                e.preventDefault();
            }).on('dxclick', function () {
                Object.tryMethod(self, 'cellHyperlinkCallback', data);
            }).appendTo(container);
        }
        catch (e) {
            throw self.translator.translate('RG_INVALID_HYPERLINK_FORMAT_MSG');
        }

    };

    ResultGridUtils.prototype.handleCustomCellTemplate = function ResultGridUtils_handleCustomCellTemplate(self, container, options) {
        Object.tryMethod(self, 'cellTemplateCallback', container, options);
    };

    ResultGridUtils.prototype.handleHeaderCellTemplate = function ResultGridUtils_handleHeaderCellTemplate(self, header, info) {
        Object.tryMethod(self, 'headerCellTemplateCallback', header, info);
    };

    ResultGridUtils.prototype.formatNumberValue = function ResultGridUtils_formatNumberValue(cellInfo) {
        //As per devex documentation if return falsy value, column value wont be visible, so we should send string "0" for 0 values
        if (!cellInfo.value || isNaN(parseInt(cellInfo.value))) {
            return cellInfo.value === 0 ? cellInfo.value.toString() : cellInfo.value;
        }

        var floatValue = cellInfo.value.toString().split('.')[1];
        var precession = floatValue ? floatValue.length : 0;
        return Formatter.format(converter.toFloat(cellInfo.value), 'n' + precession);
    };


    /****************************************************************************************************
                            Pagination Handling
    *****************************************************************************************************/

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

    ResultGridUtils.prototype.getMenuPaging = function ResultGridUtils_getMenuPaging(self, totalCount) {
        var options = {};
        if (self.aggregateQueryParams) {
            if (self.queryParams) {
                addAggregateParam(self);
            }
            options.parameters = self.aggregateQueryParams;
            options.suppressPrompts = true;
        }
        else if (self.queryParams) {
            options.parameters = self.queryParams;
            options.suppressPrompts = true;
        }
        self.suppressPrompts(true);
        options.suppressPrompts = true;
        options.evalOnly = true;
        if (self.cachedQueryContainer) {
            options.queryContainer = new QueryContainerDTO($.parseJSON(JSON.stringify(self.cachedQueryContainer)));
            self.queyExecutionEngine = new QueryExecutionEngine(options);
            self.queyExecutionEngine.execute(options).done(function (data) {
                var rowlength = data.rowCount;
                updatePager(self, rowlength);
                $(self.element).find('.rg-pager').show();
                self.getTotalCount = false;
            });
        } else if (self.data() === "static" && self.scrollType() === 'standard') {
            updatePager(self, totalCount || self._totalCount());
            $(self.element).find('.rg-pager').show();
            self.getTotalCount = false;
        } else if (self.loadJSONData) {
            updatePager(self, totalCount);
            if (self.showPaging) {
                $(self.element).find('.rg-pager').show();
            }
            else {
                $(self.element).find('.rg-pager').hide();
            }
            self.getTotalCount = false;
        }
    };


    function updatePager(self, rowlength) {
        var opt = "";

        var menuObjects = [];
        if (rowlength !== 0) {
            var optlength = rowlength / self.pageSize();
            for (var i = 0; i < optlength; i++) {
                opt = ((i * self.pageSize()) + 1) + " - " + (i + 1) * self.pageSize();
                menuObjects.push({ displayName: opt, val: i });
            }

            var lastOpt = menuObjects[menuObjects.length - 1];
            var optText = lastOpt.displayName;
            optText = optText.substr(0, optText.indexOf("-") + 2);
            lastOpt.displayName = optText + rowlength;
            self.selectedValue('');
            self.listObjects(menuObjects);
            self.customTotalCount(rowlength);
        } else {
            self.selectedValue('');
            self.listObjects([{ displayName: "0", val: 0 }]);
            self.customTotalCount(0);
        }
    }


    ResultGridUtils.prototype.changePage = function ResultGridUtils_changePage(self, newValue) {
        if (!self.getTotalCount) {
            var selc = self.selectedValue();
            self.pageNumber = selc;
            self.gridInstance.pageIndex(self.pageNumber);
        }
    };


    /****************************************************************************************************
                           UNUSED FUNCTIONS
   *****************************************************************************************************/

    function handlePageButtons(self, forJSON) {
        if (self._totalCount() < self.pageSize()) {
            //disable all paging when the results less than page size
            $(self.element).find('.pageControls .firstPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .prevPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .nextPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .lastPage').attr('disabled', 'disabled');
        } else {
            //enable page navigation
            $(self.element).find('.pageControls .firstPage').removeAttr('disabled');
            $(self.element).find('.pageControls .prevPage').removeAttr('disabled');
            $(self.element).find('.pageControls .nextPage').removeAttr('disabled');
            $(self.element).find('.pageControls .lastPage').removeAttr('disabled');
        }
        if (!self.gridInstance.pageIndex()) {
            //disable when no pages to go back
            $(self.element).find('.pageControls .firstPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .prevPage').attr('disabled', 'disabled');
        } else if (self.gridInstance.pageIndex() === Math.floor(self._totalCount() / self.pageSize())) {
            //disable when no pages to move forward
            $(self.element).find('.pageControls .nextPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .lastPage').attr('disabled', 'disabled');
        }

        if (self.scrollType() !== 'standard' || self._totalCount() < self.pageSize()) {
            //Use devexpress paging incase of JSON data
            $(self.element).find('.pageControls ').hide();
        } else {
            //enabling custom paging for query and static data 
            $(self.element).find('.pageControls ').show();
        }
    }

    function handlePageChange(self, state) {
        if (!self.gridInstance) {
            console.error('grid instance not available');
            return;
        }
        switch (state) {
            case 'first':
                self.gridInstance.pageIndex(0);
                break;
            case 'prev':
                self.gridInstance.pageIndex(self.gridInstance.pageIndex() - 1);
                break;
            case 'next':
                self.gridInstance.pageIndex(self.gridInstance.pageIndex() + 1);
                break;
            case 'last':
                self.gridInstance.pageIndex(Math.ceil(self._totalCount() / self.pageSize()));
                break;
        }
    }


    function handleErr(self, data) {
        MessageBox.showOk('Error in executing Query',
            'Error');
    }

    function handleGridHeight(self) {
        if ($(self.element).find('.dx-datagrid-pager.dx-pager').length) {
            var rowsHeight = $(self.element).find(".gridContainer").height() - $(self.element).find(".dx-datagrid-headers").height();
            $(self.element).find(".dx-datagrid-rowsview").height(rowsHeight);

        }
    }

    return ResultGridUtils;

});