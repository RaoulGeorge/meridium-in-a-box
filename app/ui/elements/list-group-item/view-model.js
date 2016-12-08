define(function () {
    'use strict';

    var Translator = require('system/globalization/translator'),
        proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var backgroundDiv, div, element, iconSpan, textSpan;

        this.translator = Object.resolve(Translator);
        this.className = 'list-group-item';
        backgroundDiv = document.createElement('div');
        backgroundDiv.classList.add('background-div');
        this.appendChild(backgroundDiv);
        div = document.createElement('div');
        div.classList.add('block-group');
        div.classList.add('mi-li-body');
        this.appendChild(div);
        element = document.createElement('div');
        element.setAttribute('name', 'selector');
        div.appendChild(element);
        setSelector(this);
        element = document.createElement('div');
        textSpan = document.createElement('span');
        iconSpan = document.createElement('span');
        textSpan.setAttribute('name', 'text');
        iconSpan.setAttribute('name', 'custom-icon');
        textSpan.classList.add('system-ellipsis-text');
        element.appendChild(iconSpan);
        element.appendChild(textSpan);
        div.appendChild(element);
        this._listItemIcon = iconSpan;
        toggleIcon(this);
        defineProperties(this);
    };

    proto.attachedCallback = function () {
        //Event listener is needed, it converts a click in the
        //mi-li to be from the mi-li. Other code depends on this.
        this.querySelector('.mi-li-body').addEventListener('click', this);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        if (attrName === 'selector' || attrName === 'multiselect') {
            setSelector(this);
        } else if (attrName === 'checked') {
            checkedAttributeChanged(this, newValue);
        } else if (attrName === 'description' && this.value) {
            setText(this);
        } else if (attrName === 'icon-class') {
            iconAttributeChanged(this, newValue);
        } else if (attrName === 'has-children') {
            toggleIcon(this);
        } else if (attrName === 'use-html') {
            setText(this);
        } else if (attrName === 'disabled') {
            toggleDisabled(this, newValue);
        } else if (attrName === 'disabledicon') {
            toggleDisabledIcon(this, newValue);
        }
    };

    //Event listener is needed, it converts a click in the
    //mi-li to be from the mi-li. Other code depends on this.
    proto.handleEvent = function (e) {
        if (e.type === 'click') {
            onClick(this, e);
        } else if (e.type === 'change') {
            onChange(this, e);
        }
    };

    function defineProperties (self) {
        self._value = null;
        
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });

        Element.defineProperty(self, 'listItemIcon', {
            get: getListItemIcon.bind(null, self),
            set: setListItemIcon.bind(null, self)
        });
    }

    function getListItemIcon(self) {
        return self._listItemIcon;
    }

    function setListItemIcon(self, value) {
        //self._listItemIconCallback = value || null;
    }

    function getValue (self) {
        return self._value;
    }

    function setValue (self, v) {
        self._value = v;
        setText(self);
        toggleIcon(self);
    }

    function setToggleSelector (self, div, divName) {
        var span = document.createElement('span'),
            selector = document.createElement('input');
        if (self.getAttribute('multiselect') === 'true') {
            selector.type = 'checkbox';
            span.classList.add('custom-checkbox');
        } else {
            selector.type = 'radio';
            selector.name = 'list-group-radio';
        }
        if (self.getAttribute('checked')) {
            selector.checked = self.getAttribute('checked') === 'true';
        } else {
            selector.checked = false;
        }
        selector.setAttribute('selector', true);
        div.appendChild(span);
        div.appendChild(selector);
        divName.classList.add('selector-seperator');
    }

    function setAddOnlySelector (self, div, divName) {
        var selector = document.createElement('i');
        selector.className = 'icon-plus';
        selector.title = self.translator.translate('ADD_ASSET');
        div.appendChild(selector);
        divName.classList.add('selector-seperator');
    }

    function setSelector(self) {
        var type = self.getAttribute('selector'),
            selector,
            div = self.querySelector('[name="selector"]'),
            divName = self.querySelector('[name="text"]');

        if (div.hasChildNodes()) {
            selector = div.querySelector('input');
            if (selector) {
                selector.removeEventListener('checked', self);
            }
            div.innerHTML = '';
        }
        if (type === 'toggle') {
            setToggleSelector(self, div, divName);
        } else if (type === 'addOnly') {
            setAddOnlySelector(self, div, divName);
        }
    }

    function toggleIcon(self) {
        var i, attr, showIcon, value,
            div = self.querySelector('.mi-li-body');

        attr = self.getAttribute('has-children');
        if (attr) {
            if (attr === 'true') {
                showIcon = true;
            } else {
                value = self.value[attr];
                showIcon = value instanceof Function ? value() : value;
            }
        } else {
            showIcon = false;
        }
        if (showIcon && !div.querySelector('i[name="icon"]')) {
            i = document.createElement('i');
            i.className = self.getAttribute('icon-class');
            i.title = self.translator.translate('EXPAND');
            i.setAttribute('name', 'icon');
            div.appendChild(i);
        } else if (!showIcon) {
            i = div.querySelector('i[name="icon"]');
            if (i) {
                div.removeChild(i);
            }
        }
    }

    function toggleDisabled(self, value) {
        if(value === true || value === 'true'){
            self.classList.add('disabled');
        } else if(value === false || value === 'false') {
            self.classList.remove('disabled');
        }
    }

    function toggleDisabledIcon(self, value) {
        if(value === true || value === 'true'){
            self.classList.add('disabledIcon');
        } else if(value === false || value === 'false') {
            self.classList.remove('disabledIcon');
        }
    }

    function createIcon(self) {
        var i,
            div = self.querySelector('.mi-li-body');
        if (!div.querySelector('i[name="icon"]')) {
            i = document.createElement('i');
            i.className = self.getAttribute('icon-class');
            i.setAttribute('name', 'icon');
            div.appendChild(i);
        }
    }

    function setText(self) {
        var     value, text,
            description = self.getAttribute('description') || 'description',
            attr = self.getAttribute('use-html');

        if (!self.value) {
            return;
        }

        value = self.value[description];
        text = value instanceof Function ? value.call(self.value) : value;
        if (attr) {
            self.querySelector('[name="text"]').innerHTML = text;
        } else {
            self.querySelector('[name="text"]').textContent = text;
        }
    }

    function checkedAttributeChanged (self, newValue) {
        var selector = self.querySelector('[name="selector"] input');
        if (selector) {
            selector.checked = newValue === 'false' ? false : true;
            if(selector.checked){
                selector.previousSibling.classList.add('checked');
            } else {
                selector.previousSibling.classList.remove('checked');
            }
        }
    }

    function iconAttributeChanged (self, newValue) {
        var icon = self.querySelector('[name="icon"]');
        if (icon !== null) {
            icon.className = newValue;
        } else {
            createIcon(self);
            icon = self.querySelector('[name="icon"]');
            icon.className = newValue;
        }
    }

    function onClick (self, e) {
        var customEvent;

        e.cancelBubble = true;
        e.preventDefault = true;
        customEvent = new CustomEvent('click', { bubbles: true, cancelable: true });
        if (e.target.getAttribute('name') === 'selector' ||
            e.target.parentElement.getAttribute('name') === 'selector') {
            if (e.target.tagName === 'INPUT') {
                if ((e.target.getAttribute('type') === 'radio') ||
                    (e.target.getAttribute('type') === 'checkbox')) {
                    customEvent.selecting = e.target.checked;
                }
            } else if (e.target.tagName === 'I') {
                if (self.getAttribute('disabledicon') === 'true') {
                    return;
                }
                customEvent.selecting = true;
            }
        }
        self.dispatchEvent(customEvent);
    }

    function onChange (self, e) {
        var previousCheckValue,
            newCheckValue;

        previousCheckValue = e.target.checked;
        self.setAttribute('checked', e.target.checked);
        newCheckValue = e.target.checked;

        if (previousCheckValue !== newCheckValue) {
            e.target.checked = previousCheckValue;
        }
    }

    document.registerElement('mi-li', { prototype: proto });
    return proto;
});
