define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function FmlyPrivDTO(data) {
        data = data || {};
        this.key = convert.toString(data.key);
        this.userKey = convert.toString(data.userKey);
        this.userDisplay = convert.toString(data.userDisplay);
        this.groupKey = convert.toString(data.groupKey);
        this.groupDisplay = convert.toString(data.groupDisplay);
        this.familyKey = convert.toString(data.familyKey);
        this.familyId = convert.toString(data.familyId);
        this.familyDisplay = convert.toString(data.familyDisplay);
        this.privilege = convert.toString(data.privilege);
        this.ins = data.privilege === (data.privilege = data.privilege | 1);
        this.vw = data.privilege === (data.privilege = data.privilege | 2);
        this.upd = data.privilege === (data.privilege = data.privilege | 4);
        this.del = data.privilege === (data.privilege = data.privilege | 8);
        this.hash = this.ins + this.vw + this.upd + this.del;
        this.isDirty = false;
        this.isDeleted = false;
    }

    FmlyPrivDTO.fromDataCollection = function FmlyPrivDTO_fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new FmlyPrivDTO(dataCollection[i]);
        }
        return dtos;
    };

    return FmlyPrivDTO;
});