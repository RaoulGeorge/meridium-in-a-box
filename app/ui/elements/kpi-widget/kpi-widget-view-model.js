define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        KPIService = require('metrics/services/kpi-service'),
        KPIModel = require('metrics/models/kpi-data-model'),
        Formatter = require('system/text/formatter'),
        Translator = require('system/globalization/translator'),
        Highcharts = require("highcharts");
    require('kobindings');
    require('system/knockout/knockout-helpers');


    function KpiWidgetViewModel(params, element) {
        var self = this;
        self.subscriptions = [];
        self.isBusy = ko.observable(false);
        self.rootElement = $(element);        
        self.name = params.name;
        self.isResized = params.resize;               
        self.kpiModel = ko.observable(Object.resolve(KPIModel));
        self.kpiService = Object.resolve(KPIService);
        self.formatter = Object.resolve(Formatter);
        self.translator = Object.resolve(Translator);
        self.gaugeChartOptions = ko.computed(_.partial(gaugeChartOptions_read, self));

        getKpiData(self, ko.unwrap(self.name));
        if (ko.isObservable(self.name)) {
            self.subscriptions.push(self.name.subscribe(getKpiData.bind(null, self)));
        }
        if (ko.isObservable(self.isResized)) {
            self.subscriptions.push(self.isResized.subscribe(resize.bind(null, self)));
        }
    }

    KpiWidgetViewModel.prototype.dispose = function dispose() {
        var self = this;
        _.each(self.subscriptions, function (subscription) {
            subscription.dispose();
        });
        self.subscriptions = null;
    };

    function resize(self) {        
        var rootwidth = self.rootElement.outerWidth(true);
        var rootHeight = self.rootElement.outerHeight(true);
        var radius = Math.floor(Math.min(rootwidth / 2, rootHeight)) - 1;        
        var chart = self.rootElement.find('.kpi-widget-gauge').highcharts();
        if (chart) {
            chart.setSize(radius * 2, radius);
        }
    }

    function getKpiData(self, name) {
        if (name !== "") {
            self.isBusy(true);
            self.kpiService.getKpiDataByName(name)
                .done(getKpiData_done.bind(null, self))
                .fail(function (responseData) {
                    self.isBusy(false);
                });
        } else {
            self.kpiModel(null);
        }
    }

    function getKpiData_done(self, responseData) {
        self.isBusy(false);       
        self.kpiModel().loadFromDTO(responseData[0]);
        self.kpiModel.valueHasMutated();
        resize(self);
    }


    function gaugeChartOptions_read(self) {
        var chartOptions = {

            chart: {
                type: 'gauge',
                backgroundColor: 'transparent',                
                spacing: [20,10,40,10],
            },
            lang: {
                noData: self.translator.translate('NO_DATA_TO_DISPLAY')
            },
            title: null,
            pane: {
                center: ['50%', '95%'],
                size: '190%',
                startAngle: -90,
                endAngle: 90,
                background: [{
                    backgroundColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [
                                0,
                                "#FaFaFa"
                            ],
                            [
                                0.5,
                                "#EeEeEe"
                            ],
                            [
                                0.51,
                                "rgba(255, 255, 255, 0)"
                            ]
                        ]
                    },
                    borderWidth: 0,
                    outerRadius: "100%",
                    innerRadius : '20%'
                }
                ]

            },

            tooltip: {
                enabled: false
            },
            plotOptions: {
                gauge: {
                    dataLabels: {
                        borderWidth: 0,
                        borderRadius : 0,
                        enabled: true,
                        zIndex: 5,
                        padding: 0,
                        style: { color: 'black', fontSize : '26px', fontWeight: 'normal', textShadow: null },
                        crop: false,
                        overflow: 'none',
                        formatter: null
                    },
                    dial: {
                        radius: '95%',
                        backgroundColor: 'black',
                        borderWidth: 0,
                        baseWidth: 16,
                        topWidth: 2,
                        baseLength: '0.5%', // of radius
                        rearLength: '0%'
                    },
                    pivot: {
                        radius: 6,
                        backgroundColor: "#FFFFFF",
                        borderColor: 'black',
                        borderWidth: 4
                    },
                    overshoot: 1
                }
            },
            // the value axis
            yAxis: {
                min: null,
                max: null,
                lineWidth: 0,
                minorTickInterval: null,
                tickPositions: [],
                tickWidth: 0,
                plotBands: [],
                labels: {
                    distance: 10,
                    //align: 'center',
                    //formatter: null
                }
            },

            credits: {
                enabled: false
            },

            series: [
                {
                    name: 'Current',
                    data: []


                }]

        };
        if (self.kpiModel()) {
            var model = self.kpiModel();
            var tickPositions = [], min = null, max = null, plotBands = [];


            if (model.showScore) {

                tickPositions = _.pluck(model.measurementRange, 'startScore');
                min = _.min(model.measurementRange, 'startScore').startScore;
                max = _.max(model.measurementRange, 'endScore').endScore;
                tickPositions.push(max);
                plotBands = _.map(model.measurementRange, function (item) {
                    return {
                        from: item.startScore,
                        to: item.endScore,
                        color: getColorForScore(item, model.lastMeasurementScore),
                        thickness: '20%'
                    };
                });


                chartOptions.yAxis.labels.formatter = function () {
                    return self.formatter.format(this.value, 'N2');
                };

                chartOptions.series[0].data.push(model.lastMeasurementScore);

                chartOptions.plotOptions.gauge.dataLabels.formatter = function () {
                    var formattedResult = self.formatter.format(model.lastMeasurementScore, 'N2');
                    if (_.isFinite(model.deltaScorePercentage)) {
                        formattedResult += ' (';
                        if (Math.abs(model.deltaScorePercentage) >= 0.005) {
                            if (model.deltaScorePercentage >= 0) {
                                formattedResult += '+';
                            }
                            else {
                                formattedResult += '-';
                            }
                        }
                        formattedResult += self.formatter.format(Math.abs(model.deltaScorePercentage), 'P0');
                        formattedResult += ')';
                    }
                    return formattedResult;
                };

            } else {

                tickPositions = _.pluck(model.measurementRange, 'startValue');
                min = _.min(model.measurementRange, 'startValue').startValue;
                max = _.max(model.measurementRange, 'endValue').endValue;
                tickPositions.push(max);
                var radius = (chartOptions.plotOptions.gauge.dial.radius).split('%');
                plotBands = _.map(model.measurementRange, function (item) {
                    return {
                        from: item.startValue,
                        to: item.endValue,
                        color: getColor(item, model.lastMeasurementValue),
                        thickness: '20%'
                    };
                });


                chartOptions.yAxis.labels.formatter = function () {
                    return self.formatter.format(this.value, model.numberFormat);
                };

                chartOptions.series[0].data.push(model.lastMeasurementValue);

                chartOptions.plotOptions.gauge.dataLabels.formatter = function () {
                    var formattedResult = self.formatter.format(model.lastMeasurementValue, model.numberFormat);
                    if (_.isFinite(model.deltaPercentage)) {
                        formattedResult += ' (';
                        if (Math.abs(model.deltaPercentage) >= 0.005) {
                            if (model.deltaPercentage >= 0) {
                                formattedResult += '+';
                            }
                            else {
                                formattedResult += '-';
                            }
                        }
                        formattedResult += self.formatter.format(Math.abs(model.deltaPercentage), 'P0');
                        formattedResult += ')';
                    }
                    return formattedResult;
                };
            }

            chartOptions.yAxis.min = min;
            chartOptions.yAxis.max = max;
            chartOptions.yAxis.plotBands = plotBands;
            chartOptions.yAxis.tickPositions = tickPositions;
            chartOptions.plotOptions.gauge.dataLabels.style.color = model.lastMeasurementColor;

        }
        return chartOptions;
    }

    function getColor(measurementRange, currentValue) {
        if (currentValue >= measurementRange.startValue && currentValue <= measurementRange.endValue) {
            return Highcharts.Color(measurementRange.color).get('rgba');
        }
        //return Highcharts.Color(measurementRange.color).setOpacity(0.3).get('rgba');
        return Highcharts.Color(measurementRange.mutedColor).get('rgba');
    }

    function getColorForScore(measurementRange, currentScore) {
        if (currentScore >= measurementRange.startScore && currentScore <= measurementRange.endScore) {
            return Highcharts.Color(measurementRange.color).get('rgba');
        }
        return Highcharts.Color(measurementRange.mutedColor).get('rgba');
    }

    return KpiWidgetViewModel;
});