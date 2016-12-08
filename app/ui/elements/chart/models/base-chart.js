define(function (require) {
    'use strict';

    var Converter = require('system/lang/converter'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        ApplicationEvents = require('application/application-events'),
        ChartFormatterFactory = require("ui/elements/chart/formatters/chart-formatter-factory");
    
    function BaseChart(renderTo, config, title) {
        this.chartUtil = Object.resolve(ChartUtilities);
        this.config = config;
        this.chartData = null;
        this.categoryArray = [];
        this.chartFormatter = ChartFormatterFactory.create(this.config);
        this.options = newChartOptions(this, renderTo, title);
    }

    function newChartOptions (self, renderTo, title) {
        return {
            chart: {
                style: {
                    fontFamily: 'open_sansregular'
                },
                renderTo: renderTo,
                backgroundColor: 'transparent',
                zoomType: 'xy',
                panning: true,
                panKey: 'shift',
                options3d: {}
            },
            colors: self.chartUtil.CHART_COLORS,
            exporting: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            title: {
                text: title
            },
            loading:{
                style:{}
            },
            scrollbar: {},
            legend: {
                enabled: self.config.showLegend,
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'top',
                y: 0,
                x: 0,
                borderColor: '#CCC',
                borderWidth: 1,
                backgroundColor: '#FFFFFF',
                shadow: false
            },
            tooltip: {
                pointFormat: self.config.pointFormat || '{series.name}: {point.y:g2}',
                pointFormatter: self.chartFormatter.formatTooltip(self),
                shared: false
            },
            plotOptions: {
                series: {
                    turboThreshold: 10000,
                    showInLegend: true,
                    pointWidth: 35,
                    pointPadding: 5,
                    cursor: null,
                    dataLabels: {
                        enabled: self.config.showLabels,
                        pointFormat: self.config.dataLabelFormat ||
                        (isPieChart(self) ? '{point.name}: {point.y:g2}' : '{point.y:g2}'),
                        formatter: self.chartFormatter.formatDataLabels(self),
                        color: 'black',
                        distance: 45,
                        style: {
                            textShadow: 'none'
                        }
                    },
                    point: {
                        events: {
                            click: pointClickEvent,
                            mouseOver: mouseOverEvent
                        }
                    }

                },
                line: {
                    marker: {
                        enabled: false
                    }
                },
                column: {},
                bar: {},
                area: {
                    marker: {
                        enabled: false
                    },
                    lineWidth: 3
                },
                areaspline: {
                    marker: {
                        enabled: false
                    },
                    lineWidth: 3
                }
            },
            yAxis: [],
            xAxis: {
                labels: {
                    rotation: xAxisLabelAngle(self.chartUtil, self.config.chartType),
                    enabled: self.config.showXaxisLabels
                }
            }
        };
    }

    function pointClickEvent () {
        /*jshint validthis: true*/
        var url, el, dashboard,
            tab = true;

        if(this.series && this.series.chart && this.series.chart.container){
            el = this.series.chart.container;
            dashboard = ChartUtilities.closestByNodeName(el, 'MI-DASHBOARD');
        }
        if (this.options && this.options.url) { url = this.options.url; }
        if(url) {
            tab = url.indexOf('graph') <= -1;
            if(dashboard){tab = true;}
            Object.resolve(ApplicationEvents).navigate.raise(url, { tab: tab });
        }
    }

    function mouseOverEvent () {
        /*jshint validthis: true*/
        var url = (this.options && this.options.url) ? this.options.url : null;
        if(url){
            if(this.graphic){this.graphic.element.style.cursor = 'pointer';}
        }
    }

    function xAxisLabelAngle (chartUtil, chartType) {
        var angleLabelFor = [
            chartUtil.CHART_TYPE_BAR,
            chartUtil.CHART_TYPE_STACKED_BAR,
            chartUtil.CHART_TYPE_POLAR,
            chartUtil.CHART_TYPE_RADAR
        ];

        return angleLabelFor.indexOf(chartType) > -1 ? 0 : -60;
    }

    BaseChart.prototype.getOptions = function (chartData, categoryArray) {
        this.chartData = chartData;
        this.categoryArray = categoryArray;
        this.configureOptions();
        this.formatChartData();
        this.configureChartType();
        this.setAxes();

        return this.options;        
    };

    BaseChart.prototype.configureOptions = function () {
    };

    BaseChart.prototype.formatChartData = function () {
        this.options.series = this.chartData;
    };

    BaseChart.prototype.configureChartType = function() {
        var length = (this.chartData  || {}).length,
            idx;

        for (idx = 0; idx < length; idx++) {
            this.enable3D();
            this.formatScrollBar(idx);
            this.formatStacked(idx);
        }
    };

    BaseChart.prototype.enable3D = function () {
        this.options.chart.options3d.enabled = false;
    };

    BaseChart.prototype.formatScrollBar = function (/*idx*/) {
    };

    BaseChart.prototype.formatStacked = function (/*idx*/) {
    };

    BaseChart.prototype.setAxes = function () {
        this.setXAxis();
        this.setYAxis(0);
        this.setYAxis(1);
    };

    BaseChart.prototype.setXAxis = function () {
        this.options.xAxis.title = this.options.xAxis.title || {};
        if (!this.options.xAxis.title.text) {
            this.options.xAxis.title.text = this.config.axis[2].caption  || this.config.axis[2].name;
        }
        if (!this.options.xAxis.gridLineWidth) {
            this.options.xAxis.gridLineWidth = this.config.axis[2].gridLines ? 1 : 0;
        }        
    };

    BaseChart.prototype.setYAxis = function (idx) {
        this.options.yAxis[this.options.yAxis.length] = {
            type: calculateChartType(this.config.axis[idx]),
            min: calculateYAxisMinimum(this.config.axis[idx]),
            max: Converter.toNullableInteger(this.config.axis[idx].maximum),
            title: {
                text: this.config.axis[idx].caption || this.config.axis[idx].name
            },
            labels: {
                format: this.chartFormatter.translateFormatting(this.config.axis[idx]),
                formatter: this.chartFormatter.axisFormatter,
                rotation: calculateLabelAngle(this.config),
                enabled: shouldLabelsBeEnabled(this.config)
            },
            opposite: idx === 1,
            tickInterval: Converter.toNullableInteger(this.config.axis[idx].tickInterval),
            gridLineWidth: this.config.axis[idx].gridLines ? 1 : 0,
            stackLabels: {
                enabled: false
            }
        };        
    };

    function calculateYAxisMinimum (axis) {
        var min = Converter.toNullableInteger(axis.minimum);
        return axis.logarithmic ? Math.max(1, min) : min;
    }

    function calculateChartType (axis) {
        if (axis.logarithmic) {
            return 'logarithmic';
        }
        return undefined;
    }

    function calculateLabelAngle (config) {
        if (config.chartType !== 'bar' && config.chartType !== 'stacked-bar') {
            return 0;
        }
        return -60;
    }

    function shouldLabelsBeEnabled (config) {
        if(config.chartType === 'bar' || config.chartType === 'stacked-bar'){
            return config.showXaxisLabels;
        }
        return true;
    }

    function isPieChart(self){
        return self.chartUtil.CHART_TYPE_PIE === self.config.chartType ||
            self.chartUtil.CHART_TYPE_DONUT === self.config.chartType ||
            self.chartUtil.CHART_TYPE_PYRAMID === self.config.chartType;
    }

    return BaseChart;
});
