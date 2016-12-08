define (function (require) {
    'use strict';

    var _ = require('lodash'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        Parser = require('system/text/parser');

    function ProcessHeatMapChart(){}

    ProcessHeatMapChart.processData = function(parentClass,  result, config, sliceIndexes, heatmapSeries, row){
        var catIdx, sliceIndex, value, chartType, hyperLinkValue, color, formattedValue,
            gridObject = {},
            chartData = result.chartData,
            categories = result.categoryArray;

        for (catIdx = 0; catIdx < categories.length; catIdx++){
            if (chartData.length === 0) {
                chartData[0] = {
                    data: [],
                    urls: [],
                    formattedValues: []
                };
            }
            if(!checkHeatMapCategories(chartData[0].data, catIdx)){
                for (sliceIndex = 0; sliceIndex < sliceIndexes.length; sliceIndex++) {

                    value = ChartUtilities.getRowValueFromQuery(config, row, sliceIndexes, sliceIndex);
                    value = config.formattedQuery ? value : Parser.parseFloat(ChartUtilities.extractHyperlinkValue(value));
                    value = !_.isNaN(Number(value)) ? Number(value) : 0;
                    formattedValue = ChartUtilities.getFormattedValueFromQuery(config, row, sliceIndexes, sliceIndex);
                    hyperLinkValue = ChartUtilities.extractHyperlinkHref(row.columnValues[sliceIndexes[sliceIndex]]);
                    chartType = parentClass.chartUtilities.translateChartType(config.series[sliceIndex].chartType);
                    gridObject[config.categoryProperty] = result.categoryArray[result.categoryArray.length - 1];
                    gridObject[config.series[sliceIndex].name] = value;

                    chartData[0].data.push([catIdx, sliceIndex, value]);
                    chartData[0].urls.push(hyperLinkValue);
                    chartData[0].formattedValues.push(formattedValue ? formattedValue: '');

                    color = heatMapColor(heatmapSeries, catIdx, sliceIndex);
                    config.heatmap.colorSeries.push({
                        name: categories[catIdx] + ' | ' + config.heatmap.yAxis[sliceIndex],
                        x: catIdx,
                        y: sliceIndex,
                        value: value,
                        color: color,
                        url: hyperLinkValue,
                        formattedValue: formattedValue
                    });
                }
            }
        }
        result.gridData.data[result.gridData.data.length] = gridObject;
    };

    function heatMapColor(heatmapSeries, catIdx, sliceIndex){
        var idx, color;
        if(heatmapSeries.length > 0){
            for(idx = 0; idx < heatmapSeries.length; idx++){
                if(heatmapSeries[idx] && heatmapSeries[idx].x === catIdx && heatmapSeries[idx].y === sliceIndex){
                    color = heatmapSeries[idx].color;
                }
            }
        }
        return color ? color : '#ffffff';
    }

    function checkHeatMapCategories(chartData, catIdx){
        var idx, found = false;

        for(idx = 0; idx < chartData.length; idx++){
            if(chartData[idx][0] === catIdx){
                found = true;
            }
        }
        return found;
    }

    return ProcessHeatMapChart;
});