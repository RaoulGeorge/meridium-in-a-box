define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function EntityFamilyDTO(data) {
        data = data || {};
        this.id = convert.toString(data.id);
        this.description = convert.toString(data.description);
        this.defaultCaption = convert.toString(data.defaultCaption);
        this.databaseTableName = convert.toString(data.databaseTableName);
        this.caption = convert.toString(data.caption);
        this.description = convert.toString(data.description);
        this.isBaselineFamily = convert.toString(data.isBaselineFamily);
        this.isRuleLock = convert.toString(data.isRuleLock);
        this.isSystemFamily = convert.toString(data.isSystemFamily);
        this.key = convert.toString(data.key);
        this.parentKey = convert.toString(data.parentKey);
        this.updateDate = convert.toString(data.updateDate);
        this.updateUser = convert.toString(data.updateUser);
        this.status = convert.toString(data.status);
        this.securityPrivileges = convert.toString(data.securityPrivileges);
        this.redirectionUrl = convert.toString(data.redirectionUrl);
        this.useUrlRedirection = convert.toString(data.useUrlRedirection);
        this.isauditable = convert.toString(data.isauditable);
        //this.fields = data.fields || '';
        //this.relationships = data.relationships || '';
        //this.predecessors = data.predecessors || '';
    }

    EntityFamilyDTO.fromDataCollection = function EntityFamilyDTO_fromDataCollection(dataCollection) {
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new EntityFamilyDTO(dataCollection[i]);
        }
        return dtos;
    };

    return EntityFamilyDTO;
});