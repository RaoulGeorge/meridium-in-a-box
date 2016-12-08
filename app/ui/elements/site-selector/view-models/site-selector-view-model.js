define(function (require) {
    'use strict';

    var _ = require('lodash');

    var Assert = require('mi-assert'),
        SiteUser = require('../models/site-user'),
        Event = require('system/lang/event'),
        AjaxRequest = require('system/http/es6-ajax-request'),
        m = require('mithril');

    function SiteSelectorViewModel() {
        var user = new SiteUser();
        this.__private__ = {
            user: user,
            selectedSite: user.NullSite,
            isHidden: false,
            isDisabled: false,
            isReadOnly: false
        };
        this.selectedSiteChanged = Object.resolve(Event);
        this.setSelectedSite(this.getDefaultSite());
    }

    SiteSelectorViewModel.prototype.dispose = function dispose() {
        this.selectedSiteChanged.remove();
        this.selectedSiteChanged = null;
    };

    SiteSelectorViewModel.prototype.getDefaultSite = function getDefaultSite() {
        return getUser(this).getDefaultSite();
    };

    function getUser(self) {
        assertThis(self);
        var user = self.__private__.user;
        assertUser(self, user);
        return user;
    }

    SiteSelectorViewModel.prototype.setSelectedSite = function setSelectedSite(site) {
        assertThis(this);
        assertSite(site);
        this.__private__.selectedSite = site;
        this.selectedSiteChanged.raise(this, { site: this.getSelectedSite() });
    };

    SiteSelectorViewModel.prototype.getSites = function getSites() {
        return getUser(this).getSites();
    };

    SiteSelectorViewModel.prototype.getSelectableSites = function getSites() {
        var globalAccess = SiteUser.hasGlobalAccess(),
            sites = this.getSites(),
            noSites = sites.length === 0,
            selectedSite = this.getSelectedSite(),
            nullSite = getUser(this).NullSite;
        if (globalAccess) {
            sites = insertNullSite(this, sites);
        } else {
            if (noSites || selectedSite === nullSite) {
                sites = [nullSite];
            }
        }
        Assert.isArray(sites, 'sites');
        Assert.assert(sites.length >= 1, 'expected sites to have at least one item');
        return sites;
    };

    function insertNullSite(self, sites) {
        sites.unshift(getUser(self).NullSite);
        return sites;
    }

    SiteSelectorViewModel.prototype.getSelectedSite = function getSelectedSite() {
        assertThis(this);
        var site = this.__private__.selectedSite;
        assertSite(site);
        return site;
    };

    SiteSelectorViewModel.prototype.allowSelection = function allowSelection() {
        return getUser(this).hasMultipleSites();
    };

    SiteSelectorViewModel.prototype.isHidden = function isHidden() {
        assertThis(this);
        var value = this.__private__.isHidden || getSiteCount(this) === 0 || getDBSiteCount(this) <= 1;
        Assert.isBoolean(value);
        return value;
    };

    function getSiteCount(self) {
        assertThis(self);
        return self.getSites().length;
    }

    function getDBSiteCount(self) {
        assertThis(self);
        return getUser(self).getDBSiteCount();
    }

    SiteSelectorViewModel.prototype.isDisabled = function isDisabled() {
        assertThis(this);
        var value = this.__private__.isDisabled;
        Assert.isBoolean(value);
        return value;
    };

    SiteSelectorViewModel.prototype.isReadOnly = function isReadOnly() {
        assertThis(this);
        var value = this.__private__.isReadOnly;
        Assert.isBoolean(value);
        return value;
    };

    SiteSelectorViewModel.prototype.setHidden = function setHidden(value) {
        assertThis(this);
        Assert.isBoolean(value);
        this.__private__.isHidden = value;
    };

    SiteSelectorViewModel.prototype.setDisabled = function setDisabled(value) {
        assertThis(this);
        Assert.isBoolean(value);
        this.__private__.isDisabled = value;
    };

    SiteSelectorViewModel.prototype.setReadOnly = function setReadOnly(value) {
        assertThis(this);
        Assert.isBoolean(value);
        this.__private__.isReadOnly = value;
    };

    SiteSelectorViewModel.prototype.selectSiteByKey = function selectBySetByKey(siteKey) {
        assertThis(this);
        var site = matchSite(this, siteKey);
        if (site) {
            this.setSelectedSite(site);
        }
    };

    function matchSite(self, siteKey) {
        if (siteKey === null) { return getUser(self).NullSite; }
        return _.find(self.getSites(), whereKeyMatches.bind(null, siteKey));
    }

    function whereKeyMatches(siteKey, item) {
        return item.siteKey === siteKey;
    }

    SiteSelectorViewModel.prototype.selectSiteByAssetKey = function selectSiteByAssetKey(assetKey) {
        assertThis(this);
        Assert.stringNotEmpty(assetKey);
        findAssetContext(assetKey)
            .then(selectSiteByAssetContext.bind(null, this));
    };

    function findAssetContext(assetKey) {
        Assert.stringNotEmpty(assetKey);
        var url = 'meridium/api/common/assetcontext/' + assetKey;
        return AjaxRequest.get(url).send();
    }

    function selectSiteByAssetContext(self, context) {
        self.selectSiteByKey(context.siteKey === '0' ? null : context.siteKey);
        m.redraw();
    }

    SiteSelectorViewModel.prototype.selectDefaultSite = function () {
        var site = this.getDefaultSite();
        if (site) {
            this.setSelectedSite(site);
        }
    };

    function assertThis(self) {
        if (Assert.enabled) {
            Assert.instanceOf(self, SiteSelectorViewModel, 'this');
            Assert.isNotUndefined(self.__private__, 'this.__private__');
            Assert.isObject(self.__private__.user, 'this.__private__.user');
            Assert.isObject(self.__private__.selectedSite, 'this.__private__.selectedSite');
            Assert.isBoolean(self.__private__.isHidden, 'this.__private__.isHidden');
            Assert.isBoolean(self.__private__.isDisabled, 'this.__private__.isDisabled');
            Assert.isBoolean(self.__private__.isReadOnly, 'this.__private__.isReadOnly');
            Assert.instanceOf(self.selectedSiteChanged, Event, 'this.selectedSiteChanged');
        }
    }

    function assertUser(self, user) {
        user = user || getUser(self);
        if (Assert.enabled) {
            Assert.instanceOf(user, SiteUser, 'user');
        }
    }

    function assertSite(site) {
        if (Assert.enabled) {
            Assert.ok(site, 'site');
            if (site.siteKey !== null) {
                Assert.isString(site.siteKey, 'site.siteKey');
            }
            Assert.isString(site.siteName, 'site.siteName');
        }
    }

    return SiteSelectorViewModel;
});