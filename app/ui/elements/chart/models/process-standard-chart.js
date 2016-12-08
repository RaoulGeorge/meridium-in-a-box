define (function (require) {
    'use strict';

    var R = require('ramda'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        Parser = require('system/text/parser'),
        ApplicationContext = require('application/application-context');

    function ProcessStandardChart(){}

    ProcessStandardChart.processData = function(parentClass, result, config, sliceIndexes, row, hyperlinkIndexes){
        var sliceIndex, value, chartType, hyperLinkValue, formattedValue,
            gridObject = {},
            chartData = result.chartData,
            categories = result.categoryArray;

        for (sliceIndex = 0; sliceIndex < sliceIndexes.length; sliceIndex++) {
            value = ChartUtilities.getRowValueFromQuery(config, row, sliceIndexes, sliceIndex);
            formattedValue = ChartUtilities.getFormattedValueFromQuery(config, row, sliceIndexes, sliceIndex);
            hyperLinkValue = ChartUtilities.extractHyperlinkHref(row.columnValues[hyperlinkIndexes[sliceIndex]]);
            chartType = parentClass.chartUtilities.translateChartType(config.series[sliceIndex].chartType);
            gridObject[config.categoryProperty] = result.categoryArray[result.categoryArray.length - 1];

            if (chartType === 'stock' || chartType === 'stock-area' || chartType === 'stacked-stock'){
                setStockChart(config, categories, chartData, hyperLinkValue, formattedValue, chartType, value, sliceIndex);
            } else {
                var dataObj = {
                    y: value,
                    url: (hyperLinkValue ? hyperLinkValue : '')
                };
                if(config.formattedQuery && formattedValue){
                    dataObj.formattedValue = formattedValue;
                }
                if (chartData[sliceIndex]) {
                    chartData[sliceIndex].data[chartData[sliceIndex].data.length] = dataObj;
                } else {
                    chartData[sliceIndex] = {
                        type: chartType,
                        data: [dataObj],
                        name: config.series[sliceIndex].name,
                        color: config.series[sliceIndex].color,
                        yAxis: config.series[sliceIndex].yAxis
                    };
                }
            }
            gridObject[config.series[sliceIndex].name] = value;
        }
        result.gridData.data[result.gridData.data.length] = gridObject;
    };

    function setStockChart(config, categories, chartData, hyperLinkValue, formattedValue, chartType, value, sliceIndex){
        if(categories[categories.length - 1] !== undefined &&
            categories[categories.length - 1] !== "" && categories[categories.length - 1] !== null) {
            if (chartData[sliceIndex]) {
                chartData[sliceIndex].data[chartData[sliceIndex].data.length] =
                    [
                        parseDateValue(categories[categories.length - 1]),
                        Number(getPointValue(value))
                    ];
                chartData[sliceIndex].urls[chartData[sliceIndex].urls.length] =
                    (hyperLinkValue ? hyperLinkValue : '');
                chartData[sliceIndex].formattedValues[chartData[sliceIndex].formattedValues.length] =
                    (formattedValue ? formattedValue : '');
            } else {
                chartData[sliceIndex] = {
                    type: chartType,
                    data: [
                        [
                            parseDateValue(categories[categories.length - 1]),
                            Number(getPointValue(value))
                        ]
                    ],
                    name: config.series[sliceIndex].name,
                    color: config.series[sliceIndex].color,
                    yAxis: config.series[sliceIndex].yAxis,
                    urls: [(hyperLinkValue ? hyperLinkValue : '')],
                    formattedValues: [(formattedValue ? formattedValue : '')]
                };
            }
        }
    }

    function getPointValue (point) {
        var value = Parser.parseFloat(ChartUtilities.extractHyperlinkValue(point));
        return  isNaN(value) ? null : Number(value);
    }

    function parseDateValue(val){
        if(ChartUtilities.isHTML(val)){
            return Date.parse(
                Parser.parseDate(
                    ChartUtilities.extractHyperlinkValue(val),
                    ApplicationContext.user.formats.dateTime,
                    ApplicationContext.user.cultureId
                )
            );
        }else{
            return Date.parse(
                ChartUtilities.extractHyperlinkValue(val)
            );
        }
    }

    return ProcessStandardChart;
});