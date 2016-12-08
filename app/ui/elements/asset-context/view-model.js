define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var AssetHierarchyControl = require('assets/asset-hierarchy-control'),
        AssetGroupControl = require('assets/asset-group-control'),
        DialogBox = require('system/ui/dialog-box'),
        Translator = require('system/globalization/translator'),
        SelectedAssetResults = require('assets/models/selected-asset-results'),
        ko = require('knockout'),
        view = require('text!./template.html'),
        Region = require('spa/region'),
        ApplicationContext = require('application/application-context'),
        AssetContextDTO = require('assets/services/asset-context-dto'),
        HierarchyDTO = require('assets/services/hierarchy-dto'),
        GroupDTO = require('assets/services/asset-group-dto'),
        AssetContextService = require('assets/services/asset-context-service'),
        R = require('ramda'),
        CASCADE_ATTRIBUTES = [
            'selector',
            'multiselect',
            'allowAdd'
        ];

    var AssetContextViewModel = {};
    AssetContextViewModel.prototype = Object.create(HTMLElement.prototype);

    AssetContextViewModel.prototype.createdCallback = function() {
        this.element = this;
        this.translator = Object.resolve(Translator);
        this.results = null;
        this.dialog = null;
        this.existing = [];
        this.activePill = null;
        this.internalvalue = null;
        this.showAsDialog = null;
        this.assetContextService = Object.resolve(AssetContextService);
        this.group = {
            href: '#assets/group',
            title : this.translator.translate('ASSET_GROUP'),
            url : 'group',
            screen: null
        };
        this.hierarchy = {
            href: '#assets/hierarchy',
            title: this.translator.translate('ASSET_HIERARCHY'),
            url : 'hierarchy',
            screen: null
        };


        Object.defineProperty(this, 'value', {
            get: getValue.bind(null, this),
            set: this.setContext.bind(this)
        });

        this.delayload = Element.booleanAttribute(this, 'delayload');
    };

    AssetContextViewModel.prototype.setContext = function (context) {
        var deferred = new $.Deferred(),
            newAssetKey;

        if (!context) {
            _.defer(deferred.resolve, this.internalvalue);
            return deferred.promise();
        }
        newAssetKey = context.entityKey || context;
        if (!newAssetKey) {
            _.defer(deferred.resolve, this.internalvalue);
            return deferred.promise();
        }

        if (this.internalValue && isSameContext(this.internalvalue.entityKey, newAssetKey)) {
            _.defer(deferred.resolve, this.internalvalue);
            return deferred.promise();
        }

        handleOverviewContext(this, context);

        changeContext(this, context, deferred);

        return deferred.promise();
    };

    function handleOverviewContext(self, context) {
        if (typeof context === 'string') {
            setInternalValueWithoutChangeEvent(self, context);
        }
    }


    AssetContextViewModel.prototype.attachedCallback = function () {

        Element.clearDom(this);

        if (this.getAttribute('data-open') === 'true') {
            this.load();
            this.attach(new Region($(this)));
        } else {
            attachContextControl(this);
        }
    };

    AssetContextViewModel.prototype.disableStuff = function (noHierarchy, noGroup) {
        if (noHierarchy === false && noGroup === false) {
            return;
        }
        var list = this.region.element.querySelector('.assetMenu');
        if (noHierarchy === true) {
            detachHierarchy(this);
            unloadHierarchy(this);
            this.region.element.querySelector('.asset-hierarchy-control').style.display = 'none';
            list.removeChild(list.firtElementChild);
            this.activePill('hierarchy');
        } else if (noGroup === true) {
            detachGroup(this);
            unloadGroup(this);
            this.region.element.querySelector('.asset-group-explorer').removeAttribute('data-bind');
            list.removeChild(list.lastElementChild);
            this.activePill('group');
        }
        list.classList.remove('nav-pills');
        list.classList.add('not-active');

    };

    AssetContextViewModel.prototype.detachedCallback = function() {
        if (this.region) {
            this.detach();
            this.unload();
        }
    };

    AssetContextViewModel.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (this.delayload === false) {
            if (attrName === 'entitykey') {
                changeContext(this, newVal);
            } else if (attrName === 'loadassets') {
                this.group.screen.settings.loadAssets = newVal === 'true';
                this.group.screen.settings.hasChildren = newVal === 'true';
                this.group.screen.detach(this.region);
                this.group.screen.attach(this.region);
            }
            cascadeChangedAttribute(this, attrName, newVal);
        }
    };

    AssetContextViewModel.prototype.menuClick = function assetContextViewModel_menuClick(item, event) {
        var e, data, newUrl;

        event.preventDefault();
        event.stopImmediatePropagation();

        newUrl = event.target.getAttribute('data-menu-item');
        if (newUrl === 'hierarchy') {
            data = this.hierarchy;
        } else {
            data = this.group;
        }

        e = new CustomEvent('menu-changing', {
            bubbles: true,
            cancelable: true,
            detail: { menu: data }
        });
        this.dispatchEvent(e);
        if (e.defaultPrevented === true) {
            return;
        }

        if (newUrl === 'hierarchy') {
            this.showHierarchy();
        } else {
            this.showGroup();
        }
    };

    AssetContextViewModel.prototype.load = function () {
        var idx, hierarchySettings, groupSettings, open;

        this.results = new SelectedAssetResults();
        this.results.init();
        this.results.existing = this.existing;
        this.activePill = ko.observable('hierarchy');
        open = this.getAttribute('data-open');
        this.showAsDialog = ko.observable(!open);
        for (idx = 0; idx < this.existing.length; idx++) {
            this.results.selected.push(this.existing[idx]);
        }

        hierarchySettings = {
            multiSelect: false,
            selectedItems: this.results.selected,
            selectable: false,
            contentArea: '.asset-hierarchy-control'
        };

        groupSettings = {
            multiSelect: false,
            selectedItems: this.results.selected,
            selectable: false,
            contentArea: '.asset-group-explorer',
            loadAssets: this.getAttribute('loadassets') !== null,
            allowAdd: this.getAttribute('allow-add') !== null
        };

        this.hierarchy.screen = AssetHierarchyControl.create(hierarchySettings);
        this.hierarchy.screen.load();
        this.group.screen = AssetGroupControl.create(groupSettings);
    };

    AssetContextViewModel.prototype.attach = function (region) {
        this.region = region;
        this.region.attach($(view));
        this.region.$element.find('.region').attr('data-bind', 'halt-bindings');
        this.region.element.addEventListener('change', this);

        if (this.delayload === false) {
            ko.applyBindingsToDescendants(this, this.region.element.querySelector('.region'));
            attachHierarchy(this);
            attachGroup(this);
            cascadeAttributes(this);

            Element.raiseEvent(this.group.screen.groupElement.querySelector('mi-tool-bar'), 'resize', {});
        }
    };

    AssetContextViewModel.prototype.detach = function () {
        detachHierarchy(this);
        detachGroup(this);
        ko.cleanNode(this.region.element);
        this.region.clear();
        this.region = null;
    };

    AssetContextViewModel.prototype.handleEvent = function (e) {

        if (e.type === 'navigated') {
            if (this.group.screen && e.target === this.group.screen.groupElement) {
                navigatedGroupTreeEvent(this);
            } else {
                navigatedHierarchyEvent(this);
            }
        } else if (e.type === 'selected' && this.activePill() === 'group') {
            navigatedGroupListEvent(this);
        } else if (e.type === 'loaded') {
            setLoadContext(this, e);
        } else if (e.type === 'click') {
            showSelector(this);
        } else if (e.type === 'change' && e.target !== this) {
            e.stopImmediatePropagation();
        }
    };

    AssetContextViewModel.prototype.unload = function assetContextViewModel_unload() {
        unloadHierarchy(this);
        unloadGroup(this);
    };

    AssetContextViewModel.prototype.translateText = function assetContextViewModel_translate(key) {
        return this.translator.translate(key);
    };

    AssetContextViewModel.prototype.done = function assetContextViewModel_done() {
        if (!this.dialog) {
            hideSelector(this);
        }
    };

    AssetContextViewModel.prototype.showHierarchy = function assetContextViewModel_showHierarchy() {
        this.activePill(this.hierarchy.url);
        Element.raiseEvent(this, 'menu-change', { menu: this.hierarchy });
    };

    AssetContextViewModel.prototype.showGroup = function assetContextViewModel_showGroup() {
        this.activePill(this.group.url);
        Element.raiseEvent(this, 'menu-change', { menu: this.group });
        Element.raiseEvent(this.group.screen.groupElement.querySelector('mi-tool-bar'), 'resize', {});
    };

    AssetContextViewModel.prototype.setSiteFilter = function(sites) {
        this.hierarchy.screen.setSiteFilter(sites);
    };

    AssetContextViewModel.prototype.loadState = function (state) {
        var value, dfd;
        state = state || {};
        state.hierarchy = state.hierarchy || {};
        state.group = state.group || {};
        state.hierarchy.value = null;
        state.group.value = null;
        this.hierarchy.screen.loadState(state.hierarchy);
        this.group.screen.loadState(state.group);
        value = state.value;
        if (value) {
            dfd = this.setContext(value);
        } else {
            dfd = $.Deferred();
            dfd.resolve();
            if (state.menu === this.group.url) {
                this.activePill(this.group.url);
                this.group.screen.groupElement.addEventListener('loaded', this);
                this.group.screen.groupElement.reload();
            } else {
                this.activePill(this.hierarchy.url);
                this.value = elementIsContainedInAssetFinderDialog(this) ? AssetContextDTO.default() : ApplicationContext.assetcontext;
            }
        }
        return dfd.promise();
    };

    AssetContextViewModel.prototype.saveState = function () {
        return {
            hierarchy: this.hierarchy.screen.saveState(),
            group: this.group.screen.saveState(),
            value: this.internalvalue,
            menu: this.activePill()
        };
    };

    AssetContextViewModel.prototype.href = function () {
        if (this.activePill() === this.hierarchy.url) {
            return this.hierarchy.href + '/' + this.value.entityKey;
        } else {
            return this.group.href + '/' + this.value.entityKey;
        }
    };

    function elementIsContainedInAssetFinderDialog (assetContextElement) {
        if (R.isNil(assetContextElement.parentElement)) {
            return false;
        } else if (R.isNil(assetContextElement.parentElement.parentElement)) {
            return false;
        } else if (R.isNil(assetContextElement.parentElement.parentElement.parentElement)) {
            return false;
        }
        var parent = assetContextElement.parentElement.parentElement.parentElement;
        return parent.classList.contains('asset-finder-screen') &&
            parent.classList.contains('assets-shell-screen');
    }

    function navigatedHierarchyEvent(self) {
        var lastindex = self.hierarchy.screen.tree.value.length - 1,
            hierarchyDto = self.hierarchy.screen.tree.value[lastindex];
        setInternalValue(self, AssetContextDTO.fromHierarchyDTO(hierarchyDto));
        $(self.element).find('span.context-id').text(self.internalvalue.description);
    }

    function navigatedGroupListEvent (self) {
        if (self.group.screen.groupElement.value) {
            setInternalValue(self, AssetContextDTO.fromGroupDTO(self.group.screen.groupElement.value));
            $(self.element).find('span.context-id').text(self.internalvalue.description);
        }
    }

    function navigatedGroupTreeEvent(self) {
        var lastindex = self.group.screen.groupElement.value.length - 1,
            groupDto = self.group.screen.groupElement.value[lastindex];
        setInternalValue(self, AssetContextDTO.fromGroupDTO(groupDto));
        $(self.element).find('span.context-id').text(self.internalvalue.description);
    }

    function showSelector(self) {
        var dialogOptions = {
            height: '90%',
            width: 'auto',
            buttons: [
                {
                    name: self.translator.translate('DONE'),
                    value: 'done',
                    cssClass: 'btn-primary'
                }
            ]
        },
            title = self.translator.translate('ASSET_HIERARCHY');

        if (self.getAttribute('dialog') !== null) {
            self.dialog = new DialogBox(self, title, dialogOptions);
            self.dialog.show();
            self.loadState();
        } else {
            if (!self.region) {
                self.attach(new Region($(self.querySelector('.asset-context-selection'))));
            }
            $(self.element).find('div.asset-context-selection').show();
        }
    }

    function hideSelector(self) {
        $(self.element).find('div.asset-context-selection').removeAttr('style');
    }

    function changeContext(self, context, dfd) {
        var value;

        if (context instanceof AssetContextDTO) {
            setTimeout(getcontext_done.bind(null, self, dfd, context), 0);
        } else if (context instanceof HierarchyDTO) {
            value = AssetContextDTO.formHierarchyDTO(context);
            setTimeout(getcontext_done.bind(null, self, dfd, value), 0);
        } else if (context instanceof GroupDTO) {
            value = AssetContextDTO.fromGroupDTO(context);
            setTimeout(getcontext_done.bind(null, self, dfd, value), 0);
        } else if (context.entityKey){
            self.assetContextService
                .getcontext(context.entityKey)
                .done(getcontext_done.bind(null, self, dfd))
                .fail(dfd.reject.bind(dfd));
        } else {
            self.assetContextService
                .getcontext(context)
                .done(getcontext_done.bind(null, self, dfd))
                .fail(dfd.reject.bind(dfd));
        }
    }

    function setInternalValue(self, assetcontext) {
        if ((!self.internalvalue && (self.internalvalue !== assetcontext)) ||
            (self.internalvalue.entityKey !== assetcontext.entityKey)) {
            self.internalvalue = assetcontext;
            raiseChangeEvent(self);
        }
    }

    function setInternalValueWithoutChangeEvent(self, context) {
        if ((!self.internalvalue && (self.internalvalue !== context)) ||
            (self.internalvalue.entityKey !== context.entityKey)) {
            self.internalvalue = context;
        }
    }

    function getLastPathValue (tree) {
        var value = tree.value || [{}];

        return value.length === 0 ? '' : value[value.length - 1].entityKey || '';
    }

    function setControlValue(self, assetcontext) {
        var isHierarchyKey, tree, list;
        if (self.region || self.dialog) {
            isHierarchyKey = assetcontext.type === 'Hierarchy';
            tree = self.hierarchy.screen.tree;

            if (isHierarchyKey) {
                self.activePill(self.hierarchy.url);
                if (getLastPathValue(tree) !== assetcontext.entityKey) {
                    self.hierarchy.screen.loadcontext(assetcontext.entityKey);
                }
            } else {
                self.activePill(self.group.url);
                list = self.group.screen.groupElement;
                if (!list.value || list.value.entityKey !== assetcontext.entityKey) {
                    self.group.screen.loadcontext(assetcontext);
                }
            }
        }
    }

    function getcontext_done(self, dfd, assetcontext) {
        if (assetcontext === null) {
            assetcontext = ApplicationContext.assetcontext || AssetContextDTO.default();
        }

        setControlValue(self, assetcontext);
        setInternalValue(self, assetcontext);
        if (self.internalvalue) {
            $(self.element).find('span.context-id').text(self.internalvalue.description);
        }
        if (dfd) {
            dfd.resolve(assetcontext);
        }
    }

    function raiseChangeEvent(self) {
        Element.raiseEvent(self, 'change', self.internalvalue);
    }

    function cascadeChangedAttribute (self, attrName, newValue) {
        var list, idx, searchBoxs, trees;

        if (CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
            list = self.getElementsByTagName('mi-list-group');
            for (idx = 0; idx < list.length; idx++) {
                if (newValue !== null) {
                    list[idx].setAttribute(attrName, newValue);
                } else {
                    list[idx].removeAttribute(attrName);
                }
            }
            searchBoxs = self.querySelectorAll('mi-tool-bar mi-searchbox');
            for (idx = 0; idx < searchBoxs.length; idx++) {
                if (newValue !== null) {
                    searchBoxs[idx].setAttribute(attrName, newValue);
                } else {
                    searchBoxs[idx].removeAttribute(attrName);
                }
            }

            trees = self.getElementsByTagName('mi-tree');
            for (idx = 0; idx < trees.length; idx++) {
                if (newValue !== null) {
                    trees[idx].setAttribute(attrName, newValue);
                } else {
                    trees[idx].removeAttribute(attrName);
                }
            }
        }
    }

    function cascadeAttributes(self) {
        var idx;

        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            cascadeChangedAttribute(self, CASCADE_ATTRIBUTES[idx], self.getAttribute(CASCADE_ATTRIBUTES[idx]));
        }
    }

    function setLoadContext(self, e) {
        if(e.detail.frag.querySelector('mi-li') !== null) {
            var assetgroupdto = e.detail.frag.querySelector('mi-li').value;
            self.value = assetgroupdto;
            if (self.group.screen) {
                self.group.screen.groupElement.removeEventListener('loaded', self);
            }
        }
    }

    function getValue (self) {
        return self.internalvalue;
    }

    function isSameContext(key1, key2) {
        key1 = key1 === '0' ? '-1' : key1;
        key2 = key2 === '0' ? '-1' : key2;
        return key1 === key2;
    }

    function unloadHierarchy (self) {
        if (self.hierarchy.screen) {
            self.hierarchy.screen.unload();
            self.hierarchy.screen = null;
        }
    }

    function unloadGroup (self) {
        if (self.group.screen) {
            self.group.screen.unload();
            self.group.screen = null;
        }
    }

    function attachHierarchy (self) {
        self.hierarchy.screen.attach(self.region);
        self.hierarchy.screen.tree.addEventListener('navigated', self);
    }

    function detachHierarchy (self) {
        if (self.hierarchy.screen) {
            self.hierarchy.screen.tree.removeEventListener('navigated', self);
            self.hierarchy.screen.detach(self.region);
        }
    }

    function attachGroup (self) {
        var loadAssests;
        self.group.screen.attach(self.region);
        loadAssests = self.getAttribute('loadassets') !== null;
        if (loadAssests) {
            self.group.screen.groupElement.addEventListener('navigated', self);
        } else {
            self.group.screen.groupElement.addEventListener('selected', self);
        }
    }

    function detachGroup (self) {
        if (self.group.screen) {
            self.group.screen.groupElement.removeEventListener('navigated', self);
            self.group.screen.groupElement.removeEventListener('selected', self);
            self.group.screen.detach(self.region);
        }
    }

    function loadglobalcontext(self) {
        var globalcontext = ApplicationContext.assetcontext || AssetContextDTO.default();
        getcontext_done(self, $.Deferred(), globalcontext);
    }

    function attachContextControl (self) {
        var div, button, i, span, region;

        region = document.createElement('div');
        region.className = 'region';
        div = document.createElement('div');
        region.appendChild(div);
        button = document.createElement('button');
        button.className = 'btn btn-default';
        div.appendChild(button);
        span = document.createElement('span');
        span.className = 'context-id';
        button.appendChild(span);
        button.addEventListener('click', self);
        i = document.createElement('i');
        i.className = 'ds ds-assethierachy ds-dashboard-style';
        button.appendChild(i);
        self.appendChild(region);
        div = document.createElement('div');
        div.className = 'asset-context-selection';
        self.appendChild(div);
        loadglobalcontext(self);
    }

    document.registerElement('mi-asset-context', {prototype: AssetContextViewModel.prototype});

    return AssetContextViewModel;
});
