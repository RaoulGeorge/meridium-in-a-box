define(function (require) {
    'use strict';

    var StandardChart = require('ui/elements/chart/models/standard-chart'),
        StockChart = require('ui/elements/chart/models/stock-chart'),
        HeatMapChart = require('ui/elements/chart/models/heat-map-chart');


    function ChartOptionsFactory() { }

    ChartOptionsFactory.create = function (renderTo, config, title) {

        if (config && config.stock === true) {
            return new StockChart(renderTo, config, title);
        }else if (config && config.heatmap.enabled === true) {
            return new HeatMapChart(renderTo, config, title);
        }else if(config) {
            return new StandardChart(renderTo, config, title);
        }
    };

    return ChartOptionsFactory;
});
