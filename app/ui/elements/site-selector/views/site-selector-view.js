define(function (require) {
    'use strict';

    var m = require('mithril'),
        h = require('system/mithril/html-tags'),
        b = require('system/mithril/bootstrap-tags'),
        R = require('ramda'),
        Translator = require('system/globalization/translator');

    function SiteSelectorView(vm) {
        if (vm.isHidden()) { return; }
        var control = vm.isReadOnly() ? readonly : editable;
        return control(vm);
    }

    function readonly(vm) {
        return m('.readonly', [
            h.icon('.icon-location'),
            label(),
            output(vm)
        ]);
    }

    function editable(vm) {
        return b.dropdown([
            button(vm),
            menu(vm)
        ]);
    }

    function button(vm) {
        var selectedSite = vm.getSelectedSite();
        var attr = { 'data-toggle': 'dropdown', 'title': selectedSite.siteName };
        if (vm.isDisabled()) {
            attr.disabled = 'disabled';
        }
        return m('button.btn', attr, [
            h.icon('.icon-location'),
            label(),
            output(vm)
        ]);
    }

    function label() {
        var translator = Object.resolve(Translator),
            BUTTON_LABEL = translator.translate('SITE');
        return h.label(BUTTON_LABEL + ':');
    }

    function output(vm) {
        var selectedSite = vm.getSelectedSite();
        return selectedSite && selectedSite.truncatedSiteName ? h.output(selectedSite.truncatedSiteName) : h.output(selectedSite.siteName);
    }

    function menu(vm) {
        var sites = vm.getSelectableSites();
        return m('.dropdown-menu', [
            h.ul(menuItems(vm, sites))
        ]);
    }

    function menuItems(vm, sites) {
        return R.map(menuItem(vm), editableSites(sites));
    }

    var menuItem = R.curry(function menuItem(vm, site) {     
        return h.li({
            className: getSelectionClass(vm, site),
            onclick: vm.setSelectedSite.bind(vm, site),
            'title': site.siteName
        }, site.siteName);
    });

    function isReadWrite(site) {
        return !site.viewOnly;
    }

    function getSelectionClass(vm, site) {
        return site === vm.getSelectedSite() ? 'active' : '';
    }

    var editableSites = R.filter(isReadWrite);

    return SiteSelectorView;
});