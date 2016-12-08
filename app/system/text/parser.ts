/// <amd-dependency path="globalize" />

const Globalize = require('globalize');

class Parser {
    public parseInt(value?: string, radix?: number, culture?: string): Nillable<number> {
        if (value === undefined || value === null) { return value; }
        if (typeof value !== 'string' && typeof value !== 'number') { return NaN; }
        return Globalize.parseInt(value, radix, culture);
    };

    public parseFloat(value: string, radix?: number, culture?: string): Nillable<number> {
        if (value === undefined || value === null || typeof value === 'number') { return value; }
        if (typeof value !== 'string') { return NaN; }
        return Globalize.parseFloat(value, radix, culture);
    };

    public parseDate(value: string, formats: string, culture?: string): Date {
        return Globalize.parseDate(value, formats, culture);
    };
}

export = new Parser();
