define(function (require) {
    'use strict';

    var m = require('mithril'),
        R = require('ramda'),
        Translator = require('system/globalization/translator');

    var translator = Object.resolve(Translator);

    var TAB_WIDTH = 179,
        OVERFLOW_WIDTH = 27;

    function TabBarView(vm) {
        var tabClass = '.route-tab';

        return m('div' + tabClass, [
            logo(vm),
            middleContent(vm)
        ]);
    }

    function logo (vm) {
        return m('div.top-nav-left-icons-one', [
            m('i.fa fa-bars fa-2x top-left-nav-icon-group top-nav-meridium-logo', { id: 'show-leftnav' }),
            m('span.apm-title', 'Meridium APM Mobile'),
            m('p.pull-right.log-off-btn.mi-xs-show-block', { onclick: vm.signOut }, [
                m('i.icon-signout.ic-nav'),
                m('span.text-style', translator.translate('Log off'))
            ])
        ]);
    }

    function middleContent (vm) {
        return m('div.middle-content', [
            homeTab(vm),
            assetHierarchy(vm),
            variableTabs(vm)
        ]);
    }

    function homeTab (vm) {
        var myTab = vm.getHomeTab();
        if (R.isNil(myTab)) {
            return '';
        }
        return m('div.top-nav-left-icons second-top-icon', {
            title: translator.translate('HOME_DASHBOARD'),
            onclick: vm.makeActive.bind(vm, myTab),
            class: vm.isActiveTab(myTab) ? 'active' : ''
        }, [
            m('a.top-left-nav-icon-group test', m('i.icon-dashboard icon-dashboard-style'))
        ]);
    }

    function assetHierarchy (vm) {
        var myTab = vm.getAssetHierarchyTab();
        if (R.isNil(myTab)) {
            return '';
        }
        return m('div.top-nav-left-icons third-top-icon', {
            title: translator.translate('ASSET_HIERARCHY'),
            onclick: vm.makeActive.bind(vm, myTab),
            class: vm.isActiveTab(myTab) ? 'active' : ''
        }, [
            m('a.top-left-nav-icon-group test', m('i.ds ds-assethierachy icon-dashboard-style'))
        ]);
    }

    function variableTabs (vm) {
        var start = startTab(vm),
            end = endTab(vm, start);
        return m('div.top-nav-main-tabs-group',
                 [
                     makeVariableTabs(vm, R.slice(start, end, vm.getVariableTabs())),
                     overflowDiv(vm),
                     activeTabDiv(vm) //only for small devices
                 ]
                );
    }

    function overflowDiv (vm) {
        return m('div.tab-overflow-div',
                 [
                     overflowIcon(vm),
                     overflow(vm)
                 ]
                );
    }

    function makeVariableTabs (vm, tabs) {
        return m('ul.list-inline',
                 {style: 'margin: 0' },
                 R.map(makeTab(vm), tabs));
    }

    var makeTab = R.curry(function makeTab(vm, tab) {
        return m('li.test-border short-border', {
            class: vm.isActiveTab(tab) ? 'active' : '',
            onclick: vm.handleClickEvent.bind(vm, tab),
            title: tab.getFullTitle()
        },[
            m('a', { href: '#' + tab.getHref() }, [
                m('i.dummy-icon', { class: tab.getIconImage() }),
                m('span', tab.getTitle())
            ]),
            m('i.tab-close ds ds-cross')
        ]);
    });

    function overflowIcon (vm) {
        if (!tabOverflow(vm)) {
            return '';
        }
        return m('a.tabs-overflow-icon', {
            onclick: vm.toggleOverflowTabs.bind(vm)
        }, [
            m('i.icon-arrow-down')
        ]);
    }

    function activeTabDiv(vm) {
        var tab = vm.getActiveTab();

        if (R.isNil(tab)) {
            return '';
        }
        return m('div.test-border short-border header-tab', {                        
            title: tab.getFullTitle()
        }, [
            backButton(vm, tab),
            m('div.mobile-header', [
                vm.isSmallScreen() ?
                    m('i.icon-meridium-mobile.icon-apm-title') :
                    m('i.dummy-icon', { class: tab.getIconImage() }),
                m('div.tab-title', tab.getFullTitle())
            ])
        ]);
    }
    function backButton(vm, tab) {
        var showBackButton = (vm.isSmallScreen() && !vm.isHomeScreenActive());
        return showBackButton ?
            m('i.icon-back-arrow.pull-left.tab-back', { onclick: vm.handleClickEvent.bind(vm, tab) }) :
            m('i.icon-mobile-menu.pull-left', { onclick: vm.handleClickEvent.bind(vm, tab) });

    }

    var liftGt = R.lift(R.gt);
    var liftLt = R.lift(R.lt);
    var liftLte = R.lift(R.lte);
    var subtract = R.lift(R.subtract);

    var tabCount = R.invoker(0, 'getVariableTabsLength');
    var activeTab = R.invoker(0, 'getLastActiveVariableTab');

    var lengthOfAllTabs = R.compose(R.multiply(TAB_WIDTH), tabCount);
    var containerWidth = R.invoker(0, 'containerWidth');
    var canShowAllTabs = liftLte(lengthOfAllTabs, containerWidth);
    var maxTabCount = R.cond([
        [canShowAllTabs, tabCount],
        [R.T, R.compose(Math.floor, R.divide(R.__, TAB_WIDTH), R.subtract(R.__, OVERFLOW_WIDTH), containerWidth)]
    ]);
    var isFewerTabsThanMaxVisible = liftLte(tabCount, maxTabCount);
    var tabOverflow = liftGt(tabCount, maxTabCount);
    var halfWay = R.compose(Math.floor, R.divide(R.__, 2), maxTabCount);
    var lastTab = R.compose(R.dec, tabCount);
    var showLastTab = subtract(tabCount, maxTabCount);
    var startHalfway = subtract(activeTab, halfWay);
    var isLastTab = R.lift(R.equals)(activeTab, lastTab);
    var isLessThanMax = liftLt(activeTab, maxTabCount);
    var isOverHalfWay = liftGt(activeTab, halfWay);
    var isOverHalfButLessThanMax = R.both(isOverHalfWay, isLessThanMax);
    
    function centerTabLeft (vm) {
        return startHalfway(vm) + maxTabCount(vm) - startHalfway(vm) - maxTabCount(vm) + 1;
    }

    var centerTabRight = R.compose(R.add(2), subtract(activeTab, maxTabCount));
    var firstTab = R.always(0);
    var startTab = R.cond([
        [isFewerTabsThanMaxVisible, firstTab],
        [isOverHalfButLessThanMax, centerTabLeft],
        [isLessThanMax, firstTab],
        [isLastTab, showLastTab],
        [R.T, centerTabRight]
    ]);

    var trimEndAtTabLength = R.curry(function trimEndAtTabLength (start, vm) {
        return start + maxTabCount(vm) > tabCount(vm);
    });

    var addMaxTabCount = R.curry(addMaxTabCount = function (start, vm) {
        return start + maxTabCount(vm);
    });

    function endTab (vm, start) {
        return R.cond([
            [isFewerTabsThanMaxVisible, tabCount],
            [trimEndAtTabLength(start), tabCount],
            [R.T, addMaxTabCount(start)]
        ])(vm);
    }

    function overflow (vm) {
        if (!tabOverflow(vm) || !vm.getOverflowTabVisible()) {
            return '';
        }
        return m('div.top-nav-main-tabs-overflow', [
            m('div',
              { style: 'display: inline-block' },
              makeVariableTabs(vm, vm.getVariableTabs()))
        ]);
    }

    return TabBarView;
});
