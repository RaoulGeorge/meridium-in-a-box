define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function DomainDTO(data) {
        data = data || {};
        this.key = convert.toString(data.key) || '0';
        this.allUserFilter = convert.toString(data.allUserFilter);
        this.singleUserFilter = convert.toString(data.singleUserFilter);
        this.domainName = convert.toString(data.domainName);
        this.rootCaption = convert.toString(data.rootCaption);
        this.domainNetBiosName = convert.toString(data.domainNetBiosName);
        this.domainCaption = convert.toString(data.domainCaption);
        this.domainGroupFilter = convert.toString(data.domainGroupFilter);
        this.lockSeq = convert.toString(data.lockSeq);
        this.propertyMappings = require('./ldap-property-dto').fromDataCollection(data.propertyMappings);
        this.users=require('./domain-user-dto').fromDataCollection(data.users);
    }

    DomainDTO.fromDataCollection =function DomainDTO_fromDataCollection(dataCollection) {
            if (dataCollection === undefined) {
                return undefined;
            }

            var i, dtos = [];
            for (i = 0; i < dataCollection.length; i++) {
                dtos[dtos.length] = new DomainDTO(dataCollection[i]);
            }
            return dtos;
        };

    return DomainDTO;
});