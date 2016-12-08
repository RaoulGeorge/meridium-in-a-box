define (function (require) {
    'use strict';

    var _ = require('lodash');

    var BaseChart = require('ui/elements/chart/models/base-chart'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator');


    function StockChart (renderTo, config, title) {
        base.call(this, renderTo, config, title);
    }

    var base = Object.inherit(BaseChart, StockChart);

    StockChart.prototype.configureOptions = function (chartData) {
        base.prototype.configureOptions.call(this, chartData);
        this.translator = Object.resolve(Translator);
        this.options.rangeSelector = rangeSelector(this);
        this.options.xAxis.ordinal = false;
        this.options.xAxis.plotBands = [];
        this.options.tooltip.xDateFormat = '%m/%d/%Y %H:%M';
        this.options.plotOptions.series.point.events.click = pointClickEvent.bind(null,this);
        return this.options;       
    };

    function rangeSelector (self) {
        return {
            buttons: [{
                type: 'day',
                count: 2,
                text: self.translator.translate('STOCK_CHARTS_2D')
            }, {
                type: 'day',
                count: 10,
                text: self.translator.translate('STOCK_CHARTS_10D')
            }, {
                type: 'month',
                count: 1,
                text: self.translator.translate('STOCK_CHARTS_1M')
            }, {
                type: 'year',
                count: 1,
                text: self.translator.translate('STOCK_CHARTS_1Y')
            }, {
                type: 'year',
                count: 3,
                text: self.translator.translate('STOCK_CHARTS_3Y')
            }, {
                type: 'all',
                text: self.translator.translate('STOCK_CHARTS_MAX')
            }],
            inputEnabled: true,
            selected: 0,
            inputDateFormat: '%m/%d/%Y %H:%M',
            inputEditDateFormat: '%m/%d/%Y %H:%M',
            inputDateParser: dateParser,
            inputBoxWidth: 120
        };
    }

    function dateParser (value) {
        value = value.split(/[ :\./]/);
        return new Date(
            parseInt(value[2]),
            parseInt(value[0]) - 1,
            parseInt(value[1]),
            parseInt(value[3], 10),
            parseInt(value[4], 10)
        );        
    }

    StockChart.prototype.formatChartData = function () {
        var idx,
            length = (this.chartData || {}).length;

        for(idx = 0; idx < length; idx++){
            checkForHyperlink(this);
            if (this.config.stock && this.config.stock === true) {
                this.chartData[idx].data.sort(stockChartSort);
                configureChartType(this.chartData[idx]);
                this.chartData[idx].threshold = null;
                this.chartData[idx].tooltip = {};
                this.chartData[idx].tooltip.valueDecimals = 2;
            }
        }
        base.prototype.formatChartData.call(this);
    };

    function pointClickEvent(self, event){
        var seriesIdx, dashboard;
        if(event){
            seriesIdx = event.currentTarget.series._i;
            dashboard = ChartUtilities.closestByNodeName(event.target, 'MI-DASHBOARD');
        }
        if(self.chartData[seriesIdx] && self.chartData[seriesIdx].urls) {
            var url = self.chartData[seriesIdx].urls[event.currentTarget.index - 1],
                tab = true;

            if (url && url !== '') {
                if (url.indexOf('graph') > -1) {
                    tab = false;
                }
                if(dashboard){tab = true;}
                Object.resolve(ApplicationEvents).navigate.raise(url, {tab: tab});
            }
        }
    }

    function checkForHyperlink (self, idx) {
        if (_.has(self.config.series[idx], 'hyperlink') && self.config.series[idx].hyperlink !== 'None') {
            self.chartData[idx].cursor = 'pointer';
        }        
    }

    function configureChartType (data) {
        if (data.type === 'stock') {
            data.type = 'line';
        } else if (data.type === 'stock-area') {
            data.type = 'area';
            data.fillColor = {};
            data.fillColor.linearGradient = {};
            data.fillColor.linearGradient.x1 = 0;
            data.fillColor.linearGradient.y1 = 0;
            data.fillColor.linearGradient.x2 = 0;
            data.fillColor.linearGradient.y2 = 1;
            data.fillColor.stops = [
                [0, data.color],
                [1, window.Highcharts.Color(data.color).setOpacity(0).get('rgba')]
            ];
        }        
    }

    function stockChartSort(a,b){
        return a[0] - b[0];
    }

    StockChart.prototype.formatStacked = function (idx) {
        if (this.config.stock) {
            if (this.chartData[idx].type === this.chartUtil.CHART_TYPE_STOCK_STACKED_AREA) {
                this.chartData[idx].type = this.chartUtil.CHART_TYPE_AREA_SPLINE;
                this.options.plotOptions.areaspline.stacking = 'normal';
                this.options.tooltip.pointFormat =
                    '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>';
            }
        }        
    };

    return StockChart;
});
