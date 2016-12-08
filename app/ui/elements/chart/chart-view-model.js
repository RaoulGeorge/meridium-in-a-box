define(function (require, exports, module) {
    'use strict';
    require('highcharts');
    require('highcharts-3d');
    require('highcharts-more');
    require('highcharts-funnel');
    require('highcharts-solid-guage');
    require('highcharts-rounded-corners');
    require('highcharts-heatmap');
    require('noData');


    var _ = require('lodash'),
        $ = require('jquery'),
        ApplicationContext = require('application/application-context'),
        ChartConfigAdapter = require('ui/elements/chart/models/chart-config-adapter'),
        CatalogConstants = require('catalog/services/catalog-constants'),
        CatalogItemDTO = require('catalog/services/dto/catalog-item-dto'),
        ChartOptionsFactory = require('ui/elements/chart/models/chart-options-factory'),
        ProcessCatalogItem = require('ui/elements/chart/process-catalog-item'),
        ProcessQuery = require('ui/elements/chart/process-query'),
        ProcessJSON = require('ui/elements/chart/process-json'),
        ChartUtilities = require('ui/elements/chart/chart-utilities'),
        ChartService = require('ui/elements/chart/services/chart-service'),
        Translator = require('system/globalization/translator'),
        ErrorMessage = require('system/error/error-message'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        PageFilterConnection = require('ui/elements/page-filter/page-filter-connection'),
        ApplicationEvents = require('application/application-events'),
        BusyIndicator = require('system/ui/busy-indicator');

    require('ui/elements/tool-bar/view-model');
    require('ui/elements/resultgrid/resultgrid-view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.internal = {
            chart: null,
            grid: null
        };
        this.state = {
            options: null,
            config: null,
            rawData: null,
            chartData: null,
            gridData: null,
            totalRows: null,
            catalogItem: null,
            processData: null,
            timezoneOffset: null
        };

        Element.defineProperty(this, 'catalogItem', {
            get: getCatalogItem.bind(null, this),
            set: setCatalogItem.bind(null, this)
        });
        this.chartUtilities = new ChartUtilities();
        this.errorOccured = Object.resolve(ApplicationEvents).errorOccured;
        this.translator = Object.resolve(Translator);
        this.constants = Object.resolve(CatalogConstants);
        this.pageFilterConnection = Object.resolve(PageFilterConnection);
        this.chartService = Object.resolve(ChartService);
        this.indicator = Object.resolve(BusyIndicator);

        this.user = ApplicationContext.user;
        Element.defineProperty(this, 'options', {
            get: getOptions.bind(null, this),
            set: setOptions.bind(null, this)
        });

        this._aggregateQueryParams = null;
        Element.defineProperty(this, 'aggregateQueryParams', {
            get: function () { return this._aggregateQueryParams; }.bind(this),
            set: function (value) { this._aggregateQueryParams = value; }.bind(this)
        });

        this._isFiltered = null;
        Element.defineProperty(this, 'isFiltered', {
            get: function () { return this._isFiltered; }.bind(this),
            set: function (value) { this._isFiltered = value; }.bind(this)
        });
        this.evalMobile = false;
    };

    proto.attachedCallback = function () {
        var div, outerDiv;

        div = document.createElement('mi-tool-bar');
        if (this.getAttribute('hide-toolbar') !== null) {
            div.style.display = 'none';
        }
        div.appendChild(createButton(this, 'icon-map', 'toggleLegend', 'CHART_LEGEND'));
        div.appendChild(createButton(this, 'icon-xi-tag', 'toggleLabels', 'CHART_LABELS'));
        div.appendChild(createButton(this, 'icon-graph', 'showChart', 'CHART_CHART', true));
        div.appendChild(createButton(this, 'icon-table-view', 'showGrid', 'CHART_GRID'));
        div.appendChild(createButton(this, 'icon-refresh', 'reloadWithPrompts', 'CHART_REFRESH'));
        this.appendChild(div);

        if (this.getAttribute('hide-toolbar-legend') !== null) {
            div.querySelector('.icon-map').parentNode.style.display = 'none';
        }

        if (this.getAttribute('hide-toolbar-labels') !== null) {
            div.querySelector('.icon-xi-tag').parentNode.style.display = 'none';
        }

        if (this.getAttribute('hide-toolbar-graph') !== null) {
            div.querySelector('.icon-graph').parentNode.style.display = 'none';
        }

        if (this.getAttribute('hide-toolbar-table') !== null) {
            div.querySelector('.icon-table-view').parentNode.style.display = 'none';
        }

        if (this.getAttribute('hide-toolbar-refresh') !== null) {
            div.querySelector('.icon-refresh').parentNode.style.display = 'none';
        }

        div.addEventListener('click', this);

        outerDiv = document.createElement('div');
        outerDiv.className = 'chart-container';

        div = document.createElement('div');
        div.className = 'chart';
        outerDiv.appendChild(div);
        this.internal.grid = document.createElement('mi-resultgrid');
        this.internal.grid.setAttribute('selectionmode', 'single');
        this.internal.grid.setAttribute('showgroupingpanel', 'false');
        this.internal.grid.setAttribute('showrowfilter', 'false');
        this.internal.grid.setAttribute('hascolumnchooser', 'false');
        this.internal.grid.loadJSONData = loadGridData.bind(null, this);
        this.internal.grid.addEventListener('click', this);
        outerDiv.appendChild(this.internal.grid);

        this.appendChild(outerDiv);
        this.indicator.attachTo(outerDiv);

        this.parentElement.addEventListener('resize', this);

        this.pageFilterConnection.open(pageFilterConnection_filterChanged.bind(null, this), this);

        this.chartService.getTimezones().done(loadTimezoneData.bind(null,this));

    };

    proto.detachedCallback = function () {
        if (this.internal.chart) {
            this.internal.chart.destroy();
        }
        this.pageFilterConnection.close();

        this.internal.grid.removeEventListener('click', this);
        if(this.parentElement) {
            this.parentElement.removeEventListener('resize', this);
        }

         if(this.state && this.state.processData && this.state.processData.deferred){
            this.state.processData.deferred.reject(null, 'abort', 'abort');
         }

        this.chartUtilities = null;
        this.constants = null;
        this.translator = null;
        this.errorOccured = null;
        this.user = null;
        this.internal = null;
        this.indicator.detach();
        this.chartService = null;
        this.pageFilterConnection = null;
        this.state = null;
        this.isFiltered = null;

        if (this.querySelector('mi-tool-bar')) {
            this.querySelector('mi-tool-bar').removeEventListener('click', this);
        }
    };

    proto.attributeChangedCallback = function (attr, oldValue, newValue) {
        var toolbar = this.querySelector('mi-tool-bar');
        if (attr === 'hide-toolbar') {
            if (toolbar) {
                if (newValue === null) {
                    toolbar.style.display = 'block';
                } else {
                    toolbar.style.display = 'none';
                }
            }
        } else if (attr === 'hide-title') {
            this.state.options.title.text = getTitle(this);
            this.redraw();
        }else if (attr === 'hide-toolbar-legend') {
            toolbar.querySelector('.icon-map').parentNode.style.display = 'none';
        }else if (attr === 'hide-toolbar-graph') {
            toolbar.querySelector('.icon-graph').parentNode.style.display = 'none';
        }else if (attr === 'hide-toolbar-labels') {
            toolbar.querySelector('.icon-xi-tag').parentNode.style.display = 'none';
        }else if (attr === 'hide-toolbar-table') {
            toolbar.querySelector('.icon-table-view').parentNode.style.display = 'none';
        }else if (attr === 'hide-toolbar-refresh') {
            toolbar.querySelector('.icon-refresh').parentNode.style.display = 'none';
        }
    };

    proto.optionsFromConfig = function (config) {
        this.state.config = ChartConfigAdapter.fromDTO(config);
        this.state.chartData = config.chartData;
        this.state.gridData = config.gridData || config.chartData;
        this.state.options = initChart(this);
        return this.state.options;
    };

    proto.draw = function () {
        this.redraw();
    };

    proto.redraw = function () {
        if (this.state && this.state.options) {
            this.state.options.credits = (this.state.options.credits || {}).enabled = false;
            if (this.internal && this.internal.chart && this.internal.chart.renderTo) {
                this.internal.chart.destroy();
            }
            if(this.state.options.series === null && this.state.config.stock === true){
                this.state.options.series = this.state.chartData;
            }
            if (this.state.options.chart && this.state.options.chart.renderTo) {
                try{
                    if(this.state.timezoneOffset) {
                        window.Highcharts.setOptions({
                            global: {
                                timezoneOffset: this.state.timezoneOffset,
                                useUTC: false
                            },
                            lang:{
                                noData: this.translator.translate("CHART_NO_DATA"),
                                loading: this.translator.translate("CHART_LOADING"),
                                resetZoom: this.translator.translate("CHART_RESET_ZOOM"),
                                resetZoomTitle: this.translator.translate("CHART_RESET_ZOOM_TEXT")
                            }
                        });
                    }
                    if(this.state.config.stock && this.state.config.stock === true){
                        this.internal.chart = new window.Highcharts.StockChart(this.state.options);
                    }else {
                        this.internal.chart = new window.Highcharts.Chart(this.state.options);
                    }
                }
                catch (e) {
                    logger.error(e);
                    if(this.internal){this.internal.chart = null;}
                    if(this.translator){throw this.translator.translate('CHART_RENDER_ERROR');}
                }
                disableAnimation(this);
                if (this.classList.contains('show-grid') && this.internal) {
                    this.internal.grid.reload();
                }
            }
        }
    };

    proto.saveState = function () {
        this.state.showGrid = this.classList.contains('show-grid');
        return this.state;
    };

    proto.loadState = function (state) {
        var legend, labels, categories;
        this.state = state;

        if (this.state.options) {
            legend = this.state.options.legend.enabled;
            labels = this.state.options.plotOptions.series.dataLabels.enabled;
            categories = this.state.options.xAxis.categories;
        }

        this.state.options = initChart(this, categories);
        this.state.options.legend.enabled = legend;
        this.state.options.plotOptions.series.dataLabels.enabled = labels;
        setLegendButton(this);
        setLabelButton(this);
        if (this.state.showGrid) {
            this.showGrid();
            this.state.showGrid = null;
        }
        disableAnimation(this);
        this.draw();
    };

    proto.load = function (config) {
        var delegateLoadToFilter = false;
        this.indicator.show();
        if (config) {
            this.state.config = ChartConfigAdapter.fromDTO(config);
            if (config.data) {
                this.state.rawData = config.data;
            }
            if(config.queryParams && (this.isFiltered === undefined || this.isFiltered === null)){
                this.aggregateQueryParams = config.queryParams;
            }

            if(config.queryStrParams){
                this.aggregateQueryParams = {
                    queryString: true,
                    queryStrParams: config.queryStrParams
                };
            }
            if (!this.state.catalogItem) {
                this.state.catalogItem = {};
                this.state.catalogItem.itemType = this.constants.ITEM_TYPE_GRAPH;
            }
            this.state.catalogItem.key = config.catalogKey;
            this.state.catalogItem.path = config.catalogPath;

            delegateLoadToFilter = config.delegateLoadToFilter || false;
            if(config.evalMobile){
                this.evalMobile = true;
            }
        }
        setProcessData(this, config ? config.data : null);
        if (waitForFilter(this, delegateLoadToFilter)) {
            // do not load query, wait for filter
        } else if(_.isObject(this.state)){
            if(this.evalMobile){this.state.config.evalMobile = true;}
            this.state.processData.load(this.state.config)
                .done(processQueryDataDone.bind(null, this))
                .fail(error.bind(null, this));
        }
    };

    function waitForFilter(self, delegateLoadToFilter) {
        if (!delegateLoadToFilter) { return false; }
        return self.pageFilterConnection.remote.isConnected();
    }

    proto.reload = function () {
        callReload(this);
    };

    proto.reloadWithPrompts = function () {
        callReload(this, true);
    };

    function callReload(self, prompts){
        var enablePrompts = prompts || false;
        self.indicator.show();
        if (self.state && self.state.processData) {
            self.state.processData.load(self.state.config, true, enablePrompts)
                .done(processQueryDataDone.bind(null, self))
                .fail(error.bind(null, self));
        } else {
            setTimeout(processQueryDataDone.bind(null, self), 0);
        }
    }

    proto.reConfigure = function () {
        var result = { rawData: this.state.rawData };
        if (!this.state.processData) {
            setProcessData(this, this.state.rawData);
        }
        this.state.processData.processData(result, this.state.config);
        setState(this, result);
        this.redraw();
    };

    proto.handleEvent = function (e) {
        checkClickEvent(this, e);
        checkResizeEvent(this, e);
    };

    function checkResizeEvent (self, e) {
        if (e.type !== 'resize') {
            return;
        }
        self.redraw();
    }

    function checkClickEvent (self, e) {
        if (e.type !== 'click' || isDisabled(e.target)) {
            return;
        }
        executeIfHasAction(self, e);
        setTargetIfAnchorTag(e.target);
    }

    function executeIfHasAction (self, e) {
        var action = getAction(e.target);
        if (action) {
            Object.tryMethod(self, action);
        }
    }

    function isDisabled (target) {
        return target.disabled || target.parentElement.disabled;
    }

    function setTargetIfAnchorTag(target) {
        if (target.nodeName !== 'A') {
            return;
        }
        if (target.href || target.hash) {
            target.setAttribute('target', 'tab');
        }
    }

    function getAction (target) {
        var action = target.getAttribute('data-action');

        if (action) {
            return action;
        }
        return target.parentElement.getAttribute('data-action');
    }

    proto.toggleLegend = function () {
        var enabled;
        if (this.state.options) {
            enabled = !this.state.options.legend.enabled;
            this.state.options.legend.enabled = enabled;
            toggleSeriesLegend(this.internal.chart, enabled);
            toggleChartLegend(this.internal.chart, enabled);
            this.internal.chart.render();
            setLegendButton(this);
        }
    };

    function toggleChartLegend (chart, enabled) {
        chart.options.legend.enabled = enabled;
        if (!enabled) {
            chart.legend.destroy();
        }
    }

    function toggleSeriesLegend (chart, enabled) {
        var idx, series;
        for (idx = 0; idx < chart.series.length; idx++) {
            series = chart.series[idx];
            series.options.showInLegend = enabled;
            if (!enabled) {
                series.legendIem = null;
                chart.legend.destroyItem(series);
            }
        }
    }

    proto.toggleLabels = function () {
        var enabled;
        if (this.state.options) {
            enabled = !this.state.options.plotOptions.series.dataLabels.enabled;
            this.state.options.plotOptions.series.dataLabels.enabled = enabled;
            toggleSeriesLabels(this.internal.chart.series, enabled);
            this.internal.chart.redraw(false);
            setLabelButton(this);
        }
    };

    function toggleSeriesLabels (series, enabled) {
        var idx, opt;

        for (idx = 0; idx < series.length; idx++) {
            opt = series[idx].options;
            opt.dataLabels.enabled = enabled;
            series[idx].update(opt, false);
        }
    }

    proto.showChart = function () {
        this.classList.remove('show-grid');
        this.querySelector('button[data-action="toggleLegend"]').disabled = false;
        this.querySelector('button[data-action="toggleLabels"]').disabled = false;
        this.querySelector('button[data-action="showChart"]').classList.add('active');
        this.querySelector('button[data-action="showGrid"]').classList.remove('active');
        this.redraw();
    };

    proto.showGrid = function () {
        this.classList.add('show-grid');
        this.querySelector('button[data-action="toggleLegend"]').disabled = true;
        this.querySelector('button[data-action="toggleLabels"]').disabled = true;
        this.querySelector('button[data-action="showChart"]').classList.remove('active');
        this.querySelector('button[data-action="showGrid"]').classList.add('active');
        this.internal.grid.reload();
    };

    function loadTimezoneData(self, data){
        var idx, match, result;
        for(idx = 0; idx < data.length; idx++) {
            if(self.user && data[idx].id === self.user.timezoneId){
                var regex = /\(([^)]+)\)/;
                var matchArray = regex.exec(data[idx].name);
                if (matchArray !== null) {
                    match = matchArray[1].replace(/[UTC]/g,"");
                }

                if(match.indexOf(":") > -1){
                    match = match.split(":");
                }else{
                    result = 0;
                }

                if(match[0] && match[0].indexOf("-") > -1){
                    match[0] = Number(match[0].replace("-",""));
                    if(match[1].indexOf("30") > -1){
                        match[1] = 5;
                    }else if(match[1].indexOf("45") > -1){
                        match[1] = 75;
                    }else{
                        match[1] = 0;
                    }
                    result = ( Number( match[0] + "." + match[1] ) * 60 );

                }else if(match[0] && match[0].indexOf("+") > -1){
                    match[0] = Number(match[0].replace("+",""));
                    if(match[1].indexOf("30") > -1){
                        match[1] = 5;
                    }else if(match[1].indexOf("45") > -1){
                        match[1] = 75;
                    }else{
                        match[1] = 0;
                    }
                    result = - ( Number( match[0] + "." + match[1] ) * 60 );
                }

                if (isUtcZero(self)) {
                    result = 4;
                }

                self.state.timezoneOffset = result;
            }
        }
    }

    function isUtcZero(self) {
        var timezoneId = ApplicationContext.user.timezoneId;
        return timezoneId === 'UTC' ||
            includes(self, timezoneId, 'Morocco') ||
            includes(self, timezoneId, 'Dublin') ||
            includes(self, timezoneId, 'Edinburgh') ||
            includes(self, timezoneId, 'Lisbon') ||
            includes(self, timezoneId, 'London') ||
            includes(self, timezoneId, 'Casablanca') ||
            includes(self, timezoneId, 'Coordinated Universal Time') ||
            includes(self, timezoneId, 'Monrovia') ||
            includes(self, timezoneId, 'Reykjavik') ||
            includes(self, timezoneId, 'GMT Standard Time') ||
            includes(self, timezoneId, 'Greenwich Standard Time');
    }

    function includes(self, string, otherString) {
        return String.prototype.indexOf.call(string, otherString) !== -1;
    }

    function pageFilterConnection_filterChanged(self, parameters) {
        if (self.pageFilterConnection.remote.isConnected() && !self.skipFilterLoad) {
            if (parameters && parameters.parmDesigns && parameters.parmDesigns.length) {
                self.aggregateQueryParams = parameters;
            } else {
                self.aggregateQueryParams = undefined;
            }
            _.delay(self.load.bind(self), 500);
        }
    }

    function raiseLoadedEvent (self) {
        self.dispatchEvent(new CustomEvent('loaded', { bubble: true }));
    }

    function setState (self, data) {
        if(!self.state) { return; }
        self.state.rawData = data.rawData;
        self.state.gridData = data.gridData;
        self.state.chartData = data.chartData;
        self.state.totalRows = data.totalRows;
        if (data.catalogItem) {
            self.state.catalogItem = data.catalogItem;
        }
        if (data.config) {
            self.state.config = data.config;
        }
        self.state.options = initChart(self, data.categoryArray);
        setLabelButton(self);
        setLegendButton(self);
    }

    function processQueryDataDone (self, data) {
        if (data) {
            setState(self, data);
        }
        raiseLoadedEvent(self);
        self.draw();
        self.indicator.hide();
    }

    function getTitle (self) {
        var title = null;
        if (self.getAttribute('hide-title') === null) {
            if (self.state.catalogItem) {
                title = self.state.catalogItem.caption || self.state.catalogItem.id;
            }
            title = title || self.state.config.title;
        }
        return title;
    }

    function initChart (self, categoryArray) {
        var config = self.state.config,
            renderTo = self.querySelector('.chart'),
            title = getTitle(self),
            chart = ChartOptionsFactory.create(renderTo, config, title);
        if(chart) {
            return chart.getOptions(self.state.chartData, categoryArray);
        }
    }

    function error(self, xhr, text, message) {
        if (xhr && xhr.status === 404) {
            var chartContainerElement = self.querySelector('.chart-container');

            if (chartContainerElement) {
                chartContainerElement.innerHTML = self.translator.translate('CHART_NOT_FOUND');
                chartContainerElement.className = chartContainerElement.className + " not-found-message";
            }
        } else {
            if(text === "abort" || message ==="abort"){
                return;
            }else {
                var errorMessage = new ErrorMessage('AG1', message, new Error().stack);
                self.errorOccured.raise(self, errorMessage);
            }
        }
    }

    function createButton (self, className, action, title, active) {
        var button, icon;
        button = document.createElement('button');
        button.className = 'btn btn-default btn-icon';
        button.setAttribute('data-action', action);
        button.setAttribute('title', self.translator.translate(title));
        if (active) {
            button.classList.add('active');
        }
        icon = document.createElement('i');
        icon.className = className;
        button.appendChild(icon);
        return button;
    }

    function loadGridData (self) {
        var dfd = $.Deferred();
        if (self.state && self.state.gridData) {
            dfd.resolve(ChartUtilities.formatGridData(self.state.gridData));
        }
        return dfd;
    }

    function getOptions (self) {
        return self.state.options;
    }

    function setOptions (self, v) {
        if(_.isObject(self.state)){self.state.options = v;}
        if (v && self.state && self.state.options && self.state.options.chart) {
            self.state.options.chart.renderTo = self.querySelector('.chart');
            raiseLoadedEvent (self);
        }
        self.redraw();
    }

    function setProcessData (self, data) {
        if (self.state && self.state.catalogItem && self.state.catalogItem.graph && self.state.catalogItem.graph.queryKey) {
            self.state.processData = new ProcessCatalogItem(self.state.catalogItem, self.aggregateQueryParams, self.isFiltered);
        }else if (self.state && self.state.catalogItem && self.state.catalogItem.graph && self.state.catalogItem.graph.datasetKey) {
            self.state.processData = new ProcessCatalogItem(self.state.catalogItem, self.aggregateQueryParams, self.isFiltered);
        } else if (self.state && self.state.catalogItem && (self.state.catalogItem.key || self.state.catalogItem.path)) {
            self.state.processData = new ProcessCatalogItem(self.state.catalogItem, self.aggregateQueryParams, self.isFiltered);
        } else if (self.state && self.state.config && self.state.config.queryKey) {
            self.state.processData = new ProcessQuery(self.state.config, self.aggregateQueryParams, self.isFiltered);
        } else if(_.isObject(self.state)){
            self.state.processData = new ProcessJSON(data);
        }
    }

    function setLegendButton (self) {
        var target;

        target = self.querySelector('button[data-action="toggleLegend"]');
        if (target) {
            if (self.state.options && self.state.options.legend.enabled) {
                target.classList.add('active');
            } else {
                target.classList.remove('active');
            }
            target.blur();
        }
    }

    function setLabelButton (self) {
        var target;

        target = self.querySelector('button[data-action="toggleLabels"]');
        if (target) {
            if (self.state.options &&
                self.state.options.plotOptions.series &&
                self.state.options.plotOptions.series.dataLabels &&
                self.state.options.plotOptions.series.dataLabels.enabled) {
                target.classList.add('active');
            } else {
                target.classList.remove('active');
            }
            target.blur();
        }
    }

    function getCatalogItem (self) {
        if (!self.state.catalogItem) {
            self.state.catalogItem = new CatalogItemDTO();
            self.state.catalogItem.itemType = self.constants.ITEM_TYPE_GRAPH;
        }
        if (!self.state.catalogItem.graph) {
            self.state.catalogItem.graph = {};
        }
        if (!self.state.catalogItem.stock) {
            self.state.catalogItem.stock = false;
        }
        self.state.catalogItem.graph.config = ChartConfigAdapter.serialize(self.state.config);
        return self.state.catalogItem;
    }

    function setCatalogItem (self, v) {
        self.state.catalogItem = v;
        if (v && v.graph && v.graph.config) {
            self.state.config = ChartConfigAdapter.deserialize(v.graph.config);
        } else {
            self.state.config = ChartConfigAdapter.fromDTO({});
        }
    }

    function disableAnimation (self) {
        self.state.options.chart.animation = false;
        // To prevent a no series data error
        if (self.state.options.plotOptions !== undefined && self.state.options.plotOptions.series) {
            self.state.options.plotOptions.series.animation = false;
        } else {
            self.state.options.plotOptions = { series: { animation: false } };
        }
    }

    document.registerElement('mi-chart', { prototype: proto });

    return proto;

});
