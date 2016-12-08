define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./template.html'),
        optionsView = require('text!./options-template.html'),
        ko = require('knockout'),
        Region = require('spa/region');

    require('system/lang/string');
    require('system/lang/object');

    function ComboboxViewModel() {
        base.call(this, view, false, true);
        var self = this;

        this.isOpen = ko.observable(false);
        this.selectedItem = ko.observable();
        this.optionsRegion = new Region();
        this.text = ko.observable();
        this.isClicked = false;
        
        $(document).bind('click', documentClickHandler.bind(null, self));
    }

    var base = Object.inherit(Element.ViewModel, ComboboxViewModel);

    ComboboxViewModel.prototype.beforeAttached = function () {
        var self = this;
        this.bindProperty('optionsText', null);
        this.bindProperty('optionsValue', null);

        this.bindProperty('placeholder', null);
        this.bindArrayProperty('options', [], options_changed.bind(null, this), true);
        this.bindProperty('value', null);

        this.bindProperty('disabled', false);
        this.bindProperty('required', false);
        this.bindProperty('visible', true);

        this.bindProperty('outerBorder', null);
        this.bindProperty('textEditable', true);

        this.bindAttribute('valueChanged', null);
        this.bindAttribute('selectedOptionsChanged', null);

        this.showAllOptions = ko.observable(false);
        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.resize, this);

        this.filteredOptions = ko.computed(filteredOptions_read.bind(null, this));

        this.selectedValueText = ko.computed(selectedValueText.bind(null, this));

        this.valueSetter = ko.computed(function () {
            var inputText = self.text(), valueToSet = '';

            if (self.options && self.options()) {
                for (var i = 0; i < self.options().length; i++) {
                    if (self.getOptionText(self.options()[i]) === inputText) {
                        valueToSet = self.getOptionValue(self.options()[i]);
                        break;
                    }
                }
            }

            self.value(!valueToSet ? self.text() : valueToSet);
            //self.isOpen(true);
        });

        $(this.element).on('properties.options:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.value:changed', value_changed.bind(null, this));
    };

    ComboboxViewModel.prototype.afterAttached = function () {
        var self = this;
        this.kom.subscribe(self.outerBorder, outerBorder_change.bind(null, this));
        this.kom.subscribe(self.disabled, disabled_change.bind(null, this));
        this.kom.subscribe(self.textEditable, textEditable_change.bind(null, this));
        this.kom.subscribe(self.placeholder, placeholder_change.bind(null, this));
    };

    function outerBorder_change(self) {
        if (self.outerBorder()) {
            $(self.container).find('.mi-combobox-container').css('border', self.outerBorder());
        }
    }

    function textEditable_change(self) {
        if (self.textEditable) {
            $($(self.container).find('input')[0]).prop('readonly', !self.textEditable());
        }
    }

    function disabled_change(self) {
        if (self.disabled) {
            if (self.disabled() === true) {
                self.textEditable(false);
            }
        }
    }

    function placeholder_change(self) {
        if (self.placeholder) {
            if (self.placeholder()) {
                $($(self.container).find('input')[0]).attr("placeholder", self.placeholder());
            }
        }
    }

    ComboboxViewModel.prototype.afterDetached = function () {
        this.optionsValue = ko.observable();
        this.optionsText = ko.observable();
        this.placeholder = ko.observable();
        this.options = ko.observableArray();
        this.value = ko.observable();
        this.visible = ko.observable();        
    };
    
    ComboboxViewModel.prototype.selectValue = function (self, item, event) {
        if (self.disabled()) {
            return false;
        }

        self.selectedItem(item);

        if (item) {
            self.value(self.getOptionValue(item));
            self.text(self.getOptionText(item));
            self.valueChanged(item);
        }
        else {
            self.value('');
            self.valueChanged(item);
        }
        self.isOpen(false);        
    };

    ComboboxViewModel.prototype.toggleOptions = function (data, event) {
        event.stopPropagation();

        var self = this;

        if (self.disabled() || !self.options().length) {
            return false;
        }

        self.isClicked = true;
        self.showAllOptions(true);
        $(document).trigger("click");

        if (!self.isOpen()) {
            showOptions(self);
            $(window).on('resize', this.resizeProxy);
            $(self.element).parents().on('scroll', this.scrollProxy);
            self.isOpen(true);
        } else {
            //hideOptionContainer(self);
        }
        //self.isOpen(!self.isOpen());
    };
    
    
    
    ComboboxViewModel.prototype.getValue = function (v) {
        var _v = v;
        if (typeof v === 'function') {
            _v = v();
        }
        return _v;
    };

    ComboboxViewModel.prototype.getReturnValue = function (property, item) {
        if (typeof property === 'function') {
            return item ? property.call(item, item) : item;
        } else {
            return item ? item[property] : item;
        }
    };

    ComboboxViewModel.prototype.getOptionText = function (item) {
        var self = this;
        return self.optionsText() ? self.getValue(self.getReturnValue(self.optionsText(), item)) : item;
    };

    ComboboxViewModel.prototype.getOptionValue = function (item) {
        var self = this;
        return self.optionsValue() ? self.getValue(self.getReturnValue(self.optionsValue(), item)) : item;
    };

    // Is used to add or remove css to highlight an option on hover
    ComboboxViewModel.prototype.isActive = function (item) {
        var self = this;
        //return self.getOptionValue(item) === self.value();
        var isActive = self.getOptionText(item) === self.text();

        return isActive;
    };

    ComboboxViewModel.prototype.resize = function () {
        this.isOpen(false);
        hideOptionContainer(this);
    };


    function options_changed(args) {
        //console.log(args);
    }


    function value_changed(self, e, value) {
        if (value) {
            //self.valueChanged(value);
        } else {
            //self.valueChanged(self.text());
        }
    }


    function filteredOptions_read(self) {

        var filteredOptions;

        if (!self.options || !self.options() || self.options().length === 0) {
            return [];
        }

        if (typeof self.options()[0] === 'object' && !self.optionsText()) {
            return self.options();
        }

        if (self.showAllOptions()) {
            return self.options();
        }

        if (self.isClicked || !self.text()) {
            return self.options();
        }

        if (!self.textEditable()) {
            return self.options();
        }

        filteredOptions = ko.utils.arrayFilter(self.options(), function (option) {
            return self.getOptionText(option).startsWith(self.text());
        });

        if (filteredOptions.length !== self.options().length) {
            if ($('.combobox-options-outer-container')) {
                if (filteredOptions.length === 0) {
                    hideOptionContainer(self);
                }
            }

            if (filteredOptions.length !== 0) {
                showOptions(self);
            }
        }

        return filteredOptions;
    }


    function showOptions(self) {

        if (self.filteredOptions().length === 0) {
            return;
        }

        var optionsContainerDiv,
            ctrlOffset, ctrlWidth, ctrlHeight = 30,
            optionsWidth, optionsHeight, optionsTop, optionsLeft;
        
        // create and append an outer div for optins, with the class 'combobox-options-outer-container'
        optionsContainerDiv = document.createElement('div');
        self.optionsContainerDiv = optionsContainerDiv;
        $(optionsContainerDiv).addClass('combobox-options-outer-container');
        document.body.appendChild(optionsContainerDiv);

        // add the dom element to the options region
        //ko.cleanNode($(optionsContainerDiv));
        //ko.cleanNode($(optionsView));
        self.optionsRegion.setElement(optionsContainerDiv);
        self.optionsRegion.attach(optionsView);

        ko.cleanNode(self.optionsRegion.activeContainer);
        ko.applyBindings(self, self.optionsRegion.activeContainer);


        ctrlOffset = $(self.container).find('.mi-combobox-container').offset();
        ctrlWidth = $(self.container).find('.mi-combobox-container').width();

        self.topOffset = ctrlOffset.top;
        self.leftOffset = ctrlOffset.left;

        $(optionsContainerDiv).css({
            'position': 'absolute', // this will absolutely positioned inside a relative div
            'top': self.topOffset + 40, // 40 is the height of the control (input box)
            'left': self.leftOffset, // same as that of the control
            'min-width': ctrlWidth, //
            'z-index': 100000, // this is not required
        });

        // the options region has a div which has z-index: 1 (what will take care of positioning the options div on top of everything else..)

        setTimeout(function () {

            optionsWidth = $(optionsContainerDiv).width();
            optionsHeight = $(optionsContainerDiv).height();

            if (ctrlOffset.top + optionsHeight >= $(window).height() - 50) {

                // move options to the the top of the Ctrl
                // We assumed that the options div has a min width of that of the ctrl.
                optionsTop = ctrlOffset.top - optionsHeight;
                
                // align the options div to the left-edge of the Ctrl
                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(optionsContainerDiv).find('.mi-combobox-options-container').addClass('top-left');
                }
                else {

                    // align the options div to the right-edge of the Ctrl
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(optionsContainerDiv).find('.mi-combobox-options-container').addClass('top-right');
                }

            } else {

                // move options to below the Ctrl.
                optionsTop = self.topOffset + ctrlHeight + 5;

                // align the options div to the left-edge of the Ctrl
                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(optionsContainerDiv).find('.mi-combobox-options-container').addClass('bottom-left');
                }
                else {

                // align the options div to the right-edge of the Ctrl
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(optionsContainerDiv).find('.mi-combobox-options-container').addClass('bottom-right');
                }
            }
            
            // set the left and top of the div (which is absolutely positioned inside of a relatively positioned div
            $(optionsContainerDiv).css({ 'left': optionsLeft, 'top': optionsTop });

            // to scroll the selected item into view..
            if ($('.mi-combobox-option.active')) {
                if ($('.mi-combobox-option.active')[0]) {
                    $($('.mi-combobox-options-container')[0]).scrollTop($($('.mi-combobox-option.active')[0]).offset().top -
                                                                        $($('.mi-combobox-options-container')[0]).offset().top);
                }
            }

        }, 1);

    }
    

    function hideOptionContainer(self) {
        ko.cleanNode($(self.optionsRegion.activeContainer));
        $('.combobox-options-outer-container').remove();
        $(window).off('resize', self.resizeProxy);
        $('body').find('.content').off('scroll', self.scrollProxy);
    }


    function selectedValueText(self) {

        //if (!self.options) {
        //    return;
        //}
        var selectedItem = null;
        var options = self.options();
        var optionValue = null;
        var _selectedItem = null;

        if (self.value() && options) {
            for (var i = 0; i < options.length; i++) {

                _selectedItem = getSelectedItem(self, options[i], self.value());
                if (_selectedItem) {
                    selectedItem = _selectedItem;
                    break;
                }
            }
            if (selectedItem) {
                var returnVal = self.getOptionText(selectedItem);
                self.text(returnVal);
                return returnVal;
            } else {
                self.text(self.value());
                return self.value();
            }
        }


        var placeholder = self.placeholder() ? self.placeholder() : '';
        self.text(placeholder);
        return placeholder;
    }


    function getSelectedItem(self, item, val) {
        var optionValue = self.getOptionValue(item), selectedItem = null;

        if (self.optionsValue()) {
            if (optionValue === val) {
                selectedItem = item;
            }
        } else {
            if (item === val) {
                selectedItem = item;
            }
        }

        return selectedItem;
    }


    function documentClickHandler(self) {
        if (self.isClicked) {
            self.isClicked = false;
        } else {
            if (self.isOpen()) {
                $('.combobox-options-outer-container').remove();
                self.isOpen(false);
            }
        }
    }


    Element.register('mi-combobox', ComboboxViewModel);


    return ComboboxViewModel;
});