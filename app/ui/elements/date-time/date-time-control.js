define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ErrorNotificationHandler = require('logging/error-notification-handler'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        Event = require('system/lang/event'),
	    Device = require('system/hardware/device');
    require('ui/elements/date-time/bootstrap-datetimepicker');

    function DateTimeControl(element) {
        this.element = element;
        this.options = null;
        this.picker = null;
        this.changed = new Event();
        this.invalid = new Event();
        this.blur = new Event();
        this.hide = new Event();

        this.inputGroup = null;
        this.input = null;
        this.addon = null;
        this.button = null;
        this.icon = null;
        this.$input = null;
        this.$addon = null;

        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
    }

    DateTimeControl.culture = '';

    DateTimeControl.setCulture = function (culture) {
        try{
            DateTimeControl.culture = culture;
        } catch (e) {
            catchError(this, e);
        }
    };

    DateTimeControl.prototype.initHTML = function () {
        try{
            try_initHTML(this);
        } catch (e) {
            catchError(this, e);
        }
    };

    DateTimeControl.prototype.initialize = function (options) {
        try{
            try_initialize(this, options);
        } catch (e) {
            catchError(this, e);
        }
    };

    DateTimeControl.prototype.setValue = function (value) {
        try{
            if (this.picker) { this.picker.setDate(value); }
        } catch (e) {
            catchError(this, e);
        }
    };

    DateTimeControl.prototype.enable = function () {
        try{
            setDisabled(this, false);
        } catch (e) {
            catchError(this, e);
        }
    };

    DateTimeControl.prototype.disable = function () {
        try{
            setDisabled(this, true);
        } catch (e) {
            catchError(this, e);
        }
    };

    DateTimeControl.prototype.dispose = function () {
        try{
            try_dispose(this);
        } catch (e) {
            catchError(this, e);
        } finally {
            destroy(this);
        }
    };

    function try_initHTML(self) {
        Element.clearDom(self.element);
        self.inputGroup = Element.build('div', self.element, ['input-group', 'date']);
        self.input = Element.build('input', self.inputGroup, ['form-control'], { type: 'text' });
        self.addon = Element.build('span', self.inputGroup, ['input-group-btn']);
        self.button = Element.build('button', self.addon, ['btn', 'btn-icon']);
        self.icon = Element.build('span', self.button);
        self.$input = $(self.input);
        self.$addon = $(self.addon);
    }

    function try_initialize(self, options) {
        if (options) { self.options = options; }
        destroy(self);
        setButtonIcon(self);
        initDateTimePicker(self);
    }

    function try_dispose(self) {
        self.changed.remove();
        self.changed = null;
        self.invalid.remove();
        self.invalid = null;
        destroy(self);
    }

    function destroy(self) {
        unregisterEvents(self);
        destroyDateTimePicker(self);
    }

    function unregisterEvents(self) {
        self.$addon.off();
        self.$input.off();
    }

    function destroyDateTimePicker(self) {
        if (self.picker) {
            self.picker.destroy();
            self.picker = null;
        }
    }

    function setButtonIcon(self) {
        if (self.options.pickDate) {
            self.icon.classList.add('icon-calendar');
            self.icon.classList.remove('icon-time-units');
        } else {
            self.icon.classList.add('icon-time-units');
            self.icon.classList.remove('icon-calendar');
        }
    }

    function initDateTimePicker(self) {
        self.picker = newDateTimePicker(self);
        setDisabled(self, self.options.disabled);
        registerEvents(self);
    }

    function newDateTimePicker(self) {
        self.$input.datetimepicker({
            pickDate: self.options.pickDate,
            pickTime: self.options.pickTime,
            useMinutes: self.options.useMinutes,
            useSeconds: self.options.useSeconds,
            minuteStepping: self.options.minuteStep,
            format: self.options.format,
            language: DateTimeControl.culture,
            useCurrent: self.options.useCurrent
        });
        return self.$input.data('DateTimePicker');
    }

    function setDisabled(self, disabled) {
        if (self.picker && disabled) {
            self.picker.disable();
        } else if (self.picker && !disabled) {
            self.picker.enable();
        }
        self.input.disabled = disabled;
        self.button.disabled = disabled;
    }

    function registerEvents(self) {
        self.$addon.click(addon_click.bind(null, self));
        self.$input.change(input_change);
        self.$input.on('dp.change', input_dp_change.bind(null, self));
        self.$input.on('blur', input_blur.bind(null, self));
        self.$input.on('dp.error', input_dp_error.bind(null, self));
        self.$input.on('dp.hide', input_dp_hide.bind(null, self));
        preventKeyboardOnMobile(self);
    }

    function preventKeyboardOnMobile(self) {
        var device = Object.resolve(Device);

        if (device.isMobile()) {
            self.input.readOnly = true;
        }
    }

    function addon_click(self) {
        self.input.focus();
    }

    function input_change(e) {
        e.stopPropagation();
    }

    function input_dp_change(self, e) {
        var oldDate = e.oldDate ? e.oldDate.toDate() : null,
            newDate = e.date ? e.date.toDate() : null;
        _.defer(function () { $(self.input).removeClass('date-error');  self.input.style.border = '1px solid #c0c5c5'; self.input.style.padding = '10px'; });
        self.changed.raise(self, oldDate, newDate);
    }

    function input_blur(self, e) {
        self.blur.raise(self);
        e.stopPropagation();
    }

    function input_dp_hide(self, e){
        self.hide.raise();
        e.stopPropagation();
    }

    function input_dp_error(self, e) {
        if (self.input.value || (!self.input.value && self.element.required)) {
            self.invalid.raise(self, self.input.value);
            _.defer(function () { $(self.input).addClass('date-error'); });
        } else {
            self.changed.raise(self, null, null);
        }
    }

    function catchError(self, e) {
        logger.error(e.stack);
        self.errorNotificationHandler.addError({
            errorMessage: e.message,
            errorDetail: e.stack
        });
    }

    return DateTimeControl;
});