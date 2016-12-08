define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');

    var React = require('react'),
       ReactDOM = require('react-dom');

    var SelectComponent = require('ui/react/select/element');
    var DropdownComponent = require('ui/react/dropdown/dropdown');

    var proto = Object.create(HTMLElement.prototype);

    var attributes = ['value', 'caption'];

    proto.createdCallback = function () {
        var self = this;

        self.__private__ = {
            options: [],
            value: '',
            caption: ''
        };

        setInitialValues(self);
        defineProperties(self, self.__private__);     
    };

    function setInitialValues(self) {
        _.each(attributes, getAttributeValue.bind(null, self));
    }

    function getAttributeValue(self, attrName) {
        var attrVal = self.getAttribute(attrName);
        if (attrVal) {
           setPropertyVal(self, attrName, attrVal);
        }
    }

    function defineProperties(self, props) {
        _.each(props, defineProperty.bind(null, self));
    }

    function defineProperty(self, value, key) {
        Object.defineProperty(self, key, {
            get: getPropertyVal.bind(null, self, key),
            set: setPropertyVal.bind(null, self, key),
        });
    }

    proto.attachedCallback = function () {
        this.render();
    };

    proto.detachedCallback  = function () {
        this.innerHTML = '';
    };

    proto.attributeChangedCallback = function (attrName, newVal, oldVal) {
        var self = this;
        if (attributes.indexOf(attrName) !== -1) {
            self[attrName] = newVal;
        }
    };

    proto.render = function () {

        var mountPoint = this.querySelector('span');
        if (mountPoint) {
            ReactDOM.unmountComponentAtNode(mountPoint);
        } else {
            mountPoint = document.createElement('span');
            this.appendChild(mountPoint);
        }
        
        ReactDOM.render(RSelect(this), mountPoint);
    };

    function RSelect(self) {
        return React.createElement(SelectComponent, {
            options: getPropertyVal(self, 'options'),
            value: getPropertyVal(self, 'value'),
            caption: getPropertyVal(self, 'caption'),
            onChange: fireChangeEvent.bind(null, self),
            style: { width: '150px' }
        });
    }

    function fireChangeEvent(self, newValue) {
        var oldValue = getPropertyVal(self, 'value');
        setPropertyVal(self, 'value', newValue);
        self.dispatchEvent(new CustomEvent('change', {
            detail: { oldValue: oldValue, newValue: newValue }
        }));
    }

    function getPropertyVal(self, propName) {
        return self.__private__[propName];
    }

    function setPropertyVal(self, propName, val) {
        self.__private__[propName] = val;
        self.render();
    }

    document.registerElement('mi-select2', { prototype: proto });

    return proto;
});