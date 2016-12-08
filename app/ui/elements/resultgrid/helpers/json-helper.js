define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var utils = require('./utils');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    function JsonHelper() {

    }

    var base = Object.inherit(utils, JsonHelper);


    JsonHelper.prototype.preSelectRows = function JsonHelper_preSelectRows(self, data) {
        try {
            var dataGrid = $(self.element).find('.gridContainer').dxDataGrid('instance');
            if (dataGrid) {
                dataGrid.selectRows(data);
            }
        }
        catch (e) {

        }
    };


    JsonHelper.prototype.handleCellPrepared = function JsonHelper_handleCellPrepared(self, dataObject) {
        if (dataObject.rowType !== 'data') {
            return;
        }
        Object.tryMethod(self, 'cellPreparedCallback', dataObject.cellElement, dataObject);
    };

    JsonHelper.prototype.handleInitNewRow = function JsonHelper_handleInitNewRow(self, container, options) {
        Object.tryMethod(self, 'onInitNewRowCallback', container, options);
    };

    JsonHelper.prototype.handleContentReadyActionForJSON = function JsonHelper_handleContentReadyActionForJSON(self) {
        var dataGridInstance = $(self.element).find('.gridContainer').dxDataGrid('instance');
        $(self.element).find('.rg-controls').show();
        $(self.element).find('.rg-header').show();
        var ttlCount = dataGridInstance.totalCount() > 0 ? dataGridInstance.totalCount() : 0;

        var colIdx = $('.dx-datagrid-filter-row .dx-editor-cell').index($('.dx-editor-cell.dx-focused'));
        self.filterElIndex = colIdx !== -1 ? colIdx : self.filterElIndex;

        _.delay(function () {
            $($('.dx-datagrid-filter-row .dx-editor-cell')[self.filterElIndex]).find('input').focus();
        }, 100);

        self.gridInstance = dataGridInstance;
        Object.tryMethod(self, 'gridLoadedCallback', dataGridInstance);

        if (self.customTotalCount() !== ttlCount) {
            self.getTotalCount = true;
        }

        if (self.scrollType() === 'standard') {
            if (self.getTotalCount) {
                this.getMenuPaging(self, ttlCount);
            }
        } else {
            $(self.element).find('.dxDataGridTotalCount').show().text(self._totalCount() + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        }

        $(self.element).find('.dx-datagrid-pager.dx-pager').hide();

        //CSS style overrides for showGridBorder property
        if (self.showGridBorder && $(self.element).find('.grid-border').length === 0) {
            $(self.element).find('#gridContainer').wrap("<div class='grid-border' />");
        }
    };

    JsonHelper.prototype.handleSelectionChangedForJSON = function JsonHelper_handleSelectionChangedForJSON(self, selecteditems) {
        var data;
        if (self.selectionMode() === 'single') {
            data = selecteditems.selectedRowsData[0];
            Object.tryMethod(self, 'callback', data);
        }
        else {
            data = _.map(selecteditems.selectedRowsData, function (a) {
                if (a.FEdefine && a.FEdefine === true && a._notReplaceable === true) {
                    return $.extend(true, a, { illegal: true });
                } else { return a; }
            });
            Object.tryMethod(self, 'multiSelectCallback', data);
        }
    };

    JsonHelper.prototype.handleSelectionChangeForJsonWithoutColumns = function JsonHelper_handleSelectionChangeForJsonWithoutColumns(self, selecteditems) {
        var data;
        if (self.selectionMode() === 'single') {
            data = selecteditems.selectedRowsData[0];
            Object.tryMethod(self, 'callback', data);
        }
        else {
            data = _.map(selecteditems.selectedRowsData, function (a) {
                if (a.FEdefine && a.FEdefine === true) { } else { return a; }
            });
            Object.tryMethod(self, 'multiSelectCallback', data);
        }
    };

    JsonHelper.prototype.handleEditorPreparedForJson = function JsonHelper_handleEditorPreparedForJson(self, options) {
        if (options.parentType === 'filterRow' && options.dataType === 'number') {
            options.editorElement.dxNumberBox({ 'showSpinButtons': true });
        } else if (options.parentType === 'dataRow' && options.dataType === 'number') {
            var numerBox = options.editorElement.dxTextBox({
                value: this.formatNumberValue(options),
                onValueChanged: function (e) {
                    options.setValue(Parser.parseFloat(e.value));
                }
            });
        }
    };

    JsonHelper.prototype.handleEditingStart = function JsonHelper_handleEditingStart(self, container) {
        Object.tryMethod(self, 'onEditingStart', container);
    };


    JsonHelper.prototype.getColumnsFromData = function JsonHelper_getColumnsFromData(self, data) {
        var cols = [];
        for (var i = 0; i < data.columns.length; i++) {
            var column = data.columns[i] || {};
            column.dataField = data.columns[i].dataField || data.columns[i].id;
            if (data.columns[i].alias !== undefined && data.columns[i].alias !== '') {
                column.caption = data.columns[i].alias;
            }
            else if (!column.caption) {
                column.caption = data.columns[i].id;
            }

            if (data.columns[i].isActionColumn !== undefined && data.columns[i].isActionColumn === 'true') {
                column.cellTemplate = this.handleCellTemplateForActionColumn.bind(null, self);

                //handling hyperlink columns sorting and filtering by constructing a new column with hyperlink texts
                var colName = addLinkTextColumn(column.dataField, data.data);
                column.calculateSortValue = colName;
                column.calculateFilterExpression = handleCalcFilterExp.bind(null, colName);
            }
            else if (data.columns[i].hasCellTemplate !== undefined && data.columns[i].hasCellTemplate === 'true') {
                column.cellTemplate = this.handleCustomCellTemplate.bind(null, self);
            }

            if (data.columns[i].hasHeaderCellTemplate !== undefined && data.columns[i].hasHeaderCellTemplate === 'true') {
                column.headerCellTemplate = this.handleHeaderCellTemplate.bind(null, self);
            }

            if (data.columns[i].dataType !== undefined) {
                column.dataType = data.columns[i].dataType;
                if (column.dataType === 'number') {
                    column.customizeText = this.formatNumberValue;

                    //column.editCellTemplate = function (el, cellInfo) {
                    //    debugger
                    //    el.dxTextBox({
                    //        value: cellInfo.text,
                    //        onValueChanged: function (e) {
                    //            cellInfo.setValue(Parser.parseFloat(e.value));
                    //        }
                    //    });
                    //    return el;
                    //};
                }
            }
            column.encodeHtml = false;
            assignProperty(data.columns[i], column, 'precision');
            assignProperty(data.columns[i], column, 'format');
            assignProperty(data.columns[i], column, 'cssClass');
            assignProperty(data.columns[i], column, 'alignment');
            assignProperty(data.columns[i], column, 'width');
            assignProperty(data.columns[i], column, 'allowFiltering', converter.toBoolean(data.columns[i].allowFiltering, 'true'));
            assignProperty(data.columns[i], column, 'allowEditing', converter.toBoolean(data.columns[i].allowEditing, 'true'));
            assignProperty(data.columns[i], column, 'fixed', converter.toBoolean(data.columns[i].fixed, 'true'));
            assignProperty(data.columns[i], column, 'visible', converter.toBoolean(data.columns[i].visible, true));

            //handling column datasource selection
            if (data.columns[i].lookup !== undefined && data[data.columns[i].lookup.dataSource]) {
                column.lookup = $.extend({}, data.columns[i].lookup);
                column.lookup.dataSource = data[data.columns[i].lookup.dataSource];
            }

            cols.push(column);
        }
        return cols;
    };

    //Generating column for with hyperlink texts
    function addLinkTextColumn(fieldId, data) {
        var colName = fieldId + "_linkText";
        for (var j = 0; j < data.length; j++) {
            data[j][colName] = $(data[j][fieldId]).text();
        }
        return colName;
    }

    function handleCalcFilterExp(colName, filterValue, selectedFilterOperation) {
        return [colName, selectedFilterOperation || '=', filterValue];
    }


    function assignProperty(obj1, obj2, prop, value) {
        if (obj1[prop] !== undefined) {
            obj2[prop] = arguments.length === 4 ? value : obj1[prop];
        }
    }

    return JsonHelper;
});