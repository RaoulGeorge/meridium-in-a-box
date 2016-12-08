define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var utils = require('./utils');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    function StaticHelper(self) {

    }

    var base = Object.inherit(utils, StaticHelper);

    StaticHelper.prototype.handleStaticDataLoad = function StaticHelper_handleStaticDataLoad(self, optionsObj, dfd) {
        var dataDfd = $.Deferred(),
            colIdx;
        //Remembering the focused filter textbox to use it after results load.
        colIdx = $('.dx-datagrid-filter-row .dx-editor-cell').index($('.dx-editor-cell.dx-focused'));
        self.filterElIndex = colIdx !== -1 ? colIdx : self.filterElIndex;

        dataDfd.done(staticDataLoadDone.bind(null, self, optionsObj, dfd));

        Object.tryMethod(self, 'onPageChangeCB', dataDfd, optionsObj);
    };

    function staticDataLoadDone(self, optionsObj, dfd, data) {
        self.rawQueryData = data;
        if (self.currentFilter !== optionsObj.filter) {
            self.currentFilter = optionsObj.filter;
            self.getTotalCount = true;
            $(self.element).find('.dxDataGridTotalCount').html(data.totalCount + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        }
        dfd.resolve(data.data);

        //setting focus on filter current filter column textbox
        $($('.dx-datagrid-filter-row .dx-editor-cell')[self.filterElIndex]).find('input').focus();
    }

    StaticHelper.prototype.handleGetTotalRecordsCount = function StaticHelper_handleGetTotalRecordsCount(self, getOptions) {
        var dfd = $.Deferred();
        Object.tryMethod(self, 'totalCountCallback', dfd);
        dfd.done(function (val) {
            self._totalCount(val);
        });
        return dfd.promise();
    };

    StaticHelper.prototype.getStaticColumns = function StaticHelper_getColumns(self, columns) {
        var data = self.rawQueryData, dataColumn , gridColumn;
        for (var q = 0; q < columns.length; q++) {

            dataColumn = data.columns[q];
            gridColumn = columns[q];

            gridColumn.dataField = dataColumn.id;
            if (dataColumn.alias !== undefined && dataColumn.alias !== '') {
                gridColumn.caption = dataColumn.alias;
            }
            else {
                gridColumn.caption = dataColumn.id;
            }

            if (dataColumn.isActionColumn !== undefined && dataColumn.isActionColumn === 'true') {
                gridColumn.cellTemplate = this.handleCellTemplateForActionColumn.bind(null, self);
            }
            else if (dataColumn.hasCellTemplate !== undefined && dataColumn.hasCellTemplate === 'true') {
                gridColumn.cellTemplate = this.handleCustomCellTemplate.bind(null, self);
            }
            if (dataColumn.hasHeaderCellTemplate !== undefined && dataColumn.hasHeaderCellTemplate === 'true') {
                gridColumn.headerCellTemplate = this.handleHeaderCellTemplate.bind(null, self);
            }

            gridColumn.encodeHtml = false;
            assignProperty(dataColumn, gridColumn, 'dataType');
            if (gridColumn.dataType === 'number') {
                gridColumn.customizeText = this.formatNumberValue;
            }
            assignProperty(dataColumn, gridColumn, 'format');
            assignProperty(dataColumn, gridColumn, 'precision');
            assignProperty(dataColumn, gridColumn, 'cssClass');
            assignProperty(dataColumn, gridColumn, 'alignment');
            assignProperty(dataColumn, gridColumn, 'width');
            assignProperty(dataColumn, gridColumn, 'allowFiltering', converter.toBoolean(dataColumn.allowFiltering, 'true'));
            assignProperty(dataColumn, gridColumn, 'visible', converter.toBoolean(dataColumn.visible, true));
            assignProperty(dataColumn, gridColumn, 'allowEditing', converter.toBoolean(dataColumn.allowEditing, 'true'));

            //Handling column datasource lookup
            if (dataColumn.lookup !== undefined && data[dataColumn.lookup.dataSource]) {
                gridColumn.lookup = dataColumn.lookup;
                gridColumn.lookup.dataSource = data[dataColumn.lookup.dataSource];
            }
        }
        return columns;
    };

    //Checks obj1 property to obj2 if it is defined and sets value, if value passed else sets obj1 prop value 
    function assignProperty(obj1, obj2, prop, value) {
        if (obj1[prop] !== undefined) {
            obj2[prop] = arguments.length === 4 ? value : obj1[prop];
        }
    }

    return StaticHelper;
});