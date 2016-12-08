define(function (require) {
    'use strict';

    var $ = require('jquery');

    //var view = require('text!./view.html');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var tabDiv, spanText, spanNumber;
        this.element = this;
        this.$element = null;
        this.text = this.getAttribute('text');
        this.hasError = this.getAttribute('haserror');
        this.number = this.getAttribute('number');
        this.value = this.getAttribute('value');
        this.isSelected = this.getAttribute('selected');
        this.disabled = this.getAttribute('disable');
        this.noAccess = this.getAttribute('noaccess');

        tabDiv = document.createElement('div');
        tabDiv.className = 'tab-group-item block';
        this.appendChild(tabDiv);

        spanNumber = document.createElement('span');
        spanNumber.className = 'number';
        spanNumber.innerHTML = '&nbsp';

        spanText = document.createElement('span');
        spanText.className = 'text';
        spanText.innerHTML = '&nbsp';

        tabDiv.appendChild(this.wrapTab(spanText, spanNumber));
        //defineProperties(this);
    };

    proto.attachedCallback = function () {
        this.setElement();
        //this.element.innerHTML = view;
        this.setText(this.text);
        this.setNumber(this.number);
        this.setNoAccess(this.noAccess);
        this.setDisabledTab(this.disabled);
        this.attachClickHandlers();
        //this.value = this.text;
        this.tabWidthClass = this.element.getAttribute('tabWidthClass');
        this.setTabWidth();
        if (this.isSelected) {
            this.setActive();
        }
    };

    proto.detachedCallback = function () {
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (!this.$element) {
            this.setElement();
        }

        if (attrName === 'haserror') {
            this.setHasError(newVal);
        }

        if (attrName === 'tabwidthclass') {
            this.tabWidthClass = newVal;
            this.setTabWidth();
        } else if (attrName === 'value') {
            this.setValue(newVal);
        } else if (attrName === 'text') {
            this.setText(newVal);
        } else if (attrName === 'number') {
            this.setNumber(newVal);
        } else if (attrName === 'selected') {
            this.isSelected = newVal;
            if (this.isSelected) {
                this.setActive();
            } else {
                this.setInactive();
            }
        } else if (attrName === 'disable') {
            this.setDisabledTab(newVal);
        } else if (attrName === 'noaccess') {
            this.setNoAccess(newVal);
        }
    };

    proto.setElement = function () {
        this.$element = $(this.element);
    };

    proto.setText = function (text) {
        if (text) {
            this.text = text;
            this.$element.find('.text').empty().append(text);
        }
    };

    proto.setValue = function (value) {
        if (value) {
            this.value = value;
        }
    };

    proto.setNumber = function (number) {
        if (isFinite(number)) {
            this.number = number;
            this.$element.find('.number').html("&nbsp").append(number);
            this.$element.find('.text').parent('td').removeClass('tdtxtcenter').addClass('tdtxtleft');
        }

        if (!number || isNaN(parseInt(number))) {
            this.$element.find('.text').parent('td').removeClass('tdtxtleft').addClass('tdtxtcenter');
        }
    };

    proto.attachClickHandlers = function () {
        this.$element.on('click', onClick.bind(null, this));
    };

    proto.detachClickHandlers = function () {
        this.$element.off('click');
    };

    proto.setActive = function () {
        var el = this.$element.find('.tab-group-item');
        var hasNoAccess = el.hasClass('no-access');
        var hasDisabled = el.hasClass('disabled-tab');
        if(!hasNoAccess && !hasDisabled) {
            this.$element.find('.tab-group-item').addClass('active');
        }
    };

    proto.setInactive = function () {
        this.$element.find('.tab-group-item').removeClass('active');
    };

    proto.setTabWidth = function () {
        this.$element.find('.tab-group-item').addClass(this.tabWidthClass);
    };

    proto.setNoAccess = function (noaccess) {
        if (!noaccess) {
            this.$element.find('.tab-group-item').removeClass('no-access');
        }
        else  {
            this.$element.find('.tab-group-item').addClass('no-access');
        }
    };
    proto.setDisabledTab = function (disable) {
        if (!disable) {
            this.$element.find('.tab-group-item').removeClass('disabled-tab');
        }
        else {
            this.$element.find('.tab-group-item').addClass('disabled-tab');
        }
    };
    proto.setHasError = function (value) {
        if (value === 'true') {
            this.$element.find('.tab-group-item').append('<i class="icon-alert"></i>');
        } else {
            this.$element.find('.tab-group-item').find('i.icon-alert').remove();
        }
    };

    proto.wrapTab = function wrapTab(spanText, spanNumber) {
        var tbl, tbdy, tr, td, tbldiv, tblInnerDiv;

        tbldiv = document.createElement('div');
        tbldiv.className = 'tbldiv';

        tblInnerDiv = document.createElement('div');
        tblInnerDiv.className = 'tblInnerDiv';

        tbldiv.appendChild(tblInnerDiv);

        tbl = document.createElement('table');
        tbl.className = 'tbl';
        tbdy = document.createElement('tbody');
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.className = 'tdtxtright';
        td.appendChild(spanNumber);
        tr.appendChild(td);
        td = document.createElement('td');
        td.className = 'tdtxtleft';
        td.appendChild(spanText);
        tr.appendChild(td);
        tbdy.appendChild(tr);
        tbl.appendChild(tbdy);

        tblInnerDiv.appendChild(tbl);
        return tblInnerDiv;
    };

    function onClick(self) {
        //self.setActive();
    }

    function defineProperties(self) {
        self._value = null;
        self._tabWidthClass = self._tabWidthClass || null;
        Element.defineProperty(self, 'value', {
            get: function () { return this._value; }.bind(self),
            set: function (v) {
                this._value = v;
            }.bind(self)
        });
    }

    document.registerElement('mi-tab', { prototype: proto });

    return proto;
});
