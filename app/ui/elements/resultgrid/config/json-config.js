define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var defaultConfig = require('./default-config');
    var helper = Object.resolve(require('../helpers/json-helper'));

    function JsonConfig(self, data, cols) {
        var config =  {
            dataSource: data.data,
            columns: cols,
            pager: {
                visible: false,
            },
            onCellPrepared: helper.handleCellPrepared.bind(null, self),
            onInitNewRow: helper.handleInitNewRow.bind(null, self),
            onRowPrepared: helper.handleRowPrepared.bind(null, self),
            onContentReady: helper.handleContentReadyActionForJSON.bind(helper, self),
            onSelectionChanged: (cols ? helper.handleSelectionChangedForJSON.bind(null, self) : helper.handleSelectionChangeForJsonWithoutColumns.bind(null, self)),
            onEditorPrepared: helper.handleEditorPreparedForJson.bind(helper, self),
            onEditingStart: helper.handleEditingStart.bind(null, self)
        };

        if (self.scrollType() === 'standard') {
            config.paging = pagingConfig(self);
        }

        if (data.config) {
            $.extend(config, data.config); //Extending data config if passed by module
        }

        $.extend(config, defaultConfig(self));

        return config;
    }


    function pagingConfig(self) {
        return {
            enabled: true,
            pageSize: self.pageSize()
        };
    }

    return JsonConfig;
});