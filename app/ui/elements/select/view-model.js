define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./template.html'),
        optionsView = require('text!./options-template.html'),
        ko = require('knockout'),
        Region = require('spa/region'),
        Element = require('./element'),
        Device = Object.resolve(require('system/hardware/device'));

    require('system/lang/string');
    require('system/lang/object');

    function DropdownViewModel(element) {
        base.call(this, view, false, false);
        var self = this;
        this.element = element;

        this.isOpen = null;
        this.selectedItem = null;
        this.text = null;
        this.showAllOptions = null;
        this.textFocus = null;
        this.keyPressed = null;


        this.optionsValue = null;
        this.optionsText = null;
        this.optionsGroup = null;
        this.multiple = null;
        this.optionsCaption = null;
        this.options = null;
        this.value = null;
        this.required = null;
        this.disabled = null;
        this.editable = null;
        this.selectedOptions = null;

        this.isRequired = null;
        this.currentText = null;
        this.currentMatchedOptions = null;
        this._selectedOptions = [];
        this.updated_selectedOptions = false;
        this.propertiesUpdateDone = true;

        this.selectedValueText = null;
        this.filteredOptions = null;
        this.isMobile = Device.isMobile();


        this.optionsRegion = new Region('', 'blah');
        self.optionsContainerDiv = null;
        this.isClicked = false;
        this.documentHandlerFn = documentClickHandler.bind(null, self);
        this.isRequiredSubscriber = null;
        this.filteredOptionsSubscriber = null;


    }

    var base = Object.inherit(Element.ViewModel, DropdownViewModel);



    function filterOptions(self) {
        if (!self.options) {
            return [];
        }
        var options = [].concat(self.options()),
         inputText = self.text(),
         filteredOptions = [],
         optionGroup = self.optionsGroup(),
         matchedOptions = options,
         matchTest = [],
         captionTest,
         optionsCaption = self.optionsCaption(),
         regexp, _matchOpts;

        if (options && options.length) {

            matchTest = hasMatchingOption(self, matchedOptions, inputText);

            captionTest = optionsCaption !== inputText;

            if ((!self.showAllOptions()) &&
                !(typeof self.options()[0] === 'object' &&
                !self.optionsText()) &&
                self.text() &&
                typeof self.text() !== 'object' &&
                captionTest && self.keyPressed()) {

                inputText = replaceSpecialChars(inputText);
                regexp = new RegExp(inputText.trim(), 'i');
                _matchOpts = ko.utils.arrayFilter(options, function (option) {
                    var optionText = self.getOptionText(option);
                    //return optionText.startsWith(inputText);
                    return regexp.test(optionText);
                });

                if (!matchTest || (matchTest && _matchOpts.length > 1)) {

                    //if (typeof _matchOpts[0] === 'object') {
                    //    _matchOpts = _.sortBy(_matchOpts, self.optionsText());
                    //} else {
                    //    _matchOpts = _matchOpts.sort();
                    //}
                    matchedOptions = _matchOpts.length ? _matchOpts : options;
                }
            }


            if (typeof matchedOptions[0] === 'object' && optionGroup) {
                //filteredOptions = {'undefined':[]};
                //for (var i = 0; i < matchedOptions.length; i++) {
                //    var groupName = matchedOptions[i][optionGroup];
                //    if (filteredOptions[groupName]) {
                //        filteredOptions[groupName].push(matchedOptions[i]);
                //    } else {
                //        filteredOptions[groupName] = [matchedOptions[i]];
                //    }
                //}

                var optionsGroups = _.groupBy(matchedOptions, optionGroup),
                    nullGroup = { 'undefined': [] };

                filteredOptions = optionsGroups ? optionsGroups : nullGroup;


            } else {

                filteredOptions = matchedOptions;

            }
        }


        return filteredOptions;
    }

    function replaceSpecialChars(inputText) {
        //To replace single backslash with Double backslash
        //inputText = inputText.replace(/\\/g, "\\\\");
        //To replace + sign with \+ for supporting localization
        //inputText = inputText.replace(/\+/g, "\\+");

        inputText = inputText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        return inputText;
    }

    DropdownViewModel.prototype.beforeAttached = function () {
        var self = this;

        this.init();

        $(document).off('mousedown', this.documentHandlerFn)
                   .on('mousedown', this.documentHandlerFn);

        this.bindAttribute('multiple', false, multiple_changed.bind(null, this), true);
        this.bindAttribute('editable', true, null, true);

        this.bindAttribute('value', null, value_changed.bind(null, this), true);
        this.bindAttribute('selectedOptions', [], selectedOptions_changed.bind(null, this), true);

        this.bindAttribute('optionsCaption', null, null, true);
        this.bindAttribute('optionsText', null, null, true);
        this.bindAttribute('optionsValue', null, null, true);
        this.bindAttribute('optionsGroup', null, null, true);

        this.bindAttribute('disabled', false, disabled_changed.bind(null, self), true);
        this.bindAttribute('required', false, null, true);

        this.bindAttribute('options', [], options_changed.bind(null, self), true);

        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.resize, this);


        //$(this.element).on('properties.options:changed', function (e, value) { }.bind(this));
        //$(this.element).on('properties.value:changed', value_changed.bind(null, this));
        //$(this.element).on('properties.multiple:changed', function (e, value) { }.bind(this));
        //$(this.element).on('properties.size:changed', function (e, value) { }.bind(this));
        //$(this.element).on('properties.selectedOptions:changed', selectedOptions_changed.bind(null, this));

    };


    DropdownViewModel.prototype.init = function DropdownViewModel_init() {
        var self = this;
        this.isOpen = ko.observable(false);
        this.keyPressed = ko.observable();
        this.selectedItem = ko.observable();
        this.text = ko.observable();
        this.showAllOptions = ko.observable(false);
        this.textFocus = ko.observable();


        this.optionsValue = ko.observable();
        this.optionsText = ko.observable();
        this.optionsGroup = ko.observable();
        this.multiple = ko.observable(false);
        this.optionsCaption = ko.observable('');
        this.options = ko.observableArray([]);
        this.value = ko.observable();
        this.required = ko.observable(false);
        this.disabled = ko.observable(false);
        this.editable = ko.observable(true);
        this.selectedOptions = ko.observableArray([]);

        this.propertiesUpdateDone = ko.observable(true);

        this.isRequired = ko.computed(computeIsRequired.bind(self, self));
        this.isRequiredSubscriber = this.isRequired.subscribe(required_changed.bind(self, self));

        this.selectedValueText = ko.computed(selectedValueText.bind(null, this));
        this.filteredOptions = ko.computed(filterOptions.bind(null, this));

        this.filteredOptionsSubscriber = this.filteredOptions.subscribe(handleFilterOptionsChange.bind(self, self));
    };


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

    function computeIsRequired(self) {
        return self.required() && !self.hasValue();
    }
    function handleFilterOptionsChange(self, filteredOpts) {
        self.setOptionContainerPosition.bind(null, self)(filteredOpts);
        focusOnFirstOption.bind(null, self)(filteredOpts);
    }


    function disabled_changed(self, state) {
        if (state) {
            $(self.element).addClass('mi-select-disabled');
        } else {
            $(self.element).removeClass('mi-select-disabled');
        }
    }

    function required_changed(self, state) {
        if (self.isRequired()) {
            $(self.element).addClass('mi-select-required');
        } else {
            $(self.element).removeClass('mi-select-required');
        }
    }

    DropdownViewModel.prototype.afterAttached = function () {
        var self = this;

        //createOptionsRegion(self);
    };

    DropdownViewModel.prototype.afterDetached = function () {
        this.isOpen(false);
        $(this.optionsContainerDiv).remove();

        this.isOpen = null;
        this.selectedItem = null;
        this.text = null;
        this.showAllOptions = null;
        this.textFocus = null;


        this.optionsValue = null;
        this.optionsText = null;
        this.optionsGroup = null;
        this.multiple = null;
        this.optionsCaption = null;
        this.options = null;
        this.value = null;
        this.required = null;
        this.disabled = null;
        this.editable = null;
        this.selectedOptions = null;

        this.isRequired = null;
        this.keyPressed = null;

        this.selectedValueText = null;
        this.filteredOptions = null;

        $(document).off('mousedown', this.documentHandlerFn);

        if (this.isRequiredSubscriber) {
            this.isRequiredSubscriber.dispose();
        }
        if (this.filteredOptionsSubscriber) {
            this.filteredOptionsSubscriber.dispose();
        }
    };


    DropdownViewModel.prototype.selectValue = function (self, item, event) {

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
                //$('.select-outer-container').remove();
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
                self.text(textToDisplay);
                valueToSend = '';
                $(self.element).trigger('properties.' + 'value' + ':changed', [valueToSend]);
            }
            //required_changed(self, self.required());
            self.textFocus(true);
            self.isOpen(false);
            //$('.select-outer-container').remove();
            detachEventHandlers(self);

            $(self.element).trigger('selected', [self.value()]);
            //$(self.element).find(".mi-selected-value-text").focus();//.select();
            //hideOptionContainer(self);
        }
        else if (self.multiple()) {

            if (!item) {
                return true;
            }
            var selOpts = self.selectedOptions(),
            values = selOpts || [],
            itemOptionVal = self.getOptionValue(item);


            if ($.inArray(itemOptionVal, self.selectedOptions()) === -1) {
                self._selectedOptions.push(item);
                values.push(itemOptionVal);

            } else {
                self._selectedOptions = $.grep(self._selectedOptions, function (valItem) {
                    return self.getOptionValue(valItem) !== itemOptionVal;
                });

                values = $.grep(values, function (val) {
                    return val !== itemOptionVal;
                });

            }
            self.updated_selectedOptions = true;
            self.selectedOptions(values);
            $(self.element).trigger('properties.' + 'selectedOptions' + ':changed', [values]);
            self.textFocus(true);
        }
        return true;
    };

    DropdownViewModel.prototype.toggleSelectAll = function (data, event) {
        var self = this;
        if (self.disabled()) {
            return true;
        }
        if (self.selectedOptions().length || self.selectedOptions().length === self.options().length) {
            self._selectedOptions = [];
            self.updated_selectedOptions = true;
            self.selectedOptions([]);
            $(self.element).trigger('properties.' + 'selectedOptions' + ':changed', [[]]);
        } else if (!self.selectedOptions().length) {
            var values = pluckProperty(self.options(), self.getOptionValue.bind(self));
            self._selectedOptions = self.options();
            self.updated_selectedOptions = true;
            self.selectedOptions(values);
            $(self.element).trigger('properties.' + 'selectedOptions' + ':changed', [values]);

        }
        return true;
    };

    function pluckProperty(options, callback) {
        var values = [], i;
        for (i = 0; i < options.length; i++) {
            values.push(callback(options[i]));
        }
        return values;
    }

    DropdownViewModel.prototype.toggleOptions = function (data, event) {

        event.stopPropagation();

        var self = this;
        if (self.disabled() || (self.options() && !self.options().length)) {
            return false;
        }

        self.isClicked = true;
        $(document).trigger("mousedown", [self.element]);
        this.showAllOptions(true);

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

    DropdownViewModel.prototype.showOptions = function (ev) {
        var self = this;
        this.showAllOptions(self.multiple());
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
    DropdownViewModel.prototype.handleMouseDown = function handleKeyUpOnTextInput(data, e) {
        e.stopPropagation();
        return true;

    };

    DropdownViewModel.prototype.handleKeyUpOnTextInput = function handleKeyUpOnTextInput(data, e) {
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

    DropdownViewModel.prototype.handleKeyDownOnTextInput = function handleKeyUpOnTextInput(data, e) {
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
            this.showAllOptions(self.multiple());
            handleKeys.bind(null, self)(e);
        }
        return true;
    };


    DropdownViewModel.prototype.getValue = function (v) {
        return typeof v === 'function' ? v() : v;
    };

    DropdownViewModel.prototype.getReturnValue = function (property, item) {
        if (typeof property === 'function') {
            return item ? property.call(item, item) : item;
        }
        return item ? item[property] : item;
    };

    DropdownViewModel.prototype.getOptionText = function (item) {
        var self = this;
        if (item) {

            return self.optionsText() ? self.getValue(self.getReturnValue(self.optionsText(), item)) : item;
        }

        return item;
    };

    DropdownViewModel.prototype.getOptionValue = function (item) {
        var self = this;
        if (item) {
            return self.optionsValue() ? self.getValue(self.getReturnValue(self.optionsValue(), item)) : item;
        }

        return item;
    };

    DropdownViewModel.prototype.hasValue = function () {
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

    DropdownViewModel.prototype.isActive = function (item) {
        var self = this;
        if (self.multiple()) {
            return $.inArray(self.getOptionValue(item), self.selectedOptions()) !== -1;
        } else {
            if (typeof self.value() === 'object' && !self.optionsValue()) {
                return _.isEqual(item, self.value());
            } else {
                return self.getOptionValue(item) === self.value();
            }
        }


    };

    DropdownViewModel.prototype.resize = function () {
        this.isOpen(false);
        hideOptionContainer(this);
    };

    DropdownViewModel.prototype.wrapOptionText = function (item) {
        var self = this,
         optionsText = self.getOptionText(item),
         inputText = self.text(),
         inpuTextRegex,
         wrappedText = optionsText,
         options = self.options(),
         matchTest;

        matchTest = hasMatchingOption(self, options, inputText);

        if (optionsText && inputText && inputText.trim() && !matchTest) {

            inputText = replaceSpecialChars(inputText);

            inpuTextRegex = new RegExp(inputText, 'gi');

            if (optionsText && typeof optionsText === 'string') {
                optionsText = escapeHtml(optionsText);
            }
            wrappedText = optionsText.replace(inpuTextRegex, function (xt) {
                return '<b>' + xt + '</b>';
            });

            wrappedText = wrappedText.replace(/ /g, '&nbsp;');
        }
        if (wrappedText && typeof wrappedText === 'string') {
            wrappedText = escapeHtml(wrappedText);
        }
        return wrappedText;
    };


    function hideOptionContainer(self) {
        //ko.cleanNode(self.optionsRegion.activeContainer);
        //$('.select-outer-container').remove();

        detachEventHandlers(self);
    }



    function documentClickHandler(self, ev) {
        if (self.isClicked) {
            self.isClicked = false;
        } else {
            if (self.isOpen && self.isOpen()) {
                //$('.select-outer-container').remove();
                self.isOpen(false);
                detachEventHandlers(self);
                $(self.element).trigger('selected', [self.multiple() ? self.selectedOptions() : self.value()]);
            }
            selectedValueText(self);
        }
    }




    function selectedValueText(self) {

        if (!self.options) {
            return;
        }
        var selectedItem = null,
         options = self.options(),
         optionValue = null,
         _selectedItem = null,
         textToDisplay = '';

        //For selecting first value as default value if no value and optionCaptio for single selct
        if (!self.multiple() && (self.optionsCaption() === null || self.optionsCaption() === '') && !self.value() && self.options() && options.length && self.propertiesUpdateDone()) {
            var value = self.getOptionValue(options[0]);
            self.value(value);
            $(self.element).trigger('properties.' + 'value' + ':changed', [value]);
            //required_changed(self, self.required());
        }

        if (!self.multiple()) {
            if ((self.value() !== null || self.value() !== '') && self.options() && options.length) {

                for (var i = 0; i < options.length; i++) {

                    _selectedItem = getSelectedItem(self, options[i], self.value());
                    if (_selectedItem) {
                        selectedItem = _selectedItem;
                        break;
                    }
                }

                if (selectedItem) {
                    textToDisplay = self.getOptionText(selectedItem);
                    self.text(textToDisplay);
                    return textToDisplay;
                }
            }
        } else if (self.options() && options.length && self.selectedOptions() && self.selectedOptions().length) {

            var selectedOpts = self.selectedOptions(),
            multiValText = '', j;

            //for (j = 0; j < selectedOpts.length; j++) {
            //    var selectedVal = selectedOpts[j];
            //    if (selectedVal === null) {
            //        continue;
            //    }

            //    for (var k = 0; k < options.length; k++) {


            //        _selectedItem = getSelectedItem(self, options[k], selectedVal);
            //        if (_selectedItem) {
            //            selectedItem = _selectedItem;
            //            break;
            //        }

            //    }


            //    var delimeter = multiValText ? ', ' : '';
            //    multiValText += delimeter + self.getOptionText(selectedItem);
            //}

            multiValText = pluckProperty(self._selectedOptions, self.getOptionText.bind(self)).join(' | ');
            textToDisplay = multiValText;
            self.text(textToDisplay);
            return textToDisplay;
        }



        textToDisplay = self.optionsCaption() || '';
        self.text(textToDisplay);
        return textToDisplay;

    }

    function getOptions(self, options, selectedOpts) {
        var opts = [], _selectedItem;
        for (var j = 0; j < selectedOpts.length; j++) {
            var selectedVal = selectedOpts[j];
            if (selectedVal === null) {
                continue;
            }

            for (var k = 0; k < options.length; k++) {

                _selectedItem = getSelectedItem(self, options[k], selectedVal);
                if (_selectedItem) {
                    opts.push(_selectedItem);
                    break;
                }

            }

        }
        return opts;
    }

    function getSelectedItem(self, item, val) {
        var optionValue = self.getOptionValue(item), selectedItem = null;

        if (typeof val === 'undefined' || val === null || typeof optionValue === 'undefined' || optionValue === null) {
            return selectedItem;
        }

        if (self.optionsValue()) {
            if (optionValue.toString() === val.toString()) {
                selectedItem = item;
            }
        } else {
            if (item === val) {
                selectedItem = item;
            } //else if (typeof val === 'object' && JSON.stringify(val, circularReferenceCheck.bind(null, cache)) === JSON.stringify(item, circularReferenceCheck.bind(null, cache2))) {
            else if (typeof val === 'object' && _.isEqual(val, item)) {
                selectedItem = item;
            }
        }

        return selectedItem;
    }



    function options_changed(self, options) {

        //clearing the values if
        if (!options.length) {
            if (self.value) {
                //self.value('');
            }

            if (self.selectedOptions) {
                self.selectedOptions([]);
            }
        }

        if (self.multiple() && self.selectedOptions) {
            if (!self.updated_selectedOptions) {
                self._selectedOptions = getOptions(self, options, self.selectedOptions());
                selectedValueText(self);
            }
            self.updated_selectedOptions = false;
        }
    }

    function multiple_changed(args) {
    }



    function value_changed(self, value) {
        //required_changed(self, self.required());
        if (value !== null) {
            $(self.element).trigger('valueChange', [value]);
        }

    }


    function selectedOptions_changed(self, value) {
        if (self.multiple()) {
            var options = self.options();
            if (!self.updated_selectedOptions) {
                self._selectedOptions = getOptions(self, options, value);
            }
            self.updated_selectedOptions = false;
            $(self.element).trigger('valueChange', [value]);
        }
    }


    function showOptions(self) {
        if (self.optionsCaption() === self.text()) {
            self.text('');
        }
        createOptionsRegion(self);
        self.setOptionContainerPosition(self);

        setTimeout(function (self) {
            var matchTest = hasMatchingOption(self, self.options(), self.text());
            if (self.text() && self.optionsCaption() !== self.text() && matchTest && !self.isMobile) {
                $(self.element).find(".mi-selected-value-text").select();
            }
        }.bind(self, self), 100);
    }

    function createOptionsRegion(self) {
        var outerContainer, optionsContainerDiv;

        // create and append an outer div for optins, with the class 'select-outer-container'
        if (!$('body').find('.select-outer-container').length) {
            outerContainer = document.createElement('div');
            $(outerContainer).addClass('select-outer-container');
            document.body.appendChild(outerContainer);
        } else {
            outerContainer = $('body').find('.select-outer-container');
        }

        if (!self.optionsContainerDiv) {
            optionsContainerDiv = document.createElement('div');
            self.optionsContainerDiv = optionsContainerDiv;
            $(optionsContainerDiv).css('visibility', 'hidden');
            $(outerContainer).append(optionsContainerDiv);

            // add the dom element to the options region
            self.optionsRegion.setElement(optionsContainerDiv);
            self.optionsRegion.attach(optionsView);
            ko.applyBindings(self, self.optionsRegion.activeContainer);
        }
    }


    DropdownViewModel.prototype.setOptionContainerPosition = function (self) {
        var ctrlOffset, ctrlWidth, ctrlHeight = $(self.element).outerHeight(),
            optionsWidth, optionsHeight, optionsTop, optionsLeft,
            optionsContainerDiv = self.optionsContainerDiv;

        ctrlOffset = $(self.container).find('.mi-dropdown-selector').offset();
        ctrlWidth = $(self.container).find('.mi-dropdown-selector').width();

        if (!ctrlOffset) {
            return;
        }
        self.topOffset = ctrlOffset ? ctrlOffset.top : 0;
        self.leftOffset = ctrlOffset ? ctrlOffset.left : 0;

        $(optionsContainerDiv).css({
            'position': 'absolute',
            //'top': self.topOffset + 40,
            //'left': self.leftOffset,
            'min-width': ctrlWidth,
            'z-index': 100000,
        });

        setTimeout(_setOptionContainerPosition.bind(null, self, optionsContainerDiv, ctrlOffset, ctrlWidth, ctrlHeight), 1);
    };

    function _setOptionContainerPosition(self, optionsContainerDiv, ctrlOffset, ctrlWidth, ctrlHeight) {

        var optionsWidth = $(optionsContainerDiv).outerWidth(),
        optionsHeight = $(optionsContainerDiv).outerHeight(), optionsTop, optionsLeft,
        miSelectOptionsContainer = $(optionsContainerDiv).find('.mi-select-options-container');

        miSelectOptionsContainer.removeClass('top-left top-right bottom-left bottom-right');

        //Extra 50px offset because of status bar hiding the dropdown
        if (ctrlOffset.top + optionsHeight + 50 >= $(window).height()) {
            // move options to the top of the Ctrl
            optionsTop = ctrlOffset.top - optionsHeight - 20;

            if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                optionsLeft = ctrlOffset.left;
                miSelectOptionsContainer.addClass('top-left');
            }
            else {
                optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                miSelectOptionsContainer.addClass('top-right');
            }

        } else {

            optionsTop = self.topOffset + ctrlHeight + 10;

            if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                optionsLeft = ctrlOffset.left;
                miSelectOptionsContainer.addClass('bottom-left');
                //$(optionsContainerDiv).find('.mi-select-options-container').addClass('bottom-right');
            }
            else {
                optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth)) + 7;
                miSelectOptionsContainer.addClass('bottom-right');
            }
        }


        $(optionsContainerDiv).css({ 'left': optionsLeft, 'top': optionsTop, 'visibility': 'visible' });

        if (!$(optionsContainerDiv).find('.mi-select-option').hasClass('focus') && self.multiple && !self.multiple()) {
            scrollOptionElementIntoView(self, 'active');
        }

    }

    function setOptionsContainerFocus(self) {
        //$(self.optionsContainerDiv).attr('tabindex', "-1").focus();

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
         focusedElement = $(optionsContainerDiv).find('.mi-select-option.focus');

        if (focusedElement.length && ko.contextFor($(focusedElement[0]).get(0))) {
            //var item = self.options()[$(focusedElement[0]).data('index')];

            var item = ko.contextFor($(focusedElement[0]).get(0)).$data;
            if ($(focusedElement[0]).hasClass("mi-select-caption")) {
                item = null;
            }
            self.selectValue(self, item, e);
            if (!self.multiple()) {
                self.isOpen(false);
                hideOptionContainer(self);
                $(self.element).trigger('selected', [self.value()]);
                //self.textFocus(false);
                self.textFocus(true);
            }

        }
    }

    function removeFocusOnOptions(self) {
        var optionsContainerDiv = self.optionsContainerDiv;
        $(optionsContainerDiv).find('.mi-select-option').removeClass('focus');
    }

    function focusOnFirstOption(self) {
        setTimeout(_focusOnFirstOption.bind(null, self), 10);
    }

    function _focusOnFirstOption(self) {
        if (!self.options || (self.multiple && self.multiple())) {
            return false;
        }
        var options = self.options(),
         inputText = self.text(),
         matchTest = false,
         optionsContainerDiv = self.optionsContainerDiv;

        if (options && options.length) {

            matchTest = hasMatchingOption(self, options, inputText);
        }

        if (!matchTest && inputText && inputText !== self.optionsCaption()) {
            removeFocusOnOptions(self);
            var elementToBeFocused = self.optionsCaption() ? 1 : 0;
            $($(optionsContainerDiv).find('.mi-select-option')[elementToBeFocused]).addClass('focus');
            scrollOptionElementIntoView(self);
        } else if (matchTest && inputText && inputText !== self.optionsCaption()) {
            removeFocusOnOptions(self);

            $($(optionsContainerDiv).find('.mi-select-option')).filter(function () {
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


    function focusNextOption(self) {
        var optionsContainerDiv = self.optionsContainerDiv,
         focusedElement = $(optionsContainerDiv).find('.mi-select-option.focus'),
         activeElement = $(optionsContainerDiv).find('.mi-select-option.active'),
         elementToBeFocused;

        $(optionsContainerDiv).find('.mi-select-option').removeClass('focus');

        if (focusedElement.length && $(focusedElement).nextAll('.mi-select-option:first').length) {
            elementToBeFocused = $(focusedElement).nextAll('.mi-select-option:first');
        } else if (focusedElement.length && !$(focusedElement).nextAll('.mi-select-option:first').length) {
            elementToBeFocused = $($(optionsContainerDiv).find('.mi-select-option')[0]);
        } else if (activeElement.length) {
            elementToBeFocused = $(activeElement).nextAll('.mi-select-option:first');
        } else {
            elementToBeFocused = $($(optionsContainerDiv).find('.mi-select-option')[0]);
        }
        elementToBeFocused.addClass('focus');
        var options = self.options(),
            inputText = self.text(),
            matchTest;

        if (options && options.length) {

            matchTest = hasMatchingOption(self, options, inputText);

            if (matchTest || (self.optionsCaption() && self.optionsCaption() === inputText)) {
                self.text(elementToBeFocused.text());
            }
        }

        scrollOptionElementIntoView(self);

    }



    function focusPrevOption(self) {
        var optionsContainerDiv = self.optionsContainerDiv,
         focusedElement = $(optionsContainerDiv).find('.mi-select-option.focus'),
         activeElement = $(optionsContainerDiv).find('.mi-select-option.active'),
         elementToBeFocused;

        $(optionsContainerDiv).find('.mi-select-option').removeClass('focus');

        if (focusedElement.length && $(focusedElement).prevAll('.mi-select-option:first').length) {
            elementToBeFocused = $(focusedElement).prevAll('.mi-select-option:first');
        } else if (focusedElement.length && !$(focusedElement).prevAll('.mi-select-option:first').length) {
            elementToBeFocused = $(optionsContainerDiv).find('.mi-select-option').last();
        } else if (activeElement.length) {
            elementToBeFocused = $(activeElement).prevAll('.mi-select-option:first');
        } else {
            elementToBeFocused = $($(optionsContainerDiv).find('.mi-select-option')[0]);
        }
        elementToBeFocused.addClass('focus');
        //self.text(elementToBeFocused.text());

        var options = self.options(), inputText = self.text(), matchTest;
        if (options && options.length) {

            matchTest = hasMatchingOption(self, options, inputText);

            if (matchTest || (self.optionsCaption() && self.optionsCaption() === inputText)) {
                self.text(elementToBeFocused.text());
            }
        }


        scrollOptionElementIntoView(self);
    }

    function scrollOptionElementIntoView(self, state) {
        var optionsContainerDiv = self.optionsContainerDiv,
         elementState = state || 'focus',
         elem = $(optionsContainerDiv).find('.mi-select-option.' + elementState);
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

    Element.register('mi-select', DropdownViewModel);
    return DropdownViewModel;
});
