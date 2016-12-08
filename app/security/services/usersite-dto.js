define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function UserSiteDTO(data) {
        data = data || {};

        this.key = convert.toString(data.key) || '0';
        this.siteKey = convert.toString(data.siteKey) || '0';
        this.userKey = convert.toString(data.userKey) || '0';
        this.viewOnly = convert.toBoolean(data.viewOnly) || false;
        this.siteName = convert.toString(data.siteName);
        this.userName = convert.toString(data.userName);
        this.lockSeq = convert.toString(data.lockSeq) || '0';
    }

    UserSiteDTO.fromDataCollection =
        function UserSiteDTO_fromDataCollection(dataCollection) {
            if (!dataCollection) {
                return undefined;
            }

            var i, dtos = [];
            for (i = 0; i < dataCollection.length; i++) {
                dtos[dtos.length] = new UserSiteDTO(dataCollection[i]);
            }
            return dtos;
        };

    return UserSiteDTO;
});