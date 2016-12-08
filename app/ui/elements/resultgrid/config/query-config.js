define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var defaultConfig = require('./default-config');
    var helper = Object.resolve(require('../helpers/query-helper'));

    function QueryConfig(self) {
        var config = {
            dataSource: helper.handleDatasource(self),
            customizeColumns: helper.customizeColumns.bind(helper, self),
            paging: pagingConfig(self),
            onCellPrepared: helper.handleCellPreparedForQueryResult.bind(null, self),
            onContentReady: helper.handleContentReadyAction.bind(helper, self),
            onSelectionChanged: helper.handleSelectionChanged.bind(null, self),
            onRowPrepared: helper.handleRowPrepared.bind(null, self),
            onEditorPrepared: helper.handleEditorPreparedForQuery.bind(helper)
        };

        $.extend(config, defaultConfig(self));

        return config;
    }

    function pagingConfig(self) {
        return {
            enabled: false,
            pageSize: self.pageSize()
        };
    }

    return QueryConfig;
});