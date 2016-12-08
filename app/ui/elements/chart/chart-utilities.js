define(function(require) {
    'use strict';

    var _ = require('lodash'),
        R = require('ramda'),
        Translator = require('system/globalization/translator'),
        ChartService = require('ui/elements/chart/services/chart-service'),
        ApplicationContext = require('application/application-context'),
        Formatter = require('system/text/formatter'),
        hyperlinkValueRegex = /<a [^>]+>([^<]+)<\/a>/,
        squareBracketsRegex = /\[|\]/g,
        camelCaseSpecialCharRegex = /[\s|\[|\]|_|\-|.]/g,
        upperCaseRegex = /^[A-Z]/,
        hyperlinkHrefRegex = /'([^']*)'/g,
        hashRegex = /[#']/g;

    function ChartUtilities() {
        //Chart Types
        this.CHART_TYPE_COLUMN = 'column';
        this.CHART_TYPE_STACKED_COLUMN = 'stacked-column';
        this.CHART_TYPE_BAR = 'bar';
        this.CHART_TYPE_STACKED_BAR = 'stacked-bar';
        this.CHART_TYPE_AREA = 'area';
        this.CHART_TYPE_AREA_SPLINE = 'areaspline';
        this.CHART_TYPE_STACKED_AREA = 'stacked-area';
        this.CHART_TYPE_RADAR = 'radar';
        this.CHART_TYPE_POLAR = 'polar';
        this.CHART_TYPE_LINE = 'line';
        this.CHART_TYPE_PIE = 'pie';
        this.CHART_TYPE_DONUT = 'donut';
        this.CHART_TYPE_BUBBLE = 'bubble';
        this.CHART_TYPE_SCATTER = 'scatter';
        this.CHART_TYPE_PYRAMID = 'pyramid';
        this.CHART_TYPE_STOCK = 'stock';
        this.CHART_TYPE_STOCK_AREA = 'stock-area';
        this.CHART_TYPE_STOCK_STACKED_AREA = 'stacked-stock';
        this.CHART_TYPE_HEATMAP = 'heatmap';


        //Chart Methods
        this.CHART_METHOD_COUNT = 'count';
        this.CHART_METHOD_PERCENT = 'percent';
        this.CHART_METHOD_SUM = 'sum';

        this.translator = Object.resolve(Translator);
        this.chartService = Object.resolve(ChartService);

        this.timezones = [];

        this.CHART_AXIS_FORMATS = [
            {
                format: '',
                display: this.translator.translate('CHART_NO_FORMAT')
            },
            {
                format: 'n',
                display: this.translator.translate('CHART_NUMBER')
            },
            {
                format: 'c',
                display: this.translator.translate('CHART_CURRENCY')
            },
            {
                format: 'p',
                display: this.translator.translate('CHART_PERCENTAGE')
            }
        ];

        this.CHART_COLORS = [
            '#61adff',
            '#fa913c',
            '#8ad998',
            '#ffdc50',
            '#ff5a4f',
            '#c0deff',
            '#fdd3b1',
            '#d0f0d6',
            '#fff1b9',
            '#ffbdb9',
            '#6999c7',
            '#e08437',
            '#84bb88',
            '#e6c74a',
            '#da524b',
            '#a0ceff',
            '#fcbd8a',
            '#b9e8c1',
            '#ffea96',
            '#ff9c95',
            '#5880a7',
            '#b86c2b',
            '#6d9e72',
            '#bda53d',
            '#b4443c',
            '#81bdff',
            '#fba763',
            '#a1e1ad',
            '#ffe373',
            '#ff7b72',
            '#42617f',
            '#854e18',
            '#4f7755',
            '#8d7c2b',
            '#953730'
        ];
        this.CHART_INDICATOR_COLORS = [
            '#007aff',
            '#ff9500',
            '#4cd964',
            '#ffcc00',
            '#ff3b30'
        ];
        this.CHART_TYPES = [
            {
                display: this.translator.translate('BAR_CHART'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_COLUMN,
                        display: this.translator.translate('CHART_COLUMN'),
                        icon: 'icons-mi-chart-column'
                    },
                    {
                        name: this.CHART_TYPE_BAR,
                        display: this.translator.translate('CHART_BAR'),
                        icon: 'icons-mi-chart-bar'
                    },
                    {
                        name: this.CHART_TYPE_STACKED_COLUMN,
                        display: this.translator.translate('CHART_STACkED_COLUMN'),
                        icon: 'icons-mi-chart-stacked-column'
                    },
                    {
                        name: this.CHART_TYPE_STACKED_BAR,
                        display: this.translator.translate('CHART_STACKED_BAR'),
                        icon: 'icons-mi-chart-stacked-bar'
                    }
                ]
            },
            {
                display: this.translator.translate('LINE_CHART'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_LINE,
                        display: this.translator.translate('CHART_LINE'),
                        icon: 'icons-mi-chart-line'
                    },
                    {
                        name: this.CHART_TYPE_AREA,
                        display: this.translator.translate('CHART_AREA'),
                        icon: 'icons-mi-chart-area'
                    },
                    {
                        name: this.CHART_TYPE_STACKED_AREA ,
                        display: this.translator.translate('CHART_STACKED_AREA'),
                        icon: 'icons-mi-chart-stacked-area'
                    }
                ]
            },
            {
                display: this.translator.translate('PIE_CHART'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_PIE,
                        display: this.translator.translate('CHART_PIE'),
                        icon: 'icons-mi-chart-pie'
                    },
                    {
                        name: this.CHART_TYPE_DONUT,
                        display: this.translator.translate('CHART_DONUT'),
                        icon: 'icons-mi-chart-donut'
                    },
                    {
                        name: this.CHART_TYPE_PYRAMID,
                        display: this.translator.translate('CHART_PYRAMID'),
                        icon: 'icons-mi-chart-pyramid'
                    }
                ]
            },
            {
                display: this.translator.translate('RADAR_CHART'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_RADAR,
                        display: this.translator.translate('CHART_RADAR'),
                        icon: 'icons-mi-chart-radar'
                    },
                    {
                        name: this.CHART_TYPE_POLAR,
                        display: this.translator.translate('CHART_POLAR'),
                        icon: 'icons-mi-chart-polar'
                    }
                ]
            },
            {
                display: this.translator.translate('SCATTER_CHART'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_SCATTER,
                        display: this.translator.translate('CHART_SCATTER'),
                        icon: 'icons-mi-chart-scatter'
                    },
                    {
                        name: this.CHART_TYPE_BUBBLE,
                        display: this.translator.translate('CHART_BUBBLE'),
                        icon: 'icons-mi-chart-bubble'
                    }
                ]
            },
            {
                display: this.translator.translate('STOCK_CHARTS'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_STOCK,
                        display: this.translator.translate('CHART_STOCK_LINE'),
                        icon: 'icons-mi-stock-chart-line'
                    },
                    {
                        name: this.CHART_TYPE_STOCK_AREA,
                        display: this.translator.translate('CHART_STOCK_AREA'),
                        icon: 'icons-mi-stock-chart-area'
                    },
                    {
                        name: this.CHART_TYPE_STOCK_STACKED_AREA,
                        display: this.translator.translate('CHART_STOCK_STACKED_AREA'),
                        icon: 'icons-mi-stock-chart-area-stacked'
                    }
                ]
            },
            {
                display: this.translator.translate('HEATMAP_CHARTS'),
                chartTypes: [
                    {
                        name: this.CHART_TYPE_HEATMAP,
                        display: this.translator.translate('CHART_HEATMAP'),
                        icon: 'icons-mi-heatmap-chart'
                    }
                ]
            }

        ];
    }

    ChartUtilities.prototype.allow3d = function (chartType) {
        var allowedChartTypes = [
                this.CHART_TYPE_COLUMN,
                this.CHART_TYPE_STACKED_COLUMN,
                this.CHART_TYPE_BAR,
                this.CHART_TYPE_STACKED_BAR,
                this.CHART_TYPE_PIE,
                this.CHART_TYPE_DONUT
            ];

        return allowedChartTypes.indexOf(chartType) > -1;
    };

    ChartUtilities.prototype.translateChartType = function (chartType) {
        if (chartType === this.CHART_TYPE_STACKED_COLUMN) {
            return this.CHART_TYPE_COLUMN;
        }
        if (chartType === this.CHART_TYPE_STACKED_BAR) {
            return this.CHART_TYPE_BAR;
        }
        if (chartType === this.CHART_TYPE_STACKED_AREA) {
            return this.CHART_TYPE_AREA;
        }
        if (chartType === this.CHART_TYPE_RADAR) {
            return this.CHART_TYPE_LINE;
        }
        if (chartType === this.CHART_TYPE_POLAR) {
            return this.CHART_TYPE_COLUMN;
        }

        return chartType;
    };

    var getTranslatedColumnDataForEachColumn =
        R.curry(function getTranslatedColumnDataForEachColumn(name, columnData, column){
        if(name === column.alias || name === column.uniqueId){
            columnData.push(column);
        }
    });

    ChartUtilities.prototype.getTranslatedColumnData = function (self, name) {
        var columns, columnData = [];
        if (self.chart.state.rawData) {
            columns = self.chart.state.rawData.columns;
            R.forEach(getTranslatedColumnDataForEachColumn(name, columnData), columns);
        }
        return R.head(columnData);
    };

    ChartUtilities.getHyperlinkColumnIndexes = function (rowSet){
        var columnIdx, rowIdx, data, row, isHTML, columnHyperlinkIndexes = [],
            columns = rowSet.columns, id;

        for (rowIdx = 0; rowIdx < rowSet.rows.length; rowIdx++) {
            row = rowSet.rows[rowIdx];
            data = {};
            for (columnIdx = 0; columnIdx < row.columnValues.length; columnIdx++) {
                if (columns[columnIdx].isVisible) {
                    id = columns[columnIdx].uniqueId.replace(squareBracketsRegex, '');
                    data[id] = row.columnValues[columnIdx];
                    isHTML = this.isHTML(row.columnValues[columnIdx]);
                    if (isHTML) {
                        if (!this.isInArray(columnIdx, columnHyperlinkIndexes)) {
                            columnHyperlinkIndexes[columnHyperlinkIndexes.length] = columnIdx;
                        }
                    }
                }
            }
        }

        return columnHyperlinkIndexes;
    };

    ChartUtilities.formatDataset = function (json) {
        var columns = [],
            data = [];

        if(typeof json !== 'undefined'){

            for(var i = 0; i < json.columns.length; i++){
                var column = {
                    'id': camelCase(json.columns[i].id),
                    'alias': json.columns[i].alias,
                    'isVisible': true,
                    'uniqueId': camelCase(json.columns[i].id)
                };

                columns.push(column);
            }

            for(var k = 0; k < json.data.length; k++){
                var temp = {'columnValues':[]};
                for(var l = 0; l < json.columns.length; l++){
                    temp.columnValues.push(json.data[k][json.columns[l].id]);
                }

                data.push(temp);
            }
        }

        return {
            columns: columns,
            rows: data
        };
    };

    function toLower (value) {
        return value.toLowerCase();
    }

    function camelCase(str) {
        return str.replace(camelCaseSpecialCharRegex, '').replace(upperCaseRegex, toLower);
    }

    ChartUtilities.formatGridData = function (rowSet) {
        var columnIdx, rowIdx, data, row, result = [], columnsArray = [], id , columns;
        if (rowSet.data) {
            columns = _.keys(rowSet.data[0]);
        } else if(rowSet[0]){
            rowSet.data = rowSet[0].data;
            columns = _.keys(rowSet.data[0]);
        }

        for (rowIdx = 0; rowIdx < rowSet.data.length; rowIdx++) {
            row = rowSet.data[rowIdx];
            data = {};
            for(columnIdx=0; columnIdx < columns.length; columnIdx++){
                id = camelCase(columns[columnIdx]);
                data[id] = row[columns[columnIdx]];
                data[id] = formatRow(data[id]);
                if(rowIdx === 0) {
                    var columnData = {};
                    columnData.id = camelCase(columns[columnIdx]);
                    columnData.alias = columns[columnIdx];
                    columnsArray.push(columnData);
                }
            }
            result[result.length] = data;
        }

        return {columns: columnsArray, data: result };

    };

    function formatRow(value) {
        var formatter = Object.resolve(Formatter);

        if (hasDecimal(value) && _.isFinite(value)) {
            value = formatter.format(value, 'g', ApplicationContext.user.cultureId);
        }

        return value;
    }

    function hasDecimal(value) {
        return value % 1 !== 0;
    }

    ChartUtilities.rowSetToJSON = function (rowSet) {
        var columnIdx, rowIdx, data, row, result = [],columnsArray = [],
            columns = rowSet.columns, id, alias;

        for (rowIdx = 0; rowIdx < rowSet.rows.length; rowIdx++) {
            row = rowSet.rows[rowIdx];
            data = {};
            for (columnIdx = 0; columnIdx < row.columnValues.length; columnIdx++) {
                if (columns[columnIdx].isVisible) {
                    id = columns[columnIdx].uniqueId.replace(squareBracketsRegex, '');
                    data[id] = row.columnValues[columnIdx];
                    data[id] = formatRowSet(data[id], columns[columnIdx].typeName);
                    if(columns[columnIdx].alias){
                        alias = columns[columnIdx].alias;
                    }
                    if(rowIdx === 0){
                        var columnData = {};
                        columnData.id = id;
                        if(alias){
                            columnData.alias = alias;
                        }
                        columnsArray.push(columnData);
                    }
                }
            }
            result[result.length] = data;
        }


        return {columns: columnsArray, data: result };
    };

    function formatRowSet(data, type) {
        var formatter = Object.resolve(Formatter);

        if (isNumber(type)) {
            data = formatter.format(data, 'g', ApplicationContext.user.cultureId);
        } else if (isDate(type) && !ChartUtilities.isHTML(data)) {
            data = formatter.format(new Date(data), ApplicationContext.user.formats.dateTime, ApplicationContext.user.cultureId);
        }

        return data;
    }

    function isNumber(type) {
        return type === 'System.Int32' || type === 'System.Double';
    }

    function isDate(type) {
        return type === 'System.DateTime';
    }

    ChartUtilities.extractHyperlinkValue = function (value){
        var match = hyperlinkValueRegex.exec(value || '');

        if (match !== null) {
            value = match[1];
        }
        return value;
    };

    ChartUtilities.extractHyperlinkHref = function(hyperLinkValue){
        var matchArray;
        if (hyperLinkValue && isHyperlink(hyperLinkValue.toString())) {
            matchArray = hyperLinkValue.match(hyperlinkHrefRegex);
            if (matchArray !== null) {
                hyperLinkValue = matchArray[0].replace(hashRegex,'');
            }
        } else {
            hyperLinkValue = null;
        }
        return hyperLinkValue;
    };

    function isHyperlink (value) {
        return value.indexOf('#') > -1 || value.indexOf('http') > -1;
    }

    ChartUtilities.isHTML = function(str) {
        var a = document.createElement('div');
        a.innerHTML = str;
        for (var c = a.childNodes, i = c.length; i--; ) {
            if (c[i].nodeType === 1){ return true; }
        }
        return false;
    };

    ChartUtilities.isInArray = function(value, array) {
        return array.indexOf(value) > -1;
    };

    ChartUtilities.closestByNodeName = function(el, node) {
        while (el.nodeName !== node) {
            el = el.parentNode;
            if (!el) {return null;}
        }
        return el;
    };

    ChartUtilities.prototype.showXAxisLabels = function (config) {
        var showLabelFor = [
            this.CHART_TYPE_BAR,
            this.CHART_TYPE_STACKED_BAR,
            this.CHART_TYPE_POLAR,
            this.CHART_TYPE_RADAR
        ];
        return config.showXaxisLabels || showLabelFor.indexOf(config.chartType) > -1;
    };

    ChartUtilities.prototype.typeOfPieChart = function (chartType) {
        var pieChartTypes = [
            this.CHART_TYPE_PIE,
            this.CHART_TYPE_DONUT,
            this.CHART_TYPE_PYRAMID
        ];

        return pieChartTypes.indexOf(chartType) > -1;
    };

    ChartUtilities.getRowValueFromQuery = function (config, row, sliceIndexes, sliceIndex) {
        var displayInfo = row.displayInfos ? row.displayInfos[sliceIndexes[sliceIndex]] : null,
            value = row.columnValues[sliceIndexes[sliceIndex]];
        if(config.formattedQuery){
            value = displayInfo ? displayInfo.dataFieldValue : value;
        }
        return value;
    };

    ChartUtilities.getFormattedValueFromQuery = function (config, row, sliceIndexes, sliceIndex) {
        var displayInfo = row.displayInfos ? row.displayInfos[sliceIndexes[sliceIndex]] : null,
            orgValue = row.columnValues[sliceIndexes[sliceIndex]],
            formattedValue = null;

        if(config.formattedQuery){
            if(displayInfo){
                formattedValue = orgValue;
            }
        }
        return formattedValue;
    };

    return ChartUtilities;
});
