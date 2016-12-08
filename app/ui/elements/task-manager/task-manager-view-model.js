define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        ErrorMessage = require('system/error/error-message'),
        MessageBox = require('system/ui/message-box'),
        QueryService = require('query/services/query-service'),
        CatalogService = require('catalog/services/catalog-service'),
        queryStateAdapter = require('query/adapters/query-state-adapter'),
        QueryContainerDTO = require('query/services/dto/query-container-dto'),
        QueryPromptViewModel = require('query/execution/query-prompt-view-model'),
        view = require('text!./template.html');
    require('ui/elements/checkbox/checkbox-view-model');
    require('ui/elements/resultgrid/resultgrid-view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/tool-bar/view-model');
    require('ui/elements/filter/filter-view-model');
    var converter = require('system/lang/converter');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        addAttributes(this);
        addProperties(this);
        var toolBar, searchBox, filter, resultgrid;
        toolBar = this.querySelector('mi-tool-bar');
        if (!toolBar) {
            toolBar = document.createElement('mi-tool-bar');
            this.appendChild(toolBar);
        }
        this.filters = {};
        resultgrid = document.createElement('mi-resultgrid');
        this.appendChild(resultgrid);

        this.visible = ko.observable(false);
        this.disabled = ko.observable(false);

        this.queryService = Object.resolve(QueryService);
        this.catalogService = Object.resolve(CatalogService);

        this.queryPromptViewModel = Object.resolve(QueryPromptViewModel);
        this.queryContainerDTO = Object.resolve(QueryContainerDTO);
    };

    proto.attachedCallback = function () {
        //_.defer(function () {
        //    $('.toolBarContainer').append('<button class="btn btn-default btn-icon save" style="float:right;"><i class="fa fa-save"></i></button>');
        //}, 100);
        var toolBar = this.querySelector('mi-tool-bar');
        toolBar.addEventListener('click', this);
    };

    proto.handleEvent = function (e) {
        if (e.type === 'click') {
            clickHandler(this, e);
        }
    };

    function clickHandler(self, e) {
        var action;
        if (e.target.nodeName === 'BUTTON') {
            action = e.target.getAttribute('data-action');
            buttonClickHandler(self, action, e);
        } else if (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON') {
            action = e.target.parentElement.getAttribute('data-action');
            if (!self.disabled()) {
                buttonClickHandler(self, action, e);
            }
        }
    }

    function buttonClickHandler(self, action, e) {
        if (action === 'showFilter') {
            // Call function to load the filter

            var i, j, arr = [], ar, parmDesigns, isMultiSelect;
            if (self.queryContainer) {
                parmDesigns = self.queryContainer.parmContainer.parmDesigns;

                /* jshint ignore:start */
                //constructing filter object
                if (!self.visible() && parmDesigns && parmDesigns.length > 0) {
                    $(self).find('mi-tool-bar').after(view);

                    for (i = 0; i < parmDesigns.length; i++) {
                        if (parmDesigns[i].parmValues && parmDesigns[i].parmValues.length > 0 ) {

                            var options = [], obj = { selectedOptions: [] }, parmValues;

                            for (j = 0; j < parmDesigns[i].parmValues.length; j++) {
                                parmValues = parmDesigns[i].parmValues[j];
                                isMultiSelect = parmDesigns[i].isMultiValue;

                                if (Object.keys(self.filters).length) {
                                    obj.selectedOptions = self.filters[parmDesigns[i].caption];
                                }

                                options.push(new Object({ text: parmValues.displayValue, value: parmValues.value }));
                            }

                            obj.caption = parmDesigns[i].caption;
                            obj.options = options;
                            obj.isMultiSelect = isMultiSelect;
                            arr.push(obj);
                        }

                    }


                    for (var k = 0; k < arr.length; k++) {
                        var elem;
                        //creating select
                        elem = $("<mi-select class='filter-select' data-optionstext= 'text' data-optionsvalue= 'value' " +
                                "data-optionscaption= ' " + arr[k].caption + "'></mi-select>").appendTo(".filter-grid-container .form-item").data('caption', arr[k].caption);

                        //adding attributes and data
                        elem.data('options', arr[k].options);
                        elem.attr({ 'data-options': JSON.stringify(arr[k].options) });
                        elem.on('valueChange', AddValueChange.bind(null, self));

                        //if multiselect
                        if (arr[0].isMultiSelect) {
                            elem.data('multiple', true);
                            elem.attr('data-multiple', true);
                            elem.data('selectedOptions', arr[k].selectedOptions);
                            elem.attr({ 'data-selectedoptions': JSON.stringify(arr[k].selectedOptions) });
                        }
                    }

                    $('.apply-filter-btn').on('click', function () {
                        UpdateQuery(self, self.filters);
                    });
                }
                else {
                    $(self).find('.filter-grid-container').remove();
                }
                /* jshint ignore:end */
                self.visible(!self.visible());
            }
        }
        else if (action === 'searchItem') {
            require(['devExWebJS'], function () {
                var dataGrid = $('#gridContainer').dxDataGrid('instance');
                if (dataGrid.option('filterRow.visible')) {
                    dataGrid.option('filterRow.visible', false);
                }
                else {
                    dataGrid.option('filterRow.visible', true);
                }
                dataGrid.repaint();
            });
        }
        else {
            Object.tryMethod(self, 'toolbarItemClickCallback', action, e);
        }

    }

    proto.detachedCallback = function () {
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var resultgrid, toolBar;
        var self = this;
        if (attrName === 'taskquery') {
            getExecutionMode(self, newVal);
        }
        else if (attrName === 'addenabled') {
            self.addEnabled(converter.toBoolean(newVal, 'true'));
        }
        else if (attrName === 'selectionmode') {
            self.selectionMode(newVal);
        }

    };

    function getExecutionMode(self, newVal) {
        var execOpt = {
            'pageSize': 50,
            'startPage': 0,
            'suppressPrompts': true
        },
           executionMode;



        self.options = execOpt;
        executionMode = $(self).attr('queryexecutionmode');
        if (executionMode === 'sqlStatement' || executionMode === undefined) {
            self.options.sqlStatement = newVal;

            executeSqlStatement(self, self.options, newVal);
            //renderResultGrid(self, resultgrid, newVal);
        }
        else if (executionMode === 'catalogItemKey') {
            //setting mode of execution as catalogItemKey
            self.options.catalogItemKey = newVal;
            executeCatalogItemKey(self, execOpt, newVal);
        }
        else if (executionMode === 'catalogItemPath') {
            self.catalogService.getCatalogItemKey(newVal).done(function (catalogKey) {
                self.options.catalogItemKey = catalogKey;
                executeCatalogItemKey(self, execOpt, catalogKey);
            });
        }
    }

    function renderResultGrid(self, resultgrid, data) {
        if (resultgrid) {
            //resultgrid.setAttribute('data', JSON.stringify(data));
            resultgrid.setAttribute('suppressprompts', 'true');
            resultgrid.setAttribute('showrowfilter', 'false');
            resultgrid.setAttribute('selectionmode', self.selectionMode());
            if (self.queryParams !== undefined) {
                data.parmContainer = self.queryParams;
            }
            resultgrid.queryContainerObject = data;
            resultgrid.refresh(data);

            self.data = data;

            var toolBar = self.querySelector('mi-tool-bar');
            if (toolBar) {
                for (var i = 0; i < self._loadConfigurableButtons().length; i++) {
                    toolBar.insertBefore(createButton(self, self._loadConfigurableButtons()[i].action,
                        self._loadConfigurableButtons()[i].title, self._loadConfigurableButtons()[i].iconClass), toolBar.firstChild);
                }
                toolBar.insertBefore(createButton(self, 'showFilter', 'Show Filter', 'icon-collection-filter'), toolBar.firstChild);
                toolBar.insertBefore(createButton(self, 'searchItem', 'Search Item', 'icon-search'), toolBar.firstChild);
                if (self.addEnabled()) {
                    toolBar.insertBefore(createButton(self, 'addItem', 'Add Item', 'icon-plus'), toolBar.firstChild);
                }
            }
        }
    }

    function executeCatalogItemKey(self, options, catalogItemKey) {
        // Load the catalog item.
        self.catalogService.getCatalogItem(catalogItemKey)
            .done(getCatalogItemForExecute_done.bind(null, self, options))
            .fail(handleAjaxRequestError.bind(null, self));
    }

    function getCatalogItemForExecute_done(self, options, dto) {
        executeCatalogItem(self, options, dto);
    }

    function executeCatalogItem(self, options, catalogItem) {
        var queryState = catalogItem.query.layout;

        // If we don't have a layout and a valid query state, execute the sql.
        // Otherwise, execute the query container.
        if (!queryState || !queryState.queryContainer) {
            executeSqlStatement(self, options, catalogItem.query.source);
        } else {
            executeQueryContainer(self, options, new QueryContainerDTO(queryState.queryContainer));
        }
    }

    function executeSqlStatement(self, options, sqlStatement) {
        self.queryService.compileString(sqlStatement)
            .done(compileStringForExecute_done.bind(null, self, options))
            .fail(handleAjaxRequestError.bind(null, self));
    }

    function compileStringForExecute_done(self, options, queryContainer) {
        executeQueryContainer(self, options, queryContainer);
    }

    function executeQueryContainer(self, options, queryContainer) {
        // Prompt for values.
        obtainParamValues(self, options, queryContainer)
               .done();
    }

    function obtainParamValues(self, options, queryContainer) {
        var dfd = $.Deferred();

        // Only prompt if there are parameters.
        if (queryContainer.parmContainer &&
            queryContainer.parmContainer.parmDesigns &&
            queryContainer.parmContainer.parmDesigns.length) {
            // Return a promise for compiling the container parameters AND resolving the
            // dialog. Note that the result of compiling the container and its parameters
            // will be passed in as the last argument of showPromptDialog.
            return self.queryService.compileContainerParameters(queryContainer)
                       .then(populateFiltersWithParams.bind(null, self),
                             handleAjaxRequestError.bind(null, self));
        } else {
            var resultgrid = self.querySelector('mi-resultgrid');
            resultgrid.setAttribute('queryexecutionmode', 'queryContainer');

            renderResultGrid(self, resultgrid, queryContainer);
            dfd.resolve();
            return dfd.promise();
        }
    }

    function populateFiltersWithParams(self, queryContainer) {
        // Update the query container with the prompt values.
        var kom, applicationEvents, routeArgs, data, resultgrid;

        kom = Object.resolve(KnockoutManager);
        applicationEvents = Object.resolve(ApplicationEvents);
        self.queryPromptViewModel = new QueryPromptViewModel(kom, applicationEvents);

        routeArgs = routeArgs || {};
        routeArgs.queryContainer = queryContainer;
        self.queryContainer = queryContainer;
        self.queryPromptViewModel.load(routeArgs);

        data = self.queryPromptViewModel.getParameterValues();

        resultgrid = self.querySelector('mi-resultgrid');
        resultgrid.setAttribute('queryexecutionmode', 'queryContainer');

        renderResultGrid(self, resultgrid, self.queryContainer);
    }

    function handleErrorMsg(self, message) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = message,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        //self._appEvents.errorOccured.raise(self, errorMessage);
    }

    function handleAjaxRequestError(self, response) {
        handleErrorMsg(self, response.statusText);
    }

    function createButton(self, action, title, iconClass) {
        var button = document.createElement('button'),
            icon = document.createElement('i'),
            disabled = '';
        
        if (action === 'showFilter') {
            disabled = checkFilterDisabled(self) ? ' disabled': '';
            self.disabled(checkFilterDisabled(self));
        }

        button.className = 'btn btn-default btn-icon default-buttons-right' + disabled;
        button.setAttribute('data-action', action);
        button.title = title;
        icon.className = iconClass;
        button.appendChild(icon);
        return button;
    }

    function checkFilterDisabled(self) {
        //var disabled = '';

        if (!(self.data.parmContainer.parmDesigns && self.data.parmContainer.parmDesigns.length > 0)) {
            //disabled = 'disabled';
            return true;
        }
        return false;
    }

    function addAttributes(self) {
        self.addEnabled = ko.observable(true);
        if (self.getAttribute('addenabled') !== null) {
            self.addEnabled(converter.toBoolean(self.getAttribute('addenabled'), 'true'));
        }

        self.selectionMode = ko.observable('multiple');
        if (self.getAttribute('selectionmode') !== null) {
            self.selectionMode(self.getAttribute('selectionmode'));
        }
    }

    function addProperties(self) {
        self._loadConfigurableButtons = null;
        Element.defineProperty(self, 'loadConfigurableButtons', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });

        self._toolbarItemClickCallback = null;
        Element.defineProperty(self, 'toolbarItemClickCallback', {
            get: getToolbarItemClickCallback.bind(null, self),
            set: setToolbarItemClickCallback.bind(null, self)
        });

        self._queryParams = null;
        Element.defineProperty(self, 'queryParams', {
            get: function () { return self._queryParams; }.bind(self),
            set: function (value) { self._queryParams = value; }.bind(self)
        });
    }

    function getLoader(self) {
        return self._loadConfigurableButtons;
    }

    function setLoader(self, value) {
        self._loadConfigurableButtons = value;
    }

    function getToolbarItemClickCallback(self) {
        return self._toolbarItemClickCallback;
    }

    function setToolbarItemClickCallback(self, value) {
        self._toolbarItemClickCallback = value;
    }

    function UpdateQuery(self, value) {
        var i, j, filters = Object.keys(self.filters), parmDesigns, caption, parmPrompts, isMultiValue;

        if (self.queryContainer) {
            parmDesigns = self.queryContainer.parmContainer.parmDesigns;

            //looping through each select
            for (i = 0; i < parmDesigns.length; i++) {
                caption = parmDesigns[i].caption;

                //if the current param has data
                if (filters.length > 0 && filters.indexOf(caption) >= 0) {
                    self.queryContainer.parmContainer.parmDesigns[i].parmPrompts = [];

                    isMultiValue = self.queryContainer.parmContainer.parmDesigns[i].isMultiValue;

                    //if multi value push the selected options
                    if (isMultiValue) {
                        for (j = 0; j < self.filters[caption].length; j++) {
                            self.queryContainer.parmContainer.parmDesigns[i].parmPrompts.push(self.filters[caption][j]);
                        }
                    }
                        //if single select push the selected option
                    else {
                        self.queryContainer.parmContainer.parmDesigns[i].parmPrompts.push(self.filters[caption]);
                    }
                }
                else {
                    self.queryContainer.parmContainer.parmDesigns[i].parmPrompts = [];
                }
            }

            var queryContainerDTO = new QueryContainerDTO(self.queryContainer);
            var resultgrid = self.querySelector('mi-resultgrid');
            if (resultgrid) {
                resultgrid.setAttribute('data', JSON.stringify(queryContainerDTO));
                resultgrid.setAttribute('queryexecutionmode', 'queryContainer');
            }
        }
    }

    function AddValueChange(self, e, val) {

        var caption = $(e.target).data('caption');
        if (self.filters[caption]) {
            delete self.filters[caption];
        }

        if (val.length > 0) {
            self.filters[caption] = val;
        }
    }

    document.registerElement('mi-task-manager', { prototype: proto });

    return proto;
});