define(function (require, exports, module) {
    /* jshint maxstatements:75 */
    'use strict';

    var _ = require('lodash'),
        $ = require('jquery');

    var ErrorNotificationHandler = require('logging/error-notification-handler'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        converter = require('system/lang/converter'),
        DateTimeControl = require('./date-time-control');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        defineProperties(this);
        this.rebuild = _.debounce(rebuildControl.bind(null, this), 100);
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
    };

    proto.attachedCallback = function () {
        try {
            try_attachedCallback(this);
        } catch (e) {
            catchError(e, this);
        }
    };

    proto.detachedCallback = function () {
        try {
            try_detachedCallback(this);
        } catch (e) {
            catchError(e, this);
        } finally {
            Element.clearDom(this);
        }
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        try {
            try_attributeChangedCallback(this, attrName, oldValue, newValue);
        } catch (e) {
            catchError(e, this);
        }
    };

    function try_attachedCallback(self) {
        self.control = new DateTimeControl(self);
        initProperties(self);
        self.control.initHTML();
        self.control.initialize({
            pickDate: self.pickDate,
            pickTime: self.pickTime,
            useMinutes: self.useMinutes,
            useSeconds: self.useSeconds,
            minuteStep: self.minuteStep,
            format: self.format,
            disabled: self.disabled,
            required: self.required,
            defaultDate: self.value,
            useCurrent: self.useCurrent
        });
        self.control.changed.add(control_changed, null, self);
        self.control.blur.add(control_blur, null, self);
        self.control.invalid.add(control_invalid, null, self);
        self.control.hide.add(control_hide, null, self);
    }

    function try_detachedCallback(self) {
        self.control.dispose();
        self.control = null;
        Element.clearDom(self);
    }

    function try_attributeChangedCallback(self, attrName, oldValue, newValue) {
        if (attrName === 'value') {
            oldValue = converter.toNullableDate(oldValue);
            newValue = converter.toNullableDate(newValue);
            updateValue(self, oldValue, newValue);
        } else if (attrName === 'format') {
            self.format = getFormatAttribute(self);
        } else if (attrName === 'pick-date') {
            self.pickDate = getPickDateAttribute(self);
        } else if (attrName === 'pick-time') {
            self.pickTime = getPickTimeAttribute(self);
        } else if (attrName === 'use-minutes') {
            self.useMinutes = getUseMinutesAttribute(self);
        } else if (attrName === 'use-seconds') {
            self.useSeconds = getUseSecondsAttribute(self);
        } else if (attrName === 'minute-step') {
            self.minuteStep = getMinuteStepAttribute(self);
        } else if (attrName === 'disabled') {
            self.disabled = getDisabledAttribute(self);
        } else if (attrName === 'required') {
            self.required = getRequiredAttribute(self);
        } else if (attrName === 'populate-empty') {
            self.useCurrent = getUseCurrentAttribute(self);
        }
        refreshValue(self);
    }

    function refreshValue(self) {
        if (self._properties.value) {
            self.control.picker.setValue(self.control.picker.date.toDate());
        }
    }

    function defineProperties(self) {
        self._properties = {
            pickDate: true,
            pickTime: true,
            useMinutes: true,
            useSeconds: false,
            minuteStep: 1,
            format: '',
            disabled: false,
            required: false,
            useCurrent: true,
            oldValue: null
        };
        _.each(self._properties, defineProperty.bind(null, self));

        self._properties.value = converter.toDate();
        Element.defineProperty(self, 'value', {
            get: property_read.bind(null, self, 'value'),
            set: value_write.bind(null, self)
        });
    }

    function defineProperty(self, value, key) {
        Object.defineProperty(self, key, {
            get: property_read.bind(null, self, key),
            set: property_write.bind(null, self, key)
        });
    }

    function initProperties(self) {
        self._properties.format = getFormatAttribute(self);
        self._properties.pickDate = getPickDateAttribute(self);
        self._properties.pickTime = getPickTimeAttribute(self);
        self._properties.useMinutes = getUseMinutesAttribute(self);
        self._properties.useSeconds = getUseSecondsAttribute(self);
        self._properties.minuteStep = getMinuteStepAttribute(self);
        self._properties.disabled = getDisabledAttribute(self);
        self._properties.value = converter.toDate(getValueAttribute(self), undefined, getValueAttribute(self));
        self._properties.required = getRequiredAttribute(self);
        self._properties.useCurrent = getUseCurrentAttribute(self);
        self._properties.oldValue = self._properties.value;
    }

    function getFormatAttribute(self) {
        return Element.stringAttribute(self, 'format', self.format);
    }

    function getPickDateAttribute(self) {
        return booleanAttribute(self, 'pick-date', self.pickDate);
    }

    function getPickTimeAttribute(self) {
        return booleanAttribute(self, 'pick-time', self.pickTime);
    }

    function getUseMinutesAttribute(self) {
        return booleanAttribute(self, 'use-minutes', self.useMinutes);
    }

    function getUseSecondsAttribute(self) {
        return booleanAttribute(self, 'use-seconds', self.useSeconds);
    }

    function getMinuteStepAttribute(self) {
        return Element.intAttribute(self, 'minute-step', self.minuteStep);
    }

    function getDisabledAttribute(self) {
        return Element.booleanAttribute(self, 'disabled');
    }

    function getUseCurrentAttribute(self) {
        return !Element.booleanAttribute(self, 'populate-empty');
    }

    function getRequiredAttribute(self) {
        return Element.booleanAttribute(self, 'required');
    }

    function booleanAttribute(element, name, defaultValue) {
        var value = element.getAttribute(name);
        if (value) {
            return converter.toBoolean(value, 'true');
        } else {
            return defaultValue;
        }
    }

    function getValueAttribute(self) {
        return Element.stringAttribute(self, 'value', self.value);
    }

    function property_read(self, name) {
        return self._properties[name];
    }

    function property_write(self, name, value) {
        self._properties[name] = value;
        rebuildControl(self);
    }

    function value_write(self, value) {
        var hasNativeWebComponents = (!window.CustomElements || window.CustomElements.useNative);

        if (hasNativeWebComponents) {
            value_write_base(self, value);
        } else {
            var grandparentNode,
                isDatasheet = false;

            if (self.parentNode && self.parentNode.parentNode) {
                grandparentNode = self.parentNode.parentNode;
            }

            if (grandparentNode && $(grandparentNode).hasClass('layout-element-content')) {
                isDatasheet = true;
            }

            if (isDatasheet) {
                value_write_base(self, value);
            } else {
                _.defer(function () {
                    value_write_base(self, value);
                });
            }
        }
    }

    function value_write_base(self, value) {
        if (value === undefined) { return; }
        if (value === '') { value = null; }
        if (value !== null && value !== undefined && !_.isDate(value)) {
            value = converter.toDate(value, undefined, value);
        }

        value = cleanValue(self, value);
        self._properties.value = value;
        self._properties.oldValue = value;
        if (self.control) {
            self.control.setValue(self.value);
        }
    }

    function control_changed(self, control, oldDate, newDate) {
        if (self.value === null && newDate === null) { return; }
        updateValue(self, self.value, newDate);
    }

    function control_blur(self) {
        tryRaiseChangeEvent(self);
    }

    function control_hide(self) {
        tryUpdateValueOnCloseEvent(self);
    }

    function control_invalid(self) {
        var oldValue = self._properties.value;
        self._properties.value = null;
        raiseInvalidEvent(self, oldValue);
    }

    function cleanValue(self, value) {
        if (value) {
            if (!self.pickTime) {
                value.setHours(0, 0, 0, 0);
            } else if (!self.useSeconds) {
                value.setSeconds(0, 0);
            }

            return value;
        }
    }

    function updateValue(self, oldValue, newValue) {
        if (isValueChanged(oldValue, newValue)) {
            self._properties.value = newValue;
        }
    }

    function tryRaiseChangeEvent(self) {
        if (isValueChanged(self._properties.oldValue, self._properties.value)) {
            raiseChangeEvent(self, self._properties.oldValue, self._properties.value);
            self._properties.oldValue = self._properties.value;
        }
    }

    function tryUpdateValueOnCloseEvent(self) {
        if (shouldUpdateOnClose(self) && isValueChanged(self._properties.oldValue, self._properties.value)) {
            raiseUpdateValueOnCloseEvent(self, self._properties.oldValue, self._properties.value);
            self._properties.oldValue = self._properties.value;
        }
    }

    function shouldUpdateOnClose(self) {
        return self.getAttribute('update-on-close');
    }

    function raiseChangeEvent(self, oldValue, newValue) {
        self.dispatchEvent(new CustomEvent('change', {
            detail: { oldValue: oldValue, newValue: newValue }
        }));
    }

    function raiseUpdateValueOnCloseEvent(self, oldValue, newValue) {
        self.dispatchEvent(new CustomEvent('updateValueOnClose', {
            detail: { oldValue: oldValue, newValue: newValue }
        }));
    }

    function raiseInvalidEvent(self, oldValue) {
        self.dispatchEvent(new CustomEvent('invalid', {
            detail: { oldValue: oldValue, newValue: null }
        }));
    }

    function excludeMilliseconds(value) {
        return Math.floor(value / 1000);
    }

    function isValueChanged(oldValue, newValue) {
        if (!oldValue) { return true; }
        if (!newValue) { return true; }
        //Since date time picker always returns milliseconds value 000, 
        //should prevent change for just milliseconds change
        return excludeMilliseconds(oldValue.valueOf()) !== excludeMilliseconds(newValue.valueOf());
    }

    function rebuildControl(self) {
        if (self.control) {
            self.control.initialize({
                pickDate: self.pickDate,
                pickTime: self.pickTime,
                useMinutes: self.useMinutes,
                useSeconds: self.useSeconds,
                minuteStep: self.minuteStep,
                format: self.format,
                disabled: self.disabled,
                required: self.required,
                defaultDate: self.value,
                useCurrent: self.useCurrent
            });
            if (self.disabled) {
                self.control.disable();
            } else {
                self.control.enable();
            }
        }
    }

    function catchError(e, self) {
        logger.error(e.stack);
        self.errorNotificationHandler.addError({
            errorMessage: e.message,
            errorDetail: e.stack
        });
    }

    document.registerElement('mi-date-time', { prototype: proto });
    return proto;
});