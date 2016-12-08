define(function (require) {
    'use strict';

    var _ = require('lodash'),
        R = require('ramda');

    var ApplicationContext = require('application/application-context'),
        Assert = require('mi-assert'),
        Translator = require('system/globalization/translator');

    function SiteUser() {
        var translator = Object.resolve(Translator);
        this.NullSite = {
            siteKey: null,
            siteName: translator.translate('ALL_SITES')
        };
        this.__private__ = {
            user: ApplicationContext.user,
            session: ApplicationContext.session,
            dbSitesCount: ApplicationContext.dbSiteCount
        };
    }

    SiteUser.hasGlobalAccess = function hasGlobalAccess() {
        return true;
    };

    SiteUser.prototype.getSites = function getSites() {
        var sites = copyUserSites(this);
        Assert.isArray(sites, 'sites');
        return sites;
    };

    SiteUser.prototype.getDBSiteCount = function getDBSiteCount() {
        return DBSiteCount(this);
    };

    SiteUser.prototype.hasMultipleSites = function () {
        var sites = getUser(this).sites;
        if (!sites) { return false; }
        return getUser(this).sites.length !== 1;
    };

    function copyUserSites(self) {
        var sites = getSession(self).userSites;
        sites = sites || [];
        sites = sites.slice();
        Assert.isArray(sites, 'sites');
        Assert.assert(sites !== getUser(self).sites, 'sites is a copy of user sites');
        return sites;
    }

    function getUser(self) {
        assertThis(self);
        var user = self.__private__.user;
        assertUser(self, user);
        return user;
    }

    function getSession(self) {
        assertThis(self);
        return self.__private__.session;
    }

    SiteUser.prototype.getDefaultSite = function getDefaultSite() {
        var site,
            defaultSiteKey = getDefaultSiteKey(this);
        if (defaultSiteKey) {
            site = findSite(this, defaultSiteKey);
        } else {
            site = firstEditableSite(this);
        }
        assertSite(site);
        return site;
    };

    function getDefaultSiteKey(self) {
        var defaultSiteKey = getUser(self).defaultSiteKey || null;
        Assert.isNotUndefined(defaultSiteKey, 'defaultSiteKey');
        return defaultSiteKey;
    }

    function findSite(self, siteKey) {
        var site;
        if (hasSites(self)) {
            site = _.find(self.getSites(), whereKeyMatches.bind(null, siteKey));
            site = site || firstEditableSite(self);
        } else {
            site = self.NullSite;
        }
        assertSite(site);
        return site;
    }

    function hasSites(self) {
        return self.getSites().length > 0;
    }

    function whereKeyMatches(siteKey, item) {
        return item.siteKey === siteKey;
    }

    function firstEditableSite(self) {
        var site;
        if (hasSites(self)) {
            site = R.find(isSiteEditable, self.getSites()) || self.NullSite;
        } else {
            site = self.NullSite;
        }
        assertSite(site);
        return site;
    }

    function DBSiteCount(self) {
       return self.__private__.dbSitesCount;
    }

    var isSiteEditable = R.complement(R.prop('viewOnly'));

    function assertThis(self) {
        if (Assert.enabled) {
            Assert.instanceOf(self, SiteUser, 'this');
            Assert.isNotUndefined(self.__private__, 'this.__private__');
            Assert.isNotUndefined(self.__private__.user, 'this.__private__.user');
        }
    }

    function assertUser(self, user) {
        user = user || getUser(self);
        if (Assert.enabled) {
            Assert.assert(user === ApplicationContext.user, 'expected user to be same as ApplicationContext.user');
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

    return SiteUser;
});