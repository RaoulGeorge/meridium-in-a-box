define(function (require) {
    'use strict';

    var ChartUtilities = require('ui/elements/chart/chart-utilities'),
        BaseChart = require('ui/elements/chart/models/base-chart'),
		Parser = require('system/text/parser'),
        R = require('ramda');

    function StandardChart (renderTo, config, title) {
        base.call(this, renderTo, config, title);
    }

    var base = Object.inherit(BaseChart, StandardChart);

    StandardChart.prototype.configureOptions = function () {
        this.options.chart.polar = this.config.polar;
        this.options.chart.options3d = configure3dOptions(this.config);
        this.options.legend = formatBaseChartLegend(this.options.legend, this.chartUtil, this.config.chartType);
        this.options.plotOptions.column = barAndColumnConfiguration();
        this.options.plotOptions.bar = barAndColumnConfiguration();
        this.options.plotOptions.scatter = scatterConfiguration(this.config);
        this.options.plotOptions.bubble = bubbleConfiguration(this.config);
        this.options.plotOptions.pie = pieConfiguration(this.config);
        this.options.plotOptions.pyramid = pyramidConfiguration(this.config);
        this.options.xAxis.categories = convertCategoryArray(this.categoryArray);
        this.options.xAxis.labels.formatter = truncateCat;
        this.options.plotOptions.series = setSeriesConfig(this.config, this.chartUtil, this.options.plotOptions.series);
    };

    function setSeriesConfig(config, chartUtil, seriesObj){
        var isPie = isPieChart(config, chartUtil);
        if(isPie){
            seriesObj.dataLabels.useHTML = true;
            seriesObj.dataLabels.distance = 10;
            return seriesObj;
        }else{
            return seriesObj;
        }

    }

    function pyramidConfiguration (config) {
        return {
            allowPointSelect: true,
            depth: 35,
            width: '50%',
            tooltip: {
                pointFormat: config.pointFormat || '{point.y:g2}'
            },
            dataLabels: {
                pointFormat: config.dataLabelFormat || '{point.y:g2}',
                connectorWidth:0.3,
                style: {
                    width: '100px'
                }

            }
        };
    }

    function pieConfiguration (config) {
        return {
            allowPointSelect: true,
            depth: 35,
            tooltip: {
                pointFormat: config.pointFormat || '{point.y:g2}'
            },
            dataLabels: {
                pointFormat: config.dataLabelFormat || '{point.name}: {point.y:g2}',
                style: {
                    width: '100px'
                }
            }
        };
    }

    function bubbleConfiguration (config) {
        return {
            tooltip: {
                pointFormat: config.pointFormat || '({point.x:g2}, {point.y:g2}), size: {point.z:g2}'
            },
            dataLabels: {
                pointFormat: config.dataLabelFormat ||
                    '({point.x:g2}, {point.y:g2}), size: {point.z:g2}'
            }
        };
    }

    function barAndColumnConfiguration () {
        return {
            borderWidth: 0,
            shadow: {
                opacity: 0.2,
                color: '#555555'
            }
        };
    }

    function scatterConfiguration (config) {
        return {
            tooltip: {
                pointFormat: config.pointFormat || '({point.x:g2}, {point.y:g2})'
            },
            dataLabels: {
                pointFormat: config.dataLabelFormat ||
                    '({point.x:g2}, {point.y:g2})'
            }
        };
    }

    StandardChart.prototype.formatChartData = function() {
        formatPieSeries(this);
        formatSeries(this);
        base.prototype.formatChartData.call(this);
    };

    function formatSeries (self) {
        var idx, length = (self.chartData || {}).length || -1;
        for(idx = 0; idx < length; idx++){
            convertPointValues(self.chartData[idx].data);
        }
    }

    function convertPointValues (points) {
        var idx, point;
        for(idx = 0; idx < points.length; idx++){
            point = points[idx];
            if (point.x) {
                point.x = getPointValue(point.x);
            }
            if (point.y) {
                point.y = getPointValue(point.y);
            }
            if (point.z) {
                point.z = getPointValue(point.z);
            }
        }
    }

    function getPointValue (point) {
        var extractedValue = ChartUtilities.extractHyperlinkValue(point),
            value = Parser.parseFloat(extractedValue);

        if(R.is(Date, extractedValue)){
            return extractedValue;
        }else{
            return  isNaN(value) ? null : Number(value);
        }
    }

    function formatPieSeries(self){
        if(!(self.chartData || {}).length) {
            return;
        }
        if (self.chartUtil.typeOfPieChart(self.config.chartType) && self.config.pieSeries.length > 0) {
            self.chartData[0].data = self.config.pieSeries;
        }
    }

    function convertCategoryArray (categoryArray) {
        var idx, length = (categoryArray || {}).length;
        for (idx = 0; idx < length; idx++) {
            categoryArray[idx] = ChartUtilities.extractHyperlinkValue(categoryArray[idx]);
        }
        return categoryArray;
    }

    function truncateCat () {
        /*jshint validthis: true*/
        var catStrLength = 10,
            catString = (this.value || '').toString();
        if (catString.length > catStrLength) {
            return catString.substring(0, catStrLength) + ' ...';
        }
        return this.value;
    }

    function formatBaseChartLegend(legend, chartUtil, config){
        var isPie = isPieChart(config, chartUtil);
        legend.layout = isPie ? 'horizontal' : 'vertical';
        legend.align = isPie ? 'center' : 'right';
        legend.verticalAlign = 'top';
        legend.floating = false;
        legend.maxHeight = 250;
        return legend;
    }

    function configure3dOptions (config) {
        return {
            enabled: config.enable3d,
            alpha: (config.chartType ==='pie' || config.chartType ==='donut' ? 40 : 4),
            beta:2,
            depth: 50
        };
    }

    StandardChart.prototype.enable3D = function () {
        var setting = this.options.chart.options3d.enabled;
        this.options.chart.options3d.enabled = this.chartUtil.allow3d(this.config.chartType) ? setting : false;
        if(this.config.enable3d && this.config.showScrollBar){
            this.options.chart.zoomType = '';
            this.options.chart.panning = false;
        }
    };

    function allowScrollBar (self, idx) {
        var scrollbarAllowed = [
            self.chartUtil.CHART_TYPE_COLUMN,
            self.chartUtil.CHART_TYPE_STACKED_COLUMN,
            self.chartUtil.CHART_TYPE_BAR,
            self.chartUtil.CHART_TYPE_STACKED_BAR,
            self.chartUtil.CHART_TYPE_LINE,
            self.chartUtil.CHART_TYPE_AREA,
            self.chartUtil.CHART_TYPE_STACKED_AREA
        ];

        if (!self.config.showScrollBar) {
            return false;
        }
        if (self.config.polar) {
            return false;
        }
        if (scrollbarAllowed.indexOf(self.chartData[idx].type) === -1) {
            return false;
        }
        return true;
    }

    function scrollbarMax (max) {
        max = Number(max);
        return isNaN(max) ? '' : max - 1;
    }

    StandardChart.prototype.formatScrollBar = function (idx) {

        if (allowScrollBar(this, idx)) {
            this.options.scrollbar.enabled = true;
            this.options.xAxis.max = scrollbarMax(this.config.scrollMaximum);
        }
    };

    StandardChart.prototype.formatStacked = function (idx) {
        checkForStackedBar(this, idx);
        checkForStackedColumn(this, idx);
        checkForStackedArea(this, idx);
        checkForDonut(this, idx);
        checkIfPercentStackedAllowed(this, idx);
    };

    function checkForStackedBar (self, idx) {
        if (self.chartData[idx].type === self.chartUtil.CHART_TYPE_BAR && self.config.stacked) {
            self.options.plotOptions.bar.stacking = 'normal';
            self.options.tooltip.shared = self.config.stackToolTips;
            self.options.tooltip.pointFormat = self.config.pointFormat ||
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:g2}</b><br/>';
        }
    }

    function checkForStackedColumn (self, idx) {
        if (self.chartData[idx].type === self.chartUtil.CHART_TYPE_COLUMN && self.config.stacked) {
            self.options.plotOptions.column.stacking = (self.config.percentStacked ? 'percent' : 'normal');
            self.options.tooltip.shared = self.config.stackToolTips;
            if (self.config.percentStacked) {
                self.options.tooltip.pointFormat = self.config.pointFormat ||
                    '<span style="color:{series.color}">{series.name}</span>' +
                    ': <b>{point.y:g2}</b> ({point.percentage:n0}%)<br/>';
            } else {
                self.options.tooltip.pointFormat = self.config.pointFormat ||
                    '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:g2}</b><br/>';
            }
        }
    }

    function checkForStackedArea (self, idx) {
        if (self.chartData[idx].type === self.chartUtil.CHART_TYPE_AREA && self.config.stacked) {
            self.options.plotOptions.area.stacking = 'normal';
            self.options.tooltip.shared = self.config.stackToolTips;
            self.options.tooltip.pointFormat = self.config.pointFormat ||
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:g2}</b><br/>';
        }
    }

    function checkForDonut (self, idx) {
        if (self.chartData[idx].type === self.chartUtil.CHART_TYPE_DONUT) {
            self.chartData[idx].type = self.chartUtil.CHART_TYPE_PIE;
            self.chartData[idx].innerSize = '60%';
        }
    }

    function checkIfPercentStackedAllowed (self, idx) {
        if (self.config.percentStacked && self.chartData[idx].type !== self.chartUtil.CHART_TYPE_COLUMN) {
            self.config.percentStacked = false;
        }
    }

    function isPieChart(config, chartUtil){
        var chartTypesForLegend = [
            chartUtil.CHART_TYPE_PIE,
            chartUtil.CHART_TYPE_DONUT,
            chartUtil.CHART_TYPE_PYRAMID
        ];

        return R.any(R.equals(config.chartType), chartTypesForLegend);
    }

    return StandardChart;
});
