define(function (require) {
    'use strict';

    var R = require('ramda'),
        Router = require('spa/router'),
        RouterConfig = require('text!config/router-config.json'),
        iconsConfig = require('text!config/tab-icons.json'),
        Conductor = require('spa/conductor'),
        Translator = require('system/globalization/translator'),
        Formatter = require('system/text/formatter');

    var routerConfigObject = JSON.parse(RouterConfig),
        iconMapObject = JSON.parse(iconsConfig);

    var sameScreen = R.eqProps('screen'),
        notSameScreen = R.compose(R.not, sameScreen);

    var MAX_TAB_TITLE_LEN = 7,
        DEFAULT_ICON = 'tab-icon-default';


    function TabViewModel(router, conductor, formatter) {
        this.__private__ = {
            background: false,
            contentRegion: null,
            title: '',
            fullTitle: '',
            href: '',
            icon: '',
            routeInfo: null
        };
        this.router = router;
        this.conductor = conductor;
        this.formatter = formatter;
        this.translator = Object.resolve(Translator);
        this.router.routerConfig = routerConfigObject;
        this.iconMap = iconMapObject;
    }

    TabViewModel.dependsOn = [Router, Conductor, Formatter];

    TabViewModel.prototype.open = function tabViewModel_open(contentRegion, url, background, query) {
        setContentRegion(this, contentRegion);
        setIsBackground(this, background === true);
        this.router.matchedRoute.add(route, this, this);
        this.router.activate();
        resolveRouter(this, url, query);
        this.setHref(url);
        this.setFullTitle(this.translator.translate('NEW_TAB'));
    };

    function getIsBackground (self) {
        return self.__private__.background;
    }

    function setIsBackground (self, value) {
        self.__private__.background = value;
    }

    TabViewModel.prototype.getHref = function () {
        return this.__private__.href;
    };

    TabViewModel.prototype.setHref = function (value) {
        this.__private__.href = value;
    };

    TabViewModel.prototype.getTitle = function () {
        return this.__private__.title;
    };

    function setTitle (self, value) {
        self.__private__.title = value;
    }

    TabViewModel.prototype.getFullTitle = function () {
        return this.__private__.fullTitle;
    };

    TabViewModel.prototype.setFullTitle = function (value) {
        this.__private__.fullTitle = value;
        setTitle(this, abbreviateTitle(this, value));
    };

    function abbreviateTitle (self, title) {
        return self.formatter.abbreviate(title, MAX_TAB_TITLE_LEN);
    }

    function route(self, routeInfo) {
        if (routeInfo.arguments) {
            if (routeInfo.arguments.icon !== undefined) {
                self.setIcon(routeInfo.arguments.icon);
            }
            R.cond([
                [getIsBackground, delay(openBackground(routeInfo))],
                [R.T, delay(openForeground(routeInfo))]
            ])(self);
        }        
    }

    var delay = R.curry(function (fnc, self) {
        setTimeout(fnc.bind(null, self), 20);
    });

    var openBackground = R.curry(function openBackground (routeInfo, self) {
        setRouteInfo(self, routeInfo);
        self.conductor.openScreen(self.getScreen(), getRouteInfo(self).arguments);       
    });

    var openForeground = R.curry(function openForeground (routeInfo, self) {
        var contentRegion, changeScreenOptions;

        changeScreenOptions = {
            isClosing: false,
            checkForReuse: checkForReuse(self)
        };
        setRouteInfo(self, routeInfo);
        //conductor.changeScreen will update screen and it needs to be copied back
        contentRegion = getContentRegion(self);
        self.conductor.changeScreen(
            self.getScreen(),
            contentRegion,
            getRouteInfo(self).arguments,
            changeScreenOptions
        );
        if (notSameScreen(getRouteInfo(self), contentRegion)) {
            setScreen(self, contentRegion.screen);
        }        
    });

    function checkForReuse (self) {
        return sameScreen(getRouteInfo(self), getContentRegion(self));
    }

    function getRouteInfo (self) {
        return R.defaultTo({}, self.__private__.routeInfo);
    }

    function setRouteInfo (self, value) {
        self.__private__.routeInfo = value;
    }

    function getContentRegion (self) {
        return self.__private__.contentRegion;
    }

    function setContentRegion (self, value) {
        self.__private__.contentRegion = value;
    }

    TabViewModel.prototype.update = function tabViewModel_update(url, makeActive, query) {
        setIsBackground(this, !makeActive);
        if (needToResolveRoute(this, url, makeActive, query)) {
            this.setHref(url);
            resolveRouter(this, url, query);
            return;
        }
        if (makeActive) {
            route(this, getRouteInfo(this));
        }
    };

    function needToResolveRoute (self, url, makeActive, query) {
        if (!self.isUrlSame(url)) {
            return true;
        }
        if (R.isNil(getRouteInfo(self))) {
            return true;
        }
        if (makeActive && query) {
            return true;
        }
        return false;
    }

    TabViewModel.prototype.isUrlSame = function (url) {
        return this.getHref() === url;
    };

    function resolveRouter(self, url, query) {
        self.router.resolve(url, query);
    }

    TabViewModel.prototype.setIcon = function (icon) {
        this.__private__.icon = icon;
    };

    TabViewModel.prototype.getIcon = function () {
        return this.__private__.icon;
    };

    TabViewModel.prototype.getIconImage = function () {
        return this.iconMap[R.defaultTo(DEFAULT_ICON, this.getIcon())];
    };

    TabViewModel.prototype.close = function tabViewModel_close() {
        //Was this the active tab and is it still the active tab?
        if (sameScreen(getContentRegion(this), getRouteInfo(this))) {
            this.conductor.clearScreen(getContentRegion(this));
        } else if (getRouteInfo(this)) {
            this.conductor.unloadScreen(this.getScreen());
            this.conductor.closeScreen(this.getScreen());
        }

        this.router.matchedRoute.remove();
        this.router.deactivate();
        this.router = null;
        this.conductor = null;
        setRouteInfo(this, null);
        this.translator = null;
        this.iconMap = null;
        setContentRegion(this, null);
    };

    TabViewModel.prototype.canUnload = function (callback) {
        if (hasCanUnload(this)) {
            callCanUnload(this, callback);
        } else {
            callback();
        }
    };

    function hasCanUnload (self) {
        return self.getScreen() && self.getScreen().canUnload;
    }

    function callCanUnload (self, callback) {
        var promise;

        promise = self.getScreen().canUnload();
        if (promise instanceof Object && promise.done) {
            promise.done(callback);
        } else if (promise === true) {
            callback();
        }
    }

    TabViewModel.prototype.isDirty = function () {
        return R.cond([
            [R.isNil, R.F],
            [R.T, R.compose(R.not, R.not, R.flip(Object.tryMethod)('isDirty'))]
        ])(this.getScreen());
    };

    TabViewModel.prototype.getScreen = function () {
        return R.prop('screen', R.defaultTo({}, getRouteInfo(this)));
    };

    function setScreen (self, value) {
        getRouteInfo(self).screen = value;
    }

    return TabViewModel;
});
