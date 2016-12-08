define(function (require) {
	'use strict';

	var ChartConfigDTO = require('ui/elements/chart/models/chart-config-dto'),
		SeriesDTO = require('ui/elements/chart/models/series-dto'),
		Translator = require('system/globalization/translator'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
		AxisDTO = require('ui/elements/chart/models/axis-dto');

	function ChartConfigAdapter () {}

	ChartConfigAdapter.fromDTO = function (data) {
		var config = new ChartConfigDTO(data);
		processSlices(config, data);
		processChartTypes(config, data.chartType, data.chartTypes);
		processAxis(config, data);

		return config;
	};

	ChartConfigAdapter.deserialize = function (jsonData) {
		var data = JSON.parse(jsonData);
		return ChartConfigAdapter.fromDTO(data);
	};

	ChartConfigAdapter.serialize = function (data) {
		return JSON.stringify(data);
	};

	function processAxis (config, data) {
		var translator;

		if (data.axis && data.axis[0] instanceof AxisDTO) {
			config.axis = data.axis;
			return;
		}
		config.axis = [];
		if (data.axis) {
			config.axis[0] = new AxisDTO(data.axis[0]);
			config.axis[1] = new AxisDTO(data.axis[1]);
			config.axis[2] = new AxisDTO(data.axis[2]);
		} else {
			config.axis[0] = new AxisDTO({ name: data.seriesName });
			config.axis[1] = new AxisDTO({ index: 1 });
			config.axis[2] = new AxisDTO({ index: 2, gridLines: false });
		}
		config.axis[0].index = 0;
		config.axis[1].index = 1;
		config.axis[2].index = 2;

		translator = Object.resolve(Translator);
		config.axis[0].axis = translator.translate('CHART_LEFT_AXIS');
		config.axis[1].axis = translator.translate('CHART_RIGHT_AXIS');
		config.axis[2].axis = translator.translate('CHART_BOTTOM_AXIS');
		return;
	}

	function processSlices (config, data) {
		var idx, chartUtilities = new ChartUtilities();

		config.series = [];
		if (data.series && data.series[0] instanceof SeriesDTO) {
			config.series = data.series;
			return;
		}
		if (data.series) {
			for (idx = 0; idx < data.series.length; idx++) {
                if(!data.series[idx].color){
                    data.series[idx].color = chartUtilities.CHART_COLORS[idx];
                }
				config.series[idx] = new SeriesDTO(data.series[idx]);
			}
			return;
		}
		if (data.sliceProperty) {
			config.series = [new SeriesDTO({ name: data.sliceProperty })];
			return;
		}
		if (data.sliceProperties && data.sliceProperties.length > 0) {
			for (idx = 0; idx < data.sliceProperties.length; idx++) {
				config.series[idx] = new SeriesDTO({ name: data.sliceProperties[idx] });
			}
			return;
		}
	}

	function processChartTypes (config, chartType, chartTypes) {
		var idx;

		if (chartType) {
			for (idx = 0; idx < config.series.length; idx++) {
				if (!config.series[idx].chartType) {
					config.series[idx].chartType = chartType;
				}
			}
			config.stacked = chartType.lastIndexOf('stacked', 0) === 0;
            config.stock = chartType.lastIndexOf('stock', 0) === 0;
            if(chartType.indexOf('stock') > -1){
                config.stock = true;
            }else{
                config.stock = false;
            }
		} else if (chartTypes && chartTypes.length > 0) {
			for (idx = 0; idx < chartTypes.length; idx++) {
				config.series[idx].chartType = chartTypes[idx];
				config.stacked = config.stacked || chartTypes[idx].lastIndexOf('stacked', 0) === 0;
                if(chartTypes[idx].indexOf('stock') > -1){
                    config.stock = true;
                }else{
                    config.stock = false;
                }
			}
		} else {
			for (idx = 0; idx < config.series.length; idx++) {
				config.stacked = config.stacked || config.series[idx].chartType.lastIndexOf('stacked', 0) === 0;
                if(config.series[idx].chartType.indexOf('stock') > -1){
                    config.stock = true;
                }else{
                    config.stock = false;
                }
			}
		}
	}

	return ChartConfigAdapter;
});
