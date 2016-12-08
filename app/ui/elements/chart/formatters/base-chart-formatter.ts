/// <amd-dependency path="ui/elements/chart/chart-utilities" />
/// <amd-dependency path="system/text/formatter" />
/// <amd-dependency path="system/lang/object" />
import {curry, any, equals, has, split} from 'ramda';
const Object = require('system/lang/object');
const ChartUtilities = require('ui/elements/chart/chart-utilities');
const Formatter = require('system/text/formatter');
const GETVALUESREGEX = /{(.*?)}/g;
const STRIPBRACES = /{|}/g;
const hasOptions = has('options');
const hasFormattedValue = has('formattedValue');
const hasFormattedValues = has('formattedValues');
const hasPoint = has('point');
const hasIndex = has('index');
const hasSeries = has('series');
const hasFormattedXValue = has('formattedXValue');
const hasFormattedYValue = has('formattedYValue');
const hasFormattedZValue = has('formattedZValue');
const splitByDot = split('.');

const formatDataLabels = curry(function formatDataLabels(self: any, pointFormat: string): Function|String {
    /* tslint:disable:no-invalid-this */
    const format = this.series.options.dataLabels.pointFormat || '{point.y:g2}';
    const formattedValue = processFormatting(self, format, this);
    if(isPieChart(self)){
        return '<div class="data-label" title="'+formattedValue+'">' + formattedValue + '</div>';
    }
    return formattedValue;
    /* tslint:enable:no-invalid-this */
});

const formatTooltip = curry(function formatTooltip (self: any, pointFormat: string): Function {
    /* tslint:disable:no-invalid-this */
    return processFormatting(self, this.series.tooltipOptions.pointFormat, this);
    /* tslint:enable:no-invalid-this */
});
type axisType = {format: string, decimals: string};
export class BaseChartFormatter {
    public chartUtil: any;
    public config: Object;
    constructor(config: Object) {
        this.config = config;
        this.chartUtil = Object.resolve(ChartUtilities);
    }

    public translateFormatting(axis: axisType): any {
        if (axis.format !== '') {
            return axis.format + axis.decimals;
        }
        return '';
    }
    public axisFormatter: Function = axisFormatter;
    public formatDataLabels: Function = formatDataLabels;
    public formatTooltip: Function = formatTooltip;
}

function axisFormatter(): string {
    /* tslint:disable:no-invalid-this */
    const format = this.axis.options.labels.format || 'g2';
    return formatter(this.value, format);
    /* tslint:enable:no-invalid-this */
}

function formatter (value: string, format: string): string {
    if (!format) {
        return value;
    }
    const f = Object.resolve(Formatter);
    return f.format(value, format);
}

function getNestedValueFromString(value: any, property: any): string {
    let idx;
    const props = property.replace(STRIPBRACES, '').split('.');
    let returnValue;

    returnValue = value;
    for (idx = 0; idx < props.length; idx++) {
        if (returnValue[props[idx]] !== undefined) {
            returnValue = returnValue[props[idx]];
        }
    }
    return returnValue;
}

function getYAxisFormat (self: any, series: any): string {
    if (series.yAxis) {
        return series.yAxis.options.labels.format;
    }else if(isPieChart(self)){
        return self.options.yAxis[0].labels.format;
    }else{
        return '';
    }
}

function processProperty (self: any, value: any, property: any): string {
    let propertyParts, parsedProperty, format, formattedValue: Unknown, propertyValue, valueIsNumber;
    const yAxisFormat = getYAxisFormat(self, value.series);

    parsedProperty = property.replace(STRIPBRACES, '');
    propertyParts = parsedProperty.split(':');
    parsedProperty = propertyParts[0];
    if (propertyParts.length > 1 && yAxisFormat === '') {
        format = propertyParts[1];
    } else {
        format = yAxisFormat;
    }
    propertyValue = getNestedValueFromString(value, parsedProperty);
    formattedValue = applyFormat(value, propertyValue, format, property);
    valueIsNumber = isNaN(formattedValue) ? null : Number(formattedValue);
    if(self.config.formattedQuery && valueIsNumber !== null){
        formattedValue = getFormattedQueryValue(self, value, parsedProperty, formattedValue);
    }
    return formattedValue;
}

function getFormattedQueryValue(self: any, value: any, parsedProperty: any, formattedValue: any): string{
    const propArray = splitByDot(parsedProperty);

    if(hasOptions(value) && hasFormattedValue(value) && value.options.formattedValue){
        formattedValue = value.options.formattedValue;
    }else if(hasPoint(value) && hasOptions(value.point) && value.point.options.formattedValue){
        formattedValue = value.point.options.formattedValue;
    }else if(hasFormattedXValue(value) || hasFormattedYValue(value) || hasFormattedZValue(value)){
        if(any(equals('x'), propArray) && value.formattedXValue){
            formattedValue = value.formattedXValue;
        }else if(any(equals('y'), propArray) && value.formattedYValue){
            formattedValue = value.formattedYValue;
        }else if(any(equals('z'), propArray) && value.formattedZValue){
            formattedValue = value.formattedZValue;
        }
    }else if(hasIndex(value) && hasSeries(value) && hasIndex(value.series) &&
        self.chartData[value.series.index] && hasFormattedValues(self.chartData[value.series.index])){
        if(self.chartData[value.series.index].formattedValues[value.index] !=='') {
            formattedValue = self.chartData[value.series.index].formattedValues[value.index];
        }
    }

    return formattedValue;
}

export function applyFormat(ctx: string, value: string, format: string, property: string): string {
    try {
        //Meridium formatting
        return formatter(value, format);
    } catch (e) {
        //Highcharts formatting
        return window['Highcharts'].format(property, {point: ctx});
    }
}

function processFormatting (self: any, formatSpecifier: string, value: string): any {
    const subValues = formatSpecifier.match(GETVALUESREGEX);
    let idx, repValue, result = formatSpecifier;

    for (idx = 0; idx < subValues!.length; idx++) {
        repValue = processProperty(self, value, subValues![idx]);
        result = result.replace(subValues![idx], repValue);
    }
    return result;
}

function isPieChart(self: any): boolean{
    return self.chartUtil.CHART_TYPE_PIE === self.config.chartType ||
        self.chartUtil.CHART_TYPE_DONUT === self.config.chartType ||
        self.chartUtil.CHART_TYPE_PYRAMID === self.config.chartType;
}