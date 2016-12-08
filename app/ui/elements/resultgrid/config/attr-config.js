define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var ko = require('knockout');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    function AttributesConfig(self) {
        this.vm = self;
        self.data = ko.observable();
        self.allowColumnResizing = ko.observable(true);
        self.allowColumnReordering = ko.observable(true);
        self.hasColumnChooser = ko.observable(true);
        self.selectionMode = ko.observable('multiple');
        self.showRowFilter = ko.observable(false);
        self.hideEditControls = ko.observable(false);
        self.showGroupingPanel = ko.observable(true);
        self.allowRowEditing = ko.observable(false);
        self.allowRowAdding = ko.observable(false);
        self.allowRowDeleting = ko.observable(false);
        self.editMode = ko.observable('batch');
        self.sortingMode = ko.observable('multiple');
        self.pageSize = ko.observable(100);
        self.scrollType = ko.observable('standard');
        self.queryExecutionMode = ko.observable('sqlStatement');
        self.suppressPrompts = ko.observable(false);
        self.columnAutoWidth = ko.observable(true);
        self.wordWrapEnabled = false;
        self.showFooter = true;
        self.showPaging = true;
    }

    //Assigning attribute value to vm variable if not null
    //third argument is to convert value to boolean
    //second argument may or may not be a function
    function addAttrValue(self, attr, callback, isBoolean) {
        var attrValue = self.getAttribute(attr), valueToAssign;
        if (!_.isNull(attrValue)) {
            valueToAssign = isBoolean ? converter.toBoolean(attrValue, 'true') : attrValue;
            _.isFunction(callback) ? callback(valueToAssign) : callback = valueToAssign;
        }
    }

    AttributesConfig.prototype.addAttributes = function AttributesConfig_addAttributes(self) {

        addAttrValue(self, 'data', self.data);
        addAttrValue(self, 'allowcolumnresizing', self.allowColumnResizing, true);
        addAttrValue(self, 'allowcolumnreordering', self.allowColumnReordering, true);
        addAttrValue(self, 'hascolumnchooser', self.hasColumnChooser, true);
        addAttrValue(self, 'selectionmode', self.selectionMode);
        addAttrValue(self, 'showrowfilter', self.showRowFilter, true);
        addAttrValue(self, 'hideeditcontrols', self.hideEditControls, true);
        addAttrValue(self, 'showgroupingpanel', self.showGroupingPanel, true);
        addAttrValue(self, 'allowrowediting', self.allowRowEditing, true);
        addAttrValue(self, 'allowrowadding', self.allowRowAdding, true);
        addAttrValue(self, 'allowrowdeleting', self.allowRowDeleting, true);
        addAttrValue(self, 'editmode', self.editMode);
        addAttrValue(self, 'sortingmode', self.sortingMode);
        addAttrValue(self, 'pagesize', self.pageSize);
        addAttrValue(self, 'scrolltype', self.scrollType);
        addAttrValue(self, 'queryexecutionmode', self.queryExecutionMode);
        addAttrValue(self, 'suppressprompts', self.suppressPrompts, true);
        addAttrValue(self, 'columnautowidth', self.columnAutoWidth, true);
        addAttrValue(self, 'wordwrapenabled', self.wordWrapEnabled, true);
        addAttrValue(self, 'showfooter', self.showFooter, true);
        addAttrValue(self, 'showpaging', self.showPaging, true);
    };


    AttributesConfig.prototype.handleAttributeChange = function AttributesConfig_handleAttributeChange(attrName, oldVal, newVal) {
        var self = this.vm;

        switch (attrName) {
            case 'data': self.data(newVal); self._refreshList(self); break;
            case 'allowcolumnresizing': self.allowColumnResizing(converter.toBoolean(newVal, 'true')); break;
            case 'allowcolumnreordering': self.allowColumnReordering(converter.toBoolean(newVal, 'true')); break;
            case 'hascolumnchooser': self.hasColumnChooser(converter.toBoolean(newVal, 'true')); break;
            case 'selectionmode': self.selectionMode(newVal); break;
            case 'showgroupingpanel': self.showGroupingPanel(converter.toBoolean(newVal, 'true')); break;
            case 'allowrowediting': self.allowRowEditing(converter.toBoolean(newVal, 'true')); break;
            case 'allowrowadding': self.allowRowAdding(converter.toBoolean(newVal, 'true')); break;
            case 'allowrowdeleting': self.allowRowDeleting(converter.toBoolean(newVal, 'true')); break;
            case 'editmode': self.editMode(converter.toString(newVal)); break;
            case 'sortingmode': self.sortingMode(newVal); break;
            case 'showrowfilter': self.showRowFilter(converter.toBoolean(newVal, 'true')); break;
            case 'hideeditcontrols': self.hideEditControls(converter.toBoolean(newVal, 'true')); break;
            case 'pagesize': self.pageSize(converter.toInteger(newVal, 'true')); break;
            case 'scrolltype': self.scrollType(newVal); break;
            case 'queryexecutionmode': self.queryExecutionMode(newVal); break;
            case 'suppressprompts': self.suppressPrompts(converter.toBoolean(newVal, 'true')); break;
            case 'columnautowidth': self.columnAutoWidth(converter.toBoolean(newVal, 'true')); break;
            case 'wordwrapenabled': self.wordWrapEnabled = converter.toBoolean(newVal, 'true'); break;
            case 'showfooter': self.showFooter = converter.toBoolean(newVal, 'true'); break;
            case 'showpaging': self.showpaging = converter.toBoolean(newVal, 'true'); break;
        }

    };

    return AttributesConfig;
});