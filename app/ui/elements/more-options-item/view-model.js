define(function () {
    'use strict';

    var $ = require('jquery');

    var Converter = require('system/lang/converter');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var moreoptionsDiv, spanText, spanIcon;
        this.$el = $(this);

        this.className = 'moreoptions-item';
        this.display = "block";

        //creating span for options icon
        spanIcon = document.createElement('span');
        spanIcon.className = 'icon';

        //creating span for options text
        spanText = document.createElement('span');
        spanText.className = 'text';

        this.appendChild(spanIcon);
        this.appendChild(spanText);

        defineProperties(this);
    };

    proto.attachedCallback = function () {
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) { };

    function defineProperties(self) {
        self._value = null;
        Element.defineProperty(self, 'value', {
            get: function () { return this._value; }.bind(self),
            set: function (value) {
                this._value = value;
                setText(this, value);
            }.bind(self)
        });
    }


    function setText(self, value) {
        var text;

        if (!self.value) {
            return;
        }
        
        //adding options text to span
        self.querySelector('.text').textContent = value.text;
        //adding options icon to span
        self.querySelector('.icon').className = value.icon;
    }


    document.registerElement('mi-more-options-item', { prototype: proto });

    return proto;
});