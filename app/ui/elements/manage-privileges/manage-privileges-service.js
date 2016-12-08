define(function (require) {
    'use strict';

    var AjaxClient = require('system/http/ajax-client'),
    USER_URL = '/meridium/api/core/security/user',
    GROUP_URL = '/meridium/api/core/security/group';
    require('system/lang/object');

    // Constructor
    function ManagePrivilegesService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    ManagePrivilegesService.dependsOn = [AjaxClient];

    ManagePrivilegesService.prototype.getUsersList = function ManagePrivilegesService_getUsersList() {
        var self = this;
        return self.ajaxClient.get(USER_URL);
    };

    ManagePrivilegesService.prototype.getGroupsList = function ManagePrivilegesService_getGroupsList() {
        var self = this;
        return self.ajaxClient.get(GROUP_URL);
    };

    return ManagePrivilegesService;
});