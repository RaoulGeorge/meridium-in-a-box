define(function (require) {
    'use strict';

    var UserSiteDTO = require('./usersite-dto');
    var convert = require('system/lang/converter');

    function SiteDTO(data) {
        data = data || {};

        this.name = convert.toString(data.name);
        this.key = convert.toString(data.key) || '0';
        this.lockSeq = convert.toString(data.lockSeq);
        this.users = UserSiteDTO.fromDataCollection(data.users);
    }

    SiteDTO.fromDataCollection =
        function SiteDTO_fromDataCollection(dataCollection) {
            if (!dataCollection) {
                return undefined;
            }

            var i, dtos = [];
            for (i = 0; i < dataCollection.length; i++) {
                dtos[dtos.length] = new SiteDTO(dataCollection[i]);
            }
            return dtos;
        };

    return SiteDTO;
});