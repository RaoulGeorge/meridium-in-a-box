define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator'),
        CASCADE_ATTRIBUTES = [
            'key',
            'description',
            'selector',
            'multiselect',
            'has-children',
            'use-html',
            'delay',
            'custom-search'
        ];

    require('ui/elements/list-group-item/view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/tool-bar/view-model');
    require('ui/elements/tool-bar-filter/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var listGroup, selector, toolBar, searchBox, filter, customFilter, loader;

        addProperties(this);

        this.classList.add('nav-list-group');

        toolBar = this.querySelector('mi-tool-bar');
        if (!toolBar) {
            toolBar = document.createElement('mi-tool-bar');
            this.appendChild(toolBar);
        }

        if (this.filterViewModel) {
            this.classList.add('show-filter');
        }
        filter = document.createElement('mi-tool-bar-filter');
        filter.filterViewModel = this.filterViewModel;
        customFilter = this.getAttribute('custom-filter');
        if (customFilter === 'true') {
            filter.setAttribute('custom-filter', 'true');
        }
        toolBar.insertBefore(filter, toolBar.firstChild);

        if (this.searchCallback) {
            this.classList.add('show-search-button');
        }
        searchBox = document.createElement('mi-searchbox');
        searchBox.searchCallback = this.searchCallback;
        toolBar.insertBefore(searchBox, toolBar.firstChild);
        cascadeAttributes(this, searchBox);

        if (this.getAttribute('allow-add') !== 'false') {
            this.classList.add('allow-add');
        }
        toolBar.insertBefore(createButton(this, 'addItem', 'NEWITEM', 'icon-plus'), toolBar.firstChild);

        listGroup = document.createElement('div');
        listGroup.className = 'list-group';
        selector = this.getAttribute('selector');
        if (selector === 'addOnly' || selector === 'toggle') {
            listGroup.className += ' selectable';
        }
        this.appendChild(listGroup);
        loader = document.createElement('div');
        loader.className = 'loading-small';
        this.appendChild(loader);
        if (this.loader) {
            this.reload();
        }

        this.addEventListener('search-selected', this);
    };

    proto.attachedCallback = function () {
        var listGroup =  getListSection(this),
            toolbar = this.querySelector('mi-tool-bar');

        listGroup.addEventListener('scroll', this);
        listGroup.addEventListener('click', this);

        toolbar.addEventListener('click', this);
        toolbar.addEventListener('resize', this);
        toolbar.addEventListener('filter-closed', this);

        setListGroupSize(this);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var listGroup = getListSection(this), filter;

        if (attrName === 'selector' && listGroup) {
            if (newValue === 'addOnly' || newValue === 'toggle') {
                listGroup.classList.add('selectable');
            } else {
                listGroup.classList.remove('selectable');
            }
        }
        if (attrName === 'allow-add') {
            if (newValue === 'false') {
                this.classList.remove('allow-add');
            } else {
                this.classList.add('allow-add');
            }
        }
        if (attrName === 'custom-filter') {
            filter = this.querySelector('mi-tool-bar mi-tool-bar-filter');
            if (filter) {
                filter.setAttribute(attrName, newValue);
            }
        }
        cascadeChangedAttribute(this, attrName, newValue, listGroup);
    };

    proto.handleEvent = function (e) {
        var action;

        if (e.type === 'scroll') {
            regionScrolled(this, e);
        } else if (e.type === 'click') {
            if (isMiLi(e.target)) {
                makeActive(this, findMiLi(e.target).value, e.selecting);
            } else if (e.target.nodeName === 'BUTTON') {
                action = e.target.getAttribute('data-action');
                buttonClickHandler(this, action, e);
            } else if (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON') {
                action = e.target.parentElement.getAttribute('data-action');
                buttonClickHandler(this, action, e);
            }
        } else if (e.type === 'resize') {
            setListGroupSize(this);
        } else if (e.type === 'filter-closed') {
            this.reload();
        } else if (e.type === 'search-selected') {
            addSearchResult.call(null, this, e.searchResult);
            setSelectedItems.call(null, this, this.searchResult);
        }
    };

    proto.reload = function () {
        var list = getListSection(this);

        if (list) {
            this.resume();
            Element.clearDom(list);
            this.setAttribute('page', '1');
            list.scrollTop = 0;
            if (this.loader) {
                this.load().done(loadUntilValueFound.bind(null, this));
            }
        }
    };

    proto.pause = function () {
        this.paused = true;
    };

    proto.resume = function () {
        this.paused = false;
    };

    proto.load = function () {
        var page = this.getAttribute('page'),
            pageSize = getPageSize(this),
            dfd;
        if (this.loader) {
            this.pause();
            this.classList.add('loading');
            setListGroupSize(this);
            dfd = this.loader(page, pageSize);
            dfd.done(loaderDone.bind(null, this));
            dfd.always(removeLoading.bind(null, this));
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    proto.scrollIntoView = function () {
        var active, ul, parentRect, liRect, list = getListSection(this);

        if (list) {
            active = list.querySelector('mi-li.active');
            if (active) {
                ul = active.parentNode;
                liRect = active.getBoundingClientRect();
                parentRect = ul.getBoundingClientRect();
                if (liRect.top < parentRect.top || liRect.top > parentRect.bottom) {
                    ul.scrollTop = active.offsetTop - ul.offsetTop;
                }
            } else if (list.firstElementChild){
                list.firstElementChild.scrollTop = 0;
            }
        }
    };

    proto.addItem = function () {
        this.dispatchEvent(new CustomEvent('add-item', { bubbles: true }));
    };

    proto.loadState = function (state) {
        var searchBox = this.querySelector('mi-tool-bar mi-searchbox');

        state = state || {};
        if (state.value) {
            this.value = state.value;
        }
        if (state.searchTerm) {
            searchBox.value = state.searchTerm;
        }
    };

    proto.saveState = function () {
        var searchBox = this.querySelector('mi-tool-bar mi-searchbox');

        return {
            value: this.value,
            searchTerm: searchBox.value
        };
    };

    function addProperties (self) {
        self.translator = Object.resolve(Translator);

        self.paused = false;
        self.searchResult = [];
        self._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });

        self._value = null;
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: makeActive.bind(null, self)
        });

        Element.defineProperty(self, 'items', {
            get: getItems.bind(null, self),
            set: setItems.bind(null, self)
        });

        Element.defineProperty(self, 'selectedItems', {
            get: getSelectedItems.bind(null, self),
            set: setSelectedItems.bind(null, self)
        });

        self._filterViewModel = null;
        Element.defineProperty(self, 'filterViewModel', {
            get: getFilterViewModel.bind(null, self),
            set: setFilterViewModel.bind(null, self)
        });

        self._searchCallback = null;
        Element.defineProperty(self, 'searchCallback', {
            get: getSearchCallback.bind(null, self),
            set: setSearchCallback.bind(null, self)
        });

        self._listItemIconCallback = null;
        Element.defineProperty(self, 'listItemIconCallback', {
            get: getListItemIconCallback.bind(null, self),
            set: setListItemIconCallback.bind(null, self)
        });
    }

    function getListItemIconCallback(self) {
        return self._listItemIconCallback;
    }

    function setListItemIconCallback(self, value) {
        self._listItemIconCallback = value || null;
    }

    function getLoader (self) {
        return self._loader;
    }

    function setLoader (self, value) {
        self._loader = value;
        self.reload();
    }

    function getValue (self) {
        return self._value;
    }

    function getItems (self) {
        var listGroup = getListSection(self),
            li, list = [], idx;

        if (listGroup) {
            li = listGroup.querySelectorAll('mi-li');
            for (idx = 0; idx < li.length; idx++) {
                list[list.length] = li[idx].value;
            }
        }
        return list;

    }

    function setItems (self, v) {
        var list = getListSection(self);

        if (list) {
            Element.clearDom(list);
            if (v) {
                generateDOM(self, v);
            }
        }
    }

    function getSelectedItems (self) {
        var listGroup  = getListSection(self),
            li, list = [], idx;

        if (listGroup) {
            li = listGroup.querySelectorAll('mi-li[checked="true"]');
            for (idx = 0; idx < li.length; idx++) {
                list[list.length] = li[idx].value;
            }
        }
        return list;
    }

    function clearSelectedItems (self) {
        var li, idx,
            listGroup = getListSection(self);

        if (listGroup) {
            li = listGroup.querySelectorAll('mi-li[checked="true"]');
            if (li.length > 0) {
                for (idx = 0; idx < li.length; idx++) {
                    li[idx].setAttribute('checked', 'false');
                }
            }
        }
    }

    function setSelectedItems (self, v) {
        var idx, element;

        clearSelectedItems(self);
        if (v) {
            for (idx = 0; idx < v.length; idx++) {
                element = elementForKey(self, v[idx]);
                if(element){
                    element.setAttribute('checked', 'true');
                }
            }
        }
    }

    function generateDOM (self, data) {
        var i, li, ul = getListSection(self), frag;

        if (ul) {
            frag = document.createDocumentFragment();
            checkLastItemIcon(data, ul);
            for (i = 0; i < data.length; i++) {
                li = document.createElement('mi-li');
                li.setAttribute('icon-class', 'icon-right-arrow');
				frag.appendChild(li);
                li.value = data[i];
                if(li.value.hasOwnProperty('disabled')) {
                    li.setAttribute('disabled', li.value.disabled === 'true' || li.value.disabled);
                }
                if(li.value.hasOwnProperty('disabledIcon')) {
                    li.setAttribute('disabledIcon', li.value.disabledIcon === 'true' || li.value.disabledIcon);
                }
                Object.tryMethod(self, '_listItemIconCallback', li.listItemIcon, data[i]);
                cascadeAttributes(self, li);
            }

            var e = new CustomEvent('loaded', {
                bubbles: true,
                cancelable: true,
                detail: { frag:frag }
            });
            self.dispatchEvent(e);

            ul.appendChild(frag);

            if(self.searchResult.length) {
                setSelectedItems(self, self.searchResult);
            }
        }
    }

    function checkLastItemIcon(data, ul){
        if(data.length === 0){
            var pathHistory = ul.parentElement,
                pathChildren, lastPathChild;
            if(pathHistory){
                if(pathHistory.parentElement){
                    pathHistory = pathHistory.parentElement;
                    if(pathHistory.previousSibling){
                        pathHistory = pathHistory.previousSibling;
                    }
                }
                if(pathHistory.nodeName === "MI-PATH-HISTORY"){
                    pathChildren = pathHistory.children[0].children;
                    lastPathChild = pathChildren[pathChildren.length -1];
                    lastPathChild.setAttribute('icon-class', '');
                }
            }
        }
    }

    function cascadeChangedAttribute (self, attrName, newValue, listGroup) {
        var li, idx, searchBox;

        if (listGroup && CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
            li = listGroup.getElementsByTagName('mi-li');
            for (idx = 0; idx < li.length; idx++) {
                li[idx].setAttribute(attrName, newValue);
            }
            searchBox = self.querySelector('mi-tool-bar mi-searchbox');
            if (searchBox) {
                searchBox.setAttribute(attrName, newValue);
            }
        }
    }

    function cascadeAttributes(self, dest) {
        var idx, attr;

        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            attr = self.getAttribute(CASCADE_ATTRIBUTES[idx]);
            if (attr) {
                dest.setAttribute(CASCADE_ATTRIBUTES[idx], attr);
            }
        }
    }

    function isMiLi(target) {
        return target.tagName === 'MI-LI' || target.parentNode.tagName === 'MI-LI' ||
            target.parentNode.parentNode.tagName === 'MI-LI' ||
            target.parentNode.parentNode.parentNode.tagName === 'MI-LI';
    }

    function findMiLi(target) {
        var miLi = target;

        while(miLi.tagName !==  'MI-LI') {
            miLi = miLi.parentNode;
        }

        return miLi;
    }

    function makeActive(self, value, selecting) {
        if (!value) { return; }
        var element, active, selectingEvent;

        selectingEvent = new CustomEvent('selecting', {
            bubbles: true,
            cancelable: true
        });
        selectingEvent.selecting = selecting;
        selectingEvent.newValue = value;
        if (self.dispatchEvent(selectingEvent)) {
            active = self.getElementsByClassName('active');
            if (active && active.length > 0) {
                active[0].classList.remove('active');
            }
            self._value = value;
            if (value) {
                element = elementForKey(self);
                if (element !== undefined) {
                    self._value = element.value;
                    element.classList.add('active');
                    self.scrollIntoView();
                } else {
                    var nestedList = self.querySelector('mi-list-group');
                    if (nestedList && nestedList !== undefined) {
                        self._value = nestedList.value;
                        nestedList.classList.add('active');
                        self.scrollIntoView();
                    }
                }
            }
            if (self.value && element !== undefined) {
                if(element.getAttribute('multiselect')) {
                    if(element.getAttribute('checked') === 'true') {
                        element.setAttribute('checked', 'false');
                    } else {
                        element.setAttribute('checked', 'true');
                    }
                }
                raisePostEvents(self, selecting);
                return true;
            } else if (self.value === null || self.value === undefined) {
                raisePostEvents(self, selecting);
            }
            return false;
        }
    }

    function raisePostEvents(self, selecting) {
        var e = new CustomEvent('change', {
            bubbles: true,
            cancelable: true
        });
        self.dispatchEvent(e);
        e = new CustomEvent('selected', {
            bubbles: true,
            cancelable: true
        });
        e.selecting = selecting;
        self.dispatchEvent(e);
    }

    function elementForKey(self, value) {
        var index = 0,
            list = getListSection(self),
            items,
            keyProperty, key;

        if (!list) {
            return undefined;
        }

        items = list.querySelectorAll('mi-li');
        if (!items || items.length === 0) {
            return undefined;
        }

        value = value || self.value;
        keyProperty = self.getAttribute('key') || 'entityKey';
        key = value[keyProperty];

        while (index < items.length && key !== items[index].value[keyProperty]) {
            index++;
        }

        return items[index];
    }

    function loaderDone(self, data) {
        var list = getListSection(self);

        if (list && self.getAttribute('page') === '1') {
            Element.clearDom(list);
        }
        if (data) {
            generateDOM(self, data);
            if (data.length === getPageSize(self)) {
                self.resume();
            }
        }
    }

    function regionScrolled(self, e) {
        var scrollRegion = e.target,
            scrollPercent = Converter.toFloat(self.getAttribute('scroll-percent') || '0.75'),
            scrollOffset = ((scrollRegion.offsetHeight + scrollRegion.scrollTop) / scrollRegion.scrollHeight);

        if (!self.paused && scrollOffset >= scrollPercent) {
            nextPage(self);
            self.load();
        }
    }

    function nextPage(self) {
        var page = Converter.toInteger(self.getAttribute('page') || '1');
        page++;
        self.setAttribute('page', page.toString());
    }

    function getPageSize(self) {
        var pageSize = self.getAttribute('page-size') || '25';

        return Converter.toInteger(pageSize);
    }

    function loadUntilValueFound(self) {
        if (!self.value) {
            return;
        }

        if (!makeActive(self, self.value)) {
            if (self.paused) {
                self.value = null;
            } else {
                nextPage(self);
                self.load().done(loadUntilValueFound.bind(null, self));
            }
        }
    }

    function createButton(self, action, title, iconClass) {
        var button = document.createElement('button'),
            icon = document.createElement('i');

        button.className = 'btn btn-default btn-icon';
        button.setAttribute('data-action', action);
        button.title = self.translator.translate(title);
        icon.className = iconClass;
        button.appendChild(icon);
        return button;
    }

    function getFilterViewModel(self) {
        return self._filterViewModel;
    }

    function setFilterViewModel(self, value) {
        var filter = self.querySelector('mi-tool-bar mi-tool-bar-filter');
        if (value) {
            self.classList.add('show-filter');
        } else {
            self.classList.remove('show-filter');
        }
        if (filter) {
            filter.filterViewModel = value;
        }
        self._filterViewModel = value;
    }

    function getSearchCallback(self) {
        return self._searchCallback;
    }

    function setSearchCallback(self, value) {
        var searchBox = self.querySelector('mi-tool-bar mi-searchbox');
        if (value) {
            self.classList.add('show-search-button');
        } else {
            self.classList.remove('show-search-button');
        }
        if (searchBox) {
            searchBox.searchCallback = value;
        }
        self._searchCallback = value;
    }

    function buttonClickHandler(self, action, e) {
        if (action && self[action]) {
            self[action](e);
        }
    }

    function setListGroupSize(self) {
        var toolbarHeight,
            toolbar = self.querySelector('mi-tool-bar'),
            list = getListSection(self);

        if (!toolbar) { return; }

        toolbarHeight = self.querySelector('mi-tool-bar').clientHeight;
        if (self.classList.contains('loading')) {
            toolbarHeight += 16;
        }
        list.style.height = 'calc(100% - ' + (toolbarHeight + 1) + 'px)';
    }

    function getListSection(self) {
        var listGroups = self.querySelectorAll('.list-group');
        return listGroups.length === 0 ? null : listGroups[listGroups.length - 1];
    }

    function removeLoading(self) {
        self.classList.remove('loading');
        setListGroupSize(self);
    }

    function addSearchResult(self, result) {
        var ridx, idx, count = 0;
        for(ridx = 0; ridx < result.length; ridx++) {
            for(idx = 0; idx < self.searchResult.length; idx++) {
                if(self.searchResult[idx].key === result[ridx].key){
                    count++;
                    break;
                }
            }

            if(count === 0){
                self.searchResult.push(result[ridx]);
            }
        }
    }

    document.registerElement('mi-list-group', { prototype: proto });
    return proto;
});
