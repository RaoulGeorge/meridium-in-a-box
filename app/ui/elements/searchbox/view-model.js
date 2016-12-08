define(function () {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var Translator = require('system/globalization/translator');

    var proto = Object.create(HTMLElement.prototype),
        CASCADE_ATTRIBUTES = [
            'key',
            'description',
            'page',
            'page-size',
            'scroll-percent',
            'use-html',
            'multiselect',
            'selector'
        ];

    proto.createdCallback = function() {
        var element;

        this.classList.add('btn');
        this.classList.add('btn-icon');
        element = document.createElement('i');
        element.className = 'icon-search';
        this.appendChild(element);

        this.search = _.debounce(valueChanged, 500);
        this._searchDiv = null;
        this._searchList = null;
        this._value = '';
        Element.defineProperty(this, 'value', {
            get: getValue.bind(null, this),
            set: setValue.bind(null, this)
        });
        this._closeSearchBind = this.closeSearch.bind(this);
        this._resizeBind = resizeListGroup.bind(null, this);
        this.isInToolbar = false;
        this.disabled = false;
        this.translator = null;
    };

    proto.attachedCallback = function () {
        this.addEventListener('click', this);
        window.addEventListener('resize', this._resizeBind);
        this.translator = Object.resolve(Translator);
        this.title = translate(this, 'SEARCH');
    };

    proto.detachedCallback = function () {
        if (this._searchDiv) {
            removeSearchDiv(this);
        }
        window.removeEventListener('resize', this._resizeBind);

        if (this.isInToolbar) {
            if (this._searchList) {
                removeSearchList(this);
            }
        }
    };

    proto.handleEvent = function(e) {
        if (e.type === 'input') {
            this._value = e.target.value;
            inputChanged(this);
        } else if (e.type === 'click' && e.target.tagName === 'I') {
            if (e.target.classList.contains('icon-multiply')) {
                clear(this);
            } else if (e.target.classList.contains('icon-search') && !this.disabled) {
                searchResultSelected(this, e);
                toggleSearch(this);
            }
        }
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var listGroup;

        if (attrName === 'delay') {
            this.search = _.debounce(valueChanged, newVal);
        } else if (attrName === 'disabled') {
            this.disabled = (newVal === 'true') ? true : false;         
        } else {
            if (this.searchDiv) {
                listGroup = this.searchDiv.querySelector('.search-list');
                if (listGroup && CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
                    listGroup.setAttribute(attrName, newVal);
                }
            }
        }
    };

    proto.closeSearch = function (e) {
        if (this._value === '') {
            if (this._searchList && $(this._searchList).css('display') !== 'none') {
                if (e.target === this._searchDiv.querySelector('input')) {
                    return;
                }
                if (this._searchDiv && this._searchDiv.querySelector('input').value === '') {
                    removeSearchDiv(this);
                    removeSearchList(this);
                }
            } else {
                if (e) {
                    if (e.type !== 'blur') {
                        if (e.target === this ||
                            e.target.parentElement === this ||
                            e.target === this._searchDiv ||
                            e.target.parentElement === this._searchDiv) {

                            return;
                        }
                    }
                }
                removeSearchDiv(this);
            }
        }
    };

    proto.toggleEnabled = function (val) {
        var searchBtn = this.querySelector('Search');
        if (val === 'true') {
            searchBtn.disabled = true;
        } else {
            searchBtn.disabled = false;
        }
    };

    proto.toggleSearch = function (){
        toggleSearch(this);
    };

    function translate(self, key) {
        return self.translator.translate(key.toUpperCase());
    }

    function toggleSearch(self) {
        var element;

        if (self._searchDiv || (self.isInToolbar && self._searchList)) {
            clear(self);
            removeSearchDiv(self);
            removeSearchList(self);
        } else {
            self._searchDiv = document.createElement('div');
            self._searchDiv.className = 'mi-searchbox';
            if (self.parentElement.tagName !== 'MI-TOOL-BAR') {
                self.parentElement.appendChild(self._searchDiv);
            } else {
                self.parentElement.parentElement.insertBefore(self._searchDiv, self.parentElement.nextElementSibling);
            }

            element = document.createElement('input');
            element.setAttribute('type', 'text');
            element.className = 'form-control mi-searchbox';
            element.value = self.value;
            element.addEventListener('blur', self._closeSearchBind);
            self._searchDiv.appendChild(element);
            element.focus();

            element = document.createElement('i');
            element.className = 'icon-multiply';
            self._searchDiv.appendChild(element);
            element.addEventListener('click', self);

            if (self.getAttribute('custom-search') !== 'true') {
                element = document.createElement('mi-list-group');
                Element.upgrade(element);
                element.classList.add('search-list');
                element.classList.add('dropdown-menu-left');
                cascadeAttributes(self, element);
                element.loader = search.bind(null, self);

                if (self.parentElement.tagName !== 'MI-TOOL-BAR') {
                    self._searchDiv.appendChild(element);
                } else {
                    self.isInToolbar = true;
                    self._searchDiv.parentElement.insertBefore(element, self._searchDiv.nextElementSibling);
                    self._searchList = element;
                    self._searchList.searchResult = self._searchList.parentElement.searchResult;
                    initOutOfToolbarListeners(self, element);
                }
                resizeListGroup(self);
            }
            toggleClearIcon(self);
            raiseResizeEvent(self);
            self._searchDiv.addEventListener('input', self);
        }
    }

    function initOutOfToolbarListeners(self) {
        self._searchList.addEventListener('click', function (e) {
            if (e.target === this) {
                toggleSearch(self);
            } else if (e.target.tagName === 'MI-LI') {
                searchResultSelected(self, e);
            }
        });
    }

    function resizeListGroup (self) {
        var parentContainer;

        if (self.getAttribute('custom-search') === 'true') {
            return;
        }
        parentContainer = self.parentElement;
        if (!parentContainer) {
            return;
        }
        if (parentContainer.nodeName === 'MI-TOOL-BAR') {
            parentContainer = parentContainer.parentElement;
        }
        if (self._searchDiv) {
            if (self.isInToolbar) {
                if (self._searchList) {
                    self._searchList.style.height = (parentContainer.clientHeight - 77).toString() + 'px';
                    $(self._searchList).css('position', 'absolute');

                    if ($(parentContainer).css('position') === 'relative') {
                        $(self._searchList).css('top', 77);
                        $(self._searchList).css('left', 0);
                    } else {
                        $(self._searchList).css('top', $(parentContainer).position().top + 77);
                        $(self._searchList).css('left', $(parentContainer).position().left);
                    }
                    self._searchList.style.width = parentContainer.clientWidth.toString() + 'px';
                }
            } else {
                self._searchList = self._searchDiv.querySelector('.search-list');
                self._searchList.style.height = (parentContainer.clientHeight - 46 - 35).toString() + 'px';
            }
        }
    }

    function removeSearchDiv (self) {
        if (self._searchDiv) {
            self._searchDiv.removeEventListener('click', self);
            self._searchDiv.removeEventListener('input', self);
            self._searchDiv.querySelector('input').removeEventListener('blur', self._closeSearchBind);
            Element.clearDom(self._searchDiv);
            self._searchDiv.parentElement.removeChild(self._searchDiv);
            self._searchDiv = null;
            raiseResizeEvent(self);
        }
    }

    function removeSearchList(self) {
        if (self._searchList) {
            self._searchList.removeEventListener('click', self);
            Element.clearDom(self._searchList);
            $(self._searchList).remove();
            self._searchList = null;

            raiseResizeEvent(self);
        }
    }

    function raiseResizeEvent (self) {
        var resizeEvent = new CustomEvent('resize', { bubbles: true });
        resizeEvent.open = self._searchDiv !== null;
        self.dispatchEvent(resizeEvent);
    }

    function toggleClearIcon (self) {
        if (self.value.length > 0) {
            self._searchDiv.querySelector('i').style.display = 'inline-block';
        } else {
            self._searchDiv.querySelector('i').style.display = 'none';
        }
    }
    function inputChanged (self) {
        toggleClearIcon(self);
        self.search(self);
    }

    function getValue (self) {
        return self._value;
    }

    function setValue (self, value) {
        self._value = value || '';

        if(self._value !== '' && !self._searchDiv){
            toggleSearch(self);
        }

        if (self._searchDiv) {
            self._searchDiv.querySelector('input').value = self._value;
            inputChanged(self);
        }
    }

    function valueChanged (self) {
        var searchBox;

        if (self.searchCallback && self._searchDiv) {
            if (self.getAttribute('custom-search') === 'true') {
                searchBox = self._searchDiv.querySelector('input');
                self.searchCallback(searchBox.value);
            } else {
                self._searchList.value = null;
                self._searchList.reload();
            }
        }
    }

    function clear (self) {
        self.value = '';
        valueChanged(self);
        self._searchDiv.querySelector('.mi-searchbox input').focus();        
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

    function search(self, page, pageSize) {
        var searchBox = self._searchDiv.querySelector('input');

        if (searchBox && self.searchCallback) {
            return self.searchCallback(searchBox.value, page, pageSize).done(search_done.bind(null, self));
        } else {
            return $.Deferred().resolve().promise();
        }
    }

    function search_done(self, result) {
        var searchList;

        if (!self._searchDiv) {
            return;
        }

        if (self.isInToolbar) {
            searchList = self._searchList;
        } else {
            searchList = self._searchDiv.querySelector('.search-list');
        }

        if (!searchList) {
            return;
        }
        if (result && result.length > 0) {
            searchList.classList.add('open');
        } else {
            searchList.classList.remove('open');
        }
    }

    function getActive(miList) {
        var listItems = miList.hasAttribute('multiselect') ? miList.querySelectorAll('mi-li[checked]') : miList.querySelectorAll('.active'),
            results = [];

            for(var idx = 0; idx < listItems.length; idx++) {
                results.push(listItems[idx].value);
            }

            return results;
    }

    function searchResultSelected(self, e) {
        var nav;

        nav = new CustomEvent('search-selected', { bubbles: true });
        nav.searchResult = getActive(e.currentTarget);
        self.dispatchEvent(nav);
    }

    document.registerElement('mi-searchbox', { prototype: proto });

    return proto;
});
