define(function (require) {
    'use strict';

    var $ = require('jquery');


    var view = require('text!./template.html');
    var ko = require('knockout');

    var proto = Object.create(HTMLElement.prototype);
    proto.createdCallback = function () {
        this.implementation = Object.resolve(CheckboxViewModel);
        this.implementation.element = this;
        this.implementation.$element = $(this);
        Object.tryMethod(this.implementation, 'created');
    };
    proto.attachedCallback = function () {
        Object.tryMethod(this.implementation, 'attached');
    };
    proto.detachedCallback = function () {
        Object.tryMethod(this.implementation, 'detached');
    };
    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        Object.tryMethod(this.implementation, attrName + 'Changed', oldVal, newVal);
    };

    function CheckboxViewModel() {
        this.element = null;
        this.$element = null;
        this.$input = null;
        this.$container = view;
        this.inputChangeHandler = onInputChange.bind(null, this);
        this.init = {};

    }

    CheckboxViewModel.prototype.created = function CheckboxViewModel_created() {
        var self = this;
        this.Node = document.createElement("div");

        $(this.Node).append();
        $(this.element).empty().append(this.$container);

       
        this.$input = this.$element.find('input[type="checkbox"]');
        this.$label = this.$element.find('label');
        var id = this.getGuid();
        this.$input.attr("id", id);
        this.$label.attr("for", id);

        //this.$input.on('change', this.inputChangeHandler);

        this.setAccessor('text', attr_change.bind(this,this, 'text'));
        this.setAccessor('checked', attr_change.bind(this, this, 'checked'));
        this.setAccessor('disabled', attr_change.bind(this, this, 'disabled'));
        this.setAccessor('value', attr_change.bind(this, this, 'value'));
        this.setAccessor('name', attr_change.bind(this, this, 'name'));

    };

    CheckboxViewModel.prototype.attached = function CheckboxViewModel_attached() {
        this.$input.on('change', this.inputChangeHandler);

    };

    CheckboxViewModel.prototype.detached = function CheckboxViewModel_detached() {
        this.$input.off('change', this.inputChangeHandler);

    };

    function onInputChange(self, ev) {

        self.checked(ev.currentTarget.checked);
        self.$element.trigger("checkedChange", [ev.currentTarget.checked, self.value()]);
    }

    function attr_change(self, attrName, value) {
        //if (!self.init[attrName] || value === 'null') {
        //    self.init[attrName] = true;
        //    return;
        //}

        if (attrName === 'text') {
            self.$element.find(".chkbox-text").html(value);
            return;
        }

        if (attrName === 'checked') {
            //console.log(value)
            self.$input.get(0).checked = value === 'checked' || toBoolean(value);
            return;
        }

        if (attrName === 'disabled') {
            //console.log(value)
            self.$input.prop("disabled", toBoolean(value));
            return;
        }

        if (self.$input) {
            self.$input.prop(attrName, value);
        }
    }
    function toBoolean(str) {

        //var str = this.toString();
        if (str === 'false' || str === false) {
            return false;
        }
        else if (str === 'true' || str === true) {
            return true;
        }
        else {
            return false;
        }
    }


    CheckboxViewModel.prototype.setAccessor = function (attrName, subscription) {
        this[attrName] = ko.observable();
        //this[attrName + '_canSet'] = true;

        //property setter and getter
        Object.defineProperty(this.element, attrName, {
            get: _propertyGet.bind(this, this, attrName),
            set: _propertySet.bind(this, this, attrName)
        });

        //attribute changes
        this[attrName + 'Changed'] = _attributeChanged.bind(this, this, attrName);


        //Local changes impact attribute and property
        this[attrName].subscribe(_attributeChangeSubscription.bind(this, this, subscription));


        this[attrName](this.element.getAttribute(attrName));
        //if (subscription) {
        //    subscription.call(this, this.element.getAttribute(attrName));
        //}
    };

    function _propertyGet(self, attrName) { 
        return self[attrName]();
    }

    function _propertySet(self, attrName,value) {

        //this[attrName + '_canSet'] = false;
        self[attrName](value);
        //this.element.setAttribute(attrName, value);
    }

    function _attributeChanged(self, attrName, oldValue, newValue) {

        //this[attrName + '_canSet'] = false;
        self[attrName](newValue);
        //this.element[attrName] = newValue;
    }

    function _attributeChangeSubscription(self, subscription, value) {
        if (subscription) {
            subscription.call(self, value);
        }

        //this.element.setAttribute(attrName, value);
        //this.element[attrName] = value;
    }

    
    CheckboxViewModel.prototype.getGuid = function miCheckboxProperty_getGuid() {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                this.s4() + '-' + this.s4() + this.s4() + this.s4();
    };

    CheckboxViewModel.prototype.s4 = function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
    };


    Element.registerElement('mi-checkbox-noko', { prototype: proto });
    return CheckboxViewModel;
});