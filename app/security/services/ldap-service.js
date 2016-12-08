define(function (require) {
    'use strict';

    var $ = require('jquery');

    var AjaxClient = require('system/http/ajax-client'),
        AjaxRequest = require('system/http/ajax-request'),
        UserDTO = require('./user-dto'),
        GroupDTO = require('./group-dto'),
        RoleDTO = require('./role-dto'),
        SystemCodeDTO = require('./systemcode-dto'),
        UomConversionSetDTO = require('./uomconversionset-dto'),
        SessionDTO = require('./session-dto'),
        CultureDTO = require('./culture-dto'),
        TimezoneDTO = require('./timezone-dto'),
        AppConfigDTO = require('./appconfig-dto'),
        EntityFamilyDTO = require('./entityfamily-dto'),
        FamilyDTO = require('./family-dto'),
        FmlyPrivDTO = require('./fmlypriv-dto'),
        KeyIdList = require('system/collections/key-id-list'),
        SECURITY_URL = 'meridium/api/core/security',
        APPCONFIG_URL = 'meridium/api/core/appconfig',
        FMLYPRIV_URL = 'meridium/api/core/security/priv',
        UOM_URL = 'meridium/api/core/uom',
        GLOBALIZATION_URL = 'meridium/api/core/globalization',
        METADATA_URL = 'meridium/api/core/metadata',
        SYSTEM_CODE_URL = 'meridium/api/core/systemcode',
        LdapSettingDTO = require('./ldap-settings-dto'),
        LDAPPREF_API_URL = 'meridium/api/core/preference/',
        SiteDTO = require('./site-dto'),
        UserSiteDTO = require('./usersite-dto'),
        LICENSE_URL = 'meridium/api/core/license/modules',
        LDAP_URL = '/meridium/api/scheduling/ldap',
        DomainDTO = require('./domain-dto');

    function LdapService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    LdapService.dependsOn = [AjaxClient];

    LdapService.prototype.url = function (url) {
        return this.ajaxClient.url(SECURITY_URL + url);
    };


    LdapService.prototype.deleteLdapProperty = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/ldap/ldapprops/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };



    LdapService.prototype.postLdapProperty = function (key, property) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/ldap/ldapprops/' + key + '/', property
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    return LdapService;
});