define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        DatasheetDialog = require('platform/datasheets/datasheet-dialog');

    function DatasheetDialogActionRoute() {

    }

    DatasheetDialogActionRoute.prototype.execute = function (config) {
        var dfd = $.Deferred(),
            entitykey = config.routeArgs.entitykey,
            datasheetConfig = {
                    'functionsAvailable': ['references', 'history'],
                    'readOnly': true,
                    'canedit': true,
                    'showDatasheetSelection': true
            },
            datasheetOptions = {
                'entityObj': entitykey
            },
            datasheetDialog = new DatasheetDialog(datasheetOptions, datasheetConfig, 'Datasheet', false);

        datasheetDialog.show();
        dfd.resolve();

        return dfd;
    };


    return DatasheetDialogActionRoute;
});