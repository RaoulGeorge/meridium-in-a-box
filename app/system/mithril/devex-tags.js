define(function (require) {
    "use strict";

    var m = require('mithril');

    return {
        dataGrid: m.bind(null, '.dx-datagrid.dx-datagrid-headers'),
        table: m.bind(null, 'table.dx-datagrid-table.dx-datagrid-table-fixed'),
        rowsView: m.bind(null, 'tbody.dx-datagrid-rowsview.dx-widget'),
        dataRow: m.bind(null, 'tr.dx-row dx-data-row.dx-column-lines')
    };
});