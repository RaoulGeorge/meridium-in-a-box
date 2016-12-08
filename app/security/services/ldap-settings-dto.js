define(function (require) {
    'use strict';

    var convert = require('system/lang/converter');

    function LdapSettingsDTO(data) {
        data = data || {};
        this.enableLdapIntegration = convert.toBoolean(data.enableLDAPIntegration);
        this.createUsersWithoutDomain = convert.toBoolean(data.createUsersWithoutDomain);
        this.enableInterfaceLog = convert.toBoolean(data.enableInterfaceLog);
        this.enableInformationalMessage = convert.toBoolean(data.enableInformationalMessage);
    }

    LdapSettingsDTO.fromDataCollection =
        function LdapSettingsDTO_fromDataCollection(dataCollection) {
            if (dataCollection === undefined) {
                return undefined;
            }

            var i, dtos = [];
            for (i = 0; i < dataCollection.length; i++) {
                dtos[dtos.length] = new LdapSettingsDTO(dataCollection[i]);
            }
            return dtos;
        };

    return LdapSettingsDTO;
});