define(function (require) {
	'use strict';
	var R = require('ramda'),
		defaultToFalse = R.defaultTo(false),
		defaultToArray = R.defaultTo([]),
		defaultToZero = R.defaultTo(0),
		defaultToNull = R.defaultTo(null);

	function ChartConfigDTO(data) {
		data = data || {};
		this.title = data.title;
		this.stacked = data.stacked || false;
		this.percentStacked = data.percentStacked || false;
		this.polar = data.polar || false;
		this.enable3d = data.enable3d || false;
        this.stock = data.stock || false;
		this.heatmap = heatMapSettings(data);
		this.series = [];
        this.pieSeries = data.pieSeries || [];
        this.pieSeriesAltered = data.pieSeriesAltered || false;
        this.pieSeriesAllHyperlinksChecked = data.pieSeriesAllHyperlinksChecked || false;
		this.axis = [];
		this.horizontalAxisProperty = data.horizontalAxisProperty;
		this.horizontalAxisPropertyAlias = data.horizontalAxisPropertyAlias;
		this.sizeProperty = data.sizeProperty;
		this.sizePropertyAlias = data.sizePropertyAlias;
		this.chartMethod = data.chartMethod;
		this.aggregateProperties = data.aggregateProperties;
		this.pointFormat = data.pointFormat || '';
		this.dataLabelFormat = data.dataLabelFormat || '';
		this.queryKey = data.queryKey;
        this.queryParams = data.queryParams;
		this.queryStrParams = data.queryStrParams;
		this.formattedQuery = data.formattedQuery || false;
		this.categoryProperty = data.categoryProperty;
		this.categoryPropertyAlias = data.categoryPropertyAlias || '';
		this.chartType = data.chartType || 'column';
		this.showLabels = data.showLabels || false;
		this.showLegend = data.showLegend || false;
        this.showXaxisLabels = (data.showXaxisLabels === false ? false : true);
        this.showScrollBar = data.showScrollBar || false;
        this.scrollMaximum = data.scrollMaximum || 10;
		this.datasetKey = data.datasetKey || '';
		this.stackToolTips = data.stackToolTips || false;
		if (data.categoryArray) {
			this.categoryArray = data.categoryArray;
		}
		if(data.evalMobile){
			this.evalMobile = data.evalMobile;
		}
	}

	function heatMapSettings(data) {
		return data.heatmap ? newHeatMap(data) : defaultHeatMap();
	}

	function defaultHeatMap() {
		return {
			enabled: false,
			yAxis:  [],
			inverted: false,
			labelColor: null,
			minColor: null,
			maxColor: null,
			minValue: 0,
			maxValue: null,
			hoverColor: null,
			borderColor: null,
			borderWidth: null,
			steps: null,
			hyperlinks: false,
			specifyColors: false,
			colorSeries: []
		};
	}

	function newHeatMap(data) {
		return {
			enabled: defaultToFalse(data.heatmap.enabled),
			yAxis: defaultToArray(data.heatmap.yAxis),
			inverted: defaultToFalse(data.heatmap.inverted),
			labelColor: defaultToNull(data.heatmap.labelColor),
			minColor: defaultToNull(data.heatmap.minColor),
			maxColor: defaultToNull(data.heatmap.maxColor),
			minValue: defaultToZero(data.heatmap.minValue),
			maxValue: defaultToNull(data.heatmap.maxValue),
			hoverColor: defaultToNull(data.heatmap.hoverColor),
			borderColor: defaultToNull(data.heatmap.borderColor),
			borderWidth: defaultToZero(data.heatmap.borderWidth),
			steps: defaultToNull(data.heatmap.steps),
			hyperlinks: defaultToFalse(data.heatmap.hyperlinks),
			specifyColors: defaultToFalse(data.heatmap.specifyColors),
			colorSeries: defaultToArray(data.heatmap.colorSeries)
		};
	}

	return ChartConfigDTO;
});
