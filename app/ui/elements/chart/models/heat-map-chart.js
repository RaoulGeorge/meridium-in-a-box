define (function (require) {
    'use strict';

    var BaseChart = require('ui/elements/chart/models/base-chart'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        ApplicationEvents = require('application/application-events'),
        ChartFormatterFactory = require("ui/elements/chart/formatters/chart-formatter-factory");

    function HeatMapChart (renderTo, config, title) {
        base.call(this, renderTo, config, title);
        this.chartFormatter = ChartFormatterFactory.create(this.config);
    }
    var base = Object.inherit(BaseChart, HeatMapChart);

    HeatMapChart.prototype.configureOptions = function () {
        var heatSeriesData = [];
        base.prototype.configureOptions.call(this);
        this.options.chart.type = 'heatmap';
        this.options.chart.inverted = this.config.heatmap.inverted;
        this.options.plotOptions.series.point.events.click = pointClickEvent.bind(null,this);
        this.options.plotOptions.series.point.events.mouseOver = mouseOverEvent.bind(null,this);
        this.options.xAxis.categories = formatCatArray(this.categoryArray);
        this.options.xAxis.labels.formatter = truncateCat;
        this.options.tooltip.formatter = this.chartFormatter.formatTooltip(this);

        this.options.plotOptions.series.dataLabels = {
            enabled: true,
            pointFormat: this.config.heatmap.pointFormat || '{point.value:g2}',
            formatter: this.chartFormatter.formatDataLabels(this)
        };
        this.options.plotOptions.heatmap = {
            dataLabels: {},
            states: {
                hover: {}
            }
        };
        this.options.plotOptions.heatmap.dataLabels = {
            enabled: true,
            color: this.config.heatmap.labelColor ? this.config.heatmap.labelColor : '#000000'
        };

        if(!this.config.heatmap.hoverColor){
            this.config.heatmap.hoverColor = window.Highcharts.getOptions().colors[0];
        }

        this.options.plotOptions.heatmap.states.hover.color = this.config.heatmap.hoverColor;
        this.options.plotOptions.heatmap.borderWidth = this.config.heatmap.borderWidth;

        if(!this.config.heatmap.borderColor){
            this.config.heatmap.borderColor = window.Highcharts.getOptions().colors[0];
        }

        this.options.plotOptions.heatmap.borderColor = this.config.heatmap.borderColor;

        this.options.yAxis = {
            categories: this.config.heatmap.yAxis,
            title: null
        };

        if(!this.config.heatmap.minColor){
            this.config.heatmap.minColor = '#FFFFFF';
        }

        if(!this.config.heatmap.maxColor){
            this.config.heatmap.maxColor = window.Highcharts.getOptions().colors[0];
        }

        this.options.colorAxis = {
            min: Number(this.config.heatmap.minValue),
            minColor: this.config.heatmap.minColor,
            maxColor: this.config.heatmap.maxColor
        };

        if(this.config.heatmap.maxValue){
            this.options.colorAxis.max = Number(this.config.heatmap.maxValue);
        }

        if(!this.config.heatmap.maxValue) {
            this.options.colorAxis.tickPositions = this.config.heatmap.steps ?
                getTickPositions(this.config.heatmap.steps.split(",")) : getTickPositions();
        }

        if(this.config.heatmap.specifyColors && this.config.heatmap.colorSeries.length > 0){
            heatSeriesData[0]= {
                data: this.config.heatmap.colorSeries
            };
            this.chartData = heatSeriesData;
        }

        return this.options;
    };

    function getTickPositions(values){
        var array = [], val = 10, idx;
        if(values === undefined){
            for(idx = 0; idx < 100; idx++){
                if(idx % val === 0){
                    array.push(idx);
                }
            }
        }else{
            for(idx = 0; idx < values.length; idx++){
                array.push(Number(values[idx]));
            }
        }
        return array;
    }

    function pointClickEvent(self, event){
        var seriesIdx, url, tab, el, dashboard,
            hyperlinks = self.config.heatmap.hyperlinks,
            specifyColors = self.config.heatmap.specifyColors;

        if(event){
            seriesIdx = event.currentTarget.series._i;
            el = event.currentTarget.graphic.element;
            dashboard = ChartUtilities.closestByNodeName(el, 'MI-DASHBOARD');
        }

        if(self.chartData[seriesIdx] && self.chartData[seriesIdx].urls && hyperlinks && !specifyColors) {
                url = self.chartData[seriesIdx].urls[event.currentTarget.index - 1];
                tab = true;

            if (url && url !== '') {
                tab = url.indexOf('graph') <= -1;
                if(dashboard){tab = true;}
                Object.resolve(ApplicationEvents).navigate.raise(url, {tab: tab});
            }
        }else if(hyperlinks && specifyColors){
            tab = true;
            if (event.currentTarget.options && event.currentTarget.options.url) {
                url = event.currentTarget.options.url;
            }
            if(url) {
                tab = url.indexOf('graph') <= -1;
                if(dashboard){tab = true;}
                Object.resolve(ApplicationEvents).navigate.raise(url, { tab: tab });
            }
        }
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

    function mouseOverEvent (self, event) {
        var seriesIdx, url,
            hyperlinks = self.config.heatmap.hyperlinks,
            specifyColors = self.config.heatmap.specifyColors;
        if(event){
            seriesIdx = event.currentTarget.series._i;
        }
        if(self.chartData[seriesIdx] && self.chartData[seriesIdx].urls && hyperlinks && !specifyColors) {
            url = self.chartData[seriesIdx].urls[event.currentTarget.index - 1];
            if (url && url !== '') {
                event.currentTarget.graphic.element.style.cursor = 'pointer';
            }
        }else if(hyperlinks && specifyColors){
            if (event.currentTarget.options && event.currentTarget.options.url) {
                url = event.currentTarget.options.url;
            }
            if (url && url !== '') {
                event.currentTarget.graphic.element.style.cursor = 'pointer';
            }
        }
    }

    function formatCatArray(catArray){
        for(var i = 0; i < catArray.length; i++){
            catArray[i] = ChartUtilities.extractHyperlinkValue(catArray[i]);
        }
        return catArray;
    }

    return HeatMapChart;
});