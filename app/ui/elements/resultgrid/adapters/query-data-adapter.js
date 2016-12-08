define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var ko = require('knockout');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter),
        ApplicationContext = require('application/application-context');

    var ColumnInfoDTO = require('./dtos/column-info-dto');

    function QueryDataAdapter(self) {

    }

    var prototype = QueryDataAdapter.prototype;

    prototype.getColumnInfos = function (queryDataColumns) {
        return _.map(queryDataColumns, function mappedColumns(queryDataColumn) {
            return new ColumnInfoDTO(queryDataColumn);
        });
    };

    /*
    //Commenting since we getting everything from Columninfo DTO
    prototype.getColumnsData = function (queryDataColumns) {
        return _.map(queryDataColumns, function mappedColumns(queryDataColumn) {
            var column = $.extend({}, queryDataColumn.__private__);
            column.id = column.fieldId;
            return column;
        });
    };
    */

    prototype.getRows = function QueryDataAdapter_getRows(resultgridVM, queryDataRows, columns) {
        return _.map(queryDataRows, function mappedRows(queryDataRow) {
            var row = {}, cells;
            for (var j = 0; j < columns.length; j++) {
                cells = queryDataRow.getCells();

                row[columns[j].dataField] = getColumnValue(resultgridVM, cells, cells[j], columns[j]);
            }
            return row;
        });
    };

    function getColumnValue(resultgridVM, cells, cell, column) {
        var columnVal = getColumnBaseValue(cell);

        if (column.hyperlinkFormat) {
            columnVal = column.dataType === 'date' ? Formatter.format(cell.getDbValue(), ApplicationContext.user.formats.dateTime) : columnVal;
            columnVal = constructHyperlink(columnVal, cell);
        }

        if (column.dataType === 'date' && columnVal !== "") {
            if (resultgridVM.cachedQueryContainer.isFormatted) {
                resultgridVM.formColumnArr.push(column.dataField);
            } else if (!hasAchorTag(columnVal)) {
                columnVal = converter.toDate(columnVal);
            }
        }

        if (column.dataType === 'boolean') {
            columnVal = converter.toBoolean(columnVal.toString().toLowerCase(), 'y');
        } else if (columnVal && typeof columnVal === 'string') {
            columnVal = escapeHtml(columnVal);
        } else if (column.dataType === 'number') {
            columnVal = cell.getDbValue();
        }

        return columnVal;
    }


    /*
      return value : '<a href="hyperlinkurlinformat" >column value</a>'
   */

    function constructHyperlink(columnVal, cell) {
        var hyperlinkUrl = cell.getHyperlinkRoute();
        return getHyperlinkHtml(hyperlinkUrl, columnVal);
    }

    function getHyperlinkHtml(url, text) {
        var anchor = '';
        if (url) {
            anchor = $('<a/>').attr('href', url).text(text || 'unknown');
            return $('<div/>').append(anchor).html();
        }
        return anchor;
    }

    function getColumnBaseValue(cell) {
        if (cell.getValue() !== undefined && cell.getValue() !== "") {
            return cell.getValue();
        } else if (cell.getDbValue() !== undefined && cell.getDbValue() !== null) {
            return cell.getDbValue();
        }
        return "";
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/<([a-z]+)([^>]*[^\/])?>(?![\s\S]*<\/\1)/gi, function (m) {
            return $('<div/>').text(m).html();
        });
    }

    function hasAchorTag(str) {
        return str.toString().indexOf('<a') !== -1;
    }

    //UNUSED

    /*
       format : '#abc/def/{2}'
       cells: ['one', 'two', 'three']

       return value : '#abc/def/three'
   */
    function getHyperlinkValue(hyperlinkFormat, cells) {
        return hyperlinkFormat.split('/').map(function (arg) {
            if (arg.startsWith('{')) {
                var cellIndex = arg.substr(1, arg.length - 2);
                return cells[cellIndex].getDbValue();
            }
            return arg;
        }).join('/');
    }


    return QueryDataAdapter;
});