define (function() {
    'use strict';

    function AxisDTO(data) {

        data  = data || {};

        this.index = data.index;
        this.axis = data.axis;
        this.name = data.name || '';
        this.caption = data.caption || '';
        this.minimum = data.minimum || '';
        this.maximum = data.maximum || '';
        this.decimals = data.decimals || '2';
        this.format = data.format || '';
        this.tickInterval = data.tickInterval || null;
        this.gridLines = (data.gridLines === false) ? false : true;
        this.logarithmic = !!data.logarithmic;
    }

    return AxisDTO;
});
