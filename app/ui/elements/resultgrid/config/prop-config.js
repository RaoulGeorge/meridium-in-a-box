define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    function PropertiesConfig() {

    }

    function getButtons(self) {
        return self._loadConfigurableButtons;
    }

    function setButtons(self, value) {
        self._loadConfigurableButtons = value;
        self.toolbarHelper.renderToolbars(self);
    }

    function getLoader(self) {
        return self._loadJSONData;
    }

    function setLoader(self, value) {
        self._loadJSONData = value;
        self.reload();
    }

    function getBorder(self) {
        return self._showGridBorder;
    }

    function setBorder(self, value) {
        self._showGridBorder = value;
    }

    PropertiesConfig.prototype.addProperties = function PropertiesConfig_addProperties(self) {
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
        self._showGridBorder = false;
        Element.defineProperty(self, 'showGridBorder', {
            get: getBorder.bind(null, self),
            set: setBorder.bind(null, self)
        });

      
    };


    return PropertiesConfig;
});