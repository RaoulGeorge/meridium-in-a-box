define(function (require) {
    'use strict';

    var $ = require('jquery'),
        m = require('mithril'),
        mx = require('system/mithril/mithril-extensions'),
        h = require('system/mithril/html-tags'),
        b = require('system/mithril/bootstrap-tags'),
        R = require('ramda'),
        Translator = require('system/globalization/translator'),
        Datasheet = require('platform/datasheets/datasheet'),
        translator = Object.resolve(Translator),
        List1Members = require('./components/list1Members'),
        List2HR = require('./components/list2HR'),
        List3Members = require('./components/list3Members');

    require('ui/elements/list-group/view-model');
    require('ui/elements/tool-bar/view-model');
    require('platform/datasheets/datasheet');

    function TeamMemberListView(vm) {
        var control;

        switch (vm.display()) {
            case "list-members":
                return list1Members(vm);       
            case 'two-lists-members':
                return getTwoLists(vm);
            case 'edit-member':
                return getDatasheetEdit(vm);
            case 'new-member':
                return getDatasheetNew(vm);
        }
    }

    // Team Members Page1/ListlMembers ------------------------------------------------------------------------------------------------------

    function list1Members(vm) {
        return m('div.list-members', [
            (!vm.members() || vm.members().length === 0) ? noData(vm) : listData(vm)
        ]);
    }

    function listData(vm) {
        return m('div.nav-list-group.team-members', [
            listGroup(vm, [
                toolBar(vm, [
                    !vm.readonly() ? editButton(vm) : ''
                ])
            ])
        ]);
    }

    function listGroup(vm, children) {
        return m.component(List1Members, {
            'description': 'PopulateHTML',
            'use-html': true,
            'key': 'key',
            'multiselect': false,
            'allow-add': false,
            'custom-search': true,
            'readonly': vm.readonly(),
            loader: vm.loadMembersAjax.bind(vm),
            onchange: vm.onSelectionChanged.bind(vm),
            searchCallback: vm.searchCBMembers.bind(vm)
        }, children);
    }

    function noData(vm) {
        return m('div.nav-list-group-nodata', [
            listGroup(vm, [
                toolBar(vm, [
                    !vm.readonly() ? editButton(vm) : ''
                ])
            ]),
            noDataSpan(vm)
        ]);
    }

    function noDataSpan(vm) {
        return m('div.no-data', [
            m('span', [
                m('p', translator.translate('NO_DATA_TO_DISPLAY'))
            ])
        ]);
    }

    function toolBar(vm, children) {
        return [
            m("mi-tool-bar.right", { config: configToolbar.bind(null, vm) }, children)
        ];
    }

    function editButton(vm) {
        var title = translator.translate('EDIT_TEAM_MEMBERS');
        return m('button.btn.btn-default.btn-icon', { onclick: vm.displayTwoLists.bind(null, vm), title: title }, [
            h.icon('.icon-edit')
        ]);
    }

    // List Members Page2 ------------------------------------------------------------------------------------------------------
    
    function getTwoLists(vm) {
        return m('div.two-lists-members', [
            hrList(vm),
            membersList(vm)
        ]);
    }

    function hrList(vm) {
        return m('div.nav-list-group.list-members-hr', [
            listHR(vm, [
                toolBar(vm, [
                        prevButton(vm),
                        linkButton(vm)
                ])
            ])
        ]);
    }

    function listHR(vm, children) {
        return m.component(List2HR, {
            'description': 'PopulateHTML',
            'use-html': true,
            'key': 'key',
            'selector': 'toggle',
            'multiselect': true,
            'page': '1',
            'page-size': '25',
            'scroll-percent': '0.75',
            'allow-add': false,
            'custom-search': true,
            loader: vm.loadHR.bind(vm),
            onchange: vm.listClickHR.bind(vm),
            searchCallback: vm.searchCBResources.bind(vm)
        }, children);
    }

    function prevButton(vm) {
        var title = translator.translate('PREVIOUS_PAGE');
        return m('button.btn.btn-default.btn-icon', { onclick: vm.displayList.bind(null, vm), title: title }, [
                h.icon('.icon-back-arrow')
        ]);
    }

    function linkButton(vm) {
        var title = translator.translate('ADD_TO_TEAM');
        return m('button.btn.btn-default.btn-icon.link', { disabled: true, onclick: vm.onLinkClicked.bind(null, vm), title: title }, [
                h.icon('.icon-team-member-shift-right')
        ]);
    }

    function membersList(vm) {
        return (!vm.members() || vm.members().length === 0) ? noMembersData(vm) : membersData(vm);
    }

    function noMembersData(vm) {
        return m('div.nav-list-group-nodata', [
            listMembers(vm, [
                toolBar(vm, [
                        unlinkButton(vm),
                        addNewButton(vm)
                ])
            ]),
            noDataSpan(vm)
        ]);
    }

    function membersData(vm) {
        return m('div.nav-list-group.list-members-tm', [
            listMembers(vm, [
                toolBar(vm, [
                        unlinkButton(vm),
                        addNewButton(vm)
                ])
            ])
        ]);
    }

    function listMembers(vm, children) {
        return m.component(List3Members, {
            'description': 'PopulateHTML',
            'use-html': true,
            'key': 'key',
            'selector': 'toggle',
            'multiselect': true,
            'allow-add': false,
            'custom-search': true,
            loader: vm.loadCurrentMembers.bind(null, vm),
            onchange: vm.listClickMembers.bind(null, vm),
            searchCallback: vm.searchCBMembers.bind(vm)
        }, children);
    }

    function unlinkButton(vm) {
        var title = translator.translate('REMOVE_FROM_TEAM');
        return m('button.btn.btn-default.btn-icon.unlink', { disabled: true, onclick: vm.onUnlinkClicked.bind(null, vm), title: title }, [
                h.icon('.icon-team-member-shift-left')
        ]);
    }

    function addNewButton(vm) {
        var title = translator.translate('ADD_NEW_TEAM_MEMBER');
        return m('button.btn.btn-default.btn-icon', { onclick: vm.addNew.bind(null, vm), title: title }, [
                h.icon('.icon-plus')
        ]);
    }

    function getDatasheetEdit(vm) {
        return m('div.edit-member-container', [
           m('button.btn.btn-default', { onclick: vm.displayList.bind(null, vm) }, [h.icon('.icon-back-arrow')]),
           m("div.edit-member", { config: configDatasheetEdit.bind(null, vm) })
        ]);
    }

    function configDatasheetEdit(vm, element, init, context) {
        if (!init) {
            context.retain = true;
            context.datasheet = createDatasheetEdit(element, vm);
        }
    }

    function createDatasheetEdit(element, vm) {
        var options = {
            'containerEl': $(element),
            'entityObj': vm.selectedKey(),
            'familyID': "MI Human Resource"
        };
        var config = {};
        if (vm.readonly()) {
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
        var datasheet = new Datasheet(options);
        datasheet.load(config).done(datasheetEditLoaded.bind(null, vm));
        datasheet.entitySaved.add(onEntityUpdated.bind(null, vm));
        return datasheet;
    }

    function datasheetEditLoaded(vm, datasheet) {
        vm.onLoad(datasheet);
    }

    function onEntityUpdated(vm, datasheet) {
        vm.displayList(vm);
        m.redraw();
    }

    function getDatasheetNew(vm) {
        return m('div.new-member-container', [
           m('button.btn.btn-default', { onclick: vm.displayTwoLists.bind(null, vm) }, [h.icon('.icon-back-arrow')]),
           m("div.new-member", { config: configDatasheetNew.bind(null, vm) }),
           addButton(vm)
        ]);
    }

    function configDatasheetNew(vm, element, init, context) {
        if (!init) {
            context.retain = true;
            context.datasheet = createDatasheetNew(element, vm);
        }
    }

    function createDatasheetNew(element, vm) {
        var options = {
            'containerEl': $(element),
            'familykey': 'MI Human Resource'
        },
       config = {
           'functionsAvailable': [],
           'readOnly': false,
           'canedit': false,
           'showDatasheetSelection': true
       };

        vm.datasheet = new Datasheet(options);
        vm.datasheet.load(config).done(datasheetNewLoaded.bind(null, vm)).fail(datasheetLoadFailed.bind(null, vm));
    }

    function datasheetNewLoaded(vm, datasheet) {       
        vm.newEntity = vm.datasheet.datasheetManager.entity;
    }

    function datasheetLoadFailed(vm) {
        vm.isAddTeamMemberBtnDisabled = true;
    }

    function onEntityModified(vm, datasheet) {
        vm.newEntity = vm.datasheet.datasheetManager.entity;
    }

    function onEntityCreated(vm, datasheet) {
        vm.displayTwoLists(vm);
        m.redraw();
    }

    function configToolbar(vm, element, init, context) {
        if (!init) {
            var el = $(element)[0];

        }
    }

    function addButton(vm) {
        return m('button.btn.btn-primary.btn-text.center-block.add-member-btn', {
            onclick: vm.addMemberButtonClicked.bind(vm),
            'disabled': vm.isAddTeamMemberBtnDisabled,
            className: vm.isAddTeamMemberBtnDisabled ? 'no-access' : ''
        }, translator.translate('ADD_TEAM_MEMBER'));
    }

    return TeamMemberListView;
});