define (function(require) {
    'use strict';

    var R = require('ramda'),
        $ = require('jquery'),
        m = require('mithril'),
        ApplicationEvents = require('application/application-events'),
        UrlManager = require('spa/url-manager'),
        TabViewModel = require('./tab-view-model'),
        LoginViewModel = require('security/view-models/login-view-model'),
        Region = require('spa/region'),
        ScreenSize = require('ui/screen-size'),
        CONTENT_SELECTOR = 'section.content';

    function TabBarViewModel(appEvents, urlManager) {
        this.__private__ = {
            tabs: [],
            activeTabIndex: 0,
            lastActiveVariableTab: 2,
            isOverflowTabVisible: false,
            contentRegion: new Region()
        };        

        this.appEvents = appEvents;
        this.urlManager = urlManager;
        this.screenSize = Object.resolve(ScreenSize);
    }

    TabBarViewModel.dependsOn = [ApplicationEvents, UrlManager];
    
    function getTabs  (self) {
        return self.__private__.tabs;
    }

    function setTabs (self, tabs) {
        self.__private__.tabs = tabs;
    }

    TabBarViewModel.prototype.getHomeTab = function () {
        return getTabs(this)[0];
    };

    TabBarViewModel.prototype.getAssetHierarchyTab = function () {
        return getTabs(this)[1];
    };

    TabBarViewModel.prototype.clearTabs = function () {
        this.__private__.tabs = [];
    };
    
    TabBarViewModel.prototype.getActiveTabIndex = function () {
        return this.__private__.activeTabIndex;
    };

    TabBarViewModel.prototype.getActiveTab = function () {
        return getActiveTab(this);
    };

    function getActiveTab (self) {
        return getTabs(self)[self.getActiveTabIndex()];
    }

    TabBarViewModel.prototype.isHomeScreenActive = function() {
        var tab = getActiveTab(this);
        if (!tab) {
            return true;
        }

        return this.isSmallScreen() ? tab.getHref() === 'rounds/dashboard/user' : this.isActiveTab(this.getHomeTab());
    };

    TabBarViewModel.prototype.setActiveTabIndex = function (value) {
        this.__private__.activeTabIndex =  value;
        if (value > 1) {
            setLastActiveVariableTab(this, value - 2);
        }
    };

    TabBarViewModel.prototype.getLastActiveVariableTab = function () {
        return this.__private__.lastActiveVariableTab;
    };

    function setLastActiveVariableTab (self, value) {
        self.__private__.lastActiveVariableTab = value;
    }
    

    TabBarViewModel.prototype.isActiveTabHrefSame = function (url) {
        return getActiveTab(this).isUrlSame(url);
    };

    TabBarViewModel.prototype.isActiveTab = function (tab) {
        return R.equals(getActiveTab(this), tab);
    };

    TabBarViewModel.prototype.attach = function () {
        initContentRegion(this);
        this.appEvents.titleChanged.add(changeTitle, this, this);
        this.appEvents.iconChanged.add(changeIcon, this, this);
        window.addEventListener('click', R.partial(closeOverflowTabs, [this]));
        this.appEvents.windowResized.add(detectTabOverflow, this, this);
    };

    function initContentRegion (self) {
        self.__private__.contentRegion.setElement($(CONTENT_SELECTOR));
    }

    function getContentRegion (self) {
        return self.__private__.contentRegion;
    }

    function changeTitle (self, title, source) {
        var tab;

        tab = findScreenTab(self, source);
        if (R.not(R.isNil(tab))) {
            tab.setFullTitle(title);
            m.redraw();
        }
        if (tab === getActiveTab(self)) {
            _title(title);
        }
    }

    function findScreenTab  (self, source) {
        var equalScreen = R.compose(R.equals(source), R.invoker(0, 'getScreen'));
        return R.find(equalScreen, getTabs(self));
    }

    function _title (title) {
        document.title = title;
    }

    function changeIcon (self, icon, source) {
        var tab;

        tab = findScreenTab(self, source);
        if (!R.isNil(tab)) {
            tab.setIcon(icon);
            m.redraw();
        }
    }
    
    TabBarViewModel.prototype.canUnloadActiveTab = function (callback) {
        getActiveTab(this).canUnload(callback);
    };

    TabBarViewModel.prototype.toggleOverflowTabs = function () {
        setOverflowTabVisible(this, !this.getOverflowTabVisible());
    };

    TabBarViewModel.prototype.getOverflowTabVisible = function () {
        return this.__private__.isOverflowTabVisible;
    };

    function setOverflowTabVisible (self, value) {
        self.__private__.isOverflowTabVisible = value;
    }

    function closeOverflowTabs  (self, e) {
        if (!targetIsInOverflow(e.target)) {
            setOverflowTabVisible(self, false);
            m.redraw();
        }
    }

    function targetIsInOverflow (target) {
        var overflowIcon = document.querySelector('a.tabs-overflow-icon'),
            overflow = document.querySelector('div.top-nav-main-tabs-overflow');
        return (overflowIcon && overflowIcon.contains(target)) ||
            (overflow && overflow.contains(target));
    }

    function detectTabOverflow (self){
        setOverflowTabVisible(self, false);
        m.redraw();
    }

    TabBarViewModel.prototype.handleClickEvent = function (tab, e) {
        if (middleClickOrCloseIcon(e)) {
            e.stopPropagation();
            checkCloseTab(this, tab);
        } else if (isMenuIcon(e)) {
            this.appEvents.smallDeviceOptionsMenuClicked.raise();
        } else {
            makeActive(this, tab);
        }
        e.preventDefault();
    };

    function middleClickOrCloseIcon (e) {
        if (e.which === 2) {
            return true;
        }
        if (e.target.nodeName === 'I' && (e.target.classList.contains('ds-cross') || e.target.classList.contains('tab-back'))) {
            return true;
        }
        return false;
    }
    function isMenuIcon(e) {
        if (e.target.nodeName === 'I' && e.target.classList.contains('icon-mobile-menu')) {
            return true;
        }
        return false;
    }

    function checkCloseTab (self, tab) {        
        tab.canUnload(R.partial(closeTab, [self, tab]));
    }

    function closeTab(self, tab) {
        var urls, 
            index = getTabs(self).indexOf(tab);

        tab.close();
        getTabs(self).splice(index, 1);
        urls = self.getHrefs();
        if (self.getActiveTabIndex() >= index) {
            self.setActiveTabIndex(self.getActiveTabIndex() - 1);
        }
        self.urlManager.setHash(urls, self.getActiveTabIndex());
    }

    function makeActive (self, tab) {
        var index;
        index = getTabs(self).indexOf(tab);
        if (index > -1) {
            setOverflowTabVisible(self, false);
            self.urlManager.setHash(self.getHrefs(), index);
        }        
    }

    TabBarViewModel.prototype.makeActive = function (tab, e) {
        makeActive(this, tab);
        e.preventDefault();
    };

    TabBarViewModel.prototype.hasDirtyTab = function () {
        return R.any(R.invoker(0, 'isDirty'), getTabs(this));
    };

    TabBarViewModel.prototype.updateTabs = function (urls, query) {
       
        R.zipWith(updateTab(this, query), urls, getTabs(this));
        R.forEach(createTab(this, query), R.slice(getTabs(this).length, Infinity, urls));
        closeExtraTabs(this, urls.length);
        _title(getActiveTab(this).getTitle());
        m.redraw();
    };

    var updateTab = R.curry(function updateTab (self, query, url, tab) {
        var isActive = self.isActiveTab(tab);
        tab.update(url, isActive, isActive ? query : undefined);
    });

    var createTab = R.curry(function createTab (self, query, url) {
        var tab = Object.resolve(TabViewModel),
            background = getTabs(self).length !== self.getActiveTabIndex();

        tab.open(getContentRegion(self), url, background, background ? undefined : query);
        getTabs(self).push(tab);
        if (!background) {
            _title(tab.getTitle());
        }
    });

    function closeExtraTabs (self, routeLength) {
        var extraTabs = R.slice(routeLength, Infinity, getTabs(self));
        R.forEach(R.invoker(0, 'close'), extraTabs);
        setTabs(self, R.take(routeLength, getTabs(self)));
    }

    TabBarViewModel.prototype.getHrefs = function () {
        return R.map(R.invoker(0, 'getHref'), getTabs(this));
    };

    TabBarViewModel.prototype.updateHrefs = function (urls) {
        R.zipWith(setHref, urls, getTabs(this));
    };

    function setHref (url, tab) {
        tab.setHref(url);
    }

    TabBarViewModel.prototype.containerWidth = function () {
        var container = document.querySelector('div.top-nav-main-tabs-group');
        if (R.isNil(container)) {
            return 0;
        }
        return container.getBoundingClientRect().width;
    };

    TabBarViewModel.prototype.getVariableTabs = function () {
        return getTabs(this).slice(2);
    };

    TabBarViewModel.prototype.getVariableTabsLength = function () {
        return this.getVariableTabs().length;
    };

    TabBarViewModel.prototype.signOut = function () {
        var login = Object.resolve(LoginViewModel);
        login.logout(true);
    };

    TabBarViewModel.prototype.isSmallScreen = function () {
        return this.screenSize.isTooSmallForAllPages();
    };

    return TabBarViewModel;
});
