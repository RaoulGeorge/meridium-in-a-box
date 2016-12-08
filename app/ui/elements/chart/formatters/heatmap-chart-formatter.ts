import R = require('ramda');
import {BaseChartFormatter, applyFormat} from './base-chart-formatter';

const GETVALUESREGEX = /{(.*?)}/g;
const STRIPBRACES = /{|}/g;

type baseConfigObj = {
    options:{
        plotOptions:{
            series:{
                dataLabels:{
                    pointFormat:string
                }
            }
        }
    }
};
const toolTipFormatter = R.curry(function toolTipFormatter(self: baseConfigObj, toolTip: string): string {
    /* tslint:disable:no-invalid-this */
    const pointFormat = self.options.plotOptions.series.dataLabels.pointFormat || '{point.value:g2}';
    return '<b>' + this.series.xAxis.categories[this.point.x] + '</b><br>' +
        this.series.yAxis.categories[this.point.y] + ' | ' + processFormatting(self, pointFormat, this);
    /* tslint:enable:no-invalid-this */
});

const formatDataLabels = R.curry(function toolTipFormatter(self: any, pointFormat: string): string {
    /* tslint:disable:no-invalid-this */
    const format = this.series.options.dataLabels.pointFormat || '{point.value:g2}';
    return processFormatting(self, format, this);
    /* tslint:enable:no-invalid-this */
});

export class HeatmapChartFormatter extends BaseChartFormatter{
    constructor(config: any) {
        super(config);
    }
    public formatDataLabels: Function = formatDataLabels;
    public formatTooltip: Function = toolTipFormatter;
}

function getNestedValueFromString(value: string, property: string): any {
    const props = property.replace(STRIPBRACES, '').split('.');
    return R.path(props, value);
}

function processProperty (self: any, value: string, property: string): string {
    let propertyParts, parsedProperty, format, formattedValue: Unknown, propertyValue, valueIsNumber;

    parsedProperty = property.replace(STRIPBRACES, '');
    propertyParts = parsedProperty.split(':');
    parsedProperty = propertyParts[0];
    if (propertyParts.length > 1) {
        format = propertyParts[1];
    }else{
        format = 'g2';
    }
    propertyValue = getNestedValueFromString(value, parsedProperty);
    formattedValue = applyFormat(value, propertyValue, format, property);
    valueIsNumber = isNaN(formattedValue) ? null : Number(formattedValue);
    if(self.config.formattedQuery && valueIsNumber !== null){
        formattedValue = getFormattedQueryValue(self, value, formattedValue);
    }
    return formattedValue;
}

function getFormattedQueryValue(self: any, value: any, formattedValue: any): string{
    const valueHasPoint = value.hasOwnProperty('point'),
        valuePointHasIndex = valueHasPoint && value.point.hasOwnProperty('index'),
        valueHasSeries = value.hasOwnProperty('series'),
        valueSeriesHasIndex = valueHasSeries && value.series.hasOwnProperty('index'),
        CDSeries = valueSeriesHasIndex && self.chartData[value.series.index],
        CDSeriesFV = valueHasPoint && CDSeries && self.chartData[value.series.index].hasOwnProperty('formattedValues');
     if(valuePointHasIndex && valueSeriesHasIndex && CDSeries && CDSeriesFV){
        if(self.chartData[value.series.index].formattedValues[value.point.index] !=='') {
            formattedValue = self.chartData[value.series.index].formattedValues[value.point.index];
        }
    }

    return formattedValue;
}

function processFormatting (self: any, formatSpecifier: string, value: string): string {
    const subValues = formatSpecifier.match(GETVALUESREGEX);
    let result = formatSpecifier, idx, repValue;

    for (idx = 0; idx < subValues!.length; idx++) {
        repValue = processProperty(self, value, subValues![idx]);
        result = result.replace(subValues![idx], repValue);
    }
    return result;
}