define(function (require, exports, module) {
    'use strict';

    var mx = require('system/mithril/mithril-extensions'),
    TabModel = require('./tab-model');

    function TabGroupViewModel(attrs, children) {
        this.onchange = null;
        this.tabs = [];
        this.setState(attrs, children);
    }

    TabGroupViewModel.prototype.setState = function (attrs, tabs) {
        this.onchange = attrs.onchange;
        this.tabs = tabs.map(toTabModel);
    };

    TabGroupViewModel.prototype.select = function (self, tab) {
        unselectAll(this);
        selectTab(tab);
        onChange(this);
        onClick(tab);
        //m.redraw();
    };

    TabGroupViewModel.prototype.getTabWidth = function () {
        var self = this;
        return '.' + calculateTabWidth(self.tabs.length);
    };

    function unselectAll(self) {
        var tabs = self.tabs.map(function (tab) {
            tab.selected = false;
            return tab;
        });
        self.tabs = tabs;
    }

    function selectTab(tab) {
        tab.selected = true;
    }

    function onChange(self) {
        if (self.onchange) {
            self.onchange(mx.event(self));
        }
    }

    function onClick(tab) {
        if (tab.onclick) {
            tab.onclick(tab);
        }
    }

    function toTabModel(tab) {
        return new TabModel(tab);
    }

    function calculateTabWidth(tabCount) {
        if (tabCount === 2) {
            return 'two-tab';
        } else if (tabCount === 3) {
            return 'three-tab';
        } else if (tabCount === 4) {
            return 'four-tab';
        } else if (tabCount === 5) {
            return 'five-tab';
        } else if (tabCount === 6) {
            return 'six-tab';
        } else if (tabCount === 7) {
            return 'seven-tab';
        } else if (tabCount === 8) {
            return 'eight-tab';
        }

        return 'one-tab';
    }

    return TabGroupViewModel;
});