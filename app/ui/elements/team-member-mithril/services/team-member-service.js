define(function (require) {
    'use strict';

    var $ = require('jquery'),
        ApplicationContext = require('application/application-context'),
        AjaxClient = require('system/http/ajax-client'),
        TEAMMEMBER_URL = 'meridium/api/core/teammember',
        MemberDTO = require('./team-member-dto'),
        Assert = require('mi-assert');

    function TeamMemberService() {
        this.ajaxClient = Object.resolve(AjaxClient);
    }

    TeamMemberService.prototype.getTeamMembers = function (entitykey, relationshipid, page, pagesize, searchterm) {
        var deferred = $.Deferred(),
            path;

        if (searchterm) {
            searchterm = '&searchterm=' + encodeURIComponent(searchterm);
        } else {
            searchterm = '';
        }

        this.ajaxClient.get(url('/team/' + entitykey + '/' + relationshipid + '?page=' + page + '&pageSize=' + pagesize + searchterm))
            .done(function (result) {
                deferred.resolve(MemberDTO.fromDataCollection(result)); })
            .fail(get_fail.bind(null, this, deferred));
        return deferred.promise();
    };

    TeamMemberService.prototype.getHR = function (page, pagesize) {
        var deferred = $.Deferred();

        this.ajaxClient.get(url('/allHR' + '?page=' + page + '&pageSize=' + pagesize))
            .done(get_done.bind(null, this, deferred))
            .fail(get_fail.bind(null, this, deferred));
        return deferred.promise();
    };

    TeamMemberService.prototype.getAllHR = function (memberKeys, page, pagesize, searchterm) {
        var deferred = $.Deferred(),
            body;

        if (searchterm) {
            searchterm = '&searchterm=' + encodeURIComponent(searchterm);
        } else {
            searchterm = '';
        }

        body = { 'memberKeys': memberKeys };
        this.ajaxClient.put(url('/allHRKeys/' + '?page=' + page + '&pageSize=' + pagesize + searchterm), memberKeys)
            .done(get_done.bind(null, this, deferred))
            .fail(get_fail.bind(null, this, deferred));
        return deferred.promise();
    };

    TeamMemberService.prototype.getUsersBySecGroupRole = function (memberKeys, groupid, roleid, page, pagesize, searchterm) {
        var deferred = $.Deferred(),
           path, body;

        if (searchterm) {
            searchterm = '&searchterm=' + encodeURIComponent(searchterm);
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

    //Link an existing member to an entity
    TeamMemberService.prototype.linkTeamMembers =
        function (key, familyID, itemsToLink) {
            var deferred = $.Deferred(),
                path = TEAMMEMBER_URL + '/memberslink/' + key + '/' + familyID,
                body = { 'memberKeys': itemsToLink };
            this.ajaxClient.put(path, itemsToLink).done(function (result) {
                deferred.resolve(MemberDTO.fromDataCollection(result));
            }).fail(function (err) {
                deferred.reject(err);
            });
            return deferred.promise();
        };

    TeamMemberService.prototype.unlinkTeamMembers =
        function (key, familyID, itemsToUnlink) {

            var deferred = $.Deferred(),
               path = TEAMMEMBER_URL + '/membersunlink/' + key + '/' + familyID,
               body = { 'memberKeys': itemsToUnlink };

            this.ajaxClient.put(path, itemsToUnlink).done(function (result) {
                deferred.resolve(MemberDTO.fromDataCollection(result));
            }).fail(function (err) {
                deferred.reject(err);
            });
            return deferred.promise();
        };

    TeamMemberService.prototype.addTeamMember =
        function (key, newentity, familyID) {
            var deferred = $.Deferred(),
                path = TEAMMEMBER_URL + '/newmember/' + key + '/' + familyID,
                body = { 'teamMember': newentity }, entity = newentity;
            entity.entityModified = null;
            entity.entitySaved = null;
            entity.entityDeleted = null;
            this.ajaxClient.post(path, entity)
                .done(function (result) {
                    deferred.resolve(new MemberDTO(result));
                }).fail(function (err) {
                    deferred.reject(err);
                });
            return deferred.promise();
        };

    function url(service) {
        return TEAMMEMBER_URL + service;
    }

    function get_done(self, deferred, data) {
        assertThis(self);
        if (data && data.length > 0) {
            deferred.resolve(MemberDTO.fromDataCollection(data));
        } else {
            deferred.resolve([]);
        }
    }

    function get_fail(self, deferred, response) {
        assertThis(self);
        deferred.reject(response);
    }

    function assertThis(self) {
        Assert.instanceOf(self, TeamMemberService);
    }

    return TeamMemberService;
});