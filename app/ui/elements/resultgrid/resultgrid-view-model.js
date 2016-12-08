/*jshint maxstatements: false */
/*jshint maxcomplexity: false */
define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');
    var jQuery = require('jquery');

    var view = require('text!./resultgrid-template.html'),
        ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        MessageBox = require('system/ui/message-box'),
        ResultGridService = require('./resultgrid-service'),
        PageFilterConnection = require('ui/elements/page-filter/page-filter-connection'),
        QueryContainerDTO = require('query/services/dto/query-container-dto'),
        ParameterContainerDTO = require('query/services/dto/parameter-container-dto'),
        CatalogService = require('catalog/services/catalog-service'),
        QueryExecutionEngine = require('query/execution/query-execution-engine'),
        converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator'),
        Converter = require('system/lang/converter'),
        ApplicationContext = require('application/application-context');

    require('ui/elements/checkbox/checkbox-view-model');
    require('ui/elements/tool-bar/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.element = this;
        this.translator = Object.resolve(Translator);
        this.service = Object.resolve(ResultGridService);
        this.catalogService = Object.resolve(CatalogService);
        this.queryContainerDTO = Object.resolve(QueryContainerDTO);
        this.pageFilterConnection = Object.resolve(PageFilterConnection);
        this.fields = ko.observableArray();
        this.cachedQueryContainer = null;// Object.resolve(QueryContainerDTO);

        var self = this;
        self.filtersArr = [];
        self.filterElIndex = null;
        self.queryContainer = null;
        self.columnsSpecified = false;
        self.totalCountDfd = new $.Deferred();
        self._totalCount = ko.observable(0);
        self._totalCount.subscribe(function (value) {
            self.totalCountDfd.resolve(value);
        });
        self.currentFilter = '';
        self.queryHasBackgroundColor = ko.observable(false);
        self.noDataCaptioin = self.translator.translate('RG_NO_DATA_CAPTION');
        addAttributes(this);
        addProperties(this);
        self.getTotalCount = true;
        self.customTotalCount = ko.observable();
        self.pageNumber = 0;
        self.listObjects = ko.observableArray([
                { displayName: "0", val: 0 }
        ]);
        self.optionsValue = 'val';
        self.selectedValue = ko.observable(0);
        self.formColumnArr = [];

        if (this.loadJSONData) {
            this.reload();
        }
    };

    proto.attachedCallback = function () {
        var rgHeader, leftToolbar, rightToolbar, div;
        this.element.innerHTML = view;
        this.pageFilterConnection.open(filter.bind(null, this), this.element);
        //refreshList(this);
        ko.applyBindings(this, $(this.element).find('mi-select')[0]);
        ko.applyBindings(this, $(this.element).find('.totalCount')[0]);
        rgHeader = this.querySelector('.rg-header');

        div = document.createElement('div');
        leftToolbar = document.createElement('mi-tool-bar');
        leftToolbar.className = 'rg-left-tool-bar pull-left';
        div.appendChild(leftToolbar);

        rightToolbar = document.createElement('mi-tool-bar');
        rightToolbar.className = 'rg-right-tool-bar pull-right';
        leftToolbar.insertBefore(createIconButton(this, 'showFilter', this.translator.translate("RG_SEARCH_CAPTION"), 'icon-search', 'rg-filter'), leftToolbar.firstChild);
        div.appendChild(rightToolbar);
        rgHeader.insertBefore(div, rgHeader.firstChild);

        leftToolbar.addEventListener('click', this);
        rightToolbar.addEventListener('click', this);

        $(leftToolbar).hide();
        $(rightToolbar).hide();
    };

    proto.detachedCallback = function () {
        this.pageFilterConnection.close();
        this.cachedQueryContainer = null;
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var self = this;

        //TODO: change to Switch
        if (attrName === 'data') {
            self.data(newVal);
            //if (newVal === 'static') {
            refreshList(this);
            //}
        }
        else if (attrName === 'allowcolumnresizing') {
            self.allowColumnResizing(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'allowcolumnreordering') {
            self.allowColumnReordering(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'hascolumnchooser') {
            self.hasColumnChooser(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'selectionmode') {
            self.selectionMode(newVal);
        }
        else if (attrName === 'showgroupingpanel') {
            self.showGroupingPanel(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'allowrowediting') {
            self.allowRowEditing(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'allowrowadding') {
        self.allowRowAdding(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'allowrowdeleting') {
        self.allowRowDeleting(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'editmode') {
            self.editMode(converter.toString(newVal));
        }
        else if (attrName === 'sortingmode') {
            self.sortingMode(newVal);
        }
        else if (attrName === 'showrowfilter') {
            self.showRowFilter(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'hideeditcontrols') {
            self.hideEditControls(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'pagesize') {
            self.pageSize(converter.toInteger(newVal, 'true'));
        }
        else if (attrName === 'scrolltype') {
            self.scrollType(newVal);
        }
        else if (attrName === 'queryexecutionmode') {
            self.queryExecutionMode(newVal);
        }
        else if (attrName === 'suppressprompts') {
            self.suppressPrompts(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'columnautowidth') {
            self.columnAutoWidth(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'wordwrapenabled') {
            self.wordWrapEnabled = converter.toBoolean(newVal, 'true');
        }
        else if (attrName === 'showfooter') {
            self.showFooter = converter.toBoolean(newVal, 'true');
        }
        else if(attrName === 'showpaging') {
            self.showpaging = converter.toBoolean(newVal, 'true');
        }
    };

    proto.refresh = function (value) {
        this.data(value);
        refreshList(this);
    };

    proto.handleEvent = function (e) {
        var self = this, action;
        if (e.type === 'click') {
            if (e.target.nodeName === 'BUTTON' && !e.target.disabled) {
                action = e.target.getAttribute('data-action');
                Object.tryMethod(self, 'toolbarItemClickCallback', action, e);
            }
            else if (e.target.nodeName === 'I' && e.target.parentNode.nodeName === 'BUTTON' && !e.target.parentNode.disabled) {
                action = e.target.parentNode.getAttribute('data-action');
                Object.tryMethod(self, 'toolbarItemClickCallback', action, e);
            }
        }
    };

    proto.disableButton = function enableButton(btnClass, boolValue) {
        var i;
        if (this.buttons) {
            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].className.split(' ').indexOf(btnClass) >= 0) {
                    this.buttons[i].disabled = boolValue;
                }
            }
        }
    };

    proto.setNoAccess = function setNoAccess(btnClass, boolValue) {
        var i;
        if (this.buttons) {
            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].className.split(' ').indexOf(btnClass) >= 0) {
                    if (boolValue) {
                        this.buttons[i].className += ' no-access';
                    }
                    else {
                        this.buttons[i].className = this.buttons[i].className.replace(/ no-access/g, '');
                    }
                }
            }
        }
    };

    proto.showButton = function showButton(btnClass, boolValue) {
        var i;
        if (this.buttons) {
            for (i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].className.split(' ').indexOf(btnClass) >= 0) {
                    if (boolValue) {
                        this.buttons[i].style.visibility = 'visible';
                    }
                    else {
                        this.buttons[i].style.visibility = 'hidden';
                    }
                }
            }
        }
    };

    function addAttributes(self) {
        self.data = ko.observable();
        if (self.getAttribute('data') !== null) {
            self.data(self.getAttribute('data'));
        }

        self.allowColumnResizing = ko.observable(true);
        if (self.getAttribute('allowcolumnresizing') !== null) {
            self.allowColumnResizing(converter.toBoolean(self.getAttribute('allowcolumnresizing'), 'true'));
        }

        self.allowColumnReordering = ko.observable(true);
        if (self.getAttribute('allowcolumnreordering') !== null) {
            self.allowColumnReordering(converter.toBoolean(self.getAttribute('allowcolumnreordering'), 'true'));
        }

        self.hasColumnChooser = ko.observable(true);
        if (self.getAttribute('hascolumnchooser') !== null) {
            self.hasColumnChooser(converter.toBoolean(self.getAttribute('hascolumnchooser'), 'true'));
        }

        self.selectionMode = ko.observable('multiple');
        if (self.getAttribute('selectionmode') !== null) {
            self.selectionMode(self.getAttribute('selectionmode'));
        }

        self.showRowFilter = ko.observable(false);
        if (self.getAttribute('showrowfilter') !== null) {
            self.showRowFilter(converter.toBoolean(self.getAttribute('showrowfilter'), 'true'));
        }

        self.hideEditControls = ko.observable(false);
        if (self.getAttribute('hideeditcontrols') !== null) {
            self.hideEditControls(converter.toBoolean(self.getAttribute('hideeditcontrols'), 'true'));
        }

        self.showGroupingPanel = ko.observable(true);
        if (self.getAttribute('showgroupingpanel') !== null) {
            self.showGroupingPanel(converter.toBoolean(self.getAttribute('showgroupingpanel'), 'true'));
        }

        self.allowRowEditing = ko.observable(false);
        if (self.getAttribute('allowrowediting') !== null) {
            self.allowRowEditing(converter.toBoolean(self.getAttribute('allowrowediting'), 'true'));
        }

         self.allowRowAdding = ko.observable(false);
        if (self.getAttribute('allowrowadding') !== null) {
            self.allowRowAdding(converter.toBoolean(self.getAttribute('allowrowadding'), 'true'));
        }

        self.allowRowDeleting = ko.observable(false);
        if (self.getAttribute('allowrowdeleting') !== null) {
            self.allowRowDeleting(converter.toBoolean(self.getAttribute('allowrowdeleting'), 'true'));
        }

        self.editMode = ko.observable('batch');
        if (self.getAttribute('editmode') !== null) {
            self.editMode(converter.toString(self.getAttribute('editmode')));
        }

        self.sortingMode = ko.observable('multiple');
        if (self.getAttribute('sortingmode') !== null) {
            self.sortingMode(self.getAttribute('sortingmode'));
        }
        self.pageSize = ko.observable(100);
        if (self.getAttribute('pagesize') !== null) {
            self.pageSize(self.getAttribute('pagesize'));
        }
        self.scrollType = ko.observable('standard');
        if (self.getAttribute('scrolltype') !== null) {
            self.scrollType(self.getAttribute('scrolltype'));
        }
        self.queryExecutionMode = ko.observable('sqlStatement');
        if (self.getAttribute('queryexecutionmode') !== null) {
            self.queryExecutionMode(self.getAttribute('queryexecutionmode'));
        }
        self.suppressPrompts = ko.observable(false);
        if (self.getAttribute('suppressprompts') !== null) {
            self.suppressPrompts(converter.toBoolean(self.getAttribute('suppressprompts'), 'true'));
        }
        self.columnAutoWidth = ko.observable(true);
        if (self.getAttribute('columnautowidth') !== null) {
            self.columnAutoWidth(converter.toBoolean(self.getAttribute('columnautowidth'), 'true'));
        }
        self.wordWrapEnabled = false;
        if (self.getAttribute('wordwrapenabled') !== null) {
            self.wordWrapEnabled = converter.toBoolean(self.getAttribute('wordwrapenabled'), 'true');
        }
        self.showFooter = true;
        if (self.getAttribute('showfooter') !== null) {
            self.showFooter = converter.toBoolean(self.getAttribute('showfooter'), 'true');
        }
        self.showPaging = true;
        if(self.getAttribute('showpaging') !== null) {
            self.showPaging  = converter.toBoolean(self.getAttribute('showpaging'), 'true');
    }
    }

    function filter(self, parameters) {
        if (parameters && parameters.parmDesigns && parameters.parmDesigns.length) {
            self.aggregateQueryParams = new ParameterContainerDTO(jQuery.parseJSON(JSON.stringify(parameters)));
            if (self.queryParams && self.queryParams.parmDesigns) {
                for (var i = 0; i < self.queryParams.parmDesigns.length; i++) {
                    for (var j = 0; j < parameters.parmDesigns.length; j++) {
                        if (self.queryParams.parmDesigns[i].id === parameters.parmDesigns[j].id) {
                            self.queryParams.parmDesigns.splice(i);
                            break;
                        }
                    }
                }
                for (var k = 0; k < self.queryParams.parmDesigns.length; k++) {
                    self.aggregateQueryParams.parmDesigns.push(self.queryParams.parmDesigns[k]);
                }
            }
        }
        if (self.data()) {
            self.refresh(self.data());
        }
    }

    function getLoader(self) {
        return self._loadJSONData;
    }

    function setLoader(self, value) {
        self._loadJSONData = value;
        self.reload();
    }

    function addProperties(self) {
        self._loadJSONData = null;
        Element.defineProperty(self, 'loadJSONData', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });

        self._queryParams = null;
        Element.defineProperty(self, 'queryParams', {
            get: function () { return self._queryParams; }.bind(self),
            set: function (value) { self._queryParams = value; }.bind(self)
        });

        self._aggregateQueryParams = null;
        Element.defineProperty(self, 'aggregateQueryParams', {
            get: function () { return self._aggregateQueryParams; }.bind(self),
            set: function (value) { self._aggregateQueryParams = value; }.bind(self)
        });

        self._queryContainerObject = null;
        Element.defineProperty(self, 'queryContainerObject', {
            get: function () { return self._queryContainerObject; }.bind(self),
            set: function (value) { self._queryContainerObject = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'onRowSelectCB', {
            get: function () { return self.callback; }.bind(self),
            set: function (value) { self.callback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'onPageChangeCB', {
            get: function () { return self.pageChangeCallback; }.bind(self),
            set: function (value) { self.pageChangeCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'onRowMultiSelectCB', {
            get: function () { return self.multiSelectCallback; }.bind(self),
            set: function (value) { self.multiSelectCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'onCellHyperlinkClickCB', {
            get: function () { return self.cellHyperlinkCallback; }.bind(self),
            set: function (value) { self.cellHyperlinkCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'onRowPreparedCB', {
            get: function () { return self.rowPreparedCallback; }.bind(self),
            set: function (value) { self.rowPreparedCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'cellTemplateCB', {
            get: function () { return self.celltTemplateCallback; }.bind(self),
            set: function (value) { self.cellTemplateCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'cellPreparedCB', {
            get: function () { return self.cellPreparedCallback; }.bind(self),
            set: function (value) { self.cellPreparedCallback = value; }.bind(self)
        });

        

        Element.defineProperty(self.element, 'onInitNewRowCB', {
            get: function () { return self.onInitNewRowCallback; }.bind(self),
            set: function (value) { self.onInitNewRowCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'headerCellTemplateCB', {
            get: function () { return self.headerCellTemplateCallback; }.bind(self),
            set: function (value) { self.headerCellTemplateCallback = value; }.bind(self)
        });

        Element.defineProperty(self.element, 'gridLoadedCB', {
            get: function () { return self.gridLoadedCallback; }.bind(self),
            set: function (value) { self.gridLoadedCallback = value; }.bind(self)
        });
        Element.defineProperty(self.element, 'totalCountCB', {
            get: function () { return self.totalCountCallback; }.bind(self),
            set: function (value) { self.totalCountCallback = value; }.bind(self)
        });
        Element.defineProperty(self.element, 'queryExecutedCB', {
            get: function () { return self.queryExecutedCallback; }.bind(self),
            set: function (value) { self.queryExecutedCallback = value; }.bind(self)
        });
        Element.defineProperty(self.element, 'totalCount', {
            get: function () { return self._totalCount(); }.bind(self),
            set: function (value) { self._totalCount(value); }.bind(self)
        });
        self._loadConfigurableButtons = null;
        Element.defineProperty(self, 'loadConfigurableButtons', {
            get: getButtons.bind(null, self),
            set: setButtons.bind(null, self)
        });
        self._toolbarItemClickCallback = null;
        Element.defineProperty(self, 'toolbarItemClickCallback', {
            get: function (self) { return self._toolbarItemClickCallback; }.bind(null, self),
            set: function (self, value) { self._toolbarItemClickCallback = value; }.bind(null, self)
        });
        self._openHyperLinkInNewTab = true;
        Element.defineProperty(self, 'openHyperLinkInNewTab', {
            get: function () { return self._openHyperLinkInNewTab; }.bind(self),
            set: function (value) { self._openHyperLinkInNewTab = value; }.bind(self)
        });
    }

    proto.reload = function () {
        $(this.element).find('.rg-filter').data('isFilterEnabled', false);
        if (this.data() === 'static' && this.gridInstance) {
            this.refresh('static');
        } else {
            this.load().done();
        }
    };
    proto.repaint = function () {
        var self = this;
        var dataGridInstance = $(self.element).find('.gridContainer').dxDataGrid('instance');
        dataGridInstance.repaint();
    };

    proto.load = function () {
        this.getTotalCount = true;
        var dfd;
        if (this.loadJSONData) {
            dfd = this.loadJSONData();
            dfd.done(loaderDone.bind(null, this));
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    function loaderDone(self, data) {
        if (data.columns === undefined || data.columns.length === 0) {
            handleJSONData(self, data);
        }
        else {
            handleJSONDataWithColumns(self, data);
        }
    }

    function refreshList(self,options) {
        handleQueryResult.bind(null, self)();
    }

    function addAggregateParam(self) {
        //Getting Aggreagate Query Param Id Separate
        var aggreParamIds = [];
        var aggregateLength = self.aggregateQueryParams.parmDesigns.length;
        for (var i = 0; i < aggregateLength; i++) {
            aggreParamIds.push(self.aggregateQueryParams.parmDesigns[i].id);
        }

        //If aggregate query param Id matching with queryParams id we are replacing the paramDesign else we will add
        //new value to the aggregate param
        var queryParamLength = self.queryParams.parmDesigns.length;
        for (var j = 0; j < queryParamLength; j++) {
            if (aggreParamIds.indexOf(self.queryParams.parmDesigns[j].id) > -1) {
                for (var k = 0; k < aggregateLength; k++) {
                    if (self.aggregateQueryParams.parmDesigns[k].id === self.queryParams.parmDesigns[j].id) {
                        self.aggregateQueryParams.parmDesigns[k] = self.queryParams.parmDesigns[j];
                    }
                }
            } else {
                self.aggregateQueryParams.parmDesigns.push(self.queryParams.parmDesigns[j]);
            }
        }
    }

    function handleQueryExecution(self, constraints, forTotalCount, canApplyFilter) {
        var dfd = $.Deferred();
        if (typeof self.data === 'function' && (self.data() === null || self.data() === undefined)) {
            return;
        }

        var options = {};
        if (self.aggregateQueryParams) {
            if (self.queryParams) {
                addAggregateParam(self);
            }
            options.parameters = self.aggregateQueryParams;
            options.suppressPrompts = true;
        }
        else if (self.queryParams) {
            options.parameters = self.queryParams;
            options.suppressPrompts = true;
        }
        else {
            options.suppressPrompts = self.suppressPrompts();
        }
        //options.suppressPrompts = true;
        options.evalOnly = false;

        if (!forTotalCount) {
            options.pageSize = self.pageSize();
            options.startPage = self.pageNumber !== 0 ? self.pageNumber : '0';
            if (self.cachedQueryContainer) {
                options.queryContainer = new QueryContainerDTO(jQuery.parseJSON(JSON.stringify(self.cachedQueryContainer)));

                if (canApplyFilter) {
                    if (constraints.sort) {
                        options.queryContainer = updateQueryContainer(self, options.queryContainer, constraints.sort);
                    }
                    if (self.prevFilter !== undefined && self.prevFilter !== constraints.filter) {
                        options.startPage = '0';
                        self.pageNumber = 0;
                        self.getTotalCount = true;
                    }
                    if (constraints.filter !== "" && self.prevFilter === undefined) {
                        self.getTotalCount = true;
                    }

                    self.prevFilter = constraints.filter;
                    options.queryContainer = updateQueryContainerWithFilter(self, options.queryContainer, constraints.filter);
                }
                self.queyExecutionEngine = new QueryExecutionEngine(options);
                self.queyExecutionEngine.execute(options).done(function (data) {
                    self.cachedQueryContainer = data.queryContainer;
                    self._totalCount(data.rowset.rows.length);
                    data.rowset.rows.splice(self.pageSize(), self.pageSize());
                    dfd.resolve(data);
                });
                return dfd;
            }

            if (self.queryExecutionMode() === 'catalogItemPath') {
                self.catalogService.getCatalogItemKey(self.data()).done(function (catalogKey) {
                    options.catalogItemKey = catalogKey;
                    self.queyExecutionEngine = new QueryExecutionEngine(options);
                    self.queyExecutionEngine.execute(options).done(function (data) {
                        self.cachedQueryContainer = data.queryContainer;
                        self._totalCount(data.rowset.rows.length);
                        data.rowset.rows.splice(self.pageSize(), self.pageSize());
                        dfd.resolve(data);
                    }).fail(function () {
                        $(self.element).find('.dx-loadindicator').hide();
                    });
                });
            } else {
                switch (self.queryExecutionMode()) {
                    case 'catalogItemKey': options.catalogItemKey = self.data(); break;
                    case 'queryContainer': options.queryContainer = self.queryContainerObject; options.suppressPrompts = self.suppressPrompts(); break;
                    case 'sqlStatement': options.sqlStatement = self.data(); break;
                    case 'catalogItem': options.catalogItem = self.data(); break;
                }
                self.queyExecutionEngine = new QueryExecutionEngine(options);
                self.queyExecutionEngine.execute(options).done(function (data) {
                    self.cachedQueryContainer = data.queryContainer;
                    self._totalCount(data.rowset.rows.length);
                    data.rowset.rows.splice(self.pageSize(), self.pageSize());
                    dfd.resolve(data);
                }).fail(function () {
                    $(self.element).find('.dx-loadindicator').hide();
                });
            }

            return dfd;
        }
    }

    function updateQueryContainer(self,cachedQueryContainer, sortOptions) {
        var options = JSON.parse(sortOptions);
        var queryContainer = cachedQueryContainer;

        for (var k = 0; k < queryContainer.columnDesigns.length; k++) {
            queryContainer.columnDesigns[k].sortOrder = "None";
            queryContainer.columnDesigns[k].sortIndex = 0;
        }


        for (var i = 0; i < options.length; i++) {
            for (var j = 0; queryContainer.columnDesigns && j < queryContainer.columnDesigns.length; j++) {
                var colUniqueID = queryContainer.columnDesigns[j].alias;
                if (colUniqueID === "") { colUniqueID = queryContainer.columnDesigns[j].id.substring(1, queryContainer.columnDesigns[j].id.length - 1); }
                if (options[i].selector === colUniqueID) {
                    if (options[i].desc) {
                        queryContainer.columnDesigns[j].sortOrder = "Descending";
                    } else {
                        queryContainer.columnDesigns[j].sortOrder = 'Ascending';
                    }
                    queryContainer.columnDesigns[j].sortIndex = i + 1;
                    break;
                }
            }
        }
        return queryContainer;
    }

    function updateQueryContainerWithFilter(self, cachedQueryContainer, filterOptions) {
        var allColFilterOptions = filterOptions.split(',and,');
        var queryContainer = cachedQueryContainer;
        var options, idx;

        clearAllFilters(self, queryContainer, allColFilterOptions);

        var prevSelc = '';
        for (var k = 0;allColFilterOptions[0] !== "" && k < allColFilterOptions.length; k++) {
            idx = 0;
            options = {
                selector: allColFilterOptions[k].split(',')[idx],
                query: getSearchQueryParam(allColFilterOptions[k])
            };
            if (options.selector) {
                if (prevSelc !== options.selector) {
                    traverseColumnDesigns(self, queryContainer, options.selector, pushFilter.bind(self, self, queryContainer, options));
                }
                prevSelc = options.selector;
            }
        }


        return queryContainer;
    }

    function getSearchQueryParam(filterStr) {
        var query = "";
        var filterStrArr = filterStr.split(',');
        var filterValLen = filterStrArr.length;
        if (filterValLen > 2 && filterStrArr[1] === 'contains') {
            var Fst = filterStr.indexOf(",");
            var Snd = filterStr.indexOf(",", Fst + 1);
            query = filterStr.substring(Snd + 1).trim();
        } else {
            query = filterStrArr[2] === undefined ? filterStrArr[2] : filterStrArr[2].trim();
        }
        return query;
    }

    function pushFilter(self, queryContainer, options,j) {
        //console.log(queryContainer.columnDesigns[j].criterias);
        //Clearing the old custom filters
        //var diffOpts = _.difference(queryContainer.columnDesigns[j].criterias, self.filtersArr);
        //queryContainer.columnDesigns[j].criterias = diffOpts[0] !== undefined ? diffOpts : [null];

        //pushing new filter into filters array
        if (options.query) {
            var filter = '';
            var systemDateField = (queryContainer.columnDesigns[j].id === 'LAST_UPDT_DT' || queryContainer.columnDesigns[j].id === 'CRT_DT') ? true : false;
            var dateField = queryContainer.columnDesigns[j].dataType.toLowerCase() === 'date' ? true : false;
            var isNotFormattedDate = self.formColumnArr.indexOf(queryContainer.columnDesigns[j].alias) === -1 ? true : false;

            if ((dateField && isNotFormattedDate) || systemDateField) {
                var currentDate = new Date(options.query);
                var currentMonth = ('0' + (currentDate.getMonth() + 1)).slice(-2);
                var currentDay = ('0' + currentDate.getDate()).slice(-2);
                var date = currentDate.getFullYear() + '-' + currentMonth + '-' + currentDay;

                var minDate = date + ' 00:00:00';
                var maxDate = date + ' 23:59:59';
                var minDateQuery = "(>=(# :dt :utc '" + minDate + "')";
                var maxDateQuery = "<=(# :dt :utc '" + maxDate + "'))";

                filter = minDateQuery + " And " + maxDateQuery;
                self.filtersArr.push(minDateQuery);
                self.filtersArr.push(maxDateQuery);
            } else if (queryContainer.columnDesigns[j].dataType.toLowerCase() === 'boolean') {
                if (options.query === "true") {
                    filter = "'Y'";
                } else if (options.query === "false") {
                    filter = "'N'";
                } else {
                    filter = '';
                }
                self.filtersArr.push(filter);
            } else {
                filter = '(Like ' + "'%" + options.query + "%'" + ')';
                self.filtersArr.push(filter);
            }

            queryContainer.columnDesigns[j].resultFilterExpression = filter;
        }
    }


    function traverseColumnDesigns(self, queryContainer, selector, callback, allCallback) {
        for (var j = 0; queryContainer.columnDesigns && j < queryContainer.columnDesigns.length; j++) {
            if (callback) {
                var colUniqueID = queryContainer.columnDesigns[j].alias;
                if (colUniqueID === "") {
                    var id = queryContainer.columnDesigns[j].id;
                    colUniqueID = (id.indexOf('[') > -1) ? id.substring(1, id.length - 1) : id;
                }

                if (selector === colUniqueID && callback) {
                    callback.call(self, j);
                }
            }

            if (allCallback) {
                allCallback.call(self, j);
            }
        }
    }


    function clearAllFilters(self, queryContainer, allColFilterOptions) {
        traverseColumnDesigns(self, queryContainer, null, null, clearFilterCriteria.bind(self, self, queryContainer));
        self.filtersArr = [];
    }

    function clearFilterCriteria(self, queryContainer, q) {
        //for (var q = 0; queryContainer.columnDesigns && q < queryContainer.columnDesigns.length; q++) {
        //console.log(queryContainer.columnDesigns[q].criterias, getOriginalCriteria(self.filtersArr, queryContainer.columnDesigns[q].criterias[0]));

        queryContainer.columnDesigns[q].resultFilterExpression = '';

        //}


        //var diffOpts = _.difference(queryContainer.columnDesigns[q].criterias, self.filtersArr);
        //queryContainer.columnDesigns[q].criterias = diffOpts[0] !== undefined ? diffOpts : [null];
    }

    function getOriginalCriteria(existingFilters, criteria) {
        if(!existingFilters.length || !criteria){
            return criteria;
        } else {
            var criteriaArr = criteria.split(' And ');
            var lastCriteria = criteriaArr[criteriaArr.length - 1].toString().trim();
            var criteriaIndex = $.inArray(lastCriteria, existingFilters);
            if (criteriaIndex !== -1) {
                if (criteriaHasDate(lastCriteria)) {
                    return removeLastCriterias(criteria, 2).trim();
                } else {
                    return criteria.substring(0, criteria.lastIndexOf(' And ')).trim();
                }
            } else {
                return criteria;
            }
        }
    }
    function criteriaHasDate(criteria) {
        var escaped = criteria.replace('(>=(# :dt :utc ', '').replace(' 00:00:00', "").replace(/\)/g, '')
            .replace(' 23:59:59', "").replace('<=(# :dt :utc ', '').replace(/'/g, "");
        return new Date(escaped).toString() !== 'Invalid Date';
    }

    function removeLastCriterias(str,times) {
        var newStr = str;
        for (var i = 0; i < times; i++) {
            newStr = newStr.substring(0, newStr.lastIndexOf(str));
        }
        return newStr;
    }

    function handleDatasource(self) {
        var dataSource = {
            load: function (loadOptions) {
                var d = new $.Deferred();
                var filterOptions = loadOptions.filter ? loadOptions.filter.join(",") : "";   //Getting filter options
                var sortOptions = loadOptions.sort ? JSON.stringify(loadOptions.sort) : "";  //Getting sort options
                //skip and take are used for paging
                var skip = loadOptions.skip; //A number of records that should be skipped 
                var take = loadOptions.take; //A number of records that should be taken
                var colIdx;
                var optionsObj = {
                    filter: filterOptions,
                    sort: sortOptions,
                    skip: self.gridInstance ? self.gridInstance.pageIndex() * self.pageSize() : 0,
                    take: self.pageSize()
                };

                if (self.gridInstance) {
                    self.gridInstance.clearSelection();
                }

                var canApplyFilter = true;
                if (loadOptions.hasOwnProperty('filter') && loadOptions.filter === undefined) {
                    canApplyFilter = false;
                }
                //For no data specified case
                if (self.data() === null || self.data() === undefined) {
                    d.resolve([]);
                    return d.promise();
                }
                    //For Data as static and module should need to call the API and return results
                else if (self.data() === 'static') {

                    var dataDfd = $.Deferred();
                    //Remembering the focused filter textbox to use it after results load.
                    colIdx = $('.dx-datagrid-filter-row .dx-editor-cell').index($('.dx-editor-cell.dx-focused'));
                    self.filterElIndex = colIdx !== -1 ? colIdx : self.filterElIndex;
                    dataDfd.done(function (data) {
                        self.rawQueryData = data;
                        if (self.currentFilter !== optionsObj.filter) {
                            self.currentFilter = optionsObj.filter;
                            self.getTotalCount = true;
                            $(self.element).find('.dxDataGridTotalCount').html(data.totalCount + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
                        }
                        d.resolve(data.data);
                        //setting focus on filter current filter column textbox
                        $($('.dx-datagrid-filter-row .dx-editor-cell')[self.filterElIndex]).find('input').focus();
                    });
                    optionsObj.skip = skip;
                    optionsObj.take = take;
                    Object.tryMethod(self, 'onPageChangeCB', dataDfd, optionsObj);
                    return d.promise();

                } else {

                    //For general query API calling case

                    if (self.currentFilter !== optionsObj.filter) {
                        self.currentFilter = optionsObj.filter;
                        colIdx = $('.dx-datagrid-filter-row .dx-editor-cell').index($('.dx-editor-cell.dx-focused'));
                        self.filterElIndex = colIdx !== -1 ? colIdx : self.filterElIndex;
                        //handleGetTotalRecordsCount(self, optionsObj).done(function () {
                        //$(self.element).find('.dxDataGridTotalCount').html(self._totalCount() + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
                        handleQueryExecution(self, optionsObj, false, canApplyFilter).done(function (data) {
                            self.queryDataColumns = data.rowset.columns;
                            Object.tryMethod(self, 'queryExecutedCB', data, optionsObj);
                            self.rawQueryData = data;
                            var modData = queryDataToObject(self, data);
                            d.resolve(modData.objects);
                            $($('.dx-datagrid-filter-row .dx-editor-cell')[self.filterElIndex]).find('input').focus();
                        }).fail(function () {
                            var modData = queryDataToObject(self, self.rawQueryData);
                            d.resolve(modData.objects);
                            $($('.dx-datagrid-filter-row .dx-editor-cell')[self.filterElIndex]).find('input').focus();
                        });
                        // });
                    } else {
                        handleQueryExecution(self, optionsObj, false, canApplyFilter).done(function (data) {
                            self.queryDataColumns = data.rowset.columns;
                            Object.tryMethod(self, 'queryExecutedCB', data, optionsObj);
                            self.rawQueryData = data;
                            var modData = queryDataToObject(self, data);
                            d.resolve(modData.objects);
                        });
                    }

                    return d.promise();
                }
            },
            totalCount: function (loadOptions) {
                //var d = self.totalCountDfd;
                var d = $.Deferred();

                if (self.data() === 'static' && self.totalCountCallback) {
                    var optionsObj = {};
                    Object.tryMethod(self, 'totalCountCallback', d, optionsObj);
                    return d.promise();
                } else {
                    d.resolve();
                    return d.promise();
                }
            },
            paginate: true,
            pageSize: self.pageSize()// 100
        };
        return dataSource;
    }

    function queryDataToObject(self, data) {
        var fields = [], i = 0, j = 0;
        var columns = [];
        var objects = [];
        var queryData = data.rowset;

        for (i = 0; i < queryData.columns.length; i++) {
            var column = {};
            if (queryData.columns[i].famliyMappingIndex.toString() === '-1') {
                column.dataField = queryData.columns[i].uniqueId;
            }
            else {
                if (queryData.columns[i].uniqueId.indexOf('[') > -1) {
                    queryData.columns[i].uniqueId = queryData.columns[i].uniqueId.substring(queryData.columns[i].uniqueId.indexOf('[') + 1, queryData.columns[i].uniqueId.length - 1);
                }
                column.dataField = queryData.columns[i].uniqueId;
            }
            column.visible = queryData.columns[i].isVisible;

            if (!isNaN(column.dataField)) {
                column.dataField = column.dataField+"_";
            }

            switch (queryData.columns[i].typeName) {
                case 'System.DateTime': column.dataType = 'date'; break;
                case 'System.Double': column.dataType = 'number'; break;
                case 'System.Boolean': column.dataType = 'boolean'; break;
            }
            columns.push(column);
        }

        for (i = 0; i < queryData.rows.length; i++) {
            var obj = {};
            for (j = 0; j < columns.length; j++) {
                var columnVal = queryData.rows[i].columnValues[j] === null ? "" : queryData.rows[i].columnValues[j];
                if (columns[j].dataType === 'date' && columnVal !== "") {
                    if (self.cachedQueryContainer.isFormatted) {
                        self.formColumnArr.push(columns[j].dataField);
                    } else {
                        columnVal = Converter.toDate(columnVal);
                    }
                }
                if (columns[j].dataType === 'boolean') {
                    columnVal = converter.toBoolean(columnVal.toString().toLowerCase(), 'true');
                }else if (columnVal && typeof columnVal === 'string') {
                    columnVal = escapeHtml(columnVal);
                }else if (columns[j].dataType === 'number') {
                    columnVal = queryData.rows[i].columnValues[j];
                }
                obj[columns[j].dataField] = columnVal;
            }
            objects.push(obj);
        }

        return { objects: objects, columns: columns };
    }

    function customizeColumns(self, columns) {
        if (self.data() === 'static') {

            var data = self.rawQueryData;
            for (var q = 0; q < columns.length; q++) {

                columns[q].dataField = data.columns[q].id;
                if (data.columns[q].alias !== undefined && data.columns[q].alias !== '') {
                    columns[q].caption = data.columns[q].alias;
                }
                else {
                    columns[q].caption = data.columns[q].id;
                }

                if (data.columns[q].isActionColumn !== undefined && data.columns[q].isActionColumn === 'true') {
                    columns[q].cellTemplate = handleCellTemplateForActionColumn.bind(null,self);
                }
                else if (data.columns[q].hasCellTemplate !== undefined && data.columns[q].hasCellTemplate === 'true') {
                    columns[q].cellTemplate = handleCustomCellTemplate.bind(null,self);
                }
                if (data.columns[q].hasHeaderCellTemplate !== undefined && data.columns[q].hasHeaderCellTemplate === 'true') {
                    columns[q].headerCellTemplate = handleHeaderCellTemplate.bind(null,self);
                }

                if (data.columns[q].dataType !== undefined) {
                    columns[q].dataType = data.columns[q].dataType;
                }
                columns[q].encodeHtml = false;
                if (data.columns[q].format !== undefined) {
                    columns[q].format = data.columns[q].format;
                }
                if (data.columns[q].precision !== undefined) {
                    columns[q].precision = data.columns[q].precision;
                }
                if (data.columns[q].cssClass !== undefined) {
                    columns[q].cssClass = data.columns[q].cssClass;
                }
                if (data.columns[q].alignment !== undefined) {
                    columns[q].alignment = data.columns[q].alignment;
                }
                if (data.columns[q].allowFiltering !== undefined) {
                    columns[q].allowFiltering = converter.toBoolean(data.columns[q].allowFiltering, 'true');
                }
                if (data.columns[q].width !== undefined) {
                    columns[q].width = data.columns[q].width;
                }
                if (data.columns[q].visible !== undefined) {
                    columns[q].visible = converter.toBoolean(data.columns[q].visible, true);
                }
                if (data.columns[q].allowEditing !== undefined) {
                    columns[q].allowEditing = converter.toBoolean(data.columns[q].allowEditing, 'true');
                }
                //Handling column datasource lookup
                if (data.columns[q].lookup !== undefined && data[data.columns[q].lookup.dataSource]) {
                    columns[q].lookup = data.columns[q].lookup;
                    columns[q].lookup.dataSource = data[data.columns[q].lookup.dataSource];
                }
            }
            return columns;
        }
        var queryData = self.rawQueryData.rowset;
        var queryContainer = self.cachedQueryContainer;
        var format = ApplicationContext.user.formats.shortDate;
        for (var i = 0; i < columns.length; i++) {
            if (queryData.columns[i].famliyMappingIndex.toString() === '-1') {
                columns[i].dataField = queryData.columns[i].uniqueId;
            }
            else {
                if (queryData.columns[i].uniqueId.indexOf('[') > -1) {
                    queryData.columns[i].uniqueId = queryData.columns[i].uniqueId.substring(queryData.columns[i].uniqueId.indexOf('[') + 1, queryData.columns[i].uniqueId.length - 1);
                }
                columns[i].dataField = queryData.columns[i].uniqueId;
            }

            switch (queryData.columns[i].typeName) {
                case 'System.DateTime':
                    columns[i].dataType = 'date';
                    if (self.formColumnArr.indexOf(queryData.columns[i].uniqueId) === -1) {
                        columns[i].format = format;
                    } else {
                        columns[i].dataType = 'string';
                    }
                    break;
                case 'System.Boolean': columns[i].dataType = 'boolean'; break;
            }

            if (queryData.columns[i].alias !== undefined && queryData.columns[i].alias !== '') {
                columns[i].caption = queryData.columns[i].alias;
            }
            else {
                columns[i].caption = queryData.columns[i].id;
            }
            //columns[i].visible = queryData.columns[i].isVisible;
            if (queryContainer.columnDesigns !== null && queryContainer.columnDesigns !== undefined) {
                for (var j = 0; j < queryContainer.columnDesigns.length; j++) {
                    var colUniqueID = queryContainer.columnDesigns[j].alias;
                    if (colUniqueID === "") { colUniqueID = queryContainer.columnDesigns[j].id.substring(0, queryContainer.columnDesigns[j].id.length); }
                    if (columns[i].caption === colUniqueID) {
                        columns[i].visible = queryContainer.columnDesigns[j].display;
                        if (queryContainer.columnDesigns[j].alias === '' && queryContainer.columnDesigns[j].caption) {
                            //revisit later
                            var caption = queryContainer.columnDesigns[j].caption;
                            queryContainer.columnDesigns[j].caption = (caption.indexOf('[') > -1) ? caption.substring(1, caption.length - 1) : caption;
                            columns[i].caption = queryContainer.columnDesigns[j].caption;
                        }
                        else if (queryContainer.columnDesigns[j].alias === '') {
                            columns[i].caption = queryContainer.columnDesigns[j].id;
                        }
                        else {
                            columns[i].caption = queryContainer.columnDesigns[j].alias;
                        }
                        columns[i] = disableSortOfConsColumn(queryContainer.columnDesigns[j], columns[i]);
                    }
                }
            }
            columns[i].encodeHtml = false;

            if (self.queryDataColumns[i].hasCellTemplate && self.queryDataColumns[i].hasCellTemplate.toString() === 'true') {
                columns[i].cellTemplate = handleCustomCellTemplate.bind(null, self);
            }
        }
        for (var k = 0; k < queryData.rows.length; k++) {
            for (var l = 0; l < columns.length; l++) {
                if (queryData.rows[k].displayInfos && queryData.rows[k].displayInfos[l] && queryData.rows[k].displayInfos[l].backColor) {
                    self.queryHasBackgroundColor(true);
                    columns[l].cssClass = queryData.rows[k].displayInfos[l].backColor;
                }
                if (queryData.rows[k].displayInfos && queryData.rows[k].displayInfos[l] && queryData.rows[k].displayInfos[l].format) {
                    columns[l].format = queryData.rows[k].displayInfos[l].format;
                }
            }
        }

    }

    function isHTML(str) {
        return /<[a-z\][\s\S]*>/i.test(str);
    }

    function handleGridHeight(self) {
        if ($(self.element).find('.dx-datagrid-pager.dx-pager').length) {
            var rowsHeight = $(self.element).find(".gridContainer").height() - $(self.element).find(".dx-datagrid-headers").height();
            $(self.element).find(".dx-datagrid-rowsview").height(rowsHeight);

        }
    }

    function handleCellPreparedForQueryResult(self,container, options) {
        var fieldData = options.value,
            fieldHtml = fieldData;


        var column = _.find(self.rawQueryData.columns, function (item) {
            return item.alias === options.column.caption;
        });
        if (column&&column.hasCellTemplate) {
            return;
        }
        if (fieldData && typeof fieldData !== 'boolean' && fieldData.toString().indexOf('<a') !== -1) {
            container.empty().append(fieldHtml);
        }

        if ($(container).attr('class') && self.queryHasBackgroundColor()) {
            var style = $(container).attr('style');
            style += 'background: ' + $(container).attr('class') + ';';
            $(container).attr('style', style);
        }
        var hyperlink = $(container).find('a');
        if (hyperlink.length && isHTML(fieldData)) {
            if (self._openHyperLinkInNewTab !== false) {
                hyperlink.attr('target', 'tab');
            }
        }
    }

    function handleContentReadyAction(self) {
        var dataGridInstance = $(self.element).find('.gridContainer').dxDataGrid('instance');
        $(self.element).find('.rg-controls').show();
        $(self.element).find('.rg-header').show();
        //Commented To Solve Brower Hanging Issue in infinite Scroll and IE cursor moving to front of txtbox
        /*$(self.element).find('.gridContainer').dxDataGrid({
            filterRow: {
                showOperationChooser: false
            }
        });*/
        setHeightBasedOnTotalCount(self, dataGridInstance);
        //$('.dxDataGridTotalCount').html(dataGridInstance.totalCount() + ' records found');
        self.gridInstance = dataGridInstance;
        Object.tryMethod(self, 'gridLoadedCallback', dataGridInstance);

        if (self.scrollType() === 'standard') {
            if (self.getTotalCount) {
                getMenuPaging(self);
            }

        } else if (self.scrollType() === 'standard' && self.data() === 'static' && !self.currentFilter) {
            var ttlCount = dataGridInstance.totalCount() > 0 ? dataGridInstance.totalCount() : 0;
            $(self.element).find('.dxDataGridTotalCount').html(ttlCount + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        }
        //handleGridHeight(self);
        $(self.element).find('.dx-datagrid-pager.dx-pager').hide();

        $(self.element).find('.dx-datagrid-pager.dx-pager').append($(self.element).find('.dxDataGridTotalCount'));
    }

    function setHeightBasedOnTotalCount(self,instance) {
        var controlHeightBasedOnTotalCount = self.showRowFilter() ? 'calc(100% - 65px)' : 'calc(100% - 25px)';
        var containerEl = $(self.element).find('.gridContainer');
        if (instance.totalCount() <= self.pageSize()) {
            containerEl.css({ height: controlHeightBasedOnTotalCount });
            //instance.repaint();
        }
    }


    function handleSelectionChanged(self, selecteditems) {
        var data;
        if (self.selectionMode() === 'single') {
            data = selecteditems.selectedRowsData[0];
            Object.tryMethod(self, 'callback', data);
        }
        else {
            data = selecteditems.selectedRowsData;
            Object.tryMethod(self, 'multiSelectCallback', data);
        }
    }

    function handleRowPrepared(self, rowElement, rowInfo) {
        Object.tryMethod(self, 'rowPreparedCallback', rowElement, rowInfo);
    }

    function handleQueryResult(self, queryData) {
        if (self.fields() === null || !self.data()) {
            return;
        }
        self.cachedQueryContainer = null;
        self.getTotalCount = true;

        self.fields([]);
        //var objectsData = queryDataToObject(self, queryData);

        var config = {
            dataSource: handleDatasource(self),
            allowColumnReordering: self.allowColumnReordering(),
            allowColumnResizing: self.allowColumnResizing(),
            customizeColumns: customizeColumns.bind(null, self),
            //columns: objectsData.columns,
            columnAutoWidth: self.columnAutoWidth(),
            selection: {
                mode: self.selectionMode()
            },
            cellPrepared: handleCellPreparedForQueryResult.bind(null,self),
            scrolling: {
                mode: self.scrollType()
            },
            paging: {
                enabled: false,
                pageSize: self.pageSize()
            },
            //pager: {
            //    showPageSizeSelector: true,
            //    allowedPageSizes: [100, 250, 500, 1000]
            //},
            //for hiding pane setting showpane to false, and displaying empty text with loader icon setting it to empty text
            loadPanel: loadPanelConfig(self),
            noDataText: self.noDataCaptioin,
            sorting: {
                mode: self.sortingMode()
            },
            editing: editConfig(self),
            wordWrapEnabled: self.wordWrapEnabled,
            contentReadyAction: handleContentReadyAction.bind(null,self),
            selectionChanged: handleSelectionChanged.bind(null,self),
            rowPrepared: handleRowPrepared.bind(null,self),
            rowUpdated: function (rowInfo) {
                //console.log(rowInfo);
            },
            rowUpdating: function (rowInfo) {
                // console.log(rowInfo);
            },
            onEditorPrepared: function (options) {
                if (options.parentType === 'filterRow' && options.dataType === 'number') {
                    options.editorElement.dxNumberBox('option', 'showSpinButtons', true);
                }
            }
        };

        loadDxDataGrid(self, config);
    }

    function handleContentReadyActionForJSON(self) {
        var dataGridInstance = $(self.element).find('.gridContainer').dxDataGrid('instance');
        $(self.element).find('.rg-controls').show();
        $(self.element).find('.rg-header').show();
        var ttlCount = dataGridInstance.totalCount() > 0 ? dataGridInstance.totalCount() : 0;

        var colIdx = $('.dx-datagrid-filter-row .dx-editor-cell').index($('.dx-editor-cell.dx-focused'));
        self.filterElIndex = colIdx !== -1 ? colIdx : self.filterElIndex;

        //Commented To Solve Brower Hanging Issue in infinite Scroll and IE cursor moving to front of txtbox
        /*$(self.element).find('.gridContainer').dxDataGrid({
            filterRow: {
                showOperationChooser: false
            }
        });*/
        _.delay(function () {
            $($('.dx-datagrid-filter-row .dx-editor-cell')[self.filterElIndex]).find('input').focus();
        }, 100);
        //if (self.scrollType() === 'infinite') {
        //    $(self.element).find('.dxDataGridTotalCount').html(self._totalCount() + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        //}
        //else {
        //    $(self.element).find('.dxDataGridTotalCount').html(ttlCount + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        //}
        self.gridInstance = dataGridInstance;
        Object.tryMethod(self, 'gridLoadedCallback', dataGridInstance);

        //if (self.scrollType() === 'standard') {
        //    handlePageButtons(self, true);
        //}

        // var hasFilter = _.find(self.gridInstance.state().columns, function (col) { return col.filterValue; });
        //if (hasFilter || self.customTotalCount() !== ttlCount) {
        if (self.customTotalCount() !== ttlCount) {
            self.getTotalCount = true;
        }

        if (self.scrollType() === 'standard') {
            if (self.getTotalCount) {
                getMenuPaging(self, ttlCount);
            }
            $(self.element).find('.dx-datagrid-pager.dx-pager').hide();
        } else {
            $(self.element).find('.dxDataGridTotalCount').show().text(self._totalCount() + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
        }
        //handleGridHeight(self);
        $(self.element).find('.dx-datagrid-pager.dx-pager').hide();

        //$(self.element).find('.dx-datagrid-pager.dx-pager').append($(self.element).find('.dxDataGridTotalCount'));
    }


    function handleSelectionChangedForJSON(self,selecteditems) {
        var data;
        if (self.selectionMode() === 'single') {
            data = selecteditems.selectedRowsData[0];
            Object.tryMethod(self, 'callback', data);
        }
        else {
            data = _.map(selecteditems.selectedRowsData, function (a) {
                if (a.FEdefine && a.FEdefine === true && a._notReplaceable === true) {
                    return $.extend(true, a, { illegal: true });
                } else { return a; }
            });
            Object.tryMethod(self, 'multiSelectCallback', data);
        }
    }

    function editConfig(self) {
        return {
            editMode: self.editMode(),
            editEnabled: self.allowRowEditing(),
            insertEnabled: self.allowRowAdding(),
            removeEnabled: self.allowRowDeleting(),
            texts: {
                addRow: self.translator.translate('RG_ADD_ROW_HELP_TEXT'),
                cancelAllChanges: self.translator.translate('RG_CANCEL_CHANGES_HELP_TEXT'),
                deleteRow: self.translator.translate('RG_DELETE'),
                saveAllChanges: self.translator.translate('RG_SAVE_CHANGES_HELP_TEXT'),
                undeleteRow: self.translator.translate('RG_UNDELETE')
            }
        };
    }

    function loadPanelConfig(self){
        return {
            enabled: true,
            showPane: false,
            text: ''
        };
    }

    function handleJSONDataWithColumns(self, data) {

        var cols = getColumnsFromData(self,data);
        self._totalCount(data.data ? data.data.length : 0);
        var config = {
            dataSource: data.data,
            allowColumnReordering: self.allowColumnReordering(),
            allowColumnResizing: self.allowColumnResizing(),
            columns: cols,
            columnAutoWidth: self.columnAutoWidth(),
            cellPrepared: handleCellPrepared.bind(null, self),
            onInitNewRow: handleInitNewRow.bind(null,self),
            selection: {
                mode: self.selectionMode()
            },
            scrolling: {
                mode: self.scrollType()
            },
            //paging: {
            //    enabled: true,
            //    pageSize: self.pageSize()
            //},
            pager:{
                visible:false,
            },
            sorting: {
                mode: self.sortingMode()
            },
            loadPanel: loadPanelConfig(self),
            noDataText: self.noDataCaptioin,
            editing: editConfig(self),
            wordWrapEnabled: self.wordWrapEnabled,
            rowPrepared: handleRowPrepared.bind(null,self),
            contentReadyAction: handleContentReadyActionForJSON.bind(null,self),
            selectionChanged: handleSelectionChangedForJSON.bind(null, self),
            onEditorPrepared: function (options) {
                if (options.parentType === 'filterRow' && options.dataType === 'number') {
                    options.editorElement.dxNumberBox('option', 'showSpinButtons', true);
                }
            },
            onEditingStart: handleEditingStart.bind(null, self)
        };

        if (self.scrollType() === 'standard') {
            config.paging = {
                enabled: true,
                pageSize: self.pageSize()
            };
        }

        loadDxDataGrid(self, config, data, 'json');
    }

    function handleSelectionChangeForJsonWithoutColumns(self,selecteditems) {
        var data;
        if (self.selectionMode() === 'single') {
            data = selecteditems.selectedRowsData[0];
            Object.tryMethod(self, 'callback', data);
        }
        else {
            data = _.map(selecteditems.selectedRowsData, function (a) {
                if (a.FEdefine && a.FEdefine === true) { } else { return a; }
            });
            Object.tryMethod(self, 'multiSelectCallback', data);
        }
    }

    function handleJSONData(self, data) {

        self._totalCount(data.data ? data.data.length : 0);
        var config = {
            dataSource: data.data,
            allowColumnReordering: self.allowColumnReordering(),
            allowColumnResizing: self.allowColumnResizing(),
            columnAutoWidth: self.columnAutoWidth(),
            selection: {
                mode: self.selectionMode()
            },
            scrolling: {
                mode: self.scrollType()
            },
            //paging: {
            //    enabled: true,
            //    pageSize: self.pageSize()
            //},
            pager: {
                visible: false,
            },
            sorting: {
                mode: self.sortingMode()
            },
            loadPanel: loadPanelConfig(self),
            noDataText: self.noDataCaptioin,
            editing: editConfig(self),
            wordWrapEnabled: self.wordWrapEnabled,
            contentReadyAction: handleContentReadyActionForJSON.bind(null,self),
            selectionChanged: handleSelectionChangeForJsonWithoutColumns.bind(null,self)
        };

        if (self.scrollType() === 'standard') {
            config.paging = {
                enabled: true,
                pageSize: self.pageSize()
            };
        }



        loadDxDataGrid(self, config, data, 'json');

    }

    function loadDxDataGrid(self,config, data, type) {
        require(['devExWebJS'], function () {

            //resetting Handlers
            attachControlsHandlers(self);
            var containerHeight = self.showRowFilter() ? 'calc(100% - 46px)' : 'calc(100% - 46px)';
            //var controlHeightBasedOnTotalCount = self.showRowFilter() ? 'calc(100% - 65px)' : 'calc(100% - 46px)';
            var controlHeightBasedOnScrollType = self.scrollType() !== 'standard' ? 'calc(100% - 65px)' : 'calc(100% - 46px)';
            if (self.scrollType() === 'infinite') {
                controlHeightBasedOnScrollType = self.showFooter ? 'calc(100% - 25px)' : '100%';
            }  
            //var containerHeight = 'auto';
            //var containerHeight = 'calc(100% - 40px)';
            var containerEl = $('<div id="gridContainer" class="gridContainer" style=""></div>').css({ 'display': 'block', 'height': containerHeight, 'width': '100%' });

            if (self.hideEditControls()) {
                containerEl.addClass('hide-edit-controls');
            }

            if (!type) {
                //For Query
                //getting totalcount to make sure it loaded
                if (self.data() === 'static') {
                    handleGetTotalRecordsCount(self).done(function () {
                        if (self._totalCount() < self.pageSize()) {
                            containerEl.css({ height: controlHeightBasedOnScrollType });
                        }
                        $(self.element).find('.gridContainer').remove().end().find('.rg-header').after(containerEl).end().find('.gridContainer').dxDataGrid(config);
                        $(containerEl).find('.dx-loadpanel-indicator.dx-loadindicator.dx-widget').html('<div class="load-spinner"><span class="loading-med loading-active center-block"></span></div>');
                        $(self.element).find('.dxDataGridTotalCount').html(self._totalCount() + ' ' + self.translator.translate('RG_TOTAL_COUNT_MESSAGE'));
                    });
                } else {
                    $(self.element).find('.gridContainer').remove().end().find('.rg-header').after(containerEl).end().find('.gridContainer').dxDataGrid(config);
                    $(containerEl).find('.dx-loadpanel-indicator.dx-loadindicator.dx-widget').html('<div class="load-spinner"><span class="loading-med loading-active center-block"></span></div>');
                }
            } else {
                //for JSON data
                //$($(self.element).find('.gridContainer')[0]).dxDataGrid(config);
                if (self._totalCount() < self.pageSize()) {
                    containerEl.css({ height: controlHeightBasedOnScrollType });
                }
                $(self.element).find('.gridContainer').remove().end().find('.rg-header').after(containerEl).end().find('.gridContainer').dxDataGrid(config);
                $(containerEl).find('.dx-loadpanel-indicator.dx-loadindicator.dx-widget').html('<div class="load-spinner"><span class="loading-med loading-active center-block"></span></div>');
                if (type === 'json' && data.selectedRows !== undefined) {
                    _.defer(preSelectRows.bind(null, self, data.selectedRows));
                }
            }
            hideFooter(self, containerEl);
            fchecklayout();
        });
    }
    function fchecklayout() {
        if ($('#radio01').attr('checked')) {
            $('.dx-datagrid').addClass('tight');
            $('#radio02').attr('checked', false);

        } else if ($('#radio02').attr('checked')) {
            $('.dx-datagrid').removeClass('tight');
            $('#radio01').attr('checked', false);
        }
    }

    function hideFooter(self, containerEl) {
        if (!self.showFooter) {
            $(containerEl).parent().find('.rg-footer').addClass('hide-rg-footer');
        }
    }

    function attachControlsHandlers(self) {
        var leftToolbar = self.querySelector('.rg-left-tool-bar');
        var rightToolbar = self.querySelector('.rg-right-tool-bar');

        if (self.scrollType() === 'infinite') {
            $(self.element).find('.dxDataGridTotalCount').show();
        }

        $(self.element).find('.rg-filter').off().hide();
        if (self.showRowFilter()) {
            $(leftToolbar).show();
            $(rightToolbar).show();
            $(self.element).find('.rg-filter').show().on('click', toggleFilter.bind(null, self));
        } else {
            if($(leftToolbar).find('button').length === 2){
                $(leftToolbar).hide();
            }
        }
        if (self.scrollType() === 'standard' ) {
            $(self.element).find('mi-select').show();
            $(self.element).find('.totalCount').show();
        }


        self.selectedValue.subscribe(function (newValue) {
            changePage(self, newValue);
        });

    }

    function toggleFilter(self, e) {
        var enabled = $(self.element).find('.rg-filter').data('isFilterEnabled');

        $(self.element).find('.rg-filter').data('isFilterEnabled', !enabled);
        $(self.element).find('.gridContainer').dxDataGrid({
            filterRow: {
                visible: !enabled,
                showOperationChooser: false
            }
        });
        //handleGridHeight(self);
    }

    function handlePageButtons(self, forJSON) {
        if (self._totalCount() < self.pageSize()) {
            //disable all paging when the results less than page size
            $(self.element).find('.pageControls .firstPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .prevPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .nextPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .lastPage').attr('disabled', 'disabled');
        } else {
            //enable page navigation
            $(self.element).find('.pageControls .firstPage').removeAttr('disabled');
            $(self.element).find('.pageControls .prevPage').removeAttr('disabled');
            $(self.element).find('.pageControls .nextPage').removeAttr('disabled');
            $(self.element).find('.pageControls .lastPage').removeAttr('disabled');
        }
        if (!self.gridInstance.pageIndex()) {
            //disable when no pages to go back
            $(self.element).find('.pageControls .firstPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .prevPage').attr('disabled', 'disabled');
        } else if (self.gridInstance.pageIndex() === Math.floor(self._totalCount() / self.pageSize())) {
            //disable when no pages to move forward
            $(self.element).find('.pageControls .nextPage').attr('disabled', 'disabled');
            $(self.element).find('.pageControls .lastPage').attr('disabled', 'disabled');
        }

        if (self.scrollType() !== 'standard' || self._totalCount() < self.pageSize()) {
            //Use devexpress paging incase of JSON data
            $(self.element).find('.pageControls ').hide();
        } else {
            //enabling custom paging for query and static data 
            $(self.element).find('.pageControls ').show();
        }
    }

    function handlePageChange(self, state) {
        if (!self.gridInstance) {
            console.error('grid instance not available');
            return;
        }
        switch (state) {
            case 'first':
                self.gridInstance.pageIndex(0);
                break;
            case 'prev':
                self.gridInstance.pageIndex(self.gridInstance.pageIndex() - 1);
                break;
            case 'next':
                self.gridInstance.pageIndex(self.gridInstance.pageIndex() + 1);
                break;
            case 'last':
                self.gridInstance.pageIndex(Math.ceil(self._totalCount() / self.pageSize()));
                break;
        }
    }

    function handleGetTotalRecordsCount(self,getOptions) {
        var elem = $(self.element).find('.dxDataGridTotalCount'),options = getOptions || null;
        if (self.data() === 'static') {
            var dfd = $.Deferred();
            Object.tryMethod(self, 'totalCountCallback', dfd);
            dfd.done(function (val) {
                self._totalCount(val);
            });
            return dfd.promise();
        } else {
            return handleQueryExecution(self, options, true, true).done(function (data) {
                self.cachedQueryContainer = data.queryContainer;
                if (self.queryExecutionMode() === 'catalogItemPath') {
                    //self.queryExecutionMode('');
                    self._totalCount(data.rowset.rows.length);
                }
                else {
                    self._totalCount(data.rowCount);
                }
                //elem.html(data.rowset.rows.length + " Records found").css('cursor', 'default').off();
            });
        }
    }

    function getColumnsFromData(self, data) {
        var cols = [];
        for (var i = 0; i < data.columns.length; i++) {
            var column = data.columns[i] || {};
            column.dataField = data.columns[i].dataField || data.columns[i].id;
            if (data.columns[i].alias !== undefined && data.columns[i].alias !== '') {
                column.caption = data.columns[i].alias;
            }
            else if (!column.caption) {
                column.caption = data.columns[i].id;
            }

            if (data.columns[i].isActionColumn !== undefined && data.columns[i].isActionColumn === 'true') {
                column.cellTemplate = handleCellTemplateForActionColumn.bind(null,self);

                //handling hyperlink columns sorting and filtering by constructing a new column with hyperlink texts
                var colName = addLinkTextColumn(column.dataField, data.data);
                column.calculateSortValue = colName;
                column.calculateFilterExpression = handleCalcFilterExp.bind(null, colName);
            }
            else if (data.columns[i].hasCellTemplate !== undefined && data.columns[i].hasCellTemplate === 'true') {
                column.cellTemplate = handleCustomCellTemplate.bind(null,self);
            }

            if (data.columns[i].allowEditing !== undefined) {
                column.allowEditing = data.columns[i].allowEditing;
            }

            if (data.columns[i].hasHeaderCellTemplate !== undefined && data.columns[i].hasHeaderCellTemplate === 'true') {
                column.headerCellTemplate = handleHeaderCellTemplate.bind(null,self);
            }

            if (data.columns[i].dataType !== undefined) {
                column.dataType = data.columns[i].dataType;
            }
            column.encodeHtml = false;
            if (data.columns[i].format !== undefined) {
                column.format = data.columns[i].format;
            }
            if (data.columns[i].precision !== undefined) {
                column.precision = data.columns[i].precision;
            }
            if (data.columns[i].cssClass !== undefined) {
                column.cssClass = data.columns[i].cssClass;
            }
            if (data.columns[i].alignment !== undefined) {
                column.alignment = data.columns[i].alignment;
            }
            if (data.columns[i].allowFiltering !== undefined) {
                column.allowFiltering = converter.toBoolean(data.columns[i].allowFiltering, 'true');
            }
            if (data.columns[i].width !== undefined) {
                column.width = data.columns[i].width;
            }
            if (data.columns[i].visible !== undefined) {
                column.visible = converter.toBoolean(data.columns[i].visible,true);
            }
            if (data.columns[i].allowEditing !== undefined) {
                column.allowEditing = converter.toBoolean(data.columns[i].allowEditing, 'true');
            }

            if(data.columns[i].fixed !== undefined) {
                column.fixed = converter.toBoolean(data.columns[i].fixed, 'true');
            }

            //handling column datasource selection
            if (data.columns[i].lookup !== undefined && data[data.columns[i].lookup.dataSource]) {
                column.lookup = $.extend({}, data.columns[i].lookup);
                column.lookup.dataSource = data[data.columns[i].lookup.dataSource];
            }

            cols.push(column);
        }
        return cols;
    }

    function handleCalcFilterExp(colName, filterValue, selectedFilterOperation) {
        return [colName, selectedFilterOperation || '=', filterValue];
    }

    //Generating column for with hyperlink texts
    function addLinkTextColumn(fieldId, data) {
        var colName = fieldId + "_linkText";
        for (var j = 0; j < data.length; j++) {
            data[j][colName] = $(data[j][fieldId]).text();
        }
        return colName;
    }

    function handleHeaderCellTemplate(self,header, info) {
        Object.tryMethod(self, 'headerCellTemplateCallback', header, info);
    }

    function handleCustomCellTemplate(self,container, options) {
        Object.tryMethod(self, 'cellTemplateCallback', container, options);
    }

    function handleEditingStart(self, container) {
        Object.tryMethod(self, 'onEditingStart', container);
    }

    function handleCellPrepared(self,container, options) {
        Object.tryMethod(self, 'cellPreparedCallback', container, options);
    }


    function handleInitNewRow(self, container, options) {
        Object.tryMethod(self, 'onInitNewRowCallback', container, options);
    }
    
    function handleCellTemplateForActionColumn(self, container, options) {

        try {
            var el = $(options.value);
            var data = el.data() || {};

            data.hyperlinkText = el.text();
            data.hyperlinkUrl = el.attr('href');

            el.addClass('dx-link').on('click', function (e) {
                e.preventDefault();
            }).on('dxclick', function () {
                Object.tryMethod(self, 'cellHyperlinkCallback', data);
            }).appendTo(container);
        }
        catch (e) {
            throw self.translator.translate('RG_INVALID_HYPERLINK_FORMAT_MSG');
        }

    }

    function getButtons(self) {
        return self._loadConfigurableButtons;
    }

    function setButtons(self, value) {
        self._loadConfigurableButtons = value;
        renderToolbars(self);
    }

    function renderToolbars(self) {
        var leftToolbar, rightToolbar, i, btn;
        leftToolbar = self.querySelector('.rg-left-tool-bar');
        rightToolbar = self.querySelector('.rg-right-tool-bar');

        if (self._loadConfigurableButtons && leftToolbar && rightToolbar) {
            for (i = 0; i < self._loadConfigurableButtons().length; i++) {
                btn = self._loadConfigurableButtons()[i];
                if (btn.align === 'left') {
                    if (btn.text) {
                        leftToolbar.insertBefore(createTextButton(self, btn.action, btn.title, btn.text, btn.btnClass), leftToolbar.firstChild);
                    }
                    else {
                        leftToolbar.insertBefore(createIconButton(self, btn.action, btn.title, btn.iconClass, btn.btnClass), leftToolbar.firstChild);
                    }
                }
                else if (btn.align === 'right') {
                    if (btn.text) {
                        rightToolbar.insertBefore(createTextButton(self, btn.action, btn.title, btn.text, btn.btnClass), rightToolbar.firstChild);
                    }
                    else {
                        rightToolbar.insertBefore(createIconButton(self, btn.action, btn.title, btn.iconClass, btn.btnClass), rightToolbar.firstChild);
                    }
                }
            }
            $(leftToolbar).show();
            $(rightToolbar).show();
        }
    }

    function createIconButton(self, action, title, iconClass, btnClass) {
        var button = document.createElement('button'), btnClassName = '';
        var icon = document.createElement('i');
        icon.className = iconClass;
        if (btnClass) {
            btnClassName = btnClass;
        }
        button.className = 'btn btn-icon ' + btnClassName;
        button.title = title;
        button.setAttribute('data-action', action);
        button.appendChild(icon);

        if (!self.buttons) {
            self.buttons = [];
        }
        self.buttons.push(button);
        return button;
    }

    function createTextButton(self, action, title, text, btnClass) {
        var button = document.createElement('button'), btnClassName = '';
        button.innerHTML = text;
        if (btnClass) {
            btnClassName = btnClass;
        }
        button.className = 'btn btn-text ' + btnClassName;
        button.title = title || text;
        button.setAttribute('data-action', action);

        if (!self.buttons) {
            self.buttons = [];
        }
        self.buttons.push(button);
        return button;
    }

    function handleErr(self, data) {
        MessageBox.showOk('Error in executing Query',
            'Error');
    }

    function preSelectRows(self, data) {
        try{
            var dataGrid = $(self.element).find('.gridContainer').dxDataGrid('instance');
            if (dataGrid) {
                dataGrid.selectRows(data);
            }
        }
        catch(e){

        }

    }

    function getMenuPaging(self,totalCount) {
        var options = {};
        if (self.aggregateQueryParams) {
            if (self.queryParams) {
                addAggregateParam(self);
            }
            options.parameters = self.aggregateQueryParams;
            options.suppressPrompts = true;
        }
        else if (self.queryParams) {
            options.parameters = self.queryParams;
            options.suppressPrompts = true;
        }
        self.suppressPrompts(true);
        options.suppressPrompts = true;
        options.evalOnly = true;
        if (self.cachedQueryContainer) {
            options.queryContainer = new QueryContainerDTO(jQuery.parseJSON(JSON.stringify(self.cachedQueryContainer)));
            self.queyExecutionEngine = new QueryExecutionEngine(options);
            self.queyExecutionEngine.execute(options).done(function (data) {
                var rowlength = data.rowCount;
                updatePager(self, rowlength);
                $(self.element).find('.rg-pager').show();
                self.getTotalCount = false;
            });
        } else if (self.data() === "static" && self.scrollType() === 'standard') {
            updatePager(self, totalCount || self._totalCount());
            $(self.element).find('.rg-pager').show();
            self.getTotalCount = false;
        } else if (self.loadJSONData) {
            updatePager(self, totalCount);
            if(self.showPaging) {
            $(self.element).find('.rg-pager').show();
            }
            else {
                 $(self.element).find('.rg-pager').hide();   
            }
            self.getTotalCount = false;
        }
    }

    //Function to check column is Constant and disable the sorting
    function disableSortOfConsColumn(colDesign, column) {
        var expressionText = colDesign.expressionText;
        if (expressionText) {
            var isFound = expressionText.match(/^'.*'$/);
            if (colDesign.dataType === 'Unknown' && isFound) {
                column.allowSorting = false;
                column.cssClass = 'disable-cursor';
            }
        }
        return column;
    }

    function updatePager(self, rowlength) {
        var opt = "";

        var menuObjects = [];
        if (rowlength !== 0) {
            var optlength = rowlength / self.pageSize();
            for (var i = 0; i < optlength; i++) {
                opt = ((i * self.pageSize()) + 1) + " - " + (i + 1) * self.pageSize();
                menuObjects.push({ displayName: opt, val: i });
            }

            var lastOpt = menuObjects[menuObjects.length - 1];
            var optText = lastOpt.displayName;
            optText = optText.substr(0, optText.indexOf("-") + 2);
            lastOpt.displayName = optText + rowlength;
            self.selectedValue('');
            self.listObjects(menuObjects);
            self.customTotalCount(rowlength);
        } else {
            self.selectedValue('');
            self.listObjects([{ displayName: "0", val: 0 }]);
            self.customTotalCount(0);
        }
    }

    function changePage(self, newValue) {
        if (!self.getTotalCount) {
            var selc = self.selectedValue();
            self.pageNumber = selc;
            self.gridInstance.pageIndex(self.pageNumber);
        }
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/<([a-z]+)([^>]*[^\/])?>(?![\s\S]*<\/\1)/gi, function (m) {
            return $('<div/>').text(m).html();
        });
    }

    document.registerElement('mi-resultgrid', { prototype: proto });

    return proto;
});
