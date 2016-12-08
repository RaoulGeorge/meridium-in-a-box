define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        Region = require('spa/region'),
        view = require('text!./template.html'),
        Translator = require('system/globalization/translator');

    require('ui/elements/list-group/view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/tool-bar/view-model');
    require('system/lang/object');
    require('system/lang/string');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.element = this;
        this.element.innerHTML = view;
        addPropertiesList1(this);
        addPropertiesList2(this);

        this.toolBar = $(this.element).find('mi-tool-bar')[2];
        Element.upgrade(this.toolBar);
        this.toolBar.addEventListener('click', this);
    };

    proto.populateListGroup1 = function (data) {
        this.listGroup1 = $(this.element).find('mi-list-group')[0];
        Element.upgrade(this.listGroup1);
        this.toolBar1 = $(this.element).find('mi-tool-bar')[0];
        Element.upgrade(this.toolBar1);
        $(this.toolBar1).find('.link').on('click', onLinkClicked.bind(null, this));
        $(this.listGroup1).attr('description', this.getAttribute('description-1'));
        $(this.listGroup1).attr('key', this.getAttribute('key-1'));
        this.listGroup1.value = this.value1;
        if (!this.loader1) {
            return;
        }
        this.listGroup1.loader = this.loader1;
        if (this.searchCallback1) {
            this.listGroup1.searchCallback = this.searchCallback1;
        } else {
            this.listGroup1.searchCallback = this.searchItems.bind(null, this.listGroup1);
        }
        //addPropertiesList1(self);
        this.listGroup1.addEventListener('change', this);
    };

    proto.populateListGroup2 = function (data) {
        this.listGroup2 = $(this.element).find('mi-list-group')[1];
        Element.upgrade(this.listGroup2);
        this.toolBar2 = $(this.element).find('mi-tool-bar')[1];
        Element.upgrade(this.toolBar2);
        $(this.toolBar2).find('.unlink').on('click', onUnlinkClicked.bind(null, this));
        $(this.listGroup2).attr('description', this.getAttribute('description-2'));
        $(this.listGroup2).attr('key', this.getAttribute('key-2'));
        this.listGroup2.value = this.value2;
        if (!this.loader2) {
            return;
        }
        this.listGroup2.loader = this.loader2;
        if (this.searchCallback2) {
            this.listGroup2.searchCallback = this.searchCallback2;
        } else {
            this.listGroup2.searchCallback = this.searchItems.bind(null, this.listGroup2);
        }       
        //addPropertiesList2(self);
        this.listGroup2.addEventListener('change', this);
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'title') {
            $(this.element).find('span.title')[0].innerHTML = this.getAttribute('title');
        }
    };

    function refreshList(self, entity, group) {
        self.element.innerHTML = view;
        self.populateListGroup1();
        self.populateListGroup2();
        self.wireEvents();
    }

    proto.reload = function () {
        this.listGroup1.reload();
        this.listGroup2.reload();
    };

    proto.searchItems = function (list, searchterm) {
        var dfd = $.Deferred();
        var filtered = [];
        list.items.forEach(function (item) {
            var desc = Object.keys(item)[0],
                key = Object.keys(item)[1];
            if ((item[key] !== undefined && item[key].toString().startsWith(searchterm.toLowerCase())) ||
                (item[desc] !== undefined && item[desc].toLowerCase().startsWith(searchterm.toLowerCase()))) {
                filtered.push(item);
            }
        });
        dfd.resolve(filtered);
        return dfd.promise();
    };

    proto.handleEvent = function (e) {
        var action;

        if (e.type === 'click') {
            if (e.target.nodeName === 'BUTTON') {
                action = e.target.getAttribute('data-action');
                buttonClickHandler(this, action, e);
            } else if (e.target.tagName === 'I' && e.target.parentElement.tagName === 'BUTTON') {
                action = e.target.parentElement.getAttribute('data-action');
                buttonClickHandler(this, action, e);
            }
        }
        //else if (e.type === 'resize') {
        //    setListGroupSize(this);
        //} 
    };

    proto.wireEvents = function () {
        $(this.element).find('.link').on('click', onLinkClicked.bind(null, this));
        $(this.element).find('.unlink').on('click', onUnlinkClicked.bind(null, this));
    };

    proto.saveLists = function () {
        var savingEvent = new CustomEvent('save-lists', {
            //detail: { itemsGroup1: this.listGroup1.items, itemsGroup2: this.listGroup2.items },
            bubbles: true,
            cancelable: true            
        });
        this.dispatchEvent(savingEvent);
        //this.dispatchEvent(new CustomEvent('save-lists', { bubbles: true }));
    };

    function buttonClickHandler(self, action, e) {
        if (action && self[action]) {
            self[action](e);
        }
    }

    //function onSaveClicked(self, e) {
    //    self.dispatchEvent(new CustomEvent('save-lists', { bubbles: true }));
    //    e.preventDefault();
    //    e.stopImmediatePropagation();
    //    var x1 = self.listGroup1.items;
    //    var x2 = self.listGroup2.items;
    //}

    function onLinkClicked(self, e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var dfd = $.Deferred();
        var itemsList2 = self.listGroup2.items;
        var itemsSelected = self.listGroup1.selectedItems;
        var listGroupNew2 = itemsList2.concat(itemsSelected);
        self.listGroup2.items = listGroupNew2;
        var listGroupNew1 = filteredItems(self.listGroup1.items, itemsSelected);
        self.listGroup1.items = listGroupNew1;
        dfd.resolve(listGroupNew1);
        return dfd.promise();
    }

    function onUnlinkClicked(self, e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var dfd = $.Deferred();
        var itemsList1 = self.listGroup1.items;
        var itemsSelected = self.listGroup2.selectedItems;
        var listGroupNew1 = itemsList1.concat(itemsSelected);
        self.listGroup1.items = listGroupNew1;
        var listGroupNew2 = filteredItems(self.listGroup2.items, itemsSelected);
        self.listGroup2.items = listGroupNew2;
        dfd.resolve(listGroupNew2);
        return dfd.promise();
    }

    function filteredItems(listFrom, listSelected) {
        //var i = 0, j = 0;
        var key = Object.keys(listFrom[0])[1];

        for (var i = 0; i < listFrom.length; i++) {
            
            for (var j = 0; j < listSelected.length; j++) {
                if (listSelected[j][key] === listFrom[i][key]) {
                    listFrom.splice(i, 1);
                    listSelected.splice(j, 1);
                    i --;
                    break;
                }
            }
        }
        return listFrom;
    }

    function addPropertiesList1(self) {
        self._value1 = null;
        self._loader1 = null;
        self._filterViewModel1 = null;
        self._searchCallback1 = null;
        Element.defineProperty(self, 'value1', {
            get: getValue1.bind(null, self),
            set: setValue1.bind(null, self)
        });
        Element.defineProperty(self, 'loader1', {
            get: getLoader1.bind(null, self),
            set: setLoader1.bind(null, self)
        });
        Element.defineProperty(self, 'searchCallback1', {
            get: getSearchCallback1.bind(null, self),
            set: setSearchCallback1.bind(null, self)
        });
    }

    function addPropertiesList2(self) {
        self._value2 = null;
        self._loader2 = null;
        self._filterViewModel2 = null;
        self._searchCallback2 = null;
        Element.defineProperty(self, 'value2', {
            get: getValue2.bind(null, self),
            set: setValue2.bind(null, self)
        });
        Element.defineProperty(self, 'loader2', {
            get: getLoader2.bind(null, self),
            set: setLoader2.bind(null, self)
        });
        Element.defineProperty(self, 'searchCallback2', {
            get: getSearchCallback2.bind(null, self),
            set: setSearchCallback2.bind(null, self)
        });
    }

    function createButton(self, action, title, iconClass) {
        var button = document.createElement('button'),
            icon = document.createElement('i');

        button.className = 'btn btn-default btn-icon';
        button.setAttribute('data-action', action);
        button.title = title;   // self.translator.translate(title);
        icon.className = iconClass;
        button.appendChild(icon);
        return button;
    }

    function getValue1(self) {
        return self._value1;
    }

    function setValue1(self, value) {
        if (self.listGroup1) {
            self.listGroup1.value = value;
        }
        self._value1 = value;
    }

    function getValue2(self) {
        return self._value2;
    }

    function setValue2(self, value) {
        if (self.listGroup2) {
            self.listGroup2.value = value;
        }
        self._value2 = value;
    }

    function getLoader1(self) {
        return self._loader1;
    }

    function setLoader1(self, value) {
        if (self.listGroup1) {
            self.listGroup1.loader = value;
        }
        self._loader1 = value;
        self.populateListGroup1();
    }

    function getLoader2(self) {
        return self._loader2;
    }

    function setLoader2(self, value) {
        if (self.listGroup2) {
            self.listGroup2.loader = value;
        }
        self._loader2 = value;
        self.populateListGroup2();
    }

    function getSearchCallback1(self) {
        return self._searchCallback1;
    }

    function setSearchCallback1(self, value) {
        if (self.listGroup1) {
            self.listGroup1.searchCallback = value;
        }
        self._setSearchCallback1 = value;
    }

    function getSearchCallback2(self) {
        return self._searchCallback2;
    }

    function setSearchCallback2(self, value) {
        if (self.listGroup2) {
            self.listGroup2.searchCallback = value;
        }
        self._setSearchCallback2 = value;
    }

    function setListHeight(self) {        
        var div = self.querySelector('.two-lists-members'),         // $(self.element).find('two-lists-members'),
            list1 = $(self.element).find('nav-list-group list-group-left'),
            list2 = $(self.element).find('nav-list-group list-group-right'),
            height1 = ((list1.clientHeight < list1.offsetHeight) ? list1.offsetHeight : list1.clientHeight),
            height2 = ((list2.clientHeight < list2.offsetHeight) ? list2.offsetHeight : list2.clientHeight),
            height = ((list1 < list2) ? list2 : list1);

        height = height.toString() + 'px';
        div.style.height = 'calc(100% - ' + height + ')';
    }

    document.registerElement('mi-accumulator', { prototype: proto });

    return proto;

});