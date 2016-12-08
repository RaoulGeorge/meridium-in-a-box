define(function (require) {

    'use strict';

    var $ = require('jquery');


    var view = require('text!./template.html');
    var ko = require('knockout');

    var proto = Object.create(HTMLElement.prototype);
    proto.createdCallback = function () {
        this.implementation = Object.resolve(RadioViewModel);
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

    function RadioViewModel() {
        this.element = null;
        this.$element = null;
        this.$input = null;
        this.$container = view;
        this.init = {};
    }

    RadioViewModel.prototype.created = function () {
        var self = this;
        this.Node = document.createElement("div");

        $(this.Node).append(this.$container);
        $(this.element).html(this.Node);

       
        this.$input = this.$element.find('input[type="radio"]');
        this.$label = this.$element.find('label');
        var id = this.getGuid();
        this.$input.attr("id", id);
        this.$label.attr("for", id);

        this.$input.on('change', function (ev) {

            self.checked(ev.currentTarget.checked);
            self.$element.trigger("checkedChange", [ev.currentTarget.checked, self.value(),self.name()]);
        });

        this.setAccessor('text', attr_change.bind(this,this, 'text'));
        this.setAccessor('checked', attr_change.bind(this, this, 'checked'));
        this.setAccessor('value', attr_change.bind(this, this, 'value'));
        this.setAccessor('name', attr_change.bind(this, this, 'name'));

    };

    function attr_change(self, attrName, value) {

        if (!self.init[attrName] || value === 'null') {
            self.init[attrName] = true;
            return;
        }

        if (attrName === 'text') {
            self.$element.find(".radio-text").html(value);
            return;
        }

        if (attrName === 'checked') {
            //console.log(value)
            self.$input.get(0).checked = toBoolean(value);
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

    function toBoolean(input) {
        if (!input) {
            return false;
        }

        var str = input.toString();
        if (str === 'false') {
            return false;
        }
        else if (str === 'true') {
            return true;
        }
        else {
            return false;
        }
    }


    RadioViewModel.prototype.setAccessor = function (attrName, subscription) {
        this[attrName] = ko.observable();
        this[attrName + '_canSet'] = true;

        //property setter and getter
        Object.defineProperty(this.element, attrName, {
            get: function () { return this[attrName](); }.bind(this),
            set: function (value) {

                this[attrName + '_canSet'] = false;
                this[attrName](value);
                this.element.setAttribute(attrName, value);
            }.bind(this)
        });

        //attribute changes
        this[attrName + 'Changed'] = function (oldValue, newValue) {

            this[attrName + '_canSet'] = false;
            this[attrName](newValue);
            this.element[attrName] = newValue;
        }.bind(this);


        //Local changes impact attribute and property
        this[attrName].subscribe(function (value) {
            if (subscription) {
                subscription.call(this, value);
            }

            this.element.setAttribute(attrName, value);
            this.element[attrName] = value;
        }.bind(this));


        this[attrName](this.element.getAttribute(attrName));
        if (subscription) {
            subscription.call(this, this.element.getAttribute(attrName));
        }
    };

    RadioViewModel.prototype.attached = function () {


    };
    RadioViewModel.prototype.getGuid = function miRadioProperty_getGuid() {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                this.s4() + '-' + this.s4() + this.s4() + this.s4();
    };

    RadioViewModel.prototype.s4 = function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
    };


    Element.registerElement('mi-radio-noko', { prototype: proto });
    return RadioViewModel;
});