define(function (require) {
    'use strict';

    /* jshint maxstatements: 100 */

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

    function SecurityService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    SecurityService.dependsOn = [AjaxClient];

    SecurityService.prototype.url = function (url) {
        return this.ajaxClient.url(SECURITY_URL + url);
    };

    SecurityService.prototype.login = function (datasource, userId, password) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/login', {
            DatasourceId: datasource,
            Id: userId,
            Password: password
        }).done(function (data) {
            dfd.resolve(new SessionDTO(data, AjaxClient.server()));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getSession = function (sessionId) {
        var dfd = $.Deferred();
        this.ajaxClient.post('/api/core/security/session', {
            SessionId: sessionId
        }).done(function (data) {
            dfd.resolve(new SessionDTO(data, AjaxClient.server()));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.ssologin = function (ipdUrl) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/ssologin/?url=' + ipdUrl).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            if (response.status) {
                if (response.status===200) {
                    var start = response.responseText.indexOf('"');
                    var end = response.responseText.indexOf('"', start + 1);
                    var url = response.responseText.substring(start + 1, end);
                    console.log(url);
                    dfd.resolve(url);
                } else {
                    dfd.reject(response);
                }
            } else {
                dfd.reject(response);
            }
        }

        );
        return dfd.promise();
    };

    SecurityService.prototype.logout = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/logout').done(dfd.resolve.bind(dfd)).fail(dfd.reject.bind(dfd));
        return dfd.promise();
    };

    SecurityService.prototype.getUsers = function (smallObject, activeOnly) {
        var dfd = $.Deferred();
        var isSmall = smallObject ? 'smallObject=true' : 'smallObject=false';
        var isActiveOnly = activeOnly ? 'activeOnly=true' : 'activeOnly=false';
        var queryString = '?' + isSmall + '&' + isActiveOnly;
        this.ajaxClient.get(SECURITY_URL + '/user/' + queryString, {
        }).done(function (data) {
            dfd.resolve(new UserDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getUsersPage = function (pageOffset, pageSize, statusFilter, searchValue) {
        var dfd = $.Deferred();
        //var queryString = '?pageOffset=' + pageOffset + '&pageSize=' + pageSize + '&statusFilter=' + statusFilter + '&typeFilter=' + typeFilter + '&searhValue=' + searchValue;
        //var queryString = '?pageOffset=' + pageOffset + '&pageSize=' + pageSize;
        var queryString = '?statusFilter=' + statusFilter + '&searchValue=' + searchValue;
        this.ajaxClient.get(SECURITY_URL + '/userpage/' + pageOffset + '/' + pageSize + queryString, {
        }).done(function (data) {
            dfd.resolve(new UserDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getUser = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/user/' + key, {
        }).done(function (data) {
            dfd.resolve(new UserDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getSessionUser = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/sessionuser/', {
        }).done(function (data) {
            dfd.resolve(new UserDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.postUser = function (user) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/user', user
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putUser = function (user) {
        var dfd = $.Deferred();
        this.ajaxClient.put(SECURITY_URL + '/user', user
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.changePassword = function (user) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/change', user
        ).done(function (data) {
                dfd.resolve(data);
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.getSystemCodes = function (tableId) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SYSTEM_CODE_URL + '/code/table/?tableId=' + tableId, {
        }).done(function (data) {
            dfd.resolve(new SystemCodeDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getUomConversionSets = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(UOM_URL + '/conversionset', {
        }).done(function (data) {
            dfd.resolve(new UomConversionSetDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getCultures = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(GLOBALIZATION_URL + '/culture', {
        }).done(function (data) {
            dfd.resolve(new CultureDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getTimezones = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(GLOBALIZATION_URL + '/timezone', {
        }).done(function (data) {
            dfd.resolve(new TimezoneDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getGroups = function (smallObject, activeOnly) {
        var dfd = $.Deferred();
        var isSmall = smallObject ? 'smallObject=true' : 'smallObject=false';
        var isActiveOnly = activeOnly ? 'activeOnly=true' : 'activeOnly=false';
        var queryString = '?' + isSmall + '&' + isActiveOnly;
        this.ajaxClient.get(SECURITY_URL + '/group/' + queryString, {
        }).done(function (data) {
            dfd.resolve(new GroupDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getGroupChildren = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/groups/children/' + key, {
        }).done(function (data) {
            dfd.resolve(new GroupDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getGroupParents = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/groups/parents', {
        }).done(function (data) {
            dfd.resolve(new GroupDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getGroup = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/group/' + key, { 
        }).done(function (data) {
            dfd.resolve(new GroupDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };


    SecurityService.prototype.checkGroupPriv = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/groupPriv/' + key, {
        }).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.postGroup = function (group) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/group', group
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putGroup = function (group) {
        var dfd = $.Deferred();
        this.ajaxClient.put(SECURITY_URL + '/group', group
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.deleteGroup = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/group/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getRoles = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/roles', {
        }).done(function (data) {
            dfd.resolve(new RoleDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getRole = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/role/' + key, {
        }).done(function (data) {
            dfd.resolve(new RoleDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.postRole = function (role) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/role', role
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putRole = function (role) {
        var dfd = $.Deferred();
        this.ajaxClient.put(SECURITY_URL + '/role', role
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.deleteRole = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/role/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getRoleUsers = function (roleKey) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/roleuser/' + roleKey, {
        }).done(function (data) {
            dfd.resolve(new UserDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getUserRoles = function (userKey) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/userRole/' + userKey, {
        }).done(function (data) {
            dfd.resolve(new RoleDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putUserRoles = function (userKey,roles) {
        var dfd = $.Deferred();
        this.ajaxClient.put(SECURITY_URL + '/userRole', { userKey: userKey, roles: roles }
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getRoleGroups = function (roleKey) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/rolegroup/' + roleKey, {
        }).done(function (data) {
            dfd.resolve(new GroupDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.addRoleUsers = function (model) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/roleuser', model
            ).done(function (data) {
                dfd.resolve(data);
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.addRoleGroups = function (model) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/rolegroup', model
            ).done(function (data) {
                dfd.resolve(data);
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.deleteRoleUsers = function (roleKey,userKey) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/roleuser/' + roleKey + "/" +userKey
            ).done(function (data) {
                dfd.resolve(data);
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.deleteRoleGroups = function (roleKey, groupKey) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/rolegroup/' + roleKey + "/" + groupKey
            ).done(function (data) {
                dfd.resolve(data);
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };



    SecurityService.prototype.setLdapPreference =
       function securityService_setPreference(data) {
           var dfd = $.Deferred(),
               path = LDAPPREF_API_URL;
           this.ajaxClient.put(path, data).fail(function (response) {
               if (response.statusText !== 'OK') {
                   dfd.reject(response);
               } else {
                   dfd.resolve();
               }
           });
           return dfd.promise();
       };

    SecurityService.prototype.getLdapSettings = function () {
        var querystring = '/ldap/settings';
        var dfd = $.Deferred(), url = SECURITY_URL + querystring;
        this.ajaxClient.get(url
            ).done(function (data) {
                dfd.resolve(new LdapSettingDTO(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.getDomains = function () {
        var querystring = '/ldap/domains';
        var dfd = $.Deferred(), url = SECURITY_URL + querystring;
        this.ajaxClient.get(url
            ).done(function (data) {
                dfd.resolve(DomainDTO.fromDataCollection(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.getLdapSchedule = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(LDAP_URL, {
        }).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.postDomain = function (domain) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/ldap/domains/', domain
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.deleteDomain = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/ldap/domains/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };



    SecurityService.prototype.putDomain = function (domain) {
        var dfd = $.Deferred();
        this.ajaxClient.put(SECURITY_URL + '/ldap/domains', domain
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getDomain = function (key) {
        var querystring = '/ldap/domains/' + key;
        var dfd = $.Deferred(), url = SECURITY_URL + querystring;
        this.ajaxClient.get(url
            ).done(function (data) {
                dfd.resolve(new DomainDTO(data));
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };

    SecurityService.prototype.runLdap = function () {
        var querystring = '/ldap/run';
        var dfd = $.Deferred(), url = SECURITY_URL + querystring;
        this.ajaxClient.post(url
            ).done(function (data) {
                dfd.resolve(data);
            }).fail(function (response) {
                dfd.reject(response);
            });
        return dfd.promise();
    };



    ////Get Photo
    //SecurityService.prototype.getPhoto = function (key) {
    //    var dfd = $.Deferred();
    //    this.ajaxClient.get(SECURITY_URL + '/userphoto/' + key, {
    //    }).done(function (data) {
    //        dfd.resolve(new BlobDTO(data));
    //    }).fail(function (response) {
    //        dfd.reject(response);
    //    });
    //    return dfd.promise();
    //};

    //Create Photo
    SecurityService.prototype.postPhoto = function (parentKey) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/userphoto/'+ parentKey
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.postPhoto2 = function (sessionId,parentKey, fileContents, timestamp) {
         var dfd = $.Deferred();
         this.ajaxClient.post(SECURITY_URL + '/userphoto2?sessionId='+ sessionId + '&key=' + parentKey,fileContents,{
             processData: false,
             contentType: 'application/octet-stream', //false,
             xhr: function () {
                 var xhr = new window.XMLHttpRequest();
                 xhr.upload.addEventListener('progress', function (e) {
                     if (e.lengthComputable) {
                         var percentage = Math.round((e.loaded * 100) / e.total);
                         dfd.notify(percentage);
                     }
                 }, false);

                 xhr.upload.addEventListener('load', function () {
                     dfd.notify(100);
                 }, false);

                 return xhr;
             }
         })
                        .done(dfd.resolve.bind(dfd))
                .fail(dfd.reject.bind(dfd));

            return dfd.promise();
        };

    //Delete Photo
    SecurityService.prototype.deletePhoto = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/userphoto/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getPasswordConfigs = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(APPCONFIG_URL + '/3', {
        }).done(function (data) {
            dfd.resolve(new AppConfigDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putPasswordConfigs = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.put(APPCONFIG_URL + '/3', data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getUserDefaults = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(APPCONFIG_URL + '/6', {
        }).done(function (data) {
            dfd.resolve(new AppConfigDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putUserDefaults = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.put(APPCONFIG_URL + '/6', data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getFmlyPrivs = function (data) {
        var dfd = $.Deferred(), url = FMLYPRIV_URL + "s/" + data;
        this.ajaxClient.get(url).done(function (data) {
            dfd.resolve(FmlyPrivDTO.fromDataCollection(data));
        });
        return dfd.promise();
    };

    SecurityService.prototype.getFmlyPrivsAndChildren = function (data) {
        var dfd = $.Deferred(), url = FMLYPRIV_URL + "s/" + data + "/true";
        this.ajaxClient.get(url).done(function (data) {
            dfd.resolve(FmlyPrivDTO.fromDataCollection(data));
        });
        return dfd.promise();
    };

    SecurityService.prototype.searchFamilies =
        function getFamilyPaginate(searchValue, pageSize, pageNum) {
            var path = METADATA_URL + '/families/search?searchValue=' + searchValue + '&pageSize=' + pageSize + '&pageNum=' + pageNum,
                dfd = $.Deferred();
            this.ajaxClient.get(path, {})
                .done(function (data) {
                    if (!data || !data.length) {
                        dfd.resolve(null);
                    }
                    else {
                        dfd.resolve($.map(data, function (item) { return new EntityFamilyDTO(item); }));
                    }
                })
                .fail(function (response) {
                    dfd.reject(response);
                });
            return dfd.promise();
        };

    SecurityService.prototype.postFmlyPriv = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.post(FMLYPRIV_URL, data
        ).done(function (priv) {
            dfd.resolve(priv);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putFmlyPriv = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.put(FMLYPRIV_URL, data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.deleteFmlyPriv = function (data) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(FMLYPRIV_URL + '/' + data
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getFamilies = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(METADATA_URL + '/families', {
        }).done(function (data) {
            dfd.resolve(new FamilyDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getEntityFamiliesRoot = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(METADATA_URL + '/entityfamiliesRoot', {
        }).done(function (data) {
            dfd.resolve(new EntityFamilyDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getRelationshipFamilies = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(METADATA_URL + '/relationshipfamilies', {
        }).done(function (data) {
            dfd.resolve(new FamilyDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };




    SecurityService.prototype.getEntityFamilies = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(METADATA_URL + '/entityfamiliesChild/' + key, {
        }).done(function (data) {
            dfd.resolve(new EntityFamilyDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getLicensedModules = function getLicensedModules() {
        var dfd = $.Deferred(),
            request = AjaxRequest.get(LICENSE_URL);
        request.send(dfd)
            .done(getLicensedModules_done.bind(null, dfd));
        return dfd.promise();
    };

    function getLicensedModules_done(dfd, data) {
        var list = new KeyIdList(data);
        dfd.resolve(list);
    }

    SecurityService.prototype.getSites = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/sites', {
        }).done(function (data) {
            dfd.resolve(new SiteDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getSite = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/site/' + key, {
        }).done(function (data) {
            dfd.resolve(new SiteDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.postSite = function (site) {
        var dfd = $.Deferred();
        this.ajaxClient.post(SECURITY_URL + '/site', site
        ).done(function (data) {
            dfd.resolve(new SiteDTO(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.putSite = function (site) {
        var dfd = $.Deferred();
        this.ajaxClient.put(SECURITY_URL + '/site', site
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.deleteSite = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.delete(SECURITY_URL + '/site/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getSiteUsers = function (siteKey) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/siteusers/' + siteKey, {
        }).done(function (data) {
            dfd.resolve(new UserSiteDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    SecurityService.prototype.getUserSites = function (userKey) {
        var dfd = $.Deferred();
        this.ajaxClient.get(SECURITY_URL + '/usersites/' + userKey, {
        }).done(function (data) {
            dfd.resolve(new UserSiteDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    return SecurityService;
});