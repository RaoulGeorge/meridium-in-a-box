define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ApplicationEvents = require('application/application-events'),
        sampleDataOne = require('text!./sample-data.json'),
        sampleDataTwo = require('text!./sample-data2.json'),
        LeftnavViewModel = require('shell/leftnav-view-model');

    require('ui/elements/panel/view-model');
    require('ui/elements/tool-bar/view-model');
    require('ui/elements/list-group/view-model');
    require('ui/elements/column/view-model');
    require('ui/elements/column-group/view-model');

    function ColumnSampleViewModel(applicationEvents) {
        this.titleChanged = applicationEvents.titleChanged;

        this.listone = JSON.parse(sampleDataOne);
        this.listtwo = JSON.parse(sampleDataTwo);
        this.listthree = JSON.parse(sampleDataOne);
        this.listfour = JSON.parse(sampleDataTwo);

        this.leftnavViewModel = Object.resolve(LeftnavViewModel);

        this.columnGroup = null;
        this.columnOne = null;
        this.columnTwo = null;
        this.columnThree = null;
        this.columnFour = null;
    }

    ColumnSampleViewModel.dependsOn = [ApplicationEvents];

    ColumnSampleViewModel.prototype.open = function ColumnSampleViewModel_open() {
        this.titleChanged.raise('Column Group Sample', this);
    };

    ColumnSampleViewModel.prototype.attach = function ColumnSampleViewModel_attach(region) {
        region.attach($(
            '<div class="column-sample-screen" style="height:100%">' +
                '<mi-column-group>' +
                    '<mi-column title="Deviations" description="groupid" key="entykey"></mi-column>' +
                    '<mi-column title="Cause" description="groupid" key="entykey"></mi-column>' +
                    '<mi-column title="Consequence" description="groupid" key="entykey"></mi-column>' +
                    '<mi-column title="Safeguards" description="groupid" key="entykey"></mi-column>' +
                '</mi-column-group>' +
            '</div>'));

        this.columnGroup = region.$element.find('mi-column-group')[0];
        this.columnOne = region.$element.find('mi-column')[0];
        this.columnTwo = region.$element.find('mi-column')[1];
        this.columnThree = region.$element.find('mi-column')[2];
        this.columnFour = region.$element.find('mi-column')[3];

        this.columnOne.loader = this.loaderOne.bind(this);
        this.columnTwo.loader = this.loaderTwo.bind(this);
        this.columnThree.loader = this.loaderThree.bind(this);
        this.columnFour.loader = this.loaderFour.bind(this);
    };

    ColumnSampleViewModel.prototype.loaderOne = function ColumnSampleViewModel_loaderOne() {
        var dfd = $.Deferred();
        dfd.resolve(this.listone);
        return dfd.promise();
    };

    ColumnSampleViewModel.prototype.loaderTwo = function ColumnSampleViewModel_loaderTwo() {
        var dfd = $.Deferred();
        dfd.resolve(this.listtwo);
        return dfd.promise();
    };

    ColumnSampleViewModel.prototype.loaderThree = function ColumnSampleViewModel_loaderThree() {
        var dfd = $.Deferred();
        dfd.resolve(this.listthree);
        return dfd.promise();
    };

    ColumnSampleViewModel.prototype.loaderFour = function ColumnSampleViewModel_loaderFour() {
        var dfd = $.Deferred();
        dfd.resolve(this.listfour);
        return dfd.promise();
    };

    return ColumnSampleViewModel;
});