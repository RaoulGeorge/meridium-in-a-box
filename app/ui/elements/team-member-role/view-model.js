define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        Region = require('spa/region'),
        MessageBox = require('system/ui/message-box'),
        view = require('text!./template.html'),
        //DialogViewModel = require('system/ui/dialog-view-model'),
        Translator = require('system/globalization/translator'),
        TeammemberRoleService = require('ui/elements/team-member-role/service'),
        MemberDTO = require('ui/elements/team-member-role/member-role-dto');

    require('ui/elements/list-group/view-model');
    require('system/lang/object');
    require('system/lang/string');
    require('devExWebJS');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.element = this;
        this.service = Object.resolve(TeammemberRoleService);
        this.translator = Object.resolve(Translator);
        this.showicon = this.getAttribute('showicon');
        this.datasheetKey = this.getAttribute('datasheetKey') ? this.getAttribute('datasheetKey') : 0;
        this.familykey = 'MI Human Resource';
        this.members = null;
        this.nonMembers = null;
        this.hrLoader = null;
        this.allowAdd = null;
        addProperties(this);
    };

    proto.attachedCallback = function () {
        this.element.innerHTML = view;
        this.allowAdd = !getReadOnly(this);
        if (!this.showicon) { hideBackButton(this); }
        hide2ListsMembersContainer(this);
        this.setCurrentPage('list-members');
        //this.loadMembers();
        this.attachClickHandlers();
        translateTitles(this);
    };

    function translateTitles(self) {
        translateTooltip(self, 'button.existing', 'EDIT_TEAM_MEMBERS');
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

    proto.attachClickHandlers = function () {
        $(this.element).find('.existing').on('click', addExistingMember.bind(null, this));
        $(this.element).find('.prev').on('click', onPrevClicked.bind(null, this));
        $(this.element).find('.add').on('click', addNewMember.bind(null, this));
        $(this.element).find('.back').on('click', back.bind(null, this));
        $(this.element).find('.link').on('click', link.bind(null, this));
        $(this.element).find('.unlink').on('click', unlink.bind(null, this));
        $(this.element).find('.rg-filter0').on('click', toggleFilter.bind(null, this, '#gridContainer0'));
        $(this.element).find('.rg-filter1').on('click', toggleFilter.bind(null, this, '#gridContainer1'));
        $(this.element).find('.rg-filter2').on('click', toggleFilter.bind(null, this, '#gridContainer2'));
    };

    proto.detachedCallback = function () {
        $(this.element).find('.back').off('click', back.bind(null, this));
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'data') {
            this.data(newVal);
        }
        if (attrName === 'readonly') {
            this.allowAdd = !getReadOnly(this);
        }
    };

    proto.loadMembers = function () {
        var dfd;
        if (!this.showicon) {
            hideBackButton(this);
        }
        if (this.loader) {
            dfd = this.loader();
            dfd.done(populateGrid0.bind(null, this));
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    proto.reload = function () {
        var self = this;
        this.loadMembers().done(function () {
            if (self.page !== undefined && self.page === "two-lists-members") {
                addExistingMember(self);
            }
        });
    };

    proto.pause = function () {
        this.paused = true;
    };

    proto.resume = function () {
        this.paused = false;
    };

    proto.setCurrentPage = function (page) {
        this.page = page;
    };

    proto.searchMembers = function searchMembers(list, searchterm) {
        var dfd = $.Deferred();
        if (searchterm !== undefined && searchterm.length > 0) {
            var filtered = [];
            list.items.forEach(function (item) {
                if ((item.firstName !== undefined && item.firstName.toLowerCase().startsWith(searchterm.toLowerCase())) ||
                    (item.lastName !== undefined && item.lastName.toLowerCase().startsWith(searchterm.toLowerCase()))) {
                    filtered.push(item);
                }
            });
            dfd.resolve(filtered);
        }
        return dfd.promise();
    };

    proto.teamMemberCB = function (callback) {
        this.callback = callback;
    };

    function toggleFilter(self, grid, e) {
        var enabled = $(e.target).data('isFilterEnabled');

        $(e.target).data('isFilterEnabled', !enabled);
        $(self.element).find(grid).dxDataGrid({
            filterRow: {
                visible: !enabled
            }
        });
    }

    function addProperties(self) {

        self.paused = false;
        self._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });
    }

    function getLoader(self) {
        return self._loader;
    }

    function setLoader(self, value) {
        self._loader = value;
        self.reload();
    }

    function populateGrid0(self, data) {
        self.members = data.data;
        var allow = !getReadOnly(self);
        $("#gridContainer0").dxDataGrid({
            dataSource: data.data,
            selection: {
                mode: 'single'
            },
            filterRow: {
                visible: false,
                showOperationChooser: false
            },
            scrolling: {
                mode: 'virtual'
            },
            paging: {
                enabled: true,
                pageSize: 25
            },
            loadPanel: true,
            editing: {
                mode: 'batch',
                allowUpdating: allow
            },
            columns: [
                {
                    dataField: 'photoURL',
                    caption: self.translator.translate('TEAM_MEMBERS_PHOTO'),
                    allowFiltering: false,
                    allowSorting: false,
                    allowEditing: false,
                    //cellTemplate: '#gridPhoto',
                    cellTemplate: function (container, data) {
                        container.height(50);
                        if (data.data && data.data.photoURL && data.data.photoURL.length > 0) {
                            $('<img />')
                           .attr('class', 'thumbnailPhoto')
                           .attr('src', data.data.photoURL)
                           .appendTo(container);
                        }
                    }
                },
            {
                caption: self.translator.translate('TEAM_MEMBERS_MEMBER'),
                allowFiltering: true,
                allowSorting: true,
                allowEditing: false,
                encodeHtml: false,
                calculateCellValue: function (data) {
                    return [data.firstName,
                        data.lastName]
                        .join(' ') +
                        ((data.jobTitle) ? ('<br />' + data.jobTitle) : '') +
                        ((data.phoneNumber) ? ('<br />' + data.phoneNumber) : '');
                },
                calculateFilterExpression: function (filterValue, selectedFilterOperation) {
                    return [this.calculateCellValue, 'contains' || '=', filterValue];
                }
            },
            {
                dataField: 'email',
                caption: self.translator.translate('TEAM_MEMBERS_EMAIL'),
                allowFiltering: true,
                allowSorting: true,
                allowEditing: false,
                encodeHtml: false,
                calculateFilterExpression: function (filterValue, selectedFilterOperation) {
                    return [this.calculateCellValue, 'contains' || '=', filterValue];
                }
            },
            {
                dataField: 'roleId',
                caption: self.translator.translate('TEAM_MEMBERS_ROLE'),
                allowFiltering: true,
                allowSorting: false,
                allowEditing: true,
                roles: data.roles,
                lookup: {
                    dataSource: data.roles,
                    displayExpr: 'Role',
                    valueExpr: 'ID',
                    allowClearing: true
                }
            }
            ],
            onRowUpdating: function (rowInfo) {
                var e = new CustomEvent('role-changed', {
                    detail: { key: rowInfo.key.key, oldData: rowInfo.oldData, newData: rowInfo.newData },
                    bubbles: true,
                    cancelable: true
                });
                self.dispatchEvent(e);
                //var cancelEdit = self.dispatchEvent(e);
                //if (cancelEdit) {
                //    rowInfo.cancel = true;
                //}
            },
            hoverStateEnabled: true,
            selectionChanged: function (selecteditems) {
                if (selecteditems.selectedRowsData.length > 0) {
                    var selected = selecteditems.selectedRowsData[0];
                    loadTeamMemberDatasheet(self, selected.key);
                    self.setCurrentPage('single-member');
                }
            }
        });
        var dataGrid0 = $("#gridContainer0").dxDataGrid('instance');
        dataGrid0.refresh();
    }

    function loadTeamMemberDatasheet(self, key) {
        var options = {
            'containerEl': $(self.element).find('.single-member'),
            'datasheetKey': self.datasheetKey,
            'entityObj': key
        };

        var config = {};
        if (!self.allowAdd) {
            config = {
                'functionsAvailable': [],
                'readOnly': true,    // false,
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
            self.datasheet.entitySaved.add(onEntitySaved.bind(null, self));
        });
    }

    function editDatasheet_done(self) {
        var e = new CustomEvent('edit-member', {
            detail: self.newentity,
            bubbles: true,
            cancelable: true
        });
        self.setCurrentPage('list-members');
        self.dispatchEvent(e);
    }

    //*************************************************
    //               New team member (details page)
    //*************************************************

    function addNewMember(self) {
        loadNewTeamMemberDatasheet(self);
        hide2ListsMembersContainer(self);
        self.setCurrentPage('new-member');
    }

    function loadNewTeamMemberDatasheet(self) {
        var options = {
            'containerEl': $(self.element).find('.single-member'),
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
            //self.datasheet.entityCreated.add(onEntityCreated.bind(null, self));
        });
    }

    function newDatasheet_done(self) {
        self.newentity = self.datasheet.datasheetManager.entity;
        self.newentity.entityModified.add(onEntityModified.bind(null, self));
        $(self.element).find('.single-member').append('<button class="btn btn-primary center-block add-member-btn ">Add Team Member</button>');
        $(self.element).find('.add-member-btn').on('click', addTeamMemberButtonClicked.bind(null, self));
    }

    function onEntityModified(self, a, b) {
        self.newentity = self.datasheet.datasheetManager.entity;
    }

    function addTeamMemberButtonClicked(self, data) {
        var e = new CustomEvent('add-member', {
            detail: self.newentity,
            bubbles: true,
            cancelable: true
        });
        self.setCurrentPage('two-lists-members');
        self.dispatchEvent(e);
    }

    function addTeamMember_fail(self) {
        self.throwException('Failed to add team member', 'Alert');
    }

    //*************************************************
    //               All HR members - Add Existing 
    //*************************************************

    function addExistingMember(self, e) {
        show2ListsMembersContainer(self);
        getNonMembers(self);
        getAllTeamMembers(self);
    }

    function getAllTeamMembers(self) {
        $("#gridContainer1").dxDataGrid({
            dataSource: self.members,
            filterRow: {
                visible: false,
                showOperationChooser: false
            },
            loadPanel: true,
            selection: {
                mode: 'multiple'
            },
            scrolling: {
                mode: 'virtual'
            },
            paging: {
                enabled: true,
                pageSize: 25
            },
            editing: {
                mode: 'batch',
                allowUpdating: false
            },
            columns: [
                {
                    dataField: 'photoURL',
                    caption: self.translator.translate('TEAM_MEMBERS_PHOTO'),
                    allowFiltering: false,
                    allowSorting: false,
                    allowEditing: false,
                    //cellTemplate: '#gridPhoto',
                    cellTemplate: function (container, data) {
                        container.height(50);
                        if (data.data && data.data.photoURL && data.data.photoURL.length > 0) {
                            $('<img />')
                           .attr('class', 'thumbnailPhoto')
                           .attr('src', data.data.photoURL)
                           .appendTo(container);
                        }
                    }
                }, {
                    caption: self.translator.translate('TEAM_MEMBERS_MEMBER'),
                    allowFiltering: true,
                    allowSorting: true,
                    allowEditing: false,
                    encodeHtml: false,
                    calculateCellValue: function (data) {
                        return [data.firstName,
                            data.lastName]
                            .join(' ') +
                            ((data.jobTitle) ? ('<br />' + data.jobTitle) : '') +
                            ((data.email) ? ('<br />' + data.email) : '') +
                            ((data.phoneNumber) ? ('<br />' + data.phoneNumber) : '');
                    },
                    calculateFilterExpression: function (filterValue, selectedFilterOperation) {
                        return [this.calculateCellValue, 'contains' || '=', filterValue];
                    }
                }, {
                    dataField: 'role',
                    caption: self.translator.translate('TEAM_MEMBERS_ROLE'),
                    allowFiltering: false,
                    allowSorting: false,
                    allowEditing: false,
                }
            ],
            hoverStateEnabled: true,
            //selectionChanged: function (selecteditems) {
            //    var selected = selecteditems.selectedRowsData[0];
            //}
        });
        var dataGrid1 = $("#gridContainer1").dxDataGrid('instance');
        dataGrid1.refresh();
        dataGrid1.clearSelection();
    }

    function getNonMembers(self) {
        var dfd = $.Deferred();
        self.hrLoader = loadHR(self);
        return dfd.promise();
    }

    function loadHR(self, page, pagesize) {

        var memberKeys = [];
        if (self.members && self.members !== undefined) {
            for (var i = 0; i < self.members.length; i++) {
                memberKeys.push(self.members[i].key);
            }
        }
        self.service.getAllHR(memberKeys, page, pagesize)
               .done(populateGrid2.bind(null, self))
               .fail(handleErr.bind(null, self));
    }

    function populateGrid2(self, data) {
        self.nonMembers = data;
        $("#gridContainer2").dxDataGrid({
            dataSource: data,
            loadPanel: true,
            filterRow: {
                visible: false,
                showOperationChooser: false
            },
            selection: {
                mode: 'multiple'
            },
            scrolling: {
                mode: 'virtual'
            },
            paging: {
                enabled: true,
                pageSize: 25
            },
            editing: {
                mode: 'batch',
                allowUpdating: false
            },
            columns: [
                {
                    dataField: 'photoURL',
                    caption: self.translator.translate('TEAM_MEMBERS_PHOTO'),
                    allowFiltering: false,
                    allowSorting: false,
                    allowEditing: false,
                    //cellTemplate: '#gridPhoto',
                    cellTemplate: function (container, data) {
                        container.height(50);
                        if (data.data && data.data.photoURL && data.data.photoURL.length > 0) {
                            $('<img />')
                           .attr('class', 'thumbnailPhoto')
                           .attr('src', data.data.photoURL)
                           .appendTo(container);
                        }
                    }
                }, {
                    caption: self.translator.translate('TEAM_MEMBERS_MEMBER'),
                    allowFiltering: true,
                    allowSorting: true,
                    allowEditing: false,
                    encodeHtml: false,
                    calculateCellValue: function (data) {
                        return [data.firstName,
                            data.lastName]
                            .join(' ') +
                            ((data.jobTitle) ? ('<br />' + data.jobTitle) : '') +
                            ((data.email) ? ('<br />' + data.email) : '') +
                            ((data.phoneNumber) ? ('<br />' + data.phoneNumber) : '');
                    },
                    calculateFilterExpression: function (filterValue, selectedFilterOperation) {
                        return [this.calculateCellValue, 'contains' || '=', filterValue];
                    }
                }
            ],
            hoverStateEnabled: true,
            //selectionChanged: function (selecteditems) {
            //    var selected = selecteditems.selectedRowsData[0];
            //}
        });
        var dataGrid2 = $("#gridContainer2").dxDataGrid('instance');
        dataGrid2.refresh();
        dataGrid2.clearSelection();
    }

    function onPrevClicked(self, e) {
        showListMembersContainer(self);
    }

    function getReadOnly(self) {
        var readOnly = false;
        if (self.hasAttribute('readOnly')) {
            if (self.getAttribute('readOnly') === 'true') {
                readOnly = true;
                hideAddExistingButton(self);
            }
        }
        return readOnly;
    }

    function onEntitySaved(self, entity) {
        var e = new CustomEvent('edit-member', {
            detail: entity,
            bubbles: true,
            cancelable: true
        });
        showListMembersContainer(self);
        self.dispatchEvent(e);
    }

    //*************************************************
    //               Navigation 
    //*************************************************

    proto.handleEvent = function (e) {
        var action;

        if (e.type === 'click') {
            if (e.target.nodeName === 'BUTTON') {
                action = e.target.getAttribute('data-action');
                buttonClickHandler(this, action, e);
            } else if (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON') {
                action = e.target.parentElement.getAttribute('data-action');
                buttonClickHandler(this, action, e);
            }
        }
    };

    function buttonClickHandler(self, action, e) {
        if (action && self[action]) {
            self[action](e);
        }
    }

    function back(self, options) {
        var editDatasheetUnload_promise,
            newDatasheetUnload_promise;
        if (self.page === 'list-members') {
            //if (!self.showicon) {
            //    hideBackButton(self);
            //}
            invokeCallback(self);
        } else if (self.page === 'single-member') {
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
        if (!self.showicon) {
            hideBackButton(self);
        }
    }

    function editDatasheetUnload_promise_done(self) {
        showListMembersContainer(self);
        if (!self.showicon) {
            hideBackButton(self);
        }
        //self.setCurrentPage('list-members');
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

    function showBackButton(self) {
        $(self.element).find('.back').css('display', 'block');
    }

    function hideBackButton(self) {
        if ($(self.element).find('.back')) {
            $(self.element).find('.back').css('display', 'none');
        }
    }

    function showAddExistingButton(self) {
        $(self.element).find('.existing').css('display', 'block');
    }

    function hideAddExistingButton(self) {
        $(self.element).find('.existing').css('display', 'none');
    }

    function hideListMembersContainer(self) {
        $(self.element).find('.list-members').css('display', 'none');
        $(self.element).find('.single-member').css('display', 'block');
    }

    function hide2ListsMembersContainer(self) {
        $(self.element).find('.two-lists-members').css('display', 'none');
    }

    function showListMembersContainer(self) {
        $(self.element).find('.single-member').empty();
        $(self.element).find('.two-lists-members').css('display', 'none');
        $(self.element).find('.list-members').css('display', 'block');
        var dataGrid0 = $('#gridContainer0').dxDataGrid('instance');
        dataGrid0.refresh();
        dataGrid0.clearSelection();
        self.setCurrentPage('list-members');
    }

    function show2ListsMembersContainer(self) {
        $(self.element).find('.list-members').css('display', 'none');
        $(self.element).find('.single-member').empty();
        $(self.element).find('.two-lists-members').css('display', 'block');
        self.setCurrentPage('two-lists-members');
    }

    function handleErr(self, data) {
        MessageBox.showOk('Error while retrieving hr',
            'Error');
    }

    function link(self, e) {
        var dataGrid2 = $('#gridContainer2').dxDataGrid('instance');
        var keys = dataGrid2.getSelectedRowKeys();

        var savingEvent = new CustomEvent('link', {
            detail: keys,
            bubbles: true,
            cancelable: true
        });
        self.dispatchEvent(savingEvent);
    }

    function unlink(self, e) {
        var dataGrid1 = $('#gridContainer1').dxDataGrid('instance');
        var keys = dataGrid1.getSelectedRowKeys();

        var savingEvent = new CustomEvent('unlink', {
            detail: keys,
            bubbles: true,
            cancelable: true
        });
        self.dispatchEvent(savingEvent);
    }

    document.registerElement('mi-team-member-role', { prototype: proto });

    return proto;
});

