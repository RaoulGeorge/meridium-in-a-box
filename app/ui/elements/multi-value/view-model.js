define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./template.html'),
        optionsView = require('text!./options-template.html'),
        ko = require('knockout'),
        Region = require('spa/region'),
        Translator = require('system/globalization/translator'),
        Element = require('../select/element'),
        Device = Object.resolve(require('system/hardware/device'));

    function MultiValueViewModel() {
        base.call(this, view, false, true);
        var self = this;

        this.translator = Object.resolve(Translator);
        this.optionsValue = ko.observable();
        this.optionsText = ko.observable();
        this.multiple = ko.observable(false);
        this.optionsCaption = ko.observable('');
        this.options = ko.observableArray([]);
        this.value = ko.observable();
        this.required = ko.observable(false);
        this.disabled = ko.observable(false);
        this.visible = ko.observable(true);
        this.selectedOptions = ko.observableArray([]);
        this.autoAdd = ko.observable(true);
        this.onOptionAdd = ko.observable();
        this.addCaption = ko.observable(this.translator.translate('MULTI_VALUE_ADD_OPTION_PLACEHOLDER'));

        //For keyboard handling
        this.textFocus = ko.observable(false);
        this.keyPressed = ko.observable(false);
        this.currentText = null;

        this.isOpen = ko.observable(false);
        this.selectedItem = ko.observable();
        this.addValue = ko.observable();
        this.optionsRegion = new Region();
        this.isClicked = false;
        this.isMobile = Device.isMobile();

        this.isRequired = ko.computed(computeIsRequired.bind(self, self));
        this.isRequiredSubscriber = this.isRequired.subscribe(required_changed.bind(self, self));

        this.addCaptionText = ko.computed(addCaptionText.bind(null, this));
        this.selectedValueText = ko.computed(selectedValueText.bind(null, this));
        this.addValueUpdate = handleAddValueUpdate;
        this.addValue.subscribe(self.addOption, this);

        $(document).bind('mousedown', documentClickHandler.bind(null, self));

    }

    var base = Object.inherit(Element.ViewModel, MultiValueViewModel);

    MultiValueViewModel.prototype.inputMouseDown = function (d, e) {
        e.stopPropagation();
        e.target.focus();
    };

    function addCaptionText(self) {
        return self.addCaption() || self.translator.translate('MULTI_VALUE_ADD_OPTION_PLACEHOLDER');
    }

    function computeIsRequired(self) {
        return self.required() && !self.hasValue();
    }

    function required_changed(self, state) {
        if (self.isRequired()) {
            $(self.element).addClass('mi-multi-value-required');
        } else {
            $(self.element).removeClass('mi-multi-value-required');
        }
    }

    MultiValueViewModel.prototype.hasValue = function MultiValueViewModel_hasValue() {
        var self = this;
        if (!self.multiple()) {
            if (!self.value()) {
                return false;
            }
        } else {
            if (self.selectedOptions() && self.selectedOptions().length) {
                return false;
            }
        }

        return true;
    };

    MultiValueViewModel.prototype.addOption = function MultiValueViewModel_addOption(value) {
        var valueSet = value;
        var self = this;

        //if (value && self.autoAdd()) {
        if (value) {

            if (typeof self.options()[0] === 'object' || self.optionsText()) {
                valueSet = {};
                valueSet[self.optionsText()] = value;
                valueSet[self.optionsValue()] = value;
            }

            //trigger event
            self.onOptionAdd(valueSet);

            self.options.push(valueSet);
            //$(self.element).trigger('properties.options:changed', [self.options()]);
            self.addValue('');


            //set selected
            if (!self.multiple()) {
                self.selectedItem(valueSet);
                self.value(self.getOptionValue(valueSet));
                $(self.element).trigger('properties.' + 'value' + ':changed', [self.value()]);
            } else if (self.multiple()) {
                var selectedOPts = self.selectedOptions();
                selectedOPts.push(self.getOptionValue(valueSet));
                self.selectedOptions(selectedOPts);
                $(self.element).trigger('properties.selectedOptions:changed', [self.selectedOptions()]);
                //self.value(selectedOPts.join(', '));
            }
        }



    };

    function handleAddValueUpdate(self, ev) {

        switch (ev.keyCode) {
            case 13:
                ev.target.blur();
                ev.target.focus();
                break;
            case 9:
                //Tab key
                self.toggleOptions();
                break;
            case 40:
                //down
                ev.preventDefault();
                focusNextOption(self, ev, true);
                break;

            case 38:
                //up
                ev.preventDefault();
                focusPrevOption(self, ev);
                break;

        }
        return true;
    }

    function documentClickHandler(self) {

        if (self.isClicked) {
            self.isClicked = false;
        } else {
            if (self.isOpen()) {
                $('.multi-value-outer-container').remove();
                self.isOpen(false);
            }
        }
    }


    MultiValueViewModel.prototype.afterAttached = function () {

    };

    MultiValueViewModel.prototype.afterCreated = function () {


    };


    MultiValueViewModel.prototype.beforeCreated = function () {
        var self = this;


        this.bindAttribute('optionsText', null);
        this.bindAttribute('optionsValue', null);
        this.bindAttribute('optionsCaption', null);
        this.bindAttribute('addCaption', null);
        this.bindAttribute('options', [], options_changed.bind(null, this), true);
        this.bindAttribute('value', null, value_changed.bind(null, this), true);
        this.bindAttribute('selectedOptions', [], null, true);

        //Configuration      
        this.bindAttribute('disabled', false);
        this.bindAttribute('required', false);
        this.bindAttribute('visible', true);
        this.bindAttribute('multiple', false, multiple_changed.bind(null, this));
        this.bindAttribute('autoAdd', true);
        //this.bindAttribute('size', false, size_changed.bind(null, this));
        //this.bindAttribute('max', null);

        //events
        //this.bindAttribute('selectedOptionsChange', null);
        //this.bindAttribute('valueChange', null);
        this.bindAttribute('onOptionAdd', null);


        this.resizeProxy = $.proxy(_.debounce(this.resize.bind(null, this), 100), this);
        this.scrollProxy = $.proxy(this.scrollHandler, this);


        //var innerUpdate = false;
        //this.selectedOptions.subscribe(function (selected) {
        //    if (!innerUpdate) {
        //        innerUpdate = true;
        //        if (selected && selected.length) {
        //            self.value(selected.join(', '));
        //        }
        //        innerUpdate = false;
        //    }
        //});

        //this.value.subscribe(function (value) {
        //    if (!innerUpdate) {
        //        innerUpdate = true;
        //        if (value) {
        //            self.selectedOptions(value.split(', '));
        //        }
        //        innerUpdate = false;
        //    }
        //});

        //this.selectedValueText = ko.computed(selectedValueText.bind(null, this));

        $(this.element).on('properties.options:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.value:changed', value_changed.bind(null, this));
        $(this.element).on('properties.multiple:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.size:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.selectedOptions:changed', selectedOptions_changed.bind(null, this));

    };



    MultiValueViewModel.prototype.selectValue = function (self, item, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (self.disabled()) {
            return false;
        }


        if (!self.multiple()) {
            var valueToSend;
            self.selectedItem(item);
            if (_.isEqual(item, self.value())) {
                selectedValueText(self);
            }
            else if (item) {
                var value = self.getOptionValue(item);
                valueToSend = value;
                self.textFocus(true);
                self.isOpen(false);
                detachEventHandlers(self);
                if (self.value) {
                    self.value(value);
                }
                $(self.element).trigger('properties.' + 'value' + ':changed', [valueToSend]);
                $(self.element).trigger('selected', [self.value ? self.value() : self.value]);

                return true;
            }
            else {
                self.value('');
                var textToDisplay = self.optionsCaption() ? self.optionsCaption() : '';
                //self.text(textToDisplay);
                valueToSend = '';
                $(self.element).trigger('properties.' + 'value' + ':changed', [valueToSend]);
            }
            self.textFocus(true);
            self.isOpen(false);
            detachEventHandlers(self);

            $(self.element).trigger('selected', [self.value()]);
        }
        else if (self.multiple()) {

            if (!item) {
                return true;
            }
            var selOpts = self.selectedOptions(),
            values = selOpts || [],
            itemOptionVal = self.getOptionValue(item);


            if ($.inArray(itemOptionVal, self.selectedOptions()) === -1) {
                //self._selectedOptions.push(item);
                values.push(itemOptionVal);

            } else {
                //self._selectedOptions = $.grep(self._selectedOptions, function (valItem) {
                //    return self.getOptionValue(valItem) !== itemOptionVal;
                //});

                values = $.grep(values, function (val) {
                    return val !== itemOptionVal;
                });

            }
            //self.updated_selectedOptions = true;
            self.selectedOptions(values);
            $(self.element).trigger('properties.' + 'selectedOptions' + ':changed', [values]);
            self.textFocus(true);
        }
        return true;
    };

    MultiValueViewModel.prototype.toggleOptions = function (data, event) {
        var self = this;

        if (event) {
            event.stopPropagation();
        }

        if (self.disabled() || (self.options() && !self.options().length)) {
            self.textFocus(true);
            detachEventHandlers(self);
            self.isOpen(false);
            return false;
        }

        self.isClicked = true;
        $(document).trigger("mousedown", [self.element]);



        if (!self.isOpen()) {
            showOptions(self);
            attachEventHandlers(self);

        } else {
            detachEventHandlers(self);
            $(self.element).trigger('selected', [self.multiple() ? self.selectedOptions() : self.value()]);
        }

        if (!self.isOpen()) {
            $(self.optionsContainerDiv).css('visibility', 'hidden');
        }
        if (!self.textFocus()) {
            self.textFocus(true);
        }
        self.isOpen(!self.isOpen());
        return true;
    };

    function hideOptions(self) {
        ko.cleanNode(self.optionsRegion.activeContainer);
        $('.multi-value-outer-container').remove();
        $(window).off('resize', self.resizeProxy);
        $(self.element).parents().off('scroll', self.scrollProxy);
    }


    function selectedValueText(self) {

        if (!self.options) {
            return;
        }

        var selectedItem = null; //self.selectedItem();
        var options = self.options();
        var optionValue = null;
        var _selectedItem = null;

        if (!self.multiple()) {
            if (self.value() && options) {



                for (var i = 0; i < options.length; i++) {

                    _selectedItem = getSelectedItem(self, options[i], self.value());
                    if (_selectedItem) {
                        selectedItem = _selectedItem;
                        break;
                    }
                }

                return self.getOptionText(selectedItem);

            }
        } else if (options && self.selectedOptions() && self.selectedOptions().length) {

            var selectedOpts = self.selectedOptions();

            var multiValText = '';
            for (var j = 0; j < selectedOpts.length; j++) {
                var selectedVal = selectedOpts[j];

                for (var k = 0; k < options.length; k++) {


                    _selectedItem = getSelectedItem(self, options[k], selectedVal);
                    if (_selectedItem) {
                        selectedItem = _selectedItem;
                        break;
                    }

                }


                var delimeter = multiValText ? ', ' : '';
                multiValText += delimeter + self.getOptionText(selectedItem);
            }


            return multiValText;
        }


        //else if (!self.value() && self.options().length) {
        //    self.value(self.options()[0][self.optionsValue()]);
        //    self.selectedItem(self.options()[0]);
        //}

        return self.optionsCaption() ? self.optionsCaption() : '';

    }

    function getSelectedItem(self, item, val) {
        var optionValue = self.getOptionValue(item), selectedItem = null;

        if (self.optionsValue()) {
            if (optionValue.valueOf() === val.valueOf()) {
                selectedItem = item;
            }
        } else {
            if (item.valueOf() === val.valueOf()) {
                selectedItem = item;
            } else if (typeof val === 'object' && _.isEqual(val, item)) {
                selectedItem = item;
            }
        }

        return selectedItem;
    }


    MultiValueViewModel.prototype.getValue = function (v) {
        var _v = v;
        if (typeof v === 'function') {
            _v = v();
        }
        return _v;
    };

    MultiValueViewModel.prototype.getReturnValue = function (property, item) {
        if (typeof property === 'function') {
            return property.call(item, item);
        } else {
            return item ? item[property] : item;
        }
    };

    MultiValueViewModel.prototype.getOptionText = function (item) {
        var self = this;

        return self.optionsText() ? self.getValue(self.getReturnValue(self.optionsText(), item)) : item;
    };

    MultiValueViewModel.prototype.getOptionValue = function (item) {
        var self = this;

        return self.optionsValue() ? self.getValue(self.getReturnValue(self.optionsValue(), item)) : item;
    };


    MultiValueViewModel.prototype.isActive = function (item) {
        var self = this;
        if (self.multiple()) {
            return $.inArray(self.getOptionValue(item), self.selectedOptions()) !== -1;
        }

        if (self.getOptionValue(item) === null || self.value() === null) {
            return self.getOptionValue(item) === self.value();
        }

        if (typeof self.value() === 'object' && !self.optionsValue()) {
            return _.isEqual(item, self.value());
        }

        return self.getOptionValue(item).valueOf() === self.value().valueOf();

    };

    MultiValueViewModel.prototype.resize = function (self) {
        if (!self.isMobile) {
            self.isOpen(false);
            hideOptions(self);
        }

    };

    MultiValueViewModel.prototype.scrollHandler = function () {

        this.isOpen(false);
        hideOptions(this);

    };

    function options_changed() {
        //console.log(arguments);
    }

    function multiple_changed(args) {
        //console.log(args);
    }

    function size_changed(args) {
        //console.log(args);
    }

    function value_changed(self, value) {
        //console.log(value);
        //self.valueChanged(value);
        //self._value(value);
        //$(mod  el.element).val(value);
        $(self.element).trigger('valueChange', [value]);
    }


    function selectedOptions_changed(self, e, value) {
        //console.log(value);
        //self.selectedOptionsChanged(value);
        //$(mod  el.element).val(value);
    }

    function OptionModel(option) {
        this.option = option;
        this.isSelected = ko.observable(false);
    }

    function showOptions(self) {


        var optionsContainerDiv,
           ctrlOffset, ctrlWidth, ctrlHeight = 30,
           optionsWidth, optionsHeight, optionsTop, optionsLeft;

        // create and append an outer div for optins, with the class 'select-outer-container'
        optionsContainerDiv = document.createElement('div');
        self.optionsContainerDiv = optionsContainerDiv;
        $(optionsContainerDiv).addClass('multi-value-outer-container');
        document.body.appendChild(optionsContainerDiv);

        // add the dom element to the options region
        self.optionsRegion.setElement(optionsContainerDiv);
        self.optionsRegion.attach(optionsView);
        ko.applyBindings(self, self.optionsRegion.activeContainer);


        ctrlOffset = $(self.container).find('.mi-multi-value-selector').offset();
        ctrlWidth = $(self.container).find('.mi-multi-value-selector').width();

        self.topOffset = ctrlOffset.top;
        self.leftOffset = ctrlOffset.left;

        $(optionsContainerDiv).css({
            'position': 'absolute',
            'top': self.topOffset + 40,
            'left': self.leftOffset,
            'min-width': ctrlWidth,
            'z-index': 100000,
        });

        setTimeout(function () {

            optionsWidth = $(optionsContainerDiv).width();
            optionsHeight = $(optionsContainerDiv).height();
            //Extra 50px offset because of status bar hiding the dropdown
            if (ctrlOffset.top + optionsHeight + 50 >= $(window).height()) {

                // move options to the top of the Ctrl
                optionsTop = ctrlOffset.top - optionsHeight - 20;

                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(optionsContainerDiv).find('.mi-multi-value-options-container').addClass('top-left');
                }
                else {
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(optionsContainerDiv).find('.mi-multi-value-options-container').addClass('top-right');
                }

            } else {

                optionsTop = self.topOffset + ctrlHeight + 10;

                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(optionsContainerDiv).find('.mi-multi-value-options-container').addClass('bottom-left');
                    //$(optionsContainerDiv).find('.mi-select-options-container').addClass('bottom-right');
                }
                else {
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(optionsContainerDiv).find('.mi-multi-value-options-container').addClass('bottom-right');
                }
            }


            $(optionsContainerDiv).css({ 'left': optionsLeft, 'top': optionsTop });
        }, 1);
    }

    /***********************************************************************************************
                                        Handle keyboard instructions
    ************************************************************************************************/

    MultiValueViewModel.prototype.showOptions = function MultiValueViewModel_showOptions(ev) {
        var self = this;
        if (!this.isOpen() && ev.keyCode !== 13 && !self.disabled()) {
            $(self.optionsContainerDiv).css('visibility', 'hidden');
            self.isClicked = true;
            $(document).trigger("mousedown", [self.element]);
            this.isOpen(true);
            showOptions(this);
            //if (ev.keyCode === 9) {
            attachEventHandlers(self);
            //}
        }
    };

    MultiValueViewModel.prototype.handleKeyUpOnTextInput = function MultiValueViewModel_handleKeyUpOnTextInput(data, e) {
        e.stopPropagation();
        if (!this.isOpen()) {
            this.keyPressed(false);
        }

        if (e.type === 'keyup') {
            this.keyPressed(true);
        }
        this.showOptions(e);
        return true;
    };

    MultiValueViewModel.prototype.handleKeyDownOnTextInput = function MultiValueViewModel_handleKeyUpOnTextInput(data, e) {
        var self = this;
        e.stopPropagation();
        $(self.element).trigger('textChange', [e]);
        if (e.keyCode === 9) {
            self.isOpen(false);
            //$('.select-outer-container').remove();
            detachEventHandlers(self);
            selectedValueText(self);
            $(self.element).trigger('selected', [self.multiple() ? self.selectedOptions() : self.value()]);
        } else if (e.keyCode === 8 && (self.multiple() || self.disabled())) {
            return false;
        } else {
            handleKeys.bind(null, self)(e);
        }
        return true;
    };

    function attachEventHandlers(self) {
        //$(window).on('resize', self.resizeProxy);
        $(self.element).parents().on('scroll', self.scrollProxy);
    }

    function detachEventHandlers(self) {
        $(self.optionsContainerDiv).css('visibility', 'hidden');
        $(self.element).parents().off('scroll', self.scrollProxy);
        //$(window).off('resize', self.resizeProxy);
        removeFocusOnOptions(self);
    }

    function hasMatchingOption(self, options, matchText) {
        if (matchText !== self.currentText) {
            self.currentText = matchText;
            self.currentMatchedOptions = _.find(options, isMatched.bind(self, self, matchText));
        }

        return self.currentMatchedOptions;
    }

    function isMatched(self, matchText, option) {
        var optionText = self.getOptionText(option);
        return optionText && optionText.toString() === matchText.toString();
    }

    function handleKeys(self, e) {

        switch (e.keyCode) {
            case 40:
                //down
                e.preventDefault();
                focusNextOption(self, e);
                break;
                //case 39:
                //    //right
                //    e.preventDefault();
                //    focusNextOption(self,e);
                //    break;

            case 38:
                //up
                e.preventDefault();
                focusPrevOption(self, e);
                break;
                //case 37:
                //    //left
                //    e.preventDefault();
                //    focusPrevOption(self,e);
                //    break;
            case 13:
                e.preventDefault();
                selectOption(self, e);
                break;
            default: return;
        }
    }

    function selectOption(self, e) {
        var optionsContainerDiv = self.optionsContainerDiv,
         focusedElement = $(optionsContainerDiv).find('.mi-multi-value-option.focus');

        if (focusedElement.length && ko.contextFor($(focusedElement[0]).get(0))) {
            //var item = self.options()[$(focusedElement[0]).data('index')];

            var item = ko.contextFor($(focusedElement[0]).get(0)).$data;
            if ($(focusedElement[0]).hasClass("mi-multi-value-caption")) {
                item = null;
            } else if (isAddInputOption(self, focusedElement)) {
                focusOnAddInput(self, focusedElement);
                return;
            }
            self.selectValue(self, item, e);
            if (!self.multiple()) {
                self.isOpen(false);
                detachEventHandlers(self);
                $(self.element).trigger('selected', [self.value()]);
                //self.textFocus(false);
                self.textFocus(true);
            }

        }
    }

    function removeFocusOnOptions(self) {
        var optionsContainerDiv = self.optionsContainerDiv;
        $(optionsContainerDiv).find('mi-multi-value-option').removeClass('focus');
    }

    function isAddInputOption(self, focusedElement) {
        return $(focusedElement[0]).hasClass("mi-multi-value-input");
    }

    function focusOnAddInput(self, focusedElement) {
        $(focusedElement[0]).find('input').focus();
    }

    function handleAddInputFocus(self, element) {
        if (isAddInputOption(self, element)) {
            focusOnAddInput(self, element);
            return true;
        }
        self.textFocus(true);
    }

    function focusOnFirstOption(self) {
        setTimeout(_focusOnFirstOption.bind(null, self), 10);
    }

    function _focusOnFirstOption(self) {
        if (!self.options || (self.multiple && self.multiple())) {
            return false;
        }
        var options = self.options(),
         inputText = self.selectedValueText(),
         matchTest = false,
         optionsContainerDiv = self.optionsContainerDiv;

        if (options && options.length) {

            matchTest = hasMatchingOption(self, options, inputText);
        }

        if (!matchTest && inputText && inputText !== self.optionsCaption()) {
            removeFocusOnOptions(self);
            var elementToBeFocusedIndex = self.optionsCaption() ? 1 : 0;
            $($(optionsContainerDiv).find('.mi-multi-value-option')[elementToBeFocusedIndex]).addClass('focus');
            scrollOptionElementIntoView(self);
        } else if (matchTest && inputText && inputText !== self.optionsCaption()) {
            removeFocusOnOptions(self);

            $($(optionsContainerDiv).find('.mi-multi-value-option')).filter(function () {
                return $(this).text() === inputText;
            }).addClass('focus');
            //$($(optionsContainerDiv).find('.mi-select-option:contains(' + replaceSpecialChars(inputText) + ')')).addClass('focus');
            scrollOptionElementIntoView(self);
        }

        if (!inputText && self.value()) {
            removeFocusOnOptions(self);
            if (self.value()) {
                scrollOptionElementIntoView(self, 'active');
            }
        }

    }


    function focusNextOption(self, ev, fromInput) {
        var optionsContainerDiv = self.optionsContainerDiv,
         focusedElement = $(optionsContainerDiv).find('.mi-multi-value-option.focus'),
         activeElement = $(optionsContainerDiv).find('.mi-multi-value-option.active'),
         elementToBeFocused;

        $(optionsContainerDiv).find('.mi-multi-value-option').removeClass('focus');

        if (focusedElement.length && $(focusedElement).nextAll('.mi-multi-value-option:first').length) {
            elementToBeFocused = $(focusedElement).nextAll('.mi-multi-value-option:first');
        } else if (focusedElement.length && !$(focusedElement).nextAll('.mi-multi-value-option:first').length) {
            elementToBeFocused = $($(optionsContainerDiv).find('.mi-multi-value-option')[0]);
        } else if (activeElement.length) {
            elementToBeFocused = $(activeElement).nextAll('.mi-multi-value-option:first');
        } else {
            elementToBeFocused = $($(optionsContainerDiv).find('.mi-multi-value-option')[fromInput ? 1 : 0]);
        }
        elementToBeFocused.addClass('focus');
        handleAddInputFocus(self, elementToBeFocused);
        var options = self.options(),
            inputText = self.selectedValueText(),
            matchTest;

        if (options && options.length) {

            matchTest = hasMatchingOption(self, options, inputText);

            if (matchTest || (self.optionsCaption() && self.optionsCaption() === inputText)) {
                //self.text(elementToBeFocused.text());
            }
        }

        scrollOptionElementIntoView(self);

    }



    function focusPrevOption(self) {
        var optionsContainerDiv = self.optionsContainerDiv,
         focusedElement = $(optionsContainerDiv).find('.mi-multi-value-option.focus'),
         activeElement = $(optionsContainerDiv).find('.mi-multi-value-option.active'),
         elementToBeFocused;

        $(optionsContainerDiv).find('.mi-multi-value-option').removeClass('focus');

        if (focusedElement.length && $(focusedElement).prevAll('.mi-multi-value-option:first').length) {
            elementToBeFocused = $(focusedElement).prevAll('.mi-multi-value-option:first');
        } else if (focusedElement.length && !$(focusedElement).prevAll('.mi-multi-value-option:first').length) {
            elementToBeFocused = $(optionsContainerDiv).find('.mi-multi-value-option').last();
        } else if (activeElement.length) {
            elementToBeFocused = $(activeElement).prevAll('.mi-multi-value-option:first');
        } else {
            elementToBeFocused = $($(optionsContainerDiv).find('.mi-multi-value-option')[0]);
        }
        elementToBeFocused.addClass('focus');
        handleAddInputFocus(self, elementToBeFocused);
        //self.text(elementToBeFocused.text());

        var options = self.options(),
            inputText = self.selectedValueText(),
            matchTest;
        if (options && options.length) {

            matchTest = hasMatchingOption(self, options, inputText);

            if (matchTest || (self.optionsCaption() && self.optionsCaption() === inputText)) {
                //self.text(elementToBeFocused.text());
            }
        }


        scrollOptionElementIntoView(self);
    }

    function scrollOptionElementIntoView(self, state) {
        var optionsContainerDiv = self.optionsContainerDiv,
         elementState = state || 'focus',
         elem = $(optionsContainerDiv).find('.mi-multi-value-option.' + elementState);
        if (elem && elem[0]) {

            //elem[0].scrollIntoView();
            elem[0].parentNode.scrollTop = elem[0].offsetTop;

        }
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/<([a-z]+)([^>]*[^\/])?>(?![\s\S]*<\/\1)/gi, function (m) {
            return $('<div/>').text(m).html();
        });
    }

    Element.register('mi-multi-value', MultiValueViewModel);
    return MultiValueViewModel;
});