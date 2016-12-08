define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var ko = require('knockout');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    var TypeNameMap = {
        'System.DateTime': 'date',
        'System.Double': 'number',
        'System.Boolean': 'boolean'
    };

    function ColumnInfoDTO(queryDataColumn) {
        this.dataField = getDataField(queryDataColumn);
        this.visible = queryDataColumn.getIsDisplayed();
        this.dataType = getDataType(queryDataColumn);
        this.hyperlinkFormat = queryDataColumn.getHyperlinkFormat();

        //To look like old querydatacolumn
        this.id = queryDataColumn.getFieldId();
        this.fieldId = queryDataColumn.getFieldId();
        this.alias = queryDataColumn.getAlias();

        //For datatype finding while columndesigns filters applying
        this.typename = queryDataColumn.getTypeName();
        this.columnDesignKey = queryDataColumn.getColumnDesignKey();
        this.hasCellTemplate = false;
    }

    function getDataField(queryDataColumn) {
        var dataField = queryDataColumn.getAlias() || queryDataColumn.getFieldId();

        if (!isNaN(dataField)) {
            dataField = dataField + "_";
        }

        return dataField;
    }

    function getDataType(queryDataColumn) {
        var dataType;
       
        dataType = TypeNameMap[queryDataColumn.getTypeName()];

        if (queryDataColumn.getFieldDataType() === 'Boolean') {
            dataType = 'boolean';
        }
        return dataType;
    }

    return ColumnInfoDTO;
});