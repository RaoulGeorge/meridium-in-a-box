define(function (require) {
    'use strict';

    var _ = require('lodash'),
        $ = require('jquery'),
        m = require('mithril'),
        Filter = require('../models/filter'),
        CatalogService = require('catalog/services/catalog-service'),
        QueryExecutionEngine = require('query/execution/query-execution-engine'),
        PageFilterService = require('../services/page-filter-service'),
        Translator = require('system/globalization/translator'),
        ApplicationContext = require('application/application-context'),
        AssetContextDTO = require('assets/services/asset-context-dto'),
        MessageBox = require('system/ui/message-box'),
        Assert = require('mi-assert');

    function PageFilterViewModel() {
        this.catalogService = Object.resolve(CatalogService);
        this.pageFilterService = Object.resolve(PageFilterService);
        this.translator = Object.resolve(Translator);
        this.preferenceLoaded = m.prop(false);
        this.id = m.prop('');
        this.caption = m.prop('');
        this.filter = m.prop();
        this.filtersDisplayed = m.prop(false);
        this.values = m.prop();
        this.connections = m.prop([]);
        this.filterLoaded = m.prop(false);
        this.defaultAsset = AssetContextDTO.default();
    }

    PageFilterViewModel.prototype.loadState = function (data) {
        tryRestoreState(this, data);
        initFilter(this);
    };

    function tryRestoreState(self, data) {
        if (data) {
            self.id(data.id);
            self.caption(data.caption);
            self.filter(data.filter);
            self.filtersDisplayed(data.filtersDisplayed);
            self.values(data.values);
            self.preferenceLoaded(data.preferenceLoaded);
        }
    }

    function initFilter(self) {
        if (!self.id() || self.values()) {
            tryApplyFilter(self);
        } else {
            tryLoadValues(self);
        }
    }

    function tryApplyFilter(self) {
        assertThis(self);
        if (self.values()) {
            publish(self);
            return;
        }

        if (self.filter()) {
            loadFilter(self);
            return;
        }

        publish(self);
    }

    function publish(self, connections) {
        assertThis(self);
        connections = connections || self.connections();
        _.invoke(connections, 'publish', self.values());

    }

    function loadFilter(self) {
        assertThis(self);
        var dfd = $.Deferred();
        if (self.filter()) {
            self.catalogService.getCatalogItemKey(self.filter())
                .done(loadFilter_done.bind(null, self, dfd));
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    }

    function loadFilter_done(self, dfd, key) {
        assertThis(self);
        var query = Object.resolve(QueryExecutionEngine, { catalogItemKey: key });
        query.compile()
            .done(compile_done.bind(null, self, dfd));
    }

    function compile_done(self, dfd, queryContainer) {
        updateFilterValues(self, queryContainer);
        saveFilterValues(self);
        publish(self);
        self.filterLoaded(true);
        dfd.resolve();
        m.redraw();
    }

    function updateFilterValues(self, queryContainer) {
        self.setValues(extractFilters(self, queryContainer.parmContainer));
    }

    PageFilterViewModel.prototype.setValues = function (values) {
        this.values(values);
    };

    function extractFilters(self, parameterContainer) {
        Assert.ok(parameterContainer);
        var parmDesigns = parameterContainer.parmDesigns || [];
        return {
            hasDependencies: false,
            parmDesigns: _.map(parmDesigns, copyParameter.bind(null, self))
        };
    }

    function saveFilterValues(self) {
        self.pageFilterService.save(self.id(), self.values());
    }

    function copyParameter(self, parameter) {
        return {
            id: parameter.id,
            dataType: parameter.dataType,
            isAssetHierarchy: parameter.isAssetHierarchy || false,
            assetHierarchyCaption: parameter.assetHierarchyCaption || self.defaultAsset.description,
            parmPrompts: parameterValue(parameter, parameter.isAssetHierarchy || false),
            isMultiValue: parameter.isMultiValue || false
        };
    }

    function parameterValue(parameter, isAssetHierarchy) {
        Assert.ok(parameter, 'parameter');
        Assert.ok(parameter.parmPrompts, 'parameter.parmPrompts');
        var context = ApplicationContext.assetcontext;

        if (parameter.parmPrompts.length) {
            if (isAssetHierarchy) {
                if (parameter.parmPrompts[0]) {
                    return parameter.parmPrompts;
                } else {
                    return [context.entityKey || '-1'];
                }
            } else {
                return parameter.parmPrompts;
            }
        } else {
            if (isAssetHierarchy) {
                return [parameter.defaultValue || context.entityKey || '-1'];
            } else {
                return parameter.defaultValue !== null ? [parameter.defaultValue] : [];
            }
        }
    }

    function tryLoadValues(self) {
        if (!self.preferenceLoaded()) {
            self.pageFilterService.get(self.id())
                .done(loadValues_done.bind(null, self));
        }
    }

    function loadValues_done(self, values) {
        tryUpdateAssetHierarchyParameters(self, values);
        self.setValues(values);
        self.setPreferenceLoaded(true);
        m.redraw();
        tryApplyFilter(self);
    }

    PageFilterViewModel.prototype.setPreferenceLoaded = function (value) {
        this.preferenceLoaded(value);
    };

    function tryUpdateAssetHierarchyParameters(self, values) {
        var callback = tryUpdateAssetHierarchyValue.bind(null, self);
        if (values && values.parmDesigns) {
            _.forEach(values.parmDesigns, callback);
        }
    }

    function tryUpdateAssetHierarchyValue(self, parameter) {
        var context = ApplicationContext.assetcontext;
        if (parameter.isAssetHierarchy) {
            if (context) {
                parameter.assetHierarchyCaption = context.description || self.defaultAsset.description;
                parameter.parmPrompts = [context.entityKey || '-1'];
            }
        }
    }

    PageFilterViewModel.prototype.saveState = function () {
        return {
            id: this.id(),
            caption: this.caption(),
            filter: this.filter(),
            filtersDisplayed: this.filtersDisplayed(),
            values: this.values(),
            preferenceLoaded: this.preferenceLoaded()
        };
    };

    PageFilterViewModel.prototype.collapseBody = function () {
        this.filtersDisplayed(false);
    };

    PageFilterViewModel.prototype.expandBody = function () {
        this.filtersDisplayed(true);
    };

    PageFilterViewModel.prototype.editFilters = function () {
        var dfd = $.Deferred();
        if (this.filter()) {
            this.catalogService.getCatalogItemKey(this.filter())
                .done(getCatalogItemKey_done.bind(null, this, dfd));
        } else {
            dfd.resolve();
        }
        return dfd.promise();
    };

    function getCatalogItemKey_done(self, dfd, key) {
        assertThis(self);
        var query = Object.resolve(QueryExecutionEngine, { catalogItemKey: key });
        query.prompt({ parameters: self.values() })
            .done(prompt_done.bind(null, self, dfd));
    }

    function prompt_done(self, dfd, queryContainer) {
        if (hasParameters(queryContainer)) {
            updateFilterValues(self, queryContainer);
            saveFilterValues(self);
            resetSkipFilterLoad();
            publish(self);
        } else {
            notifyNoParameters(self);
        }
        dfd.resolve();
        m.redraw();
    }

    function resetSkipFilterLoad() {
        var pageFilterElement = document.getElementsByTagName('mi-page-filter'),
            chartElements;

        if(pageFilterElement.length) {
            chartElements = pageFilterElement[0].getElementsByTagName('mi-chart');

            if(chartElements) {
                for(var i = 0; i < chartElements.length; i++) {
                    chartElements[i].skipFilterLoad = false;
                }
            }
        }
    }

    function hasParameters(queryContainer) {
        return !!(queryContainer.parmContainer && queryContainer.parmContainer.parmDesigns);
    }

    function notifyNoParameters(self) {
        var message = self.translator.translate('NO_QUERY_PARAMETERS'),
            title = self.translator.translate('QUERY_EXEC_PROMPT_DLG_TITLE');
        MessageBox.showOk(message, title);
    }

    PageFilterViewModel.prototype.deleteFilter = function (filter) {
        Filter.remove(this.values(), filter);
    };

    PageFilterViewModel.prototype.hasFiltersApplied = function () {
        assertThis(this);
        if (!this.values()) { return false; }
        if (!this.values().parmDesigns) { return false; }
        return this.values().parmDesigns.length > 0;
    };

    PageFilterViewModel.prototype.addConnection = function (connection) {
        Assert.ok(connection);
        this.connections().push(connection);
        if (hasValues(this) || wasLoadedWithoutFilter(this)) {
            publish(this, [connection]);
        }
    };

    function hasValues(self) {
        return !!self.values();
    }

    function wasLoadedWithoutFilter(self) {
        var noFilter = !self.filter(),
            isLoaded = self.filterLoaded();
        return isLoaded && noFilter;
    }

    PageFilterViewModel.prototype.removeConnection = function (connection) {
        Assert.ok(connection);
        return _.remove(this.connections(), connection.isSame.bind(connection));
    };

    PageFilterViewModel.prototype.reload = function () {
        tryLoadValues(this);
    };

    PageFilterViewModel.prototype.loadWithoutFilter = function () {
        this.filterLoaded(true);
        publish(this);
        m.redraw();
    };

    PageFilterViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    PageFilterViewModel.prototype.assetName = function () {
        var i, parameter;
        if (this.values()) {
            for (i = 0; i !== this.values().parmDesigns.length; i++) {
                parameter = this.values().parmDesigns[i];
                if (parameter.isAssetHierarchy) {
                    return parameter.assetHierarchyCaption;
                }
            }
            return null;
        } else {
            return null;
        }
    };

    function assertThis(self) {
        Assert.instanceOf(self, PageFilterViewModel);
    }

    return PageFilterViewModel;
});
