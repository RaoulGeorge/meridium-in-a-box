define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Translator = require('system/globalization/translator'),
        CASCADE_ATTRIBUTES = [
            'key',
            'description',
            'page',
            'page-size',
            'scroll-percent',
            'selector',
            'multiselect',
            'checked',
            'has-children',
            'use-html',
            'delay'
        ];

    require('ui/elements/path-history/view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/list-group/view-model');
    require('ui/elements/tool-bar/view-model');
    require('ui/elements/tool-bar-filter/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var section, toolBar, searchBox, filter, customFilter, listSection;

        addProperties(this);

        toolBar = this.querySelector('mi-tool-bar');
        if (!toolBar) {
            toolBar = document.createElement('mi-tool-bar');
            Element.upgrade(toolBar);
            this.appendChild(toolBar);
        }

        if (this.filterViewModel) {
            this.classList.add('show-filter');
        }
        filter = document.createElement('mi-tool-bar-filter');
        Element.upgrade(filter);
        filter.classList.add('default-buttons-left');
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
        Element.upgrade(searchBox);
        searchBox.classList.add('default-buttons-left');
        searchBox.searchCallback = newSearch.bind(null, this);
        searchBox.setAttribute('custom-search', 'true');
        searchBox.setAttribute('no-auto-close', 'true');
        toolBar.insertBefore(searchBox, toolBar.firstChild);
        cascadeAttributes(this, searchBox);

        if (this.getAttribute('allow-add') !== 'false') {
            this.classList.add('allow-add');
        }
        toolBar.insertBefore(createButton(this, 'addItem', 'NEWITEM', 'icon-plus'), toolBar.firstChild);

        toolBar.insertBefore(createButton(this, 'togglePathHistory', 'HIDE', 'icon-up-arrow', 'hide-button'), toolBar.firstChild);
        toolBar.insertBefore(createButton(this, 'backInHistory', 'BACK', 'icon-back-arrow', 'back-button'), toolBar.firstChild);

        section = document.createElement('section');
        section.className = 'nav-list-group';
        this.appendChild(section);

        this.pathHistory = document.createElement('mi-path-history');
        Element.upgrade(this.pathHistory);
        this.pathHistory.loader = this._loader;
        this.pathHistory.value = this._value;
        this.pathHistory.className = 'expanded';
        section.appendChild(this.pathHistory);
        cascadeAttributes(this, this.pathHistory);

        listSection = document.createElement('div');
        listSection.className = 'tree-list-control';
        section.appendChild(listSection);
        if (this._value) {
            getChildren(this);
        }
    };

    proto.attachedCallback = function () {
        var firstChild = this.querySelector('section.nav-list-group'),
            toolBar = this.querySelector('mi-tool-bar');

        firstChild.addEventListener('selecting', this);
        firstChild.addEventListener('selected', this);
        firstChild.addEventListener('click', this);

        toolBar.addEventListener('click', this);
        toolBar.addEventListener('resize', this);
        toolBar.addEventListener('filter-closed', this);

        this.pathHistory.addEventListener('change', this);

        //The shim and ko don't fire in the same order as native so this has
        //to go here.
        changeTitle(this);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var searchBox, filter;

        if (attrName === 'root-name') {
            changeTitle(this, newValue);
        } else if (attrName === 'allow-add') {
            if (newValue === 'false') {
                this.classList.remove('allow-add');
            } else {
                this.classList.add('allow-add');
            }
        } else if (attrName === 'custom-filter') {
            filter = this.querySelector('mi-tool-bar mi-tool-bar-filter');
            if (filter) {
                filter.setAttribute(attrName, newValue);
            }
        } else if (CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
            this.pathHistory.setAttribute(attrName, newValue);
            searchBox = this.querySelector('mi-tool-bar mi-searchbox');
            if (searchBox) {
                searchBox.setAttribute(attrName, newValue);
            }
        }
    };

    proto.handleEvent = function (e) {
        if (e.type === 'selecting') {
            selectingEvent(this, e);
        } else if (e.type === 'selected') {
            selectedEvent(this, e);
        } else if (e.type === 'click') {
            clickHandler(this, e);
        } else if (e.type === 'change') {
            getChildren(this);
        } else if (e.type === 'resize' && e.target !== window) {
            resizeScrollingRegion(this, e);
        } else if (e.type === 'filter-closed') {
            this.refreshAll();
        } else if (e.type === 'focus' && e.target.parentElement.classList.contains('mi-searchbox')) {
            this.pathHistory.value = this.pathHistory.value[0];
            this.pathHistory.firstElementChild.firstElementChild.style.display = 'none';
            setTimeout(resizeScrollingRegion.bind(null, this), 0);
        } else if (e.type === 'blur' && e.target.classList.contains('mi-searchbox')) {
            resizeScrollingRegion(this);
        }
    };

    proto.togglePathHistory = function () {
        var show = !this.pathHistory.classList.contains('expanded'),
            button = this.querySelector('button[data-action="togglePathHistory"]');

        button.firstElementChild.className = show ? 'icon-up-arrow' : 'icon-arrow';
        button.title = this.translator.translate(show ? 'HIDE' : 'SHOW');
        this.pathHistory.className = show ? 'expanded' : 'collapsed';
        resizeScrollingRegion(this);
    };

    proto.backInHistory = function() {
        var items = this.value;
        if (items.length > 1) {
            moveBackInHistory(this, items[items.length - 2]);
        }
    };

    proto.refresh = function () {
        var items = this.value,
            value = items[items.length - 1];

        if (items.length === 1) {
            this.reload();
        } else {
            this.pathHistory.pop();
            this.pathHistory.push(value);
        }
    };

    proto.refreshAll = function () {
        var items = this.pathHistory.listGroup,
            idx;

        if (items.length <= 1) {
            this.reload();
        } else {
            for (idx = 0; idx < items.length; idx++) {
                items[idx].items = null;
                items[idx].resume();
            }
            items[items.length -1].reload();
        }
    };

    proto.reload = function () {
        if (getRootName(this)) {
            this.pathHistory.clear();
        }
        changeTitle(this);
    };

    proto.addItem = function () {
        this.dispatchEvent(new CustomEvent('add-item', { bubble: true }));
    };

    proto.loadState = function (state) {
        var searchBox;

        state = state || {};
        if (state.searchTerm) {
            searchBox = this.querySelector('mi-searchbox');
            searchBox._value = state.searchTerm;
            searchBox.toggleSearch();
            this.searchTerm = state.searchTerm;
            resizeScrollingRegion(this);
            this.preSearchValue = state.preSearchValue;
        }
        this.value = state.value;
        if (state.searchTerm) {
            this.pathHistory.firstElementChild.firstElementChild.style.display = 'none';
        }
    };

    proto.saveState = function () {
        return {
            preSearchValue: this.preSearchValue,
            value: this.value,
            searchTerm: this.searchTerm
        };
    };

    function newSearch (self, searchTerm) {
        self.pathHistory.clear();
        self.pathHistory.value = {
            description: searchTerm,
            loader: self._searchCallback.bind(null, searchTerm)
        };
        self.searchTerm = searchTerm;
        self.pathHistory.firstElementChild.firstElementChild.style.display = 'none';
        resizeScrollingRegion(self);
    }

    function undoSearch (self) {
        var pathHome;

        if (self.preSearchValue) {
            self.pathHistory.clear();
            self.pathHistory.value = self.preSearchValue;
            self.preSearchValue = null;
            self.searchTerm = '';
            self.querySelector('mi-searchbox').value = null;
            pathHome = self.pathHistory.firstElementChild.firstElementChild;
            if (pathHome) {
                pathHome.style.display = 'block';
            }
            resizeScrollingRegion(self);
        }
    }

    function addProperties (self) {
        self.translator = Object.resolve(Translator);
        self._loader = null;
        self.preSearchValue = null;
        self.searchTerm = '';
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });

        self._value = null;
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });

        Element.defineProperty(self, 'listGroup', {
            get: getListGroup.bind(null, self),
            set: setListGroup
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
        self.pathHistory ? self.pathHistory.listItemIconCallback = value : '';
    }

    function getLoader (self) {
        if (self.pathHistory) {
            return self.pathHistory.loader;
        }
        return self._loader;
    }

    function setLoader (self, value) {
        if (self.pathHistory) {
            self.pathHistory.listItemIconCallback = self._listItemIconCallback;
            self.pathHistory.loader = value;
        }
        self._loader = value;
    }

    function getValue (self) {
        if (self.pathHistory) {
            return self.pathHistory.value;
        }
        return self._value;
    }

    function setValue (self, v) {
        if (self.pathHistory && v) {
            self.pathHistory.value = v;
        }
        self._value = v;
    }

    function getListGroup(self) {
        return self.querySelector('.tree-list-control mi-list-group');
    }

    function setListGroup() { }

    function cascadeAttributes(self, dest) {
        var idx, attr;

        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            attr = self.getAttribute(CASCADE_ATTRIBUTES[idx]);
            if (attr) {
                dest.setAttribute(CASCADE_ATTRIBUTES[idx], attr);
            }
        }
    }

    function clickHandler(self, e) {
        var action;

        if (e.target.nodeName === 'BUTTON') {
            action = e.target.getAttribute('data-action');
            buttonClickHandler(self, action, e);
        } else if (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON') {
            action = e.target.parentElement.getAttribute('data-action');
            buttonClickHandler(self, action, e);
        } else if (e.target.tagName === 'MI-PATH-HISTORY' && e.data) {
            moveBackInHistory(self, e.data);
        }
    }

    function buttonClickHandler(self, action, e) {
        if (action && self[action]) {
            self[action](e);
        }
    }

    function initSearch(self, e) {
        self.preSearchValue = self.pathHistory.value;
        if (e.target._searchDiv) {
            e.target._searchDiv.querySelector('input').addEventListener('focus', self);
            e.target._searchDiv.querySelector('input').addEventListener('blur', self);
        }
    }

    function resizeScrollingRegion(self, e) {
        var treeListGroup = self.querySelector('.tree-list-control'),
            nav = self.querySelector('section.nav-list-group'),
            siblings = nav.firstElementChild,
            children = self.children,
            toolBar = self.querySelector('mi-tool-bar'),
            height = 0,
            idx;

        if (!treeListGroup) {
            return;
        }

        if (e) {
            if (e.open === false) {
                undoSearch(self);
            } else {
                initSearch(self, e);
            }
        }

        if (toolBar) {
            for (idx = 0; idx < children.length; idx++) {
                if (children[idx] !== nav) {
                    height += children[idx].clientHeight;
                }
            }
            nav.style.height = 'calc(100% - ' + height + 'px)';
        }

        height = 0;
        while (siblings) {
            if (siblings !== treeListGroup) {
                height += siblings.clientHeight;
            }
            siblings = siblings.nextElementSibling;
        }

        height = height.toString() + 'px';
        treeListGroup.style.height = 'calc(100% - ' + height + ')';
    }

    function createNavigationEvent(value, data) {
        var navEvent, idx;

        navEvent = new CustomEvent('navigating', { bubbles: true, cancelable: true });
        navEvent.newValue = [];
        idx = 0;
        while (idx < value.length && value[idx] !== data) {
            navEvent.newValue[navEvent.newValue.length] = value[idx];
            idx++;
        }
        if (data !== undefined) {
            navEvent.newValue[navEvent.newValue.length] = data;
        }
        return navEvent;
    }

    function createNavigatedEvent(self) {
        var navEvent,
            listGroup = self.pathHistory.listGroup[self.pathHistory.listGroup.length - 1];

        listGroup.selectedItems = null;
        navEvent = new CustomEvent('navigated', { bubbles: true });
        self.dispatchEvent(navEvent);
    }

    function moveBackInHistory(self, data) {
        var navEvent;

        navEvent = createNavigationEvent(self.value, data);
        if (!self.dispatchEvent(navEvent)) {
            return;
        }
        self.pathHistory.moveBack(data);
        createNavigatedEvent(self);
    }

    function getChildren(self) {
        manageButtonState(self);
        restoreListGroupFromHistory(self);
    }

    function manageButtonState(self) {
        var hideButton = $('button.hide-button', self),
            backButton = $('button.back-button', self);
        hideButton.addClass('pull-right');
        if (self.pathHistory.value.length === 1) {
            backButton.addClass('disabled');
            hideButton.addClass('disabled');
        } else {
            backButton.removeClass('disabled');
            hideButton.removeClass('disabled');
        }
    }

    function restoreListGroupFromHistory(self) {
        var listGroup = self.pathHistory.listGroup[self.pathHistory.listGroup.length - 1],
            treeListControl = self.querySelector('.tree-list-control');
        if (listGroup) {
            if (treeListControl.firstElementChild) {
                treeListControl.removeChild(treeListControl.firstElementChild);
            }
            treeListControl.appendChild(listGroup);
            resizeScrollingRegion(self);
            if (listGroup.items.length === 0 && !listGroup.paused) {
                listGroup.load();
            } else {
                listGroup.scrollIntoView();
            }
        }
    }

    function getRootName (self) {
        return self.getAttribute('root-name') || self.getAttribute('title');
    }
    function changeTitle(self, newValue) {
        var hist, items,
            description = self.getAttribute('description') || 'description',
            rootName = newValue || getRootName(self);

        if (!rootName) {
            if (self.value.length > 0) {
                self.value = self.value[0];
                return;
            }
            return;
        }
        items = self.value;
        if (items.length === 0) {
            hist = {};
            hist[description] = rootName;
            self.value = hist;
        } else {
            if (!(items[0] instanceof Object)) {
                items[0] = {};
            }
            items[0][description] = rootName;
            self.value = items;
        }
    }

    function createButton(self, action, title, iconClass, buttonClass) {
        var button = document.createElement('button'),
            icon = document.createElement('i');

        button.className = 'btn btn-default btn-icon default-buttons-left ' + (buttonClass || '');
        button.setAttribute('data-action', action);
        button.title = self.translator.translate(title);
        icon.className = iconClass;
        button.appendChild(icon);
        return button;
    }

    function selectingEvent(self, e) {
        var navEvent;

        if (e.selecting === true || e.selecting === false) {
            return;
        }
        e.cancelBubble = true;
        navEvent = createNavigationEvent(self.value, e.newValue);
        if (!self.dispatchEvent(navEvent)) {
            e.preventDefault();
        }
    }

    function selectedEvent (self, e) {
        var searchEvent;
        if (e.target.classList.contains('search-list')) {
            e.cancelBubble = true;
            return;
        }
        if (e.selecting === null || typeof e.selecting === 'undefined') {
            e.cancelBubble = true;
            self.pathHistory.push(e.target.value);
            createNavigatedEvent(self);
            if (self.preSearchValue) {
                //we are searching
                searchEvent = new CustomEvent('search-selected', { bubbles: true });
                searchEvent.searchResult = [e.target.value];
                self.dispatchEvent(searchEvent);
            }
        }
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
        if (value) {
            self.classList.add('show-search-button');
        } else {
            self.classList.remove('show-search-button');
        }
        self._searchCallback = value;
    }

    Element.registerElement('mi-tree', { prototype: proto });
    return proto;
});
