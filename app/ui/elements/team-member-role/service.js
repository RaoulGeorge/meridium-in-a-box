define(function (require) {
    'use strict';

    var $ = require('jquery');


    require('system/lang/object');
    
    var AjaxClient = require('system/http/ajax-client'),
        TEAMMEMBER_URL = 'meridium/api/core/teammember',
        MemberDTO = require('ui/elements/team-member-role/member-role-dto');

    function TeamMemberService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    TeamMemberService.dependsOn = [AjaxClient];

    TeamMemberService.prototype.getAllHR = function (memberKeys, page, pagesize) {
        var deferred = $.Deferred(),
               path = TEAMMEMBER_URL + '/allHRKeys/' + '?page=' + page + '&pageSize=' + pagesize,
               body = { 'memberKeys': memberKeys };
        this.ajaxClient.put(path, memberKeys).done(function (result) {
            deferred.resolve(MemberDTO.fromDataCollection(result));
        }).fail(function (err) {
            deferred.reject(err.statusText);
        });
        return deferred.promise();
    };

    return TeamMemberService;
});
