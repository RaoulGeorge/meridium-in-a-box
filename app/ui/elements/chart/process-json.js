define(function(require) {
	'use strict';

    var $ = require('jquery');


	var ChartUtilities = require('ui/elements/chart/chart-utilities');

	function ProcessJSON(rawData) {
		this.rawData = rawData;
		this.chartUtilities = new ChartUtilities();
	}

	ProcessJSON.prototype.load = function (config) {
		var deferred,
			sliceDictionary = [],
			values = {},
			result = {
			    totalRows: this.rawData ? this.rawData.length : 0,
				categoryArray: config && config.categoryArray ? config.categoryArray : []
			};

		if (this.rawData) {
			sliceData(this, result.categoryArray, config, sliceDictionary, values);
			result.gridData = { data: this.rawData };
			aggregateData(this, result, config, sliceDictionary, values);
		}
		deferred = $.Deferred();
		deferred.resolve(result);
		return deferred.promise();
	};

	function sliceData (self, categoryArray, config, sliceDictionary, values) {
		var aggProps = config.aggregateProperties,
		rawData = self.rawData,
		idx, sliceValue, aggIdx, property, aggValue;

		setLabels(self, config);
		for (idx = 0; idx < rawData.length; idx++) {
			if (config.categoryProperty) {
				categoryArray[categoryArray.length] = rawData[idx][config.categoryProperty];
			}

			sliceValue = rawData[idx][config.series[0].name];

			if (sliceDictionary.indexOf(sliceValue) < 0) {
				sliceDictionary[sliceDictionary.length] = sliceValue;
			}

			if (aggProps) {
				for (aggIdx = 0; aggIdx < aggProps.length; aggIdx++) {
					property = aggProps[aggIdx];

					if (values[property] === undefined) {
						values[property] = [];
					}

					aggValue = rawData[idx][property] || 0;

					if (values[property][sliceValue] === undefined) {
						values[property][sliceValue] = [];
					}
					values[property][sliceValue][values[property][sliceValue].length] = aggValue;
				}
			}
		}
	}

	function setLabels (self, config) {
		if(config.chartMethod === self.chartUtilities.CHART_METHOD_COUNT){
			config.pointFormat = config.pointFormat || '{series.name}: <b>{point.y:g2}</b>';
			config.dataLabelFormat = config.dataLabelFormat || '{point.y:g2}';
		}else if(config.chartMethod === self.chartUtilities.CHART_METHOD_PERCENT){
			config.pointFormat = config.pointFormat || '{series.name}: <b>{point.y:p2}%</b>';
			config.dataLabelFormat = config.dataLabelFormat || '{point.y:p2}%';
		}else if(config.chartMethod === self.chartUtilities.CHART_METHOD_SUM && config.chartType === "stacked-column"){
			config.pointFormat = config.pointFormat ||
				'<span style="color:{series.color}">{series.name}</span>: <b>{point.y:g2}</b><br/>';
			config.dataLabelFormat = config.dataLabelFormat || '{point.y:g2}';
		}else if(config.chartMethod === self.chartUtilities.CHART_METHOD_SUM && config.chartType !== "stacked-column"){
			config.pointFormat = config.pointFormat || '{series.name}: <b>{point.y:g2}</b>';
			config.dataLabelFormat = config.dataLabelFormat || '{point.y:g2}';
		}
	}

	function aggregateData (self, result, config, sliceDictionary, values) {
		// processing of chart method (percent, count, sum, etc.)
		var chartType;
		chartType = self.chartUtilities.translateChartType(config.series[0].chartType);

		switch (config.chartMethod) {
			case self.chartUtilities.CHART_METHOD_PERCENT:
				result.chartData = percentSeries(chartType, sliceDictionary,
					config.aggregateProperties, values,
					result.totalRows);
				break;

			case self.chartUtilities.CHART_METHOD_COUNT:
				result.chartData = countSeries(chartType, sliceDictionary, config.aggregateProperties, values);
				break;

			case self.chartUtilities.CHART_METHOD_SUM:
				result.chartData = sumSeries(chartType, sliceDictionary, config.aggregateProperties, values);
				break;

			default:
				result.chartData = valueSeries(chartType, sliceDictionary, config.aggregateProperties, values);
				break;
		}
	}

	function valueSeries (chartType, sliceDictionary, aggProperties, values) {
		var sliceIdx, name, aggIdx, seriesData = [];

		for (sliceIdx = 0; sliceIdx < sliceDictionary.length; sliceIdx++) {
			name = sliceDictionary[sliceIdx];
			for (aggIdx = 0; aggIdx < aggProperties.length; aggIdx++) {
				seriesData[seriesData.length] = {
					name: name,
					data: values[aggProperties[aggIdx]][name],
					type: chartType
				};
			}
		}
		return seriesData;
	}

	function percentSeries (chartType, sliceDictionary, aggProperties, values, totalCount) {
		var countValues, sliceIdx, aggIdx, name, seriesData = [];

		for (sliceIdx = 0; sliceIdx < sliceDictionary.length; sliceIdx++) {
			name = sliceDictionary[sliceIdx];
			countValues = [];
			for (aggIdx = 0; aggIdx < aggProperties.length; aggIdx++) {
				countValues[countValues.length] = (values[aggProperties[aggIdx]][name].length / totalCount) * 100;
			}
			if (chartType === 'pie') {
				if (seriesData.length === 0) {
					seriesData[0] = { data: [], type: 'pie'};
				}
				seriesData[0].data[seriesData[0].data.length] = [name, countValues[0]];
			} else {
				seriesData.push({
					name: name,
					data: countValues,
					type: chartType
				});
			}
		}
		return seriesData;
	}

	function countSeries (chartType, sliceDictionary, aggProperties, values) {
		var countValues, sliceIdx, aggIdx, name, seriesData = [];

		for (sliceIdx = 0; sliceIdx < sliceDictionary.length; sliceIdx++) {
			name = sliceDictionary[sliceIdx];
			countValues = [];
			for (aggIdx = 0; aggIdx < aggProperties.length; aggIdx++) {
				countValues[countValues.length] = values[aggProperties[aggIdx]][name].length;
			}
			seriesData.push({
				name: name,
				data: countValues,
				type: chartType
			});
		}
		return seriesData;
	}

	function sumSeries (chartType, sliceDictionary, aggProperties, values) {
		var sumValues, sliceIdx, aggIdx, name, seriesData = [], valueIdx, sum,
		currentValues;

		for (sliceIdx = 0; sliceIdx < sliceDictionary.length; sliceIdx++) {
			sumValues = [];
			name = sliceDictionary[sliceIdx];
			for (aggIdx = 0; aggIdx < aggProperties.length; aggIdx++) {
				sum = 0;
				currentValues = values[aggProperties[aggIdx]][name];
				for (valueIdx = 0; valueIdx < currentValues.length; valueIdx++) {
					sum += currentValues[valueIdx];
				}
				sumValues[sumValues.length] = Number(sum.toFixed(4));
			}
			seriesData.push({
				name: name,
				data: sumValues,
				type: chartType
			});
		}
		return seriesData;
	}

	return ProcessJSON;
});
