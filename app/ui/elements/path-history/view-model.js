define(function(require) {
    'use strict';

    require('ui/elements/list-group-item/view-model');
    require('ui/elements/list-group/view-model');

    var CASCADE_ATTRIBUTES = [
	'key',
	'description',
	'selector',
	'multiselect',
	'checked',
	'has-children',
	'use-html',
	'page-size',
	'delay'
    ];

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var ul;

        this.style.display = 'block';
        ul = document.createElement('div');
        ul.className = 'list-group';
        this.appendChild(ul);
        Element.defineProperty(this, 'value', {
            get: getValue.bind(null, this),
            set: setValue.bind(null, this)
        });
        Element.defineProperty(this, 'listGroup', {
            get: getListGroup.bind(null, this),
            set: setListGroup
        });

        this._loader = null;
        Element.defineProperty(this, 'loader', {
            get: getLoader.bind(null, this),
            set: setLoader.bind(null, this)
        });

        this._listItemIconCallback = null;
        Element.defineProperty(this, 'listItemIconCallback', {
            get: getListItemIconCallback.bind(null, this),
            set: setListItemIconCallback.bind(null, this)
        });
    };

    function getListItemIconCallback(self) {
        return self._listItemIconCallback;
    }

    function setListItemIconCallback(self, value) {
        self._listItemIconCallback = value || null;
    }

    proto.attachedCallback = function () {
        this.firstElementChild.addEventListener('click', this);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var idx, items;

        if (CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
            items = this.firstElementChild.getElementsByTagName('mi-li');
            for (idx = 0; idx < items.length; idx++) {
                if (attrName === 'description' || attrName === 'use-html') {
                    items[idx].setAttribute(attrName, newValue);
                }
                items[idx].listGroup.setAttribute(attrName, newValue);
            }
        }
    };

    proto.handleEvent = function (e) {
        var customEvent;
        if (e.type === 'click') {
            e.cancelBubble = true;
            e.preventDefault = true;
            customEvent = new CustomEvent('click', { bubbles: true });
            customEvent.data = e.target.value;
            this.dispatchEvent(customEvent);
        }
    };

    proto.contains = function (data) {
        var idx, items = this.value;

        for (idx = 0; idx < items.length; idx++) {
            if (data === items[idx].value) {
                return true;
            }
        }
        return false;
    };

    proto.push = function (data) {
        var li;
        li = document.createElement('mi-li');
        this.firstElementChild.appendChild(li);
        li.classList.add('selected');
        if(data.hasChildren !== null) {
            li.setAttribute('icon-class', 'icon-arrow');
        }
        if (this.getAttribute('description')) {
            li.setAttribute('description', this.getAttribute('description'));
        }
        if (this.getAttribute('use-html')) {
            li.setAttribute('use-html', this.getAttribute('use-html'));
        }
        li.setAttribute('has-children', true);
        li.value = data;
        li.listGroup = createListGroup(this, data);
        Object.tryMethod(this, '_listItemIconCallback', li.listItemIcon, data);
        raiseChangeEvent(this);
    };

    proto.pop = function () {
        var firstChild = this.firstElementChild,
            items = firstChild.getElementsByTagName('mi-li');

        if (items.length > 1) {
            firstChild.removeChild(items[items.length - 1]);
            raiseChangeEvent(this);
        }
    };

    proto.moveBack = function(index) {
        var ul = this.firstElementChild,
            items = ul.getElementsByTagName('mi-li'),
            idx, last;

        if (index instanceof Object) {
            while (items && items[items.length -1].value !== index) {
                ul.removeChild(items[items.length - 1]);
                raiseChangeEvent(this);
            }
        } else {
            items = items.splice(index + 1);
            for (idx = 0; idx < items.length; idx++) {
                ul.removeChild(items[idx]);
                raiseChangeEvent(this);
            }
        }
        last = ul.querySelector('mi-li:last-of-type').listGroup;
        if (last) {
            last._value = null;
        }
    };

    proto.clear = function () {
        this.firstElementChild.innerHTML = '';
    };

    function getValue(self) {
        var li = self.firstElementChild.getElementsByTagName('mi-li'),
            list = [],
            idx;

        for (idx = 0; idx < li.length; idx++) {
            list[list.length] = li[idx].value;
        }
        return list;
    }

    function setValue(self, v) {
        var idx, li,
            firstChild = self.firstElementChild,
            changed = false;

        if (v instanceof Array) {
            li = firstChild.getElementsByTagName('mi-li');
            for (idx = 0; idx < v.length; idx++) {
                if (idx >= li.length) {
                    self.push(v[idx]);
                    changed = true;
                } else if (v[idx] !== li[idx].value) {
                    li[idx].value = v[idx];
                    li[idx].listGroup.reload();
                    changed = true;
                }
            }
            if (v.length < li.length) {
                changed = true;
                for (idx = li.length - 1; idx > v.length - 1; idx--) {
                    firstChild.removeChild(li[idx]);
                }
                li[li.length - 1].listGroup.value = null;
            }
            if (changed) {
                raiseChangeEvent(self);
            }
        } else {
            self.firstChild.innerHTML = '';
            if (v) {
                self.push(v);
            }
            raiseChangeEvent(self);
        }
    }

    function getListGroup (self) {
        var li = self.firstElementChild.getElementsByTagName('mi-li'),
            list = [],
            idx;

        for (idx = 0; idx < li.length; idx++) {
            list[list.length] = li[idx].listGroup;
        }
        return list;
    }

    function setListGroup () { }

    function getLoader (self) {
        return self._loader;
    }

    function setLoader (self, value) {
        var idx, li = self.firstElementChild.getElementsByTagName('mi-li');

        self._loader = value;
        for (idx = 0; idx < li.length; idx++) {
            li[idx].listGroup.listItemIconCallback = self.listItemIconCallback;
            li[idx].listGroup.loader = value ? value.bind(null, idx) : null;           
        }
    }

    function raiseChangeEvent(self) {
        var e = new CustomEvent('change', {
            bubbles: true
        });
        self.dispatchEvent(e);
    }

    function createListGroup(self, data) {
        var listGroup = document.createElement('mi-list-group'),
            tabIdx = self.firstElementChild.getElementsByTagName('mi-li').length - 1,
            idx;

        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            copyAttribute(self, listGroup, CASCADE_ATTRIBUTES[idx]);
        }
        listGroup.setAttribute('allow-add', 'false');
        if (data && data.loader) {
            listGroup.loader = data.loader.bind(null, tabIdx);
        } else if (self.loader) {
            listGroup.loader = self.loader.bind(null, tabIdx);
        }
        listGroup.listItemIconCallback = self.listItemIconCallback;
        listGroup.addEventListener('change', doNothing);
        return listGroup;
    }

    function doNothing(e) {
        e.cancelBubble = true;
        e.preventDefault();
    }

    function copyAttribute(a, b, attr) {
        var value = a.getAttribute(attr);
        if (value) {
            b.setAttribute(attr, value);
        }
    }

    document.registerElement('mi-path-history', { prototype: proto });
    return proto;
});
