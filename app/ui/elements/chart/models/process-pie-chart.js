define (function (require) {
    'use strict';

    var $ = require('jquery'),
        _ = require('lodash'),
        R = require('ramda'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        Parser = require('system/text/parser');

    function ProcessPieChart(){}

    ProcessPieChart.processData = function(
        parentClass,
        result,
        config,
        sliceIndexes,
        row,
        colorArray,
        pieSeriesCategories,
        categoryIndex
    ){
        var sliceIndex, value, chartType, hyperLinkValue, hyperLinkCat, hyperLinkText, match, nextColor, formattedValue,
            pieSeries = config.pieSeries,
            gridObject = {},
            chartData = result.chartData,
            rawData = result.rawData.rows,
            categories = result.categoryArray;

        for (sliceIndex = 0; sliceIndex < sliceIndexes.length; sliceIndex++) {
            var reset = false;

            value = ChartUtilities.getRowValueFromQuery(config, row, sliceIndexes, sliceIndex);
            formattedValue = ChartUtilities.getFormattedValueFromQuery(config, row, sliceIndexes, sliceIndex);
            hyperLinkValue = ChartUtilities.extractHyperlinkHref(value);
            hyperLinkText = config.formattedQuery ? value : Parser.parseFloat(ChartUtilities.extractHyperlinkValue(value));
            hyperLinkCat = categories[categories.length - 1] ?
                ChartUtilities.extractHyperlinkHref(categories[categories.length - 1].toString()) : "";
            if(hyperLinkCat){
                hyperLinkValue = hyperLinkCat;
            }
            chartType = parentClass.chartUtilities.translateChartType(config.series[sliceIndex].chartType);
            gridObject[config.categoryProperty] = result.categoryArray[result.categoryArray.length - 1];

            if (chartData.length === 0) {
                chartData[0] = { data: [], type: chartType };
            }

            if(config.pieSeries.length > 0) {
                if(parentClass.resetPieSeries) {
                    pieSeries = resetPieData(parentClass, config, rawData, categoryIndex, sliceIndexes);
                    parentClass.resetPieSeries = false;
                }
                if(pieSeriesCategories.length === 0) {
                    setCategoriesReference(pieSeries, pieSeriesCategories);
                }

                setPieSeriesCatColor(pieSeries, categories, pieSeriesCategories, hyperLinkText);

                match = checkPieSeries(parentClass, pieSeries, hyperLinkText, categories);

                if(match === 0 && config.pieSeriesAltered === false){
                    reset = true;
                    nextColor = setPieSeriesColor(parentClass, config, colorArray);
                }
                if(reset){
                    config.pieSeries[config.pieSeries.length] = {
                        name: ((typeof categories[categories.length - 1 ]) === 'string' ?
                            ChartUtilities.extractHyperlinkValue(categories[categories.length - 1].toString()) :
                            parentClass.translator.translate("SLICE") ),
                        y: formatNullNumber(hyperLinkText),
                        url: '',
                        color: nextColor,
                        hyperlink: (hyperLinkValue ? hyperLinkValue : ''),
                        used: false,
                        checked: false
                    };
                    if(config.formattedQuery && formattedValue){
                        config.pieSeries[config.pieSeries.length - 1].formattedValue = formattedValue;
                    }
                }
            }else{
                chartData[0].data[chartData[0].data.length] = {
                    name: ((typeof categories[categories.length - 1 ]) === 'string' ?
                        ChartUtilities.extractHyperlinkValue(categories[categories.length - 1].toString()) :
                        parentClass.translator.translate("SLICE") ),
                    y: formatNullNumber(hyperLinkText),
                    url: '',
                    color: setDefaultPieSeriesColor(parentClass, colorArray),
                    hyperlink: (hyperLinkValue ? hyperLinkValue : ''),
                    used: false,
                    checked: false
                };

                if(config.formattedQuery && formattedValue){
                    chartData[0].data[chartData[0].data.length - 1].formattedValue = formattedValue;
                }
            }

            gridObject[config.series[sliceIndex].name] = value;
        }
        result.gridData.data[result.gridData.data.length] = gridObject;
    };

    function setCategoriesReference(pieSeries, pieSeriesCategories){

        for(var h = 0; h < pieSeries.length; h++){

            var slice = pieSeries[h],
                cat = slice.name,
                newVal = true,
                i;

            for(i=0; i < pieSeriesCategories.length; i++){
                if(pieSeriesCategories[i].name && pieSeriesCategories[i].name === cat.toString()){
                    pieSeriesCategories[i].colors.push(slice.color);
                    newVal = false;
                }
            }

            if(newVal) {
                pieSeriesCategories[pieSeriesCategories.length] = {
                    name: cat.toString(),
                    colorUsed: 0,
                    catUsed: false,
                    colors: [slice.color]
                };
            }

        }
    }

    var forEachIndexed = R.addIndex(R.forEach);

    var resetPieDataForEachSliceIndexes = R.curry(function resetPieDataForEachSliceIndexes(resetData, config, sliceValue, sliceIndex){
        resetData.sliceIndex = sliceIndex;
        resetData.hasCat = pieSeriesExistsInQuery(resetData.rawData);
        R.forEach(resetPieDataForEachRawData(resetData, config), resetData.rawData);
    });

    var resetPieDataForEachRawData = R.curry(function resetPieDataForEachRawData(resetData, config, rawDataItem){
        resetData.found = false;
        forEachIndexed(resetPieDataForEachTempArray(resetData, rawDataItem, config), resetData.config.pieSeries);
    });

    var resetPieDataForEachTempArray = R.curry(function resetPieDataForEachTempArray(
        resetData, rawDataItem, config, pieSeriesItem, index
    ){
        var value = ChartUtilities.getRowValueFromQuery(config, rawDataItem, resetData.sliceIndexes, resetData.sliceIndex),
            formattedValue = ChartUtilities.getFormattedValueFromQuery(config, rawDataItem, resetData.sliceIndexes, resetData.sliceIndex),
            dataName = (
            typeof rawDataItem.columnValues[resetData.categoryIndex] === 'string' ?
                ChartUtilities.extractHyperlinkValue(rawDataItem.columnValues[resetData.categoryIndex]) :
                resetData.sliceName
            );

        if(pieSeriesItem && !_.has(pieSeriesItem, 'used')){
            pieSeriesItem.used = false;
        }

        if(formattedValue && pieSeriesItem){
            config.pieSeries[index].formattedValue = formattedValue;
        }

        if (pieSeriesItem && pieSeriesItem.name === dataName && !pieSeriesItem.used && !resetData.found) {
            pieSeriesItem.y = formatNullNumber(Parser.parseFloat(ChartUtilities.extractHyperlinkValue(value)));
            resetData.found = true;
            pieSeriesItem.used = true;
        }else if(pieSeriesItem){
            var hasCat = resetData.hasCat(pieSeriesItem.name);

            if(!hasCat && pieSeriesItem.name !== resetData.sliceName){
                resetData.config.pieSeries.splice(index, 1);
            }
        }
    });

    var pieSeriesExistsInQuery = R.curry(function pieSeriesExistsInQuery(rawData, name){
        return R.compose(
            R.any(R.equals(name)),
            R.flatten,
            R.map(R.prop("columnValues"))
        )(rawData);
    });

    function resetPieData(parentClass, config, rawData, categoryIndex, sliceIndexes){
        var configClone = $.extend(true, {}, config);
        var resetData = {
                sliceName: parentClass.translator.translate("SLICE"),
                config: configClone,
                rawData: rawData,
                categoryIndex: categoryIndex,
                sliceIndexes: sliceIndexes,
                sliceIndex: null,
                found: false,
                hasCat: null
            };

        forEachIndexed(resetPieDataForEachSliceIndexes(resetData, config), sliceIndexes);
        return config.pieSeries;
    }

    function setPieSeriesCatColor(pieSeries, categories, pieSeriesCategories, hyperLinkText){
        for(var h = 0; h < pieSeries.length; h++){

            var i,
                slice = pieSeries[h],
                sliceCat = slice.name,
                queryCat = categories[categories.length - 1],
                modifiedCat;

            if(sliceCat === queryCat){
                for(i=0;i<pieSeriesCategories.length;i++){
                    var cachedCat = pieSeriesCategories[i].name,
                        catUsed = pieSeriesCategories[i].catUsed;
                    if(cachedCat === queryCat && modifiedCat !== queryCat && !catUsed){
                        slice.y = formatNullNumber(hyperLinkText);
                        slice.color = pieSeriesCategories[i].colors[pieSeriesCategories[i].colorUsed];
                        pieSeriesCategories[i].colorUsed++;
                        pieSeriesCategories[i].catUsed = true;
                        modifiedCat = queryCat;
                    }
                }
            }
        }
    }

    function checkPieSeries(self, pieSeries, hyperLinkText, categories){
        var match = 0;
        for(var h = 0; h < pieSeries.length; h++){
            var slice = pieSeries[h],
                sliceY = slice.y,
                cat = slice.name,
                orgCat = (typeof categories[categories.length - 1 ]) === 'string' ?
                    ChartUtilities.extractHyperlinkValue(categories[categories.length - 1].toString()) :
                    self.translator.translate("SLICE"),
                sliceYExists = sliceY !== undefined && sliceY !== null,
                catExists = cat !== undefined,
                hyperLinkTextExists = (hyperLinkText !== undefined &&
                    hyperLinkText !== null &&
                    hyperLinkText.toString() !== "NaN"),
                catArrayExists = categories[categories.length - 1] !== undefined;

            if(!hyperLinkTextExists){hyperLinkText = 0;}
            if(!sliceYExists){sliceY = 0;}

            if(catExists && catArrayExists){
                if ( (hyperLinkText.toString() === sliceY.toString()) && (orgCat === cat.toString()) ) {
                    match++;
                }
            }
        }

        return match;
    }

    function setDefaultPieSeriesColor(self, colorArray){
        var color;

        if(colorArray.length === 0){
            colorArray.push.apply(colorArray, self.chartUtilities.CHART_COLORS);
        }
        if(colorArray.length > 0){
            color = colorArray[0];
            colorArray.shift();
        }
        return color;
    }

    function setPieSeriesColor(self, config, colorArray){
        var color,idx,
            pieSeriesColorArray = [];

        for(idx = 0; idx < config.pieSeries.length; idx++){
            pieSeriesColorArray.push(config.pieSeries[idx].color);
        }

        if(pieSeriesColorArray.length > 0 && self.outOfPieColors === false) {
            for(idx = 0; idx < pieSeriesColorArray.length; idx++){
                checkColorValue(colorArray, pieSeriesColorArray[idx]);
            }

            if(colorArray.length === 0){
                self.outOfPieColors = true;
            }
        }

        if(colorArray.length === 0){
            colorArray.push.apply(colorArray, self.chartUtilities.CHART_COLORS);
        }

        if(colorArray.length > 0){
            color = colorArray[0];
            colorArray.shift();
        }

        return color;
    }

    function checkColorValue(colorArray, slice){
        var i;
        for(i = 0; i < colorArray.length; i++){
            if(colorArray[i] === slice){
                colorArray.splice(i,1);
            }
        }
    }

    function formatNullNumber(value){
        return (!_.isNaN(Number(value)) ? (value !== null ? value : 0)  : 0);
    }

    return ProcessPieChart;
});