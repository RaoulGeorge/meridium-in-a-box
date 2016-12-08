define(function (require) {
    'use strict';

    var $ = require('jquery');


    require('system/lang/object');
    
    var AjaxClient = require('system/http/ajax-client'),
        TEAMMEMBER_URL = 'meridium/api/core/teammember',
        //UserDTO = require('security/services/user-dto');
        MemberDTO = require('ui/elements/team-member/member-dto');

    function TeamMemberService(ajaxClient) {
        this.ajaxClient = ajaxClient;
    }

    TeamMemberService.dependsOn = [AjaxClient];

    TeamMemberService.prototype.getMembersByTeamKey = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.get(TEAMMEMBER_URL + '/team/' + key, {
        }).done(function (data) {
            dfd.resolve(MemberDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    TeamMemberService.prototype.getTeamMembers = function (entitykey, relationshipid, page, pagesize, searchterm) {
        var dfd = $.Deferred(),
            path;

        if (searchterm) {
            searchterm = '&searchterm=' + searchterm;
        } else {
            searchterm = '';
        }

        path = TEAMMEMBER_URL + '/team/' + entitykey + '/' + relationshipid + '?page=' + page + '&pageSize=' + pagesize + searchterm,
        this.ajaxClient.get(path, {
        }).done(function (data) {
            dfd.resolve(MemberDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    TeamMemberService.prototype.getTeamMembersCount = function (entitykey, relationshipid, searchterm) {
        var dfd = $.Deferred();

        if (searchterm) {
            searchterm = '&searchterm=' + searchterm;
        } else {
            searchterm = '';
        }

        this.ajaxClient.get(TEAMMEMBER_URL + '/memberscount/' + entitykey + '/' + relationshipid + searchterm, {
        }).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    TeamMemberService.prototype.getAllHR = function (memberKeys, page, pagesize, searchterm) {
        var deferred = $.Deferred(),
            path, body;

        if (searchterm) {
            searchterm = '&searchterm=' + searchterm;
        } else {
            searchterm = '';
        }

        path = TEAMMEMBER_URL + '/allHRKeys/' + '?page=' + page + '&pageSize=' + pagesize + searchterm,
        body = { 'memberKeys': memberKeys };
        this.ajaxClient.put(path, memberKeys).done(function (result) {
            deferred.resolve(MemberDTO.fromDataCollection(result));
        }).fail(function (err) {
            deferred.reject(err);
        });
        return deferred.promise();
    };

    TeamMemberService.prototype.getUsersBySecGroupRole = function (memberKeys, groupid, roleid, page, pagesize, searchterm) {
        var deferred = $.Deferred(),
           path, body;

        if (searchterm) {
            searchterm = '&searchterm=' + searchterm;
        } else {
            searchterm = '';
        }

        if (groupid) {
            groupid = '&groupid=' + groupid;
        } else {
            groupid = '';
        }

        if (roleid) {
            roleid = '&roleid=' + roleid;
        } else {
            roleid = '';
        }

        path = TEAMMEMBER_URL + '?page=' + page + '&pageSize=' + pagesize + groupid + roleid + searchterm,
        body = { 'memberKeys': memberKeys };
        this.ajaxClient.put(path, memberKeys).done(function (result) {
            deferred.resolve(MemberDTO.fromDataCollection(result));
        }).fail(function (err) {
            deferred.reject(err);
        });
        return deferred.promise();
    };

    //Add and link a member to an entity
    TeamMemberService.prototype.addTeamMember =
        function (key, newentity, familyID) {
            var deferred = $.Deferred(),
                path = TEAMMEMBER_URL + '/newmember/' + key + '/' + familyID,
                body = { 'teamMember': newentity }, entity = newentity;
            entity.entityModified = null;
            entity.entitySaved = null;
            entity.entityDeleted = null;
            this.ajaxClient.post(path, entity).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err);
            });
            return deferred.promise();
        };

    //Link an existing member to an entity
    TeamMemberService.prototype.linkTeamMembers =
        function (key, familyID, itemsToLink) {
            var deferred = $.Deferred(),
                path = TEAMMEMBER_URL + '/memberslink/' + key + '/' + familyID,
                body = { 'memberKeys': itemsToLink };
            this.ajaxClient.put(path, itemsToLink).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err);
            });
            return deferred.promise();
        };

    //Unlink a team member from an entity
    TeamMemberService.prototype.unlinkTeamMembers =
        function (key, familyID, itemsToUnlink) {

            var deferred = $.Deferred(),
               path = TEAMMEMBER_URL + '/membersunlink/' + key + '/' + familyID,
               body = {'memberKeys': itemsToUnlink };

            this.ajaxClient.put(path, itemsToUnlink).done(function (result) {
                deferred.resolve(result);
            }).fail(function (err) {
                deferred.reject(err);
            });
            return deferred.promise();

        };

    //Get Photo
    TeamMemberService.prototype.getPhoto = function (key) {
        var dfd = $.Deferred();
        this.ajaxClient.post(TEAMMEMBER_URL + '/userphoto/' + key
        ).done(function (data) {
            dfd.resolve(data);
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    return TeamMemberService;
});
