define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        _ = require('lodash'),
        AjaxRequest = require('system/http/es6-ajax-request'),
        Promise = require('bluebird'),
        Assert = require('mi-assert'),
        Event = require('system/lang/event'),
        m = require('mithril'),
        R = require('ramda'),
        TeamMemberView = require('../views/team-member-list-view'),
        TeamMemberService = require('../services/team-member-service'),
        Translator = require('system/globalization/translator'),
        Datasheet = require('platform/datasheets/datasheet');

    require('ui/elements/list-group/view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/tool-bar/view-model');
    require('system/lang/object');
    require('system/lang/string');

    function TeamMemberViewModel() {
        this.service = Object.resolve(TeamMemberService);
        this.translator = Object.resolve(Translator);
        this.entitykey = m.prop('');
        this.relationshipid = m.prop('');
        this.secgroupid = m.prop('');
        this.roleid = m.prop('');
        this.familykey = 'MI Human Resource';
        this.readonly = m.prop(false);
        this.showicon = false;
        this.members = m.prop([]);        
        this.display = m.prop('list-members');
        this.selectedKey = m.prop(0);
        this.searchterm = m.prop('');
        this.page = m.prop(1);
        this.pagesize = m.prop(25);
        this.newEntity = null;
        this.isAddTeamMemberBtnDisabled = false;
    }

    TeamMemberViewModel.prototype.reload = function reload() {
        var memberEl = $(document).find('mi-list-group[idx="1"]')[0];
        if (memberEl) { memberEl.reload();}
    };

    TeamMemberViewModel.prototype.listClickHR = function listClickHR(event) {
        var link = $(document).find('button.link')[0];
        if (link) {
            link.disabled = (event.currentTarget.selectedItems.length === 0);
        }
    };

    TeamMemberViewModel.prototype.listClickMembers = function listClickMembers(self, event) {
        var unlink = $(document).find('button.unlink')[0];
        if (unlink) {
            unlink.disabled = (event.currentTarget.selectedItems.length === 0);
        }     
        m.redraw.strategy("none");
    };

    TeamMemberViewModel.prototype.updateUnlinkBtn = function updateUnlinkBtn(item, checked) {
        var event = checked;
        m.redraw.strategy("none");
    };
    
    TeamMemberViewModel.prototype.loadHR = function loadHR(page, pagesize) {        
        var self = this;
        var dfd = $.Deferred();
        if ((self.secgroupid() && self.secgroupid() !== '') || (self.roleid() && self.roleid() !== '')) {
            self.service.getUsersBySecGroupRole(toKeys(self.members()), self.secgroupid(), self.roleid(), page, pagesize)
               .done(loadHR_done.bind(null, this, dfd));

        } else {
            self.service.getAllHR(toKeys(self.members()), page, pagesize)
               .done(loadHR_done.bind(null, this, dfd));
        }
        return dfd;
    };

    function loadMembers_done(self, dfd, result) {
        assertThis(self);
        if (self.members) { self.members(result); }
        dfd.resolve(result);
        adjustHeight('1');
    }

    function loadHR_done(self, dfd, result) {
        assertThis(self);
        dfd.resolve(result);
        adjustHeight('2');
    }

    function adjustHeight(index) {
        var list = $('mi-list-group[idx=' + index + ']').find('.list-group')[0];
        if (list && list.style) {
            list.style.height = '';
        }
        if (index === '2') { adjustHeight('3'); }
    }

    TeamMemberViewModel.prototype.loadMembersAjax = function loadMembersAjax() {
        assertThis(this);
        var dfd = $.Deferred();

        if (this.entitykey() && this.relationshipid()) {
            this.service
            .getTeamMembers(this.entitykey(), this.relationshipid())
            .done(loadMembers_done.bind(null, this, dfd));
        } else {
            loadMembers_done.bind(null, ([]), dfd);
        }       
        return dfd.promise();
    };

    TeamMemberViewModel.prototype.dispose = function dispose() {
        this.members = null;
    };

    TeamMemberViewModel.prototype.onSelectionChanged = function onSelectionChanged(self, e) {
        var data = event.target.value;
        if (data) {
            var key = data.entityKey;
            if (key) {
                this.selectedKey(key);
                this.display('edit-member');
                m.redraw();
            }
        }
    };

    TeamMemberViewModel.prototype.addNew = function addNew(self, event) {
        self.display('new-member');
    };

    TeamMemberViewModel.prototype.displayList = function displayList(self, event) {
        self.display('list-members');
    };

    TeamMemberViewModel.prototype.displayTwoLists = function displayTwoLists(self, event) {
        self.display('two-lists-members');
    };

    TeamMemberViewModel.prototype.onLinkClicked = function onLinkClicked(self, event) {
        var btn = event.currentTarget,
            el = event.currentTarget.parentNode.parentNode,
            itemsToLink = toKeys(el.selectedItems);

        btn.disabled = true;
        var dfd = $.Deferred();
        self.service.linkTeamMembers(self.entitykey(), self.relationshipid(), itemsToLink)
            .done(syncMembersHR.bind(null, self, dfd));
        return dfd;
    };

    TeamMemberViewModel.prototype.onUnlinkClicked = function onUnlinkClicked(self, event) {
        var btn = event.currentTarget,
            el = event.currentTarget.parentNode.parentNode,
            itemsToUnlink = toKeys(el.selectedItems);

        btn.disabled = true;
        var dfd = $.Deferred();
        self.service.unlinkTeamMembers(self.entitykey(), self.relationshipid(), itemsToUnlink)
            .done(syncMembersHR.bind(null, self, dfd));
        return dfd;
    };

    function syncMembersHR(self, dfd, data) {
        if (data) { self.members(data); }       
        updateMembers(self)
            .then(updateHR.bind(null, self));
    }

    function updateMembers(self) {
        return Promise.resolve($(document).find('mi-list-group[idx="3"]')[0].items = self.members());
    }

    function updateHR(self) {       
        var hrEl = $(document).find('mi-list-group[idx="2"]')[0];
        membersCount(self.members().length);
        hrEl.selectedItems = null;
        hrEl.reload();
    }

    function membersCount(count) {
        var updateEvent = new CustomEvent('members-updated', {
            detail: { count: count },
            bubbles: true,
            cancelable: true
        });
        var element = document.querySelector('mi-team-member');
        element.dispatchEvent(updateEvent);
    }

    TeamMemberViewModel.prototype.searchCBMembers = function searchCBMembers(self) {
        this.searchterm(self.term);
        self.element.element.loader = this.loadTeamMembers.bind(null, this, self.term);
        adjustHeight(self.element.element.attributes.idx.value);
    };

    TeamMemberViewModel.prototype.loadTeamMembers = function loadTeamMembers(self, term, page, pageSize) {        
        var dfd = $.Deferred();

        if (term && term.length > 0) {

            var filtered = [];
            self.members().forEach(function (item) {
                if ((item.firstName !== undefined && item.firstName.toLowerCase().indexOf(term.toLowerCase()) > -1) ||
                    (item.lastName !== undefined && item.lastName.toLowerCase().indexOf(term.toLowerCase()) > -1)) {
                    filtered.push(item);
                }
            });
            dfd.resolve(filtered);
        } else {
            dfd.resolve(self.members());
        }
        return dfd.promise();
    };

    TeamMemberViewModel.prototype.loadCurrentMembers = function loadCurrentMembers(self) {
        var dfd = $.Deferred();
        dfd.resolve(self.members());
        membersCount(self.members().length);
        adjustHeight('3');
        return dfd.promise();
    };

    TeamMemberViewModel.prototype.searchCBResources = function searchCBResources(self) {
        this.searchterm(self.term);
        self.element.element.loader = searchHR.bind(null, this, self.term);       
    };

    function searchHR(self, term, page, pagesize) {
        var dfd = $.Deferred();
        if (self.secgroupid() || self.roleid()) {
            self.service.getUsersBySecGroupRole(toKeys(self.members()), self.secgroupid(), self.roleid(), page, pagesize, self.searchterm())
            .done(loadHR_done.bind(null, self, dfd));
        } else {
            self.service.getAllHR(toKeys(self.members()), page, pagesize, self.searchterm())
            .done(loadHR_done.bind(null, self, dfd));
        }
        return dfd.promise();
    }

    function toKeys(list) {
        return R.pluck('entityKey', list);
    }

    function loadTeamMemberDatasheet(self, key) {

        var config = {};
        if (self.readonly) {
            config = {
                'functionsAvailable': [],
                'readOnly': true,
                'canedit': false,
                'showDatasheetSelection': true
            };
        } else {
            config = {
                'functionsAvailable': ['save'],
                'readOnly': false,
                'canedit': true,
                'showDatasheetSelection': true
            };
        }

        var options = {
            'containerEl': document.querySelector('.edit-member'), 
            'familyKey': key
        };

        var datasheet = new Datasheet(options);
        datasheet.load(config);
    }

    TeamMemberViewModel.prototype.addMemberButtonClicked = function addMemberButtonClicked(self) {        
        var datasheetManager = this.datasheet && this.datasheet.datasheetManager, datasheetViewModel = datasheetManager && datasheetManager.layout;
        var hasError = datasheetViewModel && datasheetViewModel.setErrorAndReturnErrorFlag(datasheetManager);
        if (hasError) {            
            return;
        }
        else {
            this.isAddTeamMemberBtnDisabled = true; //making add button disabled for not making user not clickable more than once
            this.service.
                addTeamMember(this.entitykey(), this.newEntity, this.relationshipid())
                    .done(addTeamMember_done.bind(null, this))
                    .fail(addTeamMember_fail.bind(null, this));
        }
    };

    function addTeamMember_done(self, newMember) {
        self.isAddTeamMemberBtnDisabled = false; //making add button disabled false after new team member created
        var updated = R.sort(compare, R.concat(self.members(), [newMember]));
        self.members(updated);        
        self.displayTwoLists(self);
        m.redraw();
    }

    function addTeamMember_fail(self) {
        self.isAddTeamMemberBtnDisabled = false;
    }

    function assertThis(self) {
        Assert.instanceOf(self, TeamMemberViewModel);
    }

    function compare(a, b) {
        var x = (a.lastName + (a.firstName ? ', ' + a.firstName : '')).toLowerCase();
        var y = (b.lastName + (b.firstName ? ', ' + b.firstName : '')).toLowerCase();
        return (x < y) ? -1 : ((x > y) ? 1 : 0);
    }

    return TeamMemberViewModel;
});