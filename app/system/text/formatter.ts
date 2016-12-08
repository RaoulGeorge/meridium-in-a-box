import * as _ from 'lodash';
import * as $ from 'jquery';
import {singleton} from 'system/lang/ioc';
import parser = require('system/text/parser');

const Globalize = require('globalize');

type Format = string;
type FormattedValue = string;
type Culture = string;

Date['Formats'] = {
    Unformatted: 'yyyy-MM-dd HH:mm:ss',
    Sortable: 'S',
    LongDate_ShortTime: 'f',
    LongDate_LongTime: 'F',
    ShortTime: 't',
    LongTime: 'T',
    ShortDate: 'd',
    LongDate: 'D',
    Month_Year: 'Y',
    Month_Day: 'M'
};

const numberFormatter = (prefix: string) => (value: number) => prefix + (value || '');

Number['Formats'] = {
    Number: numberFormatter('n'),
    Decimal: numberFormatter('d'),
    Percent: numberFormatter('p'),
    Currency: numberFormatter('c')
};

Number['Formats'].Number_Zero = 'n0';
Number['Formats'].Number_Two = Number['Formats'].Number(2);
Number['Formats'].Number_Four = Number['Formats'].Number(4);
Number['Formats'].Decimal_Zero = 'd0';
Number['Formats'].Decimal_Two = Number['Formats'].Decimal(2);
Number['Formats'].Decimal_Four = Number['Formats'].Decimal(4);
Number['Formats'].Percent_Zero = 'p0';
Number['Formats'].Percent_One = Number['Formats'].Percent(1);
Number['Formats'].Percent_Two = Number['Formats'].Percent(2);
Number['Formats'].Currency_Zero = 'c0';
Number['Formats'].Currency_Two = Number['Formats'].Currency(2);

@singleton
class Formatter {
    public culture: Culture;

    constructor() {
        this.culture = 'en';
    }

    public setCulture(culture: Culture): void {
        this.culture = culture;
        Globalize.culture(culture);
    }

    public cultureInfo(): Culture {
        return Globalize.culture();
    }

    public format(value: any, format?: Format | Format[], culture?: Culture): FormattedValue {
        let removeThousandsSeparators = false,
            exponent:Nullable<string> = null;
        culture = culture || this.culture;

        //  if format is an array, recursively call format on the value for each format in the array and
        //  concatenate the results together to make one string of all the formatted values where each
        //  value is separated by a space.
        if (_.isArray(format)) {
            return _.map(format, (f: Format): FormattedValue => this.format(value, f, culture)).join(' ');
        }

        //  format is not an array, so format the value
        format = format as Format;
        if (value instanceof Date) {
            return formatDate(value, format, culture);
        } else {
            if (format && format.match(/^[ndmg]e?[0-9]*/i) !== null && !(value instanceof Date)) {
                let number = (typeof value === 'number') ? value : parser.parseFloat(value, 10, culture);

                if (isNaN(number as number) || number === null) {
                    format = undefined;
                } else {
                    const formatType= format.substr(0, 1);
                    if (format.match(/^[ndmg]e[0-9]*/i) !== null) {
                        //removes optional e param to pass format in as expected constructGlobalizeFormat
                        format = format.replace('e', '');
                        const parts = extractScientificNotationParts(number);
                        if (parts && parts.length > 1) {
                            number = parseFloat(parts[0]);
                            exponent = 'e' +parts[1];
                        }
                    }
                    value = number;
                    switch (formatType) {
                        case 'm':
                            //  get the format to be used by the globalize.format method below.
                            format = constructGlobalizeFormat(number, format);
                            break;
                        case 'g':
                            //  get the format to be used by the globalize.format method below.
                            format = constructGlobalizeFormat(number, format);
                            removeThousandsSeparators = true;
                            break;
                        default:
                            break;
                    }

                }
            }
            let formattedValue = Globalize.format(value, format, culture);

            if(exponent) {
                formattedValue += exponent;
            }
            if (removeThousandsSeparators) {
                const regex = new RegExp(
                    Globalize.culture(culture).numberFormat[','].replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'g');
                if (formattedValue) {
                    formattedValue = formattedValue.replace(regex, '');
                }
            }

            return formattedValue;
        }
    }

    // A method to abbreviate the given string into abc...xyz. The number of visible characters will be provided as
    // the second argument.
    public abbreviate(str: string, abbrLength: number): string {
        if (!str) {
            return str;
        }
        if (str.length > (abbrLength * 2)) {
            return str.substr(0, abbrLength) + '...' + str.substr(str.length - abbrLength, str.length);
        }
        return str;
    };

    //A method to abbreviate a string based on its container width.
    public abbreviateByWidth(str: string, containerWidth: number, abbrLength: number): string {
        if (!str) { return str; }

        const dummySpan = document.createElement('span');
        dummySpan.className = 'dummy-span';
        dummySpan.innerHTML = str;

        const body = $(document).find('body');
        body.append(dummySpan);

        const dummySpanWidth = $(dummySpan).width(); //Width of the string in the DOM
        $(dummySpan).remove();

        if (dummySpanWidth > containerWidth) {
            return this.abbreviate(str, abbrLength);
        }
        return str;
    };
}

function formatDate(value: Date, format: Format, culture: Culture): FormattedValue {
    format = convertMissingDateFormat(format);
    return Globalize.format(value, format, culture);
}

function convertMissingDateFormat(format: Format): Format {
    /*tslint:disable:quotemark */
    const RFC1123 = "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'";
    /*tslint:enable:quotemark */
    if (format === 'g') {
        return getGeneralDateShortTimeFormat();
    } else if (format === 'G' || format === 'GT') {
        return getGeneralDateLongTimeFormat();
    } else if (format === 'r' || format === 'R') {
        return RFC1123;
    } else if (format === 's' || format === 'm' || format === 'y') {
        return format.toUpperCase();
    } else {
        return format;
    }
}

function getGeneralDateShortTimeFormat(): Format {
    return getCalendarPattern('d') + ' ' + getCalendarPattern('t');
}

function getCalendarPattern(pattern: Format): Format {
    const calendar = Globalize.culture().calendar,
        patterns = calendar.patterns;
    return patterns[pattern];
}

function getGeneralDateLongTimeFormat(): Format {
    return getCalendarPattern('d') + ' ' + getCalendarPattern('T');
}

function extractScientificNotationParts(value: Nillable<number>): string[] {
    value = value as number;
    if (useNormalNotation(value)) { return [value.toString()]; }
    return value.toExponential().split(/[eE]/);
}

function useNormalNotation(value: number): boolean {
    if (value === 0) { return true; }
    const NON_SCI_MAX = 10000000000;
    const NON_SCI_MIN = 0.000001;
    const absValue = Math.abs(value);
    return absValue < NON_SCI_MAX && absValue > NON_SCI_MIN;
}

//  Maps the custom format to a native Globalize format.
function constructGlobalizeFormat(number: Nillable<number>, format: Format): Format {
    const precisionString = format.substr(1);
    const precision = precisionString.length > 0 ? parseInt(precisionString, 10) : undefined;
    const formattedValue = formatToMaxPrecision(number, precision);
    return getMaxPrecisionFormat(formattedValue);
}

//  Gets the format to pass into the globalize format method.
function getMaxPrecisionFormat(stringValue: string): Format {
    const decimalPosition = stringValue.indexOf('.');
    const actualPrecision = (decimalPosition > -1) ? ((stringValue.length - 1) - decimalPosition) : 0;
    return 'n' + actualPrecision;
}

//  Gets the format for a number to a maximum precision after the decimal point.  If a number
//  has digits that are rounded off past the precision boundary, trailing zeros
//  will be kept, otherwise they will be dropped.
function formatToMaxPrecision(value: any, precision: number | undefined): string {
    const number = Number(value);
    if (isNaN(number)) { return value; }

    let decimalValue;
    const parts = extractScientificNotationParts(number);

    if (Math.abs(number) < 1 && parts && parts.length > 1) {
        const whole = Math.floor(parseFloat(parts[0])).toString().length;
        const dec = parts[0].toString().length > whole ? (parts[0].toString().length - whole - 1) : 0;
        const diglen = whole + dec;
        const exp = Math.abs(parseFloat(parts[1]));
        const decUpd = exp + (precision > diglen ? diglen : precision) - 1;
        decimalValue = number.toFixed(decUpd > 20 ? 20 : decUpd);
    } else if (Math.abs(number) >= 1 || !precision) {
        decimalValue = (precision === 0 || precision) ?
            number.toFixed(precision > 20 ? 20 : precision) : number.toString();
    } else {
        decimalValue = number.toPrecision(precision);
    }

    const defaultValue = number.toString();
    return (defaultValue.length < decimalValue.length) ? defaultValue : decimalValue;
}

export = Formatter;
