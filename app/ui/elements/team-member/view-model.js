define(function (require) {
    'use strict';

    var $ = require('jquery'),
        AjaxRequest = require('system/http/es6-ajax-request'),
        Promise = require('bluebird'),
        ko = require('knockout'),
        Region = require('spa/region'),
        view = require('text!./member-list.html'),
        Converter = require('system/lang/converter'),
        ApplicationEvents = require('application/application-events'),
        DialogViewModel = require('system/ui/dialog-view-model'),
        TeamMemberService = require('ui/elements/team-member/service'),
        ErrorMessage = require('system/error/error-message'),
        Translator = require('system/globalization/translator'),
        MemberDTO = require('ui/elements/team-member/member-dto'),
        BusyIndicator = require('system/ui/busy-indicator');

    require('ui/elements/list-group/view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/tool-bar/view-model');
    require('system/lang/object');
    require('system/lang/string');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.element = this;
        this.entitykey = this.getAttribute('entitykey');
        this.relationshipid = this.getAttribute('relationshipid');
        this.secgroupid = this.getAttribute('secgroupid');
        this.roleid = this.getAttribute('roleid');
        this.translator = Object.resolve(Translator);
        this.familykey = 'MI Human Resource';
        this.showicon = this.getAttribute('showicon');
        this.datasheetKey = this.getAttribute('datasheetKey') ? this.getAttribute('datasheetKey') : 0;
        this.service = Object.resolve(TeamMemberService);
        this.busyIndicator = Object.resolve(BusyIndicator);
        this.applicationEvents = Object.resolve(ApplicationEvents);
        this.members = null;
        this.selectedToLink = null;
        this.selectedToUnlink = null;
        this.toolbar = null;
        this.enableLink = true;
        this.enableUnlink = true;
        this.allowAdd = null;
        this.TwoListsMembersContainer = $(this.element).find('.two-lists-members');
        this.term = '';
        this.noDataText = this.translateText('NO_DATA_TO_DISPLAY');
    };

    proto.attachedCallback = function (region) {
        this.allowAdd = !getReadOnly(this);
        this.element.innerHTML = view;
        if (!this.showicon) { hideBackButton(this); }
        hide2ListsMembersContainer(this);
        this.populateCollection();
        this.wireAdd();
        translateTitles(this);
    };

    function translateTitles(self) {
        translateTooltip(self, 'button.addExisting', 'EDIT_TEAM_MEMBERS');
        translateTooltip(self, 'button.link', 'ADD_TO_TEAM');
        translateTooltip(self, 'button.prev', 'PREVIOUS_PAGE');
        translateTooltip(self, 'button.unlink', 'REMOVE_FROM_TEAM');
        translateTooltip(self, 'button.add', 'ADD_NEW_TEAM_MEMBER');
    }

    function translateTooltip(self, selector, titleKey) {
        var element = self.element.querySelector(selector);
        if (element) {
            element.setAttribute('title', self.translator.translate(titleKey));
        }
    }

    proto.detachedCallback = function () {
        $(this.element).find('.back').off('click', back.bind(null, this));
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        switch(Converter.toString(attrName).toLowerCase()){
            case 'entitykey':
                this.entitykey = newVal;  
                refreshList(this);
                break;
            case 'relationshipid':
                this.relationshipid = newVal;
                refreshList(this);
                break;
            case 'secgroupid':
                this.secgroupid = newVal;
                refreshList(this);
                break;
            case 'roleid':
                this.roleid = newVal;
                refreshList(this);
                break;
            case 'readonly':
                this.allowAdd = !getReadOnly(this);
                updateReadOnlyState(this);
                break;
        }
    };

    proto.setCurrentPage = function (page) {
        this.page = page;
    };

    proto.populateCollection = function (data) {
        var self = this;
        self.list0 = $(self.element).find('mi-list-group')[0];
        Element.upgrade(self.list0);

        updateReadOnlyState(self);

        self.searchbox0 = self.list0.querySelector('mi-searchbox');
        Element.upgrade(self.searchbox0);
        self.searchbox0.setAttribute('no-auto-close', 'true');
        $(self.list0).on('change', onSectionClicked.bind(null, self));
        self.list0.loader = self.loadMembers0.bind(null, self);      
        self.list0.searchCallback = self.searchCBlist0.bind(null, self);
        self.ListMembersContainer = $(self.element).find('.list-members');      
        $(self.element).find('.back').on('click', back.bind(null, self));
        self.setCurrentPage('list-members');
    };

    function updateReadOnlyState(self) {
        if (!self.allowAdd) {
            $(self.list0).attr('allow-add', 'false');
            $(self.element).find('.addExisting').css('display', 'none');
        } else {
            $(self.element).find('.addExisting').on('click', addExistingMember.bind(null, self));
        }
    }

    proto.countOnLoad = function (self) {
        self.service.getTeamMembersCount(self.entitykey, self.relationshipid, self.term)
            .done(function (result) {
                console.log("Team Member Count: " + result);
            }).fail(showError.bind(null, self));
    };

    proto.searchMembers0 = function (self, term, page, pagesize) {
        var dfd = $.Deferred();
            self.service
        .getTeamMembers(self.entitykey, self.relationshipid, page, pagesize, term)
        .done(function (results) {
            toggleNoData(self, $(self.element).find('.no-data0'), results.length > 0);
            dfd.resolve(results);
        }).fail(showError.bind(null, self));
        return dfd.promise();
    };

    proto.searchMembers2 = function (self, searchterm) {
        var dfd = $.Deferred();

        if (searchterm !== undefined && searchterm.length > 0) {
            var filtered = [];
            self.list2.items.forEach(function (item) {
                if ((item.firstName !== undefined && item.firstName.toLowerCase().indexOf(searchterm.toLowerCase()) > -1) ||
                    (item.lastName !== undefined && item.lastName.toLowerCase().indexOf(searchterm.toLowerCase()) > -1)) {
                    filtered.push(item);
                }
            });           
            self.list2.items = filtered;
            dfd.resolve(filtered);
        } else {            
            self.list2.items = self.members;
            dfd.resolve(self.members);
        }
        toggleNoData(self, $(self.element).find('.no-data2'), self.list2.items.length > 0);
        return dfd.promise();      
    };

    proto.searchCBlist0 = function (self, term) {
        self.term = term;
        self.list0.loader = self.searchMembers0.bind(null, self, term);
    };

    proto.searchCBlist1 = function (self, term) {
        self.term = term;
        self.list1.loader = self.searchHR.bind(null, self, term);
    };

    proto.searchHR = function searchHR(self, term, page, pagesize) {
        self.term = term;
        var memberKeys = [];
        if (self.members && self.members !== undefined) {
            for (var i = 0; i < self.members.length; i++) {
                memberKeys.push(self.members[i].key);
            }
        }

        var dfd = $.Deferred();
        if (self.secgroupid || self.roleid) {
            self.service.getUsersBySecGroupRole(memberKeys, self.secgroupid, self.roleid, page, pagesize, term)
          .done(function (results) {
              toggleNoData(self, $(self.element).find('.no-data1'), results.length > 0);
              dfd.resolve(results);
          }).fail(showError.bind(null, self));
        } else {
            self.service.getAllHR(memberKeys, page, pagesize, term)
           .done(function (results) {
               toggleNoData(self, $(self.element).find('.no-data1'), results.length > 0);
               dfd.resolve(results);
           }).fail(showError.bind(null, self));          
        }       
        return dfd.promise();
    };

    proto.setCurrentPage = function (page) {
        this.page = page;
    };

    proto.loadMembers0 = function loadMembers0(self, page, pagesize) {
        var dfd = $.Deferred();
        if (self.entitykey && self.relationshipid) {
            self.service.getTeamMembers(self.entitykey, self.relationshipid, page, pagesize)
                .done(function (results) {
                    toggleNoData(self, $(self.element).find('.no-data0'), results.length > 0);
                    self.members = results;
                    //membersCount(self, results.length);
                    checkResults(self.searchbox0, results.length);
                    dfd.resolve(results);
                });
        }
        return dfd.promise();
    };

    proto.loadMembers2 = function loadMembers2(self, page, pagesize) {
        var dfd = $.Deferred();
        if (self.entitykey && self.relationshipid) {
            self.service.getTeamMembers(self.entitykey, self.relationshipid)
                .done(function (results) {
                    toggleNoData(self, $(self.element).find('.no-data2'), results.length > 0);
                    checkResults(self.searchbox2, results.length);
                    self.members = results;
                    if (self.page === "two-lists-members") {
                        getAllNonMembers(self);
                    }
                    //membersCount(self, results.length);
                    dfd.resolve(results);
                });
        }
        return dfd.promise();
    };

    proto.detachClickHandlers = function () {
        $(this.element).find('section').off('click', onSectionClicked.bind(null, this));
    };

    proto.translateText = function translateText(key) {
        return this.translator.translate(key);
    };

    function onSectionClicked(self, e) {
        var data = event.target.value;
        if (data) {
            var key = data.key;
            var target = $(e.target).closest('.mi-list-group-item');

            e.stopPropagation();
            target.find('.active').removeClass('active');

            if (key) {
                self.detachClickHandlers();
                loadTeamMemberDatasheet(self, key);
                self.setCurrentPage('edit-member');
            }
        }
    }

    function loadTeamMemberDatasheet(self, key) {
        var options = {
            'containerEl': $(self.element).find('.edit-member'),
            'datasheetKey': self.datasheetKey,
            'entityObj': key,
            'familyID': "MI Human Resource"
        };

        var config = {};
        if (!self.allowAdd) {
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

        require(['platform/datasheets/datasheet'], function (Datasheet) {
            self.datasheet = new Datasheet(options);
            hideListMembersContainer(self);
            self.datasheet.load(config);
            if (!self.showicon) { showBackButton(self); }
            self.datasheet.entitySaved.add(onEntityUpdated.bind(null, self));
        });
    }

    //*************************************************
    //               New team member (details page)
    //*************************************************

    proto.wireAdd = function () {
        $(this.element).find('.add').on('click', addNewMember.bind(null, this));
        $(this.element).find('.link').on('click', onLinkClicked.bind(null, this));
        $(this.element).find('.unlink').on('click', onUnlinkClicked.bind(null, this));
        $(this.element).find('.prev').on('click', onPrevClicked.bind(null, this));
    };

    function addNewMember(self) {        
        loadNewTeamMemberDatasheet(self);
        hide2ListsMembersContainer(self);
        self.setCurrentPage('new-member');
    }

    function loadNewTeamMemberDatasheet(self) {
        var options = {
            'containerEl': $(self.element).find('.new-member'),
            'familykey': self.familykey,    //442480,  
            'datasheetKey': self.datasheetKey
        },
        config = {
            'functionsAvailable': [],
            'readOnly': false,
            'canedit': false,
            'showDatasheetSelection': true
        };

        require(['platform/datasheets/datasheet'], function (Datasheet) {
            self.newentity = null;
            self.datasheet = new Datasheet(options);
            hideListMembersContainer(self);
            self.datasheet.load(config).done(newDatasheet_done.bind(null, self));
            if (!self.showicon) { showBackButton(self); }
            self.datasheet.entityCreated.add(onEntityCreated.bind(null, self));
        });
    }

    function newDatasheet_done(self) {
        var buttonText = self.translator.translate('ADD_TEAM_MEMBER');
        self.newentity = self.datasheet.datasheetManager.entity;
        self.newentity.entityModified.add(onEntityModified.bind(null, self));
        $(self.element).find('.new-member')
            .append('<button class="btn btn-primary center-block add-member-btn ">' + buttonText + '</button>');
        $(self.element).find('.add-member-btn').on('click', addTeamMemberButtonClicked.bind(null, self));
    }

    function onEntityModified(self, a, b) {
        self.newentity = self.datasheet.datasheetManager.entity;
    }

    function addTeamMemberButtonClicked(self) {
        self.service.addTeamMember(self.entitykey, self.newentity, self.relationshipid)
        .done(onEntitySaved.bind(null, self))
        .fail(showError.bind(null, self));
    }

    function toggleNoData(self, noDataDiv, hasData) {
        var list = noDataDiv.parent().find('mi-list-group');
        if (hasData) {
            noDataDiv.css('display', 'none');
            list.css('height', '100%');
        } else {
            if (!noDataDiv.html() || noDataDiv.html().length === 0) {
                var span = document.createElement('span');
                span.appendChild(document.createTextNode(self.noDataText));
                noDataDiv.append(span);
                noDataDiv.addClass('nodata');
            }
            list.css('height', '25%');
            noDataDiv.css('display', 'block');         
        }
    }
    
    function showBusyIndicator(self, div) {
        var resultsContainer = document.querySelector(div);
        self.busyIndicator.attachTo(resultsContainer);
        self.busyIndicator.show();
    }

    //*************************************************
    //               All HR members - Add Existing 
    //*************************************************

   function addExistingMember(self) {
       show2ListsMembersContainer(self);
       if (!self.list1) {
           getAllTeamMembers(self);
       }        
    }

    function getAllTeamMembers(self) {
        var dfd = $.Deferred();
        self.list2 = $(self.element).find('mi-list-group')[2];
        Element.upgrade(self.list2);
        self.searchbox2 = self.list2.querySelector('mi-searchbox');
        Element.upgrade(self.searchbox2);
        self.searchbox2.setAttribute('no-auto-close', 'true');
        $(self.list2).on('add-item', addNewMember.bind(null, self));
        $(self.list2).on('selected', memberSelected.bind(null, self));
        self.list2.searchCallback = self.searchMembers2.bind(null, self);
        self.list2.loader = self.loadMembers2.bind(null, self);
        return dfd.promise();
    }

    function memberSelected(self, event) {
        if (self.list2.items.length > 0 && self.list2.selectedItems.length > 0) {
            $(self.element).find('.unlink')[0].disabled = false;
        } else {
            $(self.element).find('.unlink')[0].disabled = true;
        }
    }

    function getAllNonMembers(self) {
        var dfd = $.Deferred();
        self.list1 = $(self.element).find('mi-list-group')[1];
        Element.upgrade(self.list1);
        self.searchbox1 = self.list1.querySelector('mi-searchbox');
        Element.upgrade(self.searchbox1);

        self.searchbox1.setAttribute('no-auto-close', 'true');
        $(self.list1).on('selected', hrSelected.bind(null, self));
        self.list1.searchCallback = self.searchCBlist1.bind(null, self);
        self.list1.loader = self.loadHR.bind(null, self);
        return dfd.promise();
    }

    function hrSelected(self, event) {
        if (self.list1.selectedItems.length > 0) {
            $(self.element).find('.link')[0].disabled = false;
        } else {
            $(self.element).find('.link')[0].disabled = true;
        }
    }

    proto.loadHR = function loadHR(self, page, pagesize) {
        var memberKeys = [];
        if (self.members && self.members !== undefined) {
            for (var i = 0; i < self.members.length; i++) {
                memberKeys.push(self.members[i].key);
            }
        }

        var dfd = $.Deferred();
        if (self.secgroupid || self.roleid) {
            self.service.getUsersBySecGroupRole(memberKeys, self.secgroupid, self.roleid, page, pagesize)
               .done(function (results) {
                   toggleNoData(self, $(self.element).find('.no-data1'), results.length > 0);
                   dfd.resolve(results);
               }).fail(showError.bind(null, self));
            
        } else {
            self.service.getAllHR(memberKeys, page, pagesize)
               .done(function (results) {
                   toggleNoData(self, $(self.element).find('.no-data1'), results.length > 0);
                   dfd.resolve(results);
               }).fail(showError.bind(null, self));
        }        
        return dfd;
    };

    function onLinkClicked(self, e) {
        showBusyIndicator(self, '.two-lists-members');
        self.list1 = $(self.element).find('mi-list-group')[1];
        self.selectedToLink = self.list1.selectedItems;
        var itemsToLink = [];
        for (var i = 0; i < self.selectedToLink.length; i++) {
            itemsToLink.push(self.selectedToLink[i].key);
        }
        self.list1.querySelector('mi-searchbox').value = null;
        self.list2.querySelector('mi-searchbox').value = null;
        var dfd = $.Deferred();        
        self.service.linkTeamMembers(self.entitykey, self.relationshipid, itemsToLink)
            .done(link_done.bind(null, self, dfd))
            .fail(showError.bind(null, self));
        return dfd;       
    }

    function onUnlinkClicked(self, e) {
        showBusyIndicator(self, '.two-lists-members');
        self.list2 = $(self.element).find('mi-list-group')[2];
        self.selectedToUnlink = self.list2.selectedItems;
        var itemsToUnlink = [];
        for (var i = 0; i < self.selectedToUnlink.length; i++) {
            itemsToUnlink.push(self.selectedToUnlink[i].key);
        }
        self.list1.querySelector('mi-searchbox').value = null;
        self.list2.querySelector('mi-searchbox').value = null;
        var dfd = $.Deferred();
        self.service.unlinkTeamMembers(self.entitykey, self.relationshipid, itemsToUnlink)
            .done(unlink_done.bind(null, self, dfd))
            .fail(showError.bind(null, self));
        return dfd;
    }

    function link_done(self, dfd, data) {
        link_first(self)
            .then(syncMembersHR.bind(null, self))
            .then(finishSyncMembersHR.bind(null, self));
    }

    function link_first(self) {
        return Promise.resolve(self.list2.items = self.members.concat(self.list1.selectedItems).sort(compare));
    }

    function unlink_done(self, dfd, data) {
        unlink_first(self)
            .then(syncMembersHR.bind(null, self))
            .then(finishSyncMembersHR.bind(null, self));
    }

    function unlink_first(self) {
        return Promise.resolve(self.list2.items = self.members.filter(function (x) { return self.list2.selectedItems.indexOf(x) < 0; }));
    }

    function syncMembersHR(self, context) {
        var contLength = context.length;
        self.members = context;
        checkResults(self.searchbox2, contLength);
        memberSelected(self);
        self.list1.reload();
        hrSelected(self);
        self.selectedToLink = null;
        self.selectedToUnlink = null;
        membersCount(self, contLength);
    }

    function finishSyncMembersHR(self) {
        toggleNoData(self, $(self.element).find('.no-data2'), self.members.length > 0);
        self.busyIndicator.hide();
    }

    function checkResults(searchbox, results) {
        if (!results || results === 0) {
            searchbox.setAttribute('disabled', 'true');
        } else {
            searchbox.removeAttribute('disabled');
        }
    }

    function membersCount(self, count) {
        //self.countOnLoad(self);
        var updateEvent = new CustomEvent('members-updated', {
            detail: { count: count },
            bubbles: true,
            cancelable: true
        });
        self.dispatchEvent(updateEvent);
    }

    function onPrevClicked(self, e) {
        if (self.list2 && self.list2.items.length >= 0) {
            self.list0.items = self.list2.items;
            checkResults(self.searchbox0, self.list0.items.length);
        }
        toggleNoData(self, $(self.element).find('.no-data0'), self.list0.items.length > 0);
        showListMembersContainer(self);
    }

    //*********************************************************
    //     
    //*********************************************************

    function getReadOnly(self) {
        var readOnly = false;
        if (self.hasAttribute('readOnly')) {
            if (self.getAttribute('readOnly') === 'true') {
                readOnly = true;
            }
        }
        return readOnly;
    }

    function onEntitySaved(self, entity) {
        self.showicon = false;
        self.list2.reload();
        newDatasheetUnload_promise_done(self);
    }

    function onEntityUpdated(self, entity) {
        self.showicon = false;
        editDatasheetUnload_promise_done(self);
        self.list0.value = null;
        self.list0.reload();
    }

    function onEntityCreated(self, entity) {
        getAllTeamMembers(self);
    }

    function refreshList(self) {
         if (self.list0 && self.list0.loader) {
            self.list0.reload();
        }
    }

    //*************************************************
    //               Navigation 
    //*************************************************

    function back(self, options) {
        var editDatasheetUnload_promise,
            newDatasheetUnload_promise;
        if (self.page === 'list-members') {
            if (!self.showicon) {
                hideBackButton(self);
            }
            invokeCallback(self);
        } else if (self.page === 'edit-member') {
            if (self.datasheet) {
                editDatasheetUnload_promise = self.datasheet.unload();
                editDatasheetUnload_promise.done(editDatasheetUnload_promise_done.bind(null, self));

            } else {
                editDatasheetUnload_promise_done(self);
            }
        } else if (self.page === 'new-member') {
            if (self.datasheet && !options.saveDone) {
                newDatasheetUnload_promise = self.datasheet.unload();
                newDatasheetUnload_promise.done(newDatasheetUnload_promise_done.bind(null, self));
            } else {
                newDatasheetUnload_promise_done(self);
            }
        }
    }

    function editDatasheetUnload_promise_done(self) {
        showListMembersContainer(self);
        if (!self.showicon) {
            hideBackButton(self);
        }
    }

    function newDatasheetUnload_promise_done(self) {
        if (!self.showicon) {
            hideBackButton(self);
        }
        show2ListsMembersContainer(self);
    }

    function invokeCallback(self) {
        Object.tryMethod(self, 'callback');
    }

    function showListMembersContainer(self) {
        $(self.element).find('.edit-member').empty();
        $(self.element).find('.new-member').empty();
        $(self.element).find('.two-lists-members').css('display', 'none');
        $(self.element).find('.list-members').css('display', 'block');      
        self.setCurrentPage('list-members');
    }

    function hideListMembersContainer(self) {
        self.ListMembersContainer.css('display', 'none');
        $(self.element).find('.edit-member').css('display', 'block');
    }

    function hide2ListsMembersContainer(self) {
        $(self.element).find('.two-lists-members').css('display', 'none');
    }

    function showBackButton(self) {
        $(self.element).find('.back').css('display', 'block');
    }

    function show2ListsMembersContainer(self) {
        $(self.element).find('.list-members').css('display', 'none');
        $(self.element).find('.edit-member').empty();
        $(self.element).find('.new-member').empty();
        $(self.element).find('.two-lists-members').css('display', 'block');
        self.setCurrentPage('two-lists-members');
    }

    function hideBackButton(self) {
        $(self.element).find('.back').css('display', 'none');
    }

    function resolvePhoto(self, dto) {
        var hasPhoto = dto.hasThumbnailPhoto;

        self.photoKey(dto.key);

        if (dto.hasThumbnailPhoto || dto.hasThumbnailPhoto === 'true') {
            $('#browsePhoto').css('display', 'none');
            $('#deletePhoto').css('display', 'inline-block');
            var url = 'api/mibin/image?sessionId=' + self.sessionId() + '&key=' + dto.key;
            $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src="' + url + '"/>');
        } else {
            $('#browsePhoto').css('display', 'inline-block');
            $('#deletePhoto').css('display', 'none');
            $('#thumbnailPhoto').replaceWith('<img id="thumbnailPhoto" class="thumbnailPhoto" src=""/>');
        }
    }

    function showError(self, response) {
        self.busyIndicator.hide();
        if (response.statusText === 'abort') { return; }
        var errorMessage = new ErrorMessage(1, response.statusText, response.responseText);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    function compare(a, b) {
        var x = (a.lastName + (a.firstName ? ', ' + a.firstName : '')).toLowerCase();
        var y = (b.lastName + (b.firstName ? ', ' + b.firstName : '')).toLowerCase();
        return (x < y) ? -1 : ((x > y) ? 1 : 0);
    }

    document.registerElement('mi-team-member-x', { prototype: proto });

    return proto;
});
