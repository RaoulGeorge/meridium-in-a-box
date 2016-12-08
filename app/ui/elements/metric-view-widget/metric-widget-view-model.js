define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        MDXQueryService = require('metrics/services/mdx-query-service'),
        CatalogService = require('catalog/services/catalog-service'),
        Formatter = require('system/text/formatter'),
        DrillThroughResultViewer = require('metrics/drill-through-result-viewer-view-model'),
        DialogBox = require('system/ui/dialog-box'),
        ErrorMessage = require('system/error/error-message'),
        ApplicationEvents = require('application/application-events'),
        Translator = require('system/globalization/translator'),
        Highcharts = require("highcharts");
    require('kobindings');
    require('system/lang/object');
    require('ui/elements/chart/chart-view-model');


    function MetricsWidgetViewModel(params, element) {
        var self = this;
        self.isBusy = ko.observable(false);
        self.rootElement = $(element);
        self.subscriptions = [];
        self.translator = Object.resolve(Translator);
        // Parameters
        self.isResized = params.resize;
        self.mode = ko.unwrap(params.mode);

        self.cubeKey = ko.isObservable(params.cubeKey) ? params.cubeKey : ko.observable(params.cubeKey);
        self.mdxQueryDTO = ko.isObservable(params.mdxQueryDTO) ? params.mdxQueryDTO : ko.observable(params.mdxQueryDTO);
        self.chartSettings = ko.isObservable(params.chartSettings) ? params.chartSettings : ko.observable(params.chartSettings);

        self.catalogItemKey = ko.isObservable(params.catalogItemKey) ? params.catalogItemKey : ko.observable(params.catalogItemKey);
        self.catalogItemPath = ko.isObservable(params.catalogItemPath) ? params.catalogItemPath : ko.observable(params.catalogItemPath);
        self.dynamicSlices = ko.isObservable(params.dynamicSlices) ? params.dynamicSlices : ko.observableArray(params.dynamicSlices);


        self.subscriptions.push(self.catalogItemKey.subscribe(catalogItemKey_changed.bind(null, self)));
        self.subscriptions.push(self.catalogItemPath.subscribe(catalogItemPath_changed.bind(null, self)));
        self.subscriptions.push(self.mdxQueryDTO.subscribe(mdxQueryDTO_changed.bind(null, self)));
        self.subscriptions.push(self.cubeKey.subscribe(cubeKey_changed.bind(null, self)));
        self.subscriptions.push(self.chartSettings.subscribe(CreateChartView.bind(null, self)));
        self.subscriptions.push(self.dynamicSlices.subscribe(dynamicSlices_Changed.bind(null, self)));
        if (ko.isObservable(self.isResized)) {
            self.subscriptions.push(self.isResized.subscribe(resize.bind(null, self)));
        }

        self.mdxQueryService = Object.resolve(MDXQueryService);
        self.catalogService = Object.resolve(CatalogService);
        self.applicationEvents = Object.resolve(ApplicationEvents);
        self.formatter = Object.resolve(Formatter);

        self.canViewCube = ko.observable(true);
        self.isCubeAlive = ko.observable(true);

        self.queryResult = ko.observable();

        self.selectedPoint = ko.observable();
        self.selectedLegend = ko.observable();
        self.chartView = ko.observable(true);
        self.dynamicSlicer = ko.observable();
        self.drillDownHistory = ko.observableArray([{ caption: 'Result' }]);
        self.highchartValue = ko.observable();
        self.highchartValue_PiePyramid = ko.observableArray([]);

        self.cubeActionName = ko.observable();
        self.cubeActionUrl = ko.observable();
        self.cubeActionCaption = ko.observable();
        self.cubeActionDescription = ko.observable();

        self.chartView.subscribe(CreateChartView.bind(null, self));

        self.queryResult.subscribe(CreateChartView.bind(null, self));
        self.chartMultipleHeight = ko.observable('100%');
        self.chartWidth = ko.observable('50%');

        if (self.mode === 'key') {
            catalogItemKey_changed(self, self.catalogItemKey(),self.dynamicSlices());
        } else if (self.mode === 'path') {
            catalogItemPath_changed(self, self.catalogItemPath(),self.dynamicSlices());
        }
        else if (self.mode === 'model') {
            mdxQueryDTO_changed(self);
        }

    }


    function catalogItemKey_changed(self, val,dynamicSlices) {
        if (_.isString(val) || _.isNumber(val)) {
        getCatalogItemByKey(self, val);
            getQueryResultByCatalogItemKey(self, val, dynamicSlices);
    }
    }


    function catalogItemPath_changed(self, val, dynamicSlices) {
        if (_.isString(val)) {
        getCatalogItemByPath(self, val);
            getQueryResultByCatalogItemPath(self, val, dynamicSlices);
    }
    }

    function dynamicSlices_Changed(self, val) {
        if (_.isArray(val) ) {
            if (self.mode === 'key' && (_.isString(self.catalogItemKey()) || _.isNumber(self.catalogItemKey()))) {
                getQueryResultByCatalogItemKey(self, self.catalogItemKey(), val);
            }
            else if (self.mode === 'path' && _.isString(self.catalogItemPath())) {
                getQueryResultByCatalogItemPath(self, self.catalogItemPath(), val);
            }
        }
    }


    MetricsWidgetViewModel.prototype.getQueryResult = function MetricViewDesignerViewModel_getQueryResult() {
        var self = this;

        self.mdxQueryService.getMdxQueryResult(self.cubeKey(), self.mdxQueryDTO()).done(function (responseData) {
            self.queryResult(responseData);
        }).fail(function (responseData) {
            handleServerError(self, responseData, self.translator.translate('INCORRECT_MDX_QUERY'));
            self.isBusy(false);
        });
    };

    MetricsWidgetViewModel.prototype.dispose = function dispose() {
        var self = this;
        _.each(self.subscriptions, function (subscription) {
            subscription.dispose();
            subscription = undefined;
        });
        self.subscriptions = [];
    };

    MetricsWidgetViewModel.prototype.drillThrough = function MetricsWidgetViewModel_drillThrough(series, members) {
        var self = this;
        members = series.cells.length ? members.concat(series.dimensionMembers) : members;
        var membersToDrillThrough = members.length ? _.pluck(members, 'uniqueName') : [];
        if (self.mode === 'model' && self.mdxQueryDTO() && self.mdxQueryDTO().slicerMembers && self.mdxQueryDTO().slicerMembers.length > 0) {
            membersToDrillThrough = membersToDrillThrough.concat(self.mdxQueryDTO().slicerMembers);
        }
        else if ((self.mode === 'key' || self.mode === 'path') && self.dynamicSlices() && self.dynamicSlices().length > 0) {
            membersToDrillThrough = membersToDrillThrough.concat(self.dynamicSlices());
        }
        self.isBusy(true);
        self.mdxQueryService.getDrillThroughResult(self.cubeKey(), series.measure.uniqueName, membersToDrillThrough)
                .done(GetDrillThroughResultSuccess.bind(null, self, series.measure.uniqueName, membersToDrillThrough))
                .fail(GetDrillThroughResultFailure.bind(null, self));
    };

    MetricsWidgetViewModel.prototype.drillDown = function MetricsWidgetViewModel_drillDown(member) {
        var self = this;
        var memberUniqueNameList = _.pluck(self.drillDownHistory().slice(1), 'uniqueName');
        memberUniqueNameList.push(member.uniqueName);
        self.drillDownHistory.push(member);
        self.isBusy(true);

        if (self.mode === 'path') {
            self.mdxQueryService.getDrillDownResultByCatalogItemPath(self.catalogItemPath(), memberUniqueNameList, self.dynamicSlices())
                .done(GetDrillDownResultSuccess.bind(null, self))
                .fail(GetDrillDownResultFailure.bind(null, self));
        }
        else if (self.mode === 'key') {
            self.mdxQueryService.getDrillDownResultByCatalogItemKey(self.catalogItemKey(), memberUniqueNameList, self.dynamicSlices())
                .done(GetDrillDownResultSuccess.bind(null, self))
                .fail(GetDrillDownResultFailure.bind(null, self));
        }
        else if (self.mode === 'model') {
            self.mdxQueryService.getDrillDownResult(self.cubeKey(), self.mdxQueryDTO(), memberUniqueNameList)
                .done(GetDrillDownResultSuccess.bind(null, self))
                .fail(GetDrillDownResultFailure.bind(null, self));
        }
    };

    MetricsWidgetViewModel.prototype.drillUp = function MetricsWidgetViewModel_drillUp(index) {
        var self = this;

        if (index === 0) {

            if (self.mode === 'path') {
                catalogItemPath_changed(self, self.catalogItemPath());
            }
            else if (self.mode === 'key') {
                catalogItemKey_changed(self, self.catalogItemKey());
            }
            else if (self.mode === 'model') {
                mdxQueryDTO_changed(self);
            }

        } else {
            self.drillDownHistory.splice(index + 1);
            var memberUniqueNameList = _.pluck(self.drillDownHistory(), 'uniqueName');
            self.isBusy(true);
            if (self.mode === 'path') {
                self.mdxQueryService.getDrillDownResultByCatalogItemPath(self.catalogItemPath(), memberUniqueNameList, self.dynamicSlices())
                    .done(GetDrillDownResultSuccess.bind(null, self))
                    .fail(GetDrillDownResultFailure.bind(null, self));
            }
            else if (self.mode === 'key') {
                self.mdxQueryService.getDrillDownResultByCatalogItemKey(self.catalogItemKey(), memberUniqueNameList, self.dynamicSlices())
                    .done(GetDrillDownResultSuccess.bind(null, self))
                    .fail(GetDrillDownResultFailure.bind(null, self));
            }
            else if (self.mode === 'model') {
                self.mdxQueryService.getDrillDownResult(self.cubeKey(), self.mdxQueryDTO(), memberUniqueNameList)
                    .done(GetDrillDownResultSuccess.bind(null, self))
                    .fail(GetDrillDownResultFailure.bind(null, self));
            }
        }
    };

    MetricsWidgetViewModel.prototype.chartTitleClick = function (index) {
        DrillDownOnSeries(index, this);// jshint ignore:line
    };


    function resize(self) {

        var chart = self.rootElement.find('.chart').highcharts();
        // TODO 
        // Chart Reflow
    }

    function cubeKey_changed(self) {
        if (self.mode === 'model' && (_.isString(self.cubeKey()) || _.isNumber(self.cubeKey()))) {
            mdxQueryDTO_changed(self);
        }
    }

    function mdxQueryDTO_changed(self) {
        if ((_.isString(self.cubeKey()) || _.isNumber(self.cubeKey())) && self.mdxQueryDTO()) {
            self.mdxQueryService.getMdxQueryResult(self.cubeKey(), self.mdxQueryDTO()).done(function (responseData) {
                self.drillDownHistory([{
                    caption: 'Result'
                }]);
                self.queryResult(responseData);
            }).fail(function (responseData) {
                handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_MDX_QUERY_ERROR_MESSAGE'));
            });
        }
    }

    function getCatalogItemByKey(self, catalogItemKey) {
        self.catalogService.getCatalogItem(catalogItemKey)
        .done(CatalogItemSuccess.bind(null, self)).fail(function (responseData) {
            handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_OPEN_ERROR_MESSAGE'));
        });
    }

    function getQueryResultByCatalogItemKey(self, catalogItemKey, dynamicSlices) {
        self.mdxQueryService.getQueryResultByCatalogItemKey(catalogItemKey, dynamicSlices)
        .done(function (responseData) {
            self.drillDownHistory([{
                caption: 'Result'
            }]);
            self.queryResult(responseData);
        }).fail(function (responseData) {
            self.isBusy(false);
            handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_OPEN_ERROR_MESSAGE'));
        });
    }

    function getCatalogItemByPath(self, catalogItemPath) {
        self.catalogService.getCatalogItemByPath(catalogItemPath)
            .done(CatalogItemSuccess.bind(null, self)).fail(function (responseData) {
                handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_FILE_NOT_FOUND'));
            });
    }

    function getQueryResultByCatalogItemPath(self, catalogItemPath, dynamicSlices) {
        self.mdxQueryService.getQueryResultByCatalogItemPath(catalogItemPath, dynamicSlices)
            .done(function (responseData) {
                self.drillDownHistory([{
                    caption: 'Result'
                }]);
                self.queryResult(responseData);
            }).fail(function (responseData) {
                handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_FILE_NOT_FOUND'));
            });
    }

    function CatalogItemSuccess(self, catalogItem) {
        self.cubeKey(catalogItem.metricView.cubeKey);
        var chartSettingDTO = catalogItem.metricView.source ? JSON.parse(catalogItem.metricView.source) : undefined;
        self.chartSettings(chartSettingDTO);
    }

    function CreateChartView(self) {
        var queryResult = self.queryResult();
        self.selectedPoint(undefined);
        self.selectedLegend(undefined);
        if (queryResult && self.chartSettings()) {
            var chartSeriesArray = [],
                yAxes = [{ title: { text: '' }, labels: { formatter: undefined }, type: 'linear', min: null, max: null }, { title: { text: '' }, opposite: true, labels: { formatter: undefined }, type: 'linear', min: null, max: null }],
                colorValues = [{
                    colorValue1: '#7cb5ec', colorValue2: '#434348', colorValue3: '#90ed7d', colorValue4: '#f7a35c', colorValue5: '#8085e9',
                    colorValue6: '#f15c80', colorValue7: '#e4d354', colorValue8: '#2b908f', colorValue9: '#f45b5b', colorValue10: '#91e8e1'
                }],
                stacking = null,
                legendDisplay = true,
                legendPlacement = 'center',
                legendLayout = 'horizontal',
                legendVerticalAlign = 'bottom',
                scrollBarDisplay = false,
                scrollMaximum = null,
                xAxisTitle = '',
                yAxesCaptions = [];

            xAxisTitle = self.chartSettings().xAxisTitle;

            yAxes[0].type = self.chartSettings().yAxes[0].scaleType.value;
            yAxes[1].type = self.chartSettings().yAxes[1].scaleType.value;

            yAxes[0].min = self.chartSettings().yAxes[0].yAxisMinimum;
            yAxes[0].max = self.chartSettings().yAxes[0].yAxisMaximum;

            yAxes[1].min = self.chartSettings().yAxes[1].yAxisMinimum;
            yAxes[1].max = self.chartSettings().yAxes[1].yAxisMaximum;

            yAxes[0].labels.formatter = _.partial(labelFormatter, self.formatter, self.chartSettings().yAxes[0].formatString);
            yAxes[1].labels.formatter = _.partial(labelFormatter, self.formatter, self.chartSettings().yAxes[1].formatString);

            colorValues[0].colorValue1 = self.chartSettings().colorValues[0].colorValue1;
            colorValues[0].colorValue2 = self.chartSettings().colorValues[0].colorValue2;
            colorValues[0].colorValue3 = self.chartSettings().colorValues[0].colorValue3;
            colorValues[0].colorValue4 = self.chartSettings().colorValues[0].colorValue4;
            colorValues[0].colorValue5 = self.chartSettings().colorValues[0].colorValue5;
            colorValues[0].colorValue6 = self.chartSettings().colorValues[0].colorValue6;
            colorValues[0].colorValue7 = self.chartSettings().colorValues[0].colorValue7;
            colorValues[0].colorValue8 = self.chartSettings().colorValues[0].colorValue8;
            colorValues[0].colorValue9 = self.chartSettings().colorValues[0].colorValue9;
            colorValues[0].colorValue10 = self.chartSettings().colorValues[0].colorValue10;

            var changedColorValues = [colorValues[0].colorValue1, colorValues[0].colorValue2, colorValues[0].colorValue3, colorValues[0].colorValue4, colorValues[0].colorValue5,
                                      colorValues[0].colorValue6, colorValues[0].colorValue7, colorValues[0].colorValue8, colorValues[0].colorValue9, colorValues[0].colorValue10];

            _.each(queryResult.series, function (resultSeries, index) {
                var chartSeries = { name: resultSeries.caption, yAxis: 0, type: 'column' },
                    seriesSetting;


                if (self.chartSettings() && self.chartSettings().seriesSettings && self.chartSettings().seriesSettings.length) {
                    seriesSetting = _.find(self.chartSettings().seriesSettings, {
                        'measure': resultSeries.measure.uniqueName
                    });
                    if (seriesSetting && seriesSetting.isStacked) {
                        stacking = 'normal';
                        chartSeries.stack = seriesSetting.measure;
                    }
                    if (self.chartSettings().chartType === 'spiderweb') {
                        chartSeries.pointPlacement = 'on';
                    }
                    if (seriesSetting) {

                        if (self.chartSettings().chartType === 'spiderweb' || self.chartSettings().chartType === 'combination') {
                            if (seriesSetting.chartType === "") {
                                seriesSetting.chartType = 'column';
                            }
                        }
                        else {
                            seriesSetting.chartType = "";
                        }
                    }
                    if (self.chartSettings().isLegendEnabled === false) {
                        legendDisplay = false;
                    }
                    if (self.chartSettings().isLegendEnabled === true) {
                        legendDisplay = true;
                        legendPlacement = self.chartSettings().legendPlacement;
                    }
                    if (self.chartSettings().legendPlacement !== 'center') {
                        legendLayout = 'vertical';
                        legendVerticalAlign = 'middle';
                    }
                    if (self.chartSettings().isScrollEnabled === true) {
                        scrollBarDisplay = true;
                        scrollMaximum = self.chartSettings().scrollMaximum - 1;
                    }
                    chartSeries.type = seriesSetting && seriesSetting.chartType ? seriesSetting.chartType : self.chartSettings().chartType;
                    if (chartSeries.type === "combination") {
                        chartSeries.type = "column";
                    }
                    chartSeries.yAxis = seriesSetting ? seriesSetting.yAxisIndex : 0;
                }
                chartSeries.data = _.map(resultSeries.cells, function (cell, index) {
                    return {
                        y: _.isNumber(cell.value) ? cell.value : 0,
                        name: queryResult.categories && queryResult.categories.length ? queryResult.categories[index].caption : resultSeries.caption
                    };
                });
                yAxesCaptions.push({
                    index: chartSeries.yAxis, caption: (resultSeries.measure) ? resultSeries.measure.caption : ''
                });
                chartSeriesArray.push(chartSeries);
            });

            if (self.chartSettings().chartType === 'spiderweb') {
                yAxes[0].gridLineInterpolation = 'polygon';
                yAxes[1].gridLineInterpolation = 'polygon';
            } else {
                if (self.chartSettings().yAxes[0].yAxisTitle !== '') {
                    yAxes[0].title.text = self.chartSettings().yAxes[0].yAxisTitle;
                }
                else {
                    yAxesCaptions = _.uniq(yAxesCaptions, 'caption');
                    yAxes[0].title.text = _.reduce(_.pluck(_.where(yAxesCaptions, { 'index': 0 }), 'caption'), function (result, caption) {
                        return result + ',' + caption;
                    });
                }

                if (self.chartSettings().yAxes[1].yAxisTitle !== '') {
                    yAxes[1].title.text = self.chartSettings().yAxes[1].yAxisTitle;
                }
                else {
                    yAxes[1].title.text = _.reduce(_.pluck(_.where(yAxesCaptions, { 'index': 1 }), 'caption'), function (result, caption) {
                        return result + ',' + caption;
                    });
                }
            }

            var piePyramid_ChartConfigs = _.filter(chartSeriesArray, function (item) {
                return (item.type === 'pie' || item.type === 'pyramid');
            });
            var other_ChartConfigs = _.filter(chartSeriesArray, function (item) {
                return (item.type !== 'pie' && item.type !== 'pyramid');
            });
            Highcharts.setOptions({
                
                lang : {
                    noData: self.translator.translate('NO_DATA_TO_DISPLAY'),
                    resetZoom: self.translator.translate("CHART_RESET_ZOOM")
                }
            });

            if (other_ChartConfigs.length) {
                var chartConfig = {
                    "colors": changedColorValues,
                    "title.text": self.chartSettings() ? self.chartSettings().chartTitle : "",
                    "xAxis": {
                        min: 0,
                        max: scrollMaximum,
                        categories: _.pluck(self.queryResult().categories, 'caption'),
                        labels: { enabled: self.queryResult().categories.length === 0 ? false : true },
                        title: { enabled: true, text: xAxisTitle }
                    },

                    "series": other_ChartConfigs,
                    "legend": { enabled: legendDisplay, align: legendPlacement, layout: legendLayout, verticalAlign: legendVerticalAlign },
                    "scrollbar": { enabled: scrollBarDisplay },
                    "yAxis": yAxes,
                    "plotOptions.series.allowPointSelect": true,
                    "plotOptions.series.stacking": stacking,
                    "plotOptions.series.cursor": 'pointer',
                    "plotOptions.series.point.events.select": _.partialRight(pointSelected, self),
                    "plotOptions.series.events.legendItemClick": _.partialRight(legendItemClick, self)
                };
                chartConfig.chart = {
                    backgroundColor: 'transparent',
                    zoomType: 'xy',
                    alignTicks: false
                };
                if (self.chartSettings().chartType === 'spiderweb') {
                    chartConfig.chart = {
                        polar: true,
                        backgroundColor: 'transparent'
                    };
                    chartConfig.xAxis.tickmarkPlacement = 'on';
                    chartConfig.xAxis.lineWidth = 0;
                }
                self.highchartValue(chartConfig);
            }
            else {
                self.highchartValue(undefined);
            }

            var piePyramidChartSeries = [];
            self.chartWidth('50%');
            _.each(piePyramid_ChartConfigs, function (item, index) {
                piePyramidChartSeries.push({
                    "chart": {
                        customHeight: (100 / Math.ceil(piePyramid_ChartConfigs.length / 2)) + '%',
                        backgroundColor: 'transparent',
                        marginRight: 150
                    },
                    "title.text": '<a data-bind="click:$component.chartTitleClick.bind($component,' + index + ')">' + item.name + '</a>',
                    "title.useHTML": true,
                    "xAxis.categories": _.pluck(self.queryResult().categories, 'caption'),
                    "series": [item],
                    "yAxis": yAxes,
                    "legend": { enabled: legendDisplay, align: legendPlacement, layout: legendLayout, verticalAlign: legendVerticalAlign },
                    "scrollbar": { enabled: scrollBarDisplay },
                    "plotOptions.series.allowPointSelect": true,
                    "plotOptions.series.stacking": stacking,
                    "plotOptions.series.cursor": 'pointer',
                    "plotOptions.series.point.events.select": _.partialRight(pointSelected, self),
                    "plotOptions.series.events.legendItemClick": _.partialRight(legendItemClick, self)
                });
            });

            if (piePyramid_ChartConfigs.length > 2) {
                self.chartMultipleHeight(100 * (piePyramid_ChartConfigs.length / 3) + '%');
            } else {
                self.chartMultipleHeight('100%');
                if (piePyramid_ChartConfigs.length === 1) {
                    self.chartWidth('100%');
                }
            }

            self.highchartValue_PiePyramid(piePyramidChartSeries);

        } else {
            self.highchartValue_PiePyramid(undefined);
            self.highchartValue(undefined);
        }
    }

    function pointSelected(event, self) {
        var point = this;// jshint ignore:line     

        var members;
        var series;
        var measuresAndDimensions = [];

        if (point.series.options.type === 'pie' || point.series.options.type === 'pyramid') {
            series = _.find(self.queryResult().series, function (item) { return  item.caption === point.series.options.name; });
        } else {
            series = self.queryResult().series[point.series.index];
        }

        

        var columnMembers = _.map(series.dimensionMembers, function (item) {
            return item.uniqueName;
        });

        if (!(self.queryResult().categories && self.queryResult().categories.length)) {
            members = [];  // for custom actions
        }

        else {
            members = self.queryResult().categories[point.x].members;
        }
        self.selectedPoint({
            members: members, series: series
        });

        var rowMembers = _.map(members, function (item) {
            return item.uniqueName;
        });

        measuresAndDimensions.push(series.measure.uniqueName);
        measuresAndDimensions.push(rowMembers);
        measuresAndDimensions.push(columnMembers);
        if (self.mode === 'model') {
            measuresAndDimensions.push(self.mdxQueryDTO().slicerMembers);
        }

        self.isBusy(true);
        self.mdxQueryService.getActionResult(self.cubeKey(), measuresAndDimensions)
            .done(GetActionResultSuccess.bind(null, self))
            .fail(GetActionResultFailure.bind(null, self));

    }

    function legendItemClick(event, self) {
        var chartSeries = this;// jshint ignore:line    
        var legendColumns = [];

        var series = self.queryResult().series[chartSeries.index];

        var columnMembers = _.map(series.dimensionMembers, function (item) {
            return item.uniqueName;
        });

        //if (self.queryResult().series[chartSeries.index].dimensionMembers.length === 1) {
        //     self.drillDown(self.queryResult().series[chartSeries.index].dimensionMembers[0]);
        // }
        if (self.queryResult().series[chartSeries.index].dimensionMembers.length > 0) {

            self.selectedLegend({
                members: self.queryResult().series[chartSeries.index].dimensionMembers, series: self.queryResult().series[chartSeries.index]
            });
            legendColumns.push(series.measure.uniqueName);
            legendColumns.push(columnMembers);

            self.isBusy(true);
            self.mdxQueryService.getActionResult(self.cubeKey(), legendColumns)
                .done(GetLegendActionResultSuccess.bind(null, self))
                .fail(GetLegendActionResultFailure.bind(null, self));
        }


        //  DrillDownOnSeries(this.index, self);// jshint ignore:line
    }

    function DrillDownOnSeries(index, self) {
        if (self.queryResult().series[index].dimensionMembers.length === 1) {
            self.drillDown(self.queryResult().series[index].dimensionMembers[0]);
        }
        if (self.queryResult().series[index].dimensionMembers.length > 1) {
            self.selectedLegend({
                members: self.queryResult().series[index].dimensionMembers, series: self.queryResult().series[index]
            });
        }
        return false;
    }

    function GetDrillThroughResultSuccess(self, uniqueName, memebersToDrillThrough, responseData) {
        var screen = Object.resolve(DrillThroughResultViewer);
        screen.drillThroughResult(responseData);
        screen.cubeKey(self.cubeKey());
        screen.uniqueName(uniqueName);
        screen.memebersToDrillThrough(memebersToDrillThrough);

        var options = {
            buttons: [{
                name: self.translator.translate('CLOSE'), value: 'close', cssClass: 'btn-text btn-secondary'
            }],
            closeOnReject: false,
            height: '90%',
            width: '90%'
        };
        self.isBusy(false);
        var dialog = new DialogBox(screen, self.translator.translate('METRIC_VIEW_DRILL_THROUGH_RESULT'), options);
        dialog.show()
            .done(function (btnIndex, btnValue, data) {
                return;
            }
                );
    }

    function GetDrillThroughResultFailure(self, responseData) {
        // show error
        self.isBusy(false);
        handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_DRILL_THROUGH_ERROR_MESSAGE'));


    }

    function GetDrillDownResultSuccess(self, responseData) {
        self.isBusy(false);
        self.queryResult(responseData);
    }

    function GetDrillDownResultFailure(self, responseData) {
        // Show error
        self.isBusy(false);
        self.queryResult(undefined);
        handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_DRILL_DOWN_ERROR_MESSAGE'));
    }

    function GetActionResultSuccess(self, responseData) {
        self.isBusy(false);
        $("div#legendActions").html("");
        var actionButtons = $("div#actionItems");

        if (responseData !== null) {
            for (var i = 0; i < responseData.length; i++) {

                if (responseData[i].actionType === '1') {
                    self.cubeActionName(responseData[i].actionName);
                    self.cubeActionUrl(responseData[i].content);
                    self.cubeActionCaption(responseData[i].actionCaption);
                    self.cubeActionDescription(responseData[i].description);
                    var hashIndex = self.cubeActionUrl().indexOf("#");
                    var currentHashIndex = window.location.href.indexOf("#");
                    if (hashIndex !== -1) {
                        if (window.location.href.substring(0, currentHashIndex) === self.cubeActionUrl().substring(0, hashIndex)) {
                            var internalUrl = self.cubeActionUrl().substring(hashIndex, self.cubeActionUrl().length);
                            actionButtons.prepend('<a href= "' + internalUrl + '" class= "' + 'btn btn-text' + '" target = "' + 'tab' + '" style= "' + 'margin-right: 3px' + '">' + self.cubeActionName() + ' </a>');
                        }
                    }
                    else {
                        actionButtons.prepend('<a href= "' + self.cubeActionUrl() + '" class= "' + 'btn btn-text' + '" target = "' + '_blank' + '" style= "' + 'margin-right: 3px' + '">' + self.cubeActionName() + ' </a>');
                    }
                }

            }
        }
    }

    function GetActionResultFailure(self, responseData) {
        self.isBusy(false);
        handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_CUSTOM_ACTION_ERROR_MESSAGE'));
    }

    function GetLegendActionResultSuccess(self, responseData) {
        self.isBusy(false);
        $("div#actionItems").html("");
        var legendActionButtons = $("div#legendActions");

        if (responseData !== null) {
            for (var i = 0; i < responseData.length; i++) {
                if (responseData[i].actionType === '1') {
                    self.cubeActionName(responseData[i].actionName);
                    self.cubeActionUrl(responseData[i].content);
                    self.cubeActionCaption(responseData[i].actionCaption);
                    self.cubeActionDescription(responseData[i].description);
                    var hashIndex = self.cubeActionUrl().indexOf("#");
                    var currentHashIndex = window.location.href.indexOf("#");
                    if (hashIndex !== -1) {
                        if (window.location.href.substring(0, currentHashIndex) === self.cubeActionUrl().substring(0, hashIndex)) {
                            var internalUrl = self.cubeActionUrl().substring(hashIndex, self.cubeActionUrl().length);
                            legendActionButtons.prepend('<a href= "' + internalUrl + '" class= "' + 'btn btn-text' + '" target = "' + 'tab' + '" style= "' + 'margin-right: 3px' + '">' + self.cubeActionName() + ' </a>');
                        }
                    }
                    else {
                        legendActionButtons.prepend('<a href= "' + self.cubeActionUrl() + '" class= "' + 'btn btn-text' + '" target = "' + '_blank' + '" style= "' + 'margin-right: 3px' + '">' + self.cubeActionName() + ' </a>');
                    }
                }

            }
        }
    }

    function GetLegendActionResultFailure(self, responseData) {
        self.isBusy(false);
        handleServerError(self, responseData, self.translator.translate('METRIC_VIEW_LEGEND_ACTION_ERROR_MESSAGE'));
    }

    function labelFormatter(formatter, formatString) {
        return formatter.format(this.value, formatString); // jshint ignore:line
    }

    function getColor(measurementRange, currentValue) {
        if (currentValue >= measurementRange.startValue && currentValue <= measurementRange.endValue) {
            return Highcharts.Color(measurementRange.color).get('rgba');
        }
        //return Highcharts.Color(measurementRange.color).setOpacity(0.3).get('rgba');
        return Highcharts.Color(measurementRange.mutedColor).get('rgba');
    }

    function handleServerError(self, response, message) {
        var code = response.status,
        detail = response.statusText,
        errorMessage = new ErrorMessage(code, message, detail);
        if (response.responseJSON && response.responseJSON.message) {
            errorMessage.detail = errorMessage.detail + " : " + '\n' + response.responseJSON.message;
        }
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    return MetricsWidgetViewModel;
});