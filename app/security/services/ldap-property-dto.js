define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function LdapPropertyDTO(data) {
        data = data || {};

        this.key = convert.toString(data.key) || '0';
        this.ldapName = convert.toString(data.ldapName);
        this.apmName = convert.toString(data.apmName);
    }

   

    LdapPropertyDTO.fromDataCollection = function LdapPropertyDTO_fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new LdapPropertyDTO(dataCollection[i]);
        }
        return dtos;
    };

    return LdapPropertyDTO;
});