define(function () {
    'use strict';

    var $ = require('jquery');

    var Converter = require('system/lang/converter');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var breadcrumbDiv, spanText, spanDelimiter;
        this.$el = $(this);

        this.className = 'breadcrumb-item';
        breadcrumbDiv = document.createElement('span');
        this.appendChild(breadcrumbDiv);

        spanText = document.createElement('span');
        spanText.className = 'text';
        breadcrumbDiv.appendChild(spanText);

        spanDelimiter = document.createElement('span');
        spanDelimiter.className = 'delimiter';
        breadcrumbDiv.appendChild(spanDelimiter);
        this.delimiter = this.getDelimiter();
        this.isActive = this.getIsActive();

        defineProperties(this);
    };

    proto.attachedCallback = function () {
        this.firstElementChild.addEventListener('click', this);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        if (attrName === 'delimiter') {
            this.delimiter = newValue;
            setDelimiter(newValue);
        } else if (attrName === 'active') {
            this.isActive = this.getIsActive();
            if (this.isActive === true) {
                showBreadcrumb(this);
            } else {
                hideBreadcrumb(this);
            }
        }
    };

    proto.handleEvent = function (e) {
        var customEvent;
        if (e.type === 'click') {
            customEvent = new CustomEvent('click', { 'detail': this.value, bubbles: true });
            this.dispatchEvent(customEvent);
        }
    };

    proto.getDelimiter = function getDelimiter() {
        return this.getAttribute('delimiter');
    };

    proto.getIsActive = function getIsActive() {
        return Converter.toBoolean(this.getAttribute('active'), 'true');
    };

    function defineProperties(self) {
        self._value = null;
        Element.defineProperty(self, 'value', {
            get: function () { return this._value; }.bind(self),
            set: function (value) {
                this._value = value;
                setText(this);
                setDelimiter(this);
            }.bind(self)
        });
    }

    
    function setText(self) {
        var text;

        if (!self.value) {
            return;
        }
        text = self.value['displayValue'];
        self.querySelector('.text').textContent = text;
    }

    function setDelimiter(self) {
        if (!self.value) {
            return;
        }
        self.querySelector('.delimiter').textContent = ' ' + self.delimiter + ' ';
    }

    function showBreadcrumb(self) {
        self.$el.css('display', 'inline-block');
    }

    function hideBreadcrumb(self) {
        self.$el.css('display', 'none');
    }


    document.registerElement('mi-breadcrumb-item', { prototype: proto });

    return proto;
});