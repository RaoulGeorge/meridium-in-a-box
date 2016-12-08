define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var Assert = require('mi-assert'),
        m = require('mithril'),
        ISiteSelectorElement = require('./i-site-selector-element'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        SiteSelectorViewModel = require('./view-models/site-selector-view-model'),
        SiteSelectorView = require('./views/site-selector-view'),
        Formatter = require('system/text/formatter');

    var formatter = Object.resolve(Formatter);
    var SiteSelectorElement = {};
    var containerWidth = 90;
    var truncTextChars = 8;

    SiteSelectorElement.prototype = Object.create(HTMLElement.prototype);

    SiteSelectorElement.prototype.createdCallback = function () {
        try {
            tryCreatedCallback(this);
        } catch (error) {
            handleError(error);
        }
    };

    function tryCreatedCallback(self) {
        initPrivate(self);
        initVm(self);
        initProperties(self);
        assertThis(self);
    }

    function initPrivate(self) {
        self.__private__ = {
            root: null,
            vm: null,
            previousValue: null
        };
    }

    function initVm(self) {
        setVm(self, Object.resolve(SiteSelectorViewModel));
        getVm(self).setReadOnly(Element.booleanAttribute(self, 'hidden'));
        getVm(self).setDisabled(Element.booleanAttribute(self, 'disabled'));
        getVm(self).setReadOnly(Element.booleanAttribute(self, 'readonly'));
        getVm(self).selectedSiteChanged.add(selectedSite_changed, self, self);
    }

    function setVm(self, vm) {
        assertThis(self);
        self.__private__.vm = vm;
    }

    function getVm(self) {
        assertThis(self);
        var vm = self.__private__.vm;
        assertVm(vm);
        return vm;
    }

    function selectedSite_changed(self, vm, e) {
        assertVm(vm);
        Assert.ok(e, 'e');
        assertSite(e.site, 'e.site');
        e.site.truncatedSiteName = formatter.abbreviateByWidth(e.site.siteName, containerWidth, truncTextChars);
        Element.raiseEvent(self, 'change', { site: e.site, value: e.site.siteKey });
    }

    function initProperties(self) {
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });
        Element.defineProperty(self, 'isSiteViewOnly', {
            get: isSiteViewOnly.bind(null, self),
            set: setSiteViewOnly
        });
    }

    function getValue(self) {
        var site = getVm(self).getSelectedSite();
        assertSite(site);
        return site.siteKey;
    }

    function setValue(self, value) {
        if (_.isUndefined(value) || value === '') {
            value = null;
        }
        getVm(self).selectSiteByKey(value);
        m.redraw();
    }

    function isSiteViewOnly(self) {
        var site = getVm(self).getSelectedSite();
        assertSite(site);
        return site.viewOnly;
    }

    function setSiteViewOnly() {
        // do nothing
    }

    function handleError(error) {
        logger.error(error.stack);
        console.error(error.stack);
        throw error;
    }

    SiteSelectorElement.prototype.attachedCallback = function () {
        try {
            tryAttachedCallback(this);
        } catch (error) {
            handleError(error);
        }
    };

    function tryAttachedCallback(self) {
        if (!hasVm(self)) { initVm(self); }
        initRoot(self);
        attachToRoot(self);
    }

    function hasVm(self) {
        assertThis(self);
        return !!self.__private__.vm;
    }

    function initRoot(self) {
        assertThis(self);
        setRoot(self, Element.build('div', self, ['site-selector-root']));
    }

    function setRoot(self, root) {
        assertThis(self);
        self.__private__.root = root;
    }

    function attachToRoot(self) {
        assertRoot(self);
        assertView(SiteSelectorView);
        m.mount(getRoot(self), { controller: getVm.bind(null, self), view: SiteSelectorView });
    }

    function getRoot(self) {
        assertThis(self);
        var root = self.__private__.root;
        assertRoot(self, root);
        return root;
    }

    SiteSelectorElement.prototype.detachedCallback = function () {
        try {
            tryDetachedCallback(this);
        } catch (error) {
            handleError(error);
        }
    };

    function tryDetachedCallback(self) {
        detachFromRoot(self);
        disposeRoot(self);
        disposeVm(self);
    }

    function detachFromRoot(self) {
        assertRoot(self);
        m.mount(getRoot(self), null);
    }

    function disposeRoot(self) {
        assertThis(self);
        assertRoot(self);
        Element.detach(getRoot(self));
        setRoot(self, null);
    }

    function disposeVm(self) {
        getVm(self).selectedSiteChanged.remove(self);
        getVm(self).dispose();
        setVm(self, null);
    }

    SiteSelectorElement.prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
        try {
            tryAttributeChangedCallback(this, attrName, oldValue, newValue);
        } catch (error) {
            handleError(error);
        }
    };

    function tryAttributeChangedCallback(self, attrName, oldValue, newValue) {
        var setter = getAttributeSetter(attrName);
        setter(self, newValue);
    }

    function getAttributeSetter(attrName) {
        var attributeSetters = {
            'hidden': setHiddenAttribute,
            'disabled': setDisabledAttribute,
            'readonly': setReadOnlyAttribute
        };
        return attributeSetters[attrName] || _.noop;
    }

    function setHiddenAttribute(self, newValue) {
        getVm(self).setHidden(newValue !== null);
        m.redraw();
    }

    function setDisabledAttribute(self, newValue) {
        getVm(self).setDisabled(newValue !== null);
        m.redraw();
    }

    function setReadOnlyAttribute(self, newValue) {
        getVm(self).setReadOnly(newValue !== null);
        m.redraw();
    }

    SiteSelectorElement.prototype.selectSiteByAssetKey = function (siteKey) {
        Assert.isNotUndefined(siteKey, 'siteKey');
        Assert.isNotNull(siteKey, 'siteKey');
        Assert.stringNotEmpty(siteKey.toString(), 'siteKey.toString()');
        getVm(this).selectSiteByAssetKey(siteKey.toString());
        m.redraw();
    };

    SiteSelectorElement.prototype.selectDefaultSite = function () {
        getVm(this).selectDefaultSite();
        m.redraw();
    };

    function assertThis(self) {
        if (Assert.enabled) {
            Assert.implementsInterface(self, ISiteSelectorElement, 'this');
            Assert.isNotUndefined(self.__private__, 'this.__private__');
            Assert.isNotUndefined(self.__private__.root, 'this.__private__.root');
            Assert.isNotUndefined(self.__private__.vm, 'this.__private__.vm');
        }
    }

    function assertRoot(self, root) {
        if (Assert.enabled) {
            root = root || getRoot(self);
            Assert.instanceOf(root, HTMLElement, 'root');
        }
    }

    function assertVm(vm) {
        if (Assert.enabled) {
            Assert.instanceOf(vm, SiteSelectorViewModel, 'vm');
        }
    }

    function assertView(view) {
        if (Assert.enabled) {
            Assert.isFunction(view, 'view');
        }
    }

    function assertSite(site) {
        if (Assert.enabled) {
            Assert.ok(site, 'site');
            if (site.siteKey !== null) {
                Assert.isString(site.siteKey, 'site.siteKey');
            }
            Assert.isString(site.siteName, 'site.siteName');
            if (site.truncatedSiteName) {
                Assert.isString(site.truncatedSiteName, 'site.truncatedSiteName ');
            }
        }
    }


    Element.registerElement('mi-site-selector', { prototype: SiteSelectorElement.prototype });
    return SiteSelectorElement;
});