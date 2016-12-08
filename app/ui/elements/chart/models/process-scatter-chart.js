define (function (require) {
    'use strict';

    var ChartUtilities = require('ui/elements/chart/chart-utilities');

    function ProcessScatterChart(){}

    ProcessScatterChart.processData = function(
        self,
        result,
        config,
        sliceIndexes,
        categoryValue,
        horizontalAxisProperty,
        sizeProperty,
        row,
        hyperlinkIndexes
    ){
        var value = {}, categoryIndex, gridObject = {}, hyperLinkValue,
            formattedValue = getFormattedValue(config, row, sliceIndexes),
            formattedHorizontalAxisProperty = getFormattedProperty(config, row, horizontalAxisProperty),
            formattedSizeProperty = getFormattedProperty(config, row, sizeProperty);

        categoryIndex = checkForCategory(categoryValue, result.chartData);
        hyperLinkValue = ChartUtilities.extractHyperlinkHref(row.columnValues[hyperlinkIndexes[0]]);

        if (categoryIndex === undefined) {
            categoryIndex = result.chartData.length;
            result.chartData[categoryIndex] = {
                type: config.chartType,
                data: [],
                name: categoryValue,
                color: config.series[0].color,
                yAxis: config.series[0].yAxis
            };
        }
        value.y = ChartUtilities.extractHyperlinkValue(formattedValue);
        value.x = ChartUtilities.extractHyperlinkValue(formattedHorizontalAxisProperty);
        if (sizeProperty) {
            value.z = ChartUtilities.extractHyperlinkValue(formattedSizeProperty);
        }

        value.url = (hyperLinkValue ? hyperLinkValue : '');
        if(config.formattedQuery){
            value.formattedXValue = row.displayInfos[horizontalAxisProperty] ? row.columnValues[horizontalAxisProperty] : '';
            value.formattedYValue = row.displayInfos[sliceIndexes[0]] ? row.columnValues[sliceIndexes[0]] : '';
            if (sizeProperty) {
                value.formattedZValue = row.displayInfos[sizeProperty]  ? row.columnValues[sizeProperty] : '';
            }
        }
        result.chartData[categoryIndex].data[result.chartData[categoryIndex].data.length] = value;
        gridObject[config.categoryProperty] = categoryValue;
        gridObject[config.series[0].name] = value.x;
        gridObject[config.horizontalAxisProperty] = value.y;
        gridObject[config.sizeProperty] = value.z;

        result.gridData.data[result.gridData.data.length] = gridObject;
    };

    function getFormattedValue(config, row, sliceIndexes){
        var displayInfo = row.displayInfos ? row.displayInfos[sliceIndexes[0]] : null,
            value = row.columnValues[sliceIndexes[0]];
        if(config.formattedQuery){
            value = displayInfo ? displayInfo.dataFieldValue : value;
        }
        return value;
    }

    function getFormattedProperty(config, row, prop){
        var displayInfo = row.displayInfos ? row.displayInfos[prop] : null,
            value = row.columnValues[prop];
        if(config.formattedQuery){
            value = displayInfo ? displayInfo.dataFieldValue : value;
        }
        return value;
    }

    function checkForCategory(category, chartData) {
        var categoryIndex, idx;

        if (chartData.length > 0) {
            for (idx = 0; idx < chartData.length; idx++) {
                if (chartData[idx].name === category) {
                    categoryIndex = idx;
                    break;
                }
            }
        }
        return categoryIndex;
    }

    return ProcessScatterChart;
});