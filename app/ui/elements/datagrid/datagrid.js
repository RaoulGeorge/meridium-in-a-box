/*jshint maxstatements: false */
/*jshint maxcomplexity: false */
define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');

    var view = require('text!./datagrid-view.html'),
        ko = require('knockout'),
        MessageBox = require('system/ui/message-box'),
        converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator'),
        ApplicationEvents = require('application/application-events'),
        ApplicationContext = require('application/application-context');

    require('ui/elements/checkbox/checkbox-view-model');
    require('ui/elements/tool-bar/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var self = this;
        this.element = this;
        this.translator = Object.resolve(Translator);
        self.gridInstance = null;
        self.totalCount = ko.observable();
        self.onContentReady = onContentReady.bind(null, self);
        self.listObjects = ko.observableArray([{ displayName: "0", val: 0 }]);
        self.optionsValue = 'val';
        self.selectedValue = ko.observable(0);
        self.selectedValueSubscription = null;

        addAttributes(this);
        addProperties(this);
    };

    proto.attachedCallback = function () {
        var self = this;
        this.element.innerHTML = view;
        ko.applyBindings(this, $(this.element).find('mi-select')[0]);
        ko.applyBindings(this, $(this.element).find('.totalCount')[0]);
        self.selectedValueSubscription = self.selectedValue.subscribe(changePage.bind(null, self));
    };

    proto.detachedCallback = function () {
        var self = this;
        self.selectedValueSubscription.dispose();
        self.selectedValueSubscription = null;
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var self = this;
    };

    function addAttributes(self) {

    }

    function addProperties(self) {
        self._loadJSONData = null;
        Element.defineProperty(self, 'config', {
            get: getConfig.bind(null, self),
            set: setConfig.bind(null, self)
        });
    }

    function setConfig(self, config) {
        if (!config) { return; }
        require(['devExWebJS'], function () {

            self.config(config);
            self.gridInstance = self.config('instance');
            self.gridInstance.off('contentReady', self.onContentReady).on('contentReady', self.onContentReady);
            $(self.element).find('.dx-datagrid-pager.dx-pager').hide();
            $(self.element).find('.dg-header').show();
        });
    }

    function getConfig(self) {
        return $(self.element).find('.gridContainer').dxDataGrid.bind($(self.element).find('.gridContainer'));
    }

    function onContentReady(self) {
        setTotalCount(self);
        updatePager(self);
    }

    function setTotalCount(self) {
        self.totalCount(self.gridInstance.totalCount());
    }

    function updatePager(self) {
        var opt = "";
        var menuObjects = [];
        var pageSize = self.gridInstance.pageSize();
        var pageIndex = self.gridInstance.pageIndex();
        var rowlength = self.totalCount() || 0;

        if (rowlength) {
            var optlength = rowlength / pageSize;
            for (var i = 0; i < optlength; i++) {
                opt = ((i * pageSize) + 1) + " - " + (i + 1) * pageSize;
                menuObjects.push({ displayName: opt, val: i });
            }

            var lastOpt = menuObjects[menuObjects.length - 1];
            var optText = lastOpt.displayName;
            optText = optText.substr(0, optText.indexOf("-") + 2);
            lastOpt.displayName = optText + rowlength;
            self.selectedValue(pageIndex);
            self.listObjects(menuObjects);
        } else {
            self.selectedValue(0);
            self.listObjects([{ displayName: "0", val: 0 }]);
        }
    }

    function changePage(self, newPageIndex) {
        self.gridInstance.pageIndex(newPageIndex);
    }

    document.registerElement('mi-datagrid', { prototype: proto });

    return proto;
});
