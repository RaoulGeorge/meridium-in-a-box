define(function (require) {
    'use strict';

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var tileDiv, spanNumber, spanText;

        this.className = 'tile-group-item';
        tileDiv = document.createElement('div');
        tileDiv.classList.add('rectangle-box');
        tileDiv.setAttribute('name', 'columns');
        this.appendChild(tileDiv);
        //setIcon(this);
        spanNumber = document.createElement('span');
        spanNumber.className = 'number';
        spanNumber.setAttribute('name', 'number');
        tileDiv.appendChild(spanNumber);

        spanText = document.createElement('span');
        spanText.className = 'text';
        spanText.setAttribute('name', 'text');
        tileDiv.appendChild(spanText);
        tileDiv.setAttribute('name', 'color');

        this.activeIdx = null;
        defineProperties(this);
    };

    proto.attachedCallback = function () {
        this.setNumber(this.getAttribute('number'));
        this.setText(this.getAttribute('text'));
        this.setIcon(this.getAttribute('icon'));
        this.setColor(this.getAttribute('color'));
        this.firstElementChild.addEventListener('click', this);
        this.activeIdx = this.getAttribute('index');
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var selector;

        if (attrName === 'width') {
            this.setTileSize(newValue);
        } else if (attrName === 'number') {
            this.setNumber(newValue);
        } else if (attrName === 'text') {
            this.setText(newValue);
            this.setTitle(newValue);
        } else if (attrName === 'icon') {
            this.setIcon(newValue);
        } else if (attrName === 'color') {
            this.setColor(newValue);
        }
        else if (attrName === 'rowfilter') {
            this.setRowFilter(newValue);
        } else if (attrName === 'selectionmode') {
            this.selectionMode(newValue);
        }
    };

    proto.handleEvent = function (e) {
        if (e.type === 'click') {
            var event = new CustomEvent('click', { 'detail': this.getAttribute('index'), bubbles: true });
            this.dispatchEvent(event);
        }
    };

    function defineProperties(self) {
        self._value = null;
        Element.defineProperty(self, 'value', {
            get: function () { return this._value; }.bind(self),
            set: function (value) {
                this._value = value;
                this.setTileSize(this.getAttribute('width'));
            }.bind(self)
        });
    }

    proto.setNumber = function setNumber(value) {
        this.querySelector('[name="number"]').textContent = (value && (value !== 'undefined')) ? value: '';    
    };

     proto.setText = function (value) {
        var attr = this.getAttribute('use-html');

        if (attr) {
            this.querySelector('[name="text"]').innerHTML = (value && (value !== 'undefined')) ? value : '';
        } else { 
            this.querySelector('[name="text"]').textContent = (value && (value !== 'undefined')) ? value : '';
        }
    };

    proto.setTitle = function (value) {
        this.setAttribute('title', value);
    };

    proto.setTileSize = function setTileSize(value) {
         if (value && (value !== 'undefined')) {
             this.style.width = value;
         }
    };

    function removeIcon(div) {
        var i = div.querySelector('i[name="icon"]');
        if(i) {
            div.removeChild(i);
        }
    }

    proto.setIcon = function setIcon(value) {
        var i, div = this.firstElementChild;
        removeIcon(div);
        if (value && (value !== 'undefined')) {
            if (!div.querySelector('i[name="icon"]')) {
                i = document.createElement('i');
                i.className = value;
                i.setAttribute('name', 'icon');
                div.insertBefore(i, div.firstChild);
            }
        }
    };

    proto.setColor = function setColor(value) {
        if (value && (value !== 'undefined')) {
            this.lastChild.style.color = value;
            //this.lastChild.style.borderTopColor = value;
        }      
    };

    proto.setRowFilter = function setRowFilter(value) {
        this.setAttribute('rowfilter', value);
    };

    proto.selectionMode = function selectionMode(value) {
        this.setAttribute('selectionmode', value);
    };

    document.registerElement('mi-tile', { prototype: proto });

    return proto;
});