define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./template.html'),
        optionsView = require('text!./options-template.html'),
        ko = require('knockout'),
        Region = require('spa/region'),
        Element = require('../select/element'),
        Translator = require('system/globalization/translator');

    function TextExteViewModel() {
        base.call(this, view, false, true);
        var self = this;
        this.translator = Object.resolve(Translator);
        this.options = ko.observableArray([]);
        this.value = ko.observable();
        this.optionsCaption = ko.observable();
        this.optionsText = ko.observable();
        this.optionsValue = ko.observable();
        this.max = ko.observable();
        this.required = ko.observable();
        this.disabled = ko.observable();
        this.visible = ko.observable();

        this.isOpen = ko.observable(false);
        this.selectedItem = ko.observable();
        this.addValue = ko.observable();
        this.optionsRegion = new Region();

        $(document).bind('click', documentClickHandler.bind(null,self));
        this.isClicked = false;

        this.addValueUpdate = handleAddValueUpdate;

        this.addValue.subscribe(self.addOption,this);

    }

    function documentClickHandler(self) {
        if (self.isClicked) {
            self.isClicked = false;
        } else {
            if (self.isOpen()) {
                $('.text-ext-outer-container').remove();
                self.isOpen(false);
            }
        }
    }

    function handleAddValueUpdate(data, ev) {
        if (ev.keyCode === 13 || ev.keyCode === 9) {
            ev.target.blur();
            ev.target.focus();
        }
    }

    var base = Object.inherit(Element.ViewModel, TextExteViewModel);
    TextExteViewModel.prototype.afterAttached = function () {

    };

    TextExteViewModel.prototype.afterCreated = function () {
      

    };
    

    TextExteViewModel.prototype.beforeCreated = function () {
        var self = this;

        this.bindAttribute('optionsText', null);
        this.bindAttribute('optionsValue', null);
        this.bindAttribute('optionsCaption', null);
        this.bindAttribute('options', [], null, true);
        this.bindAttribute('value', null);

        //Configuration
        this.bindAttribute('max', null);
        this.bindAttribute('disabled', false);
        this.bindAttribute('required', false);
        this.bindAttribute('visible', true);
       
        //events
       
       // this.bindAttribute('valueChange', null);
       // this.bindAttribute('onOptionAdd', null);
       // this.bindAttribute('onOptionRemove', null);
       

        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.resize, this);


        this.selectedValueText = ko.computed(selectedValueText.bind(null, this));

        $(this.element).on('properties.options:changed', function (e, value) {}.bind(this));
        $(this.element).on('properties.value:changed', value_changed.bind(null, this));
        $(this.element).on('properties.size:changed', function (e, value) {}.bind(this));
        $(this.element).on('properties.selectedOptions:changed', selectedOptions_changed.bind(null, this));

    };

    TextExteViewModel.prototype.removeOption = function (option, event) {
        var self = this;
        event.stopPropagation();
        self.options.remove(option);
        $(self.element).trigger('properties.options:changed', [self.options()]);

        self.value(self.options().join(', '));

        //self.onOptionRemove(option);
    };


    TextExteViewModel.prototype.addOption = function (value) {
       
        var self = this, valueSet = value, valueAdded = false;

           
            if (value) {

                if (typeof self.options()[0] === 'object' && self.options()[0] !== null) {
                    valueSet = {};
                    valueSet[self.optionsText()] = value;
                    valueSet[self.optionsValue()] = value;
                }

                //trigger event
                //self.onOptionAdd(valueSet);

                //#attempt1
                //var options = self.options.push(valueSet);
                //self.options(self.options());
                window.txt = self;

                //#attempt2
                var opts = self.options();
                for (var i = 0; i < opts.length; i++) {
                    if (opts[i] === null) {
                        self.options()[i] = valueSet;
                        valueAdded = true;
                        break;
                    }
                }

                if (!valueAdded) {
                    self.options.push(valueSet);
                    $(self.element).trigger('properties.options:changed', [self.options()]);
                } else {
                    //self.options(self.options());
                    
                    //options_changed(self, self.options());

                    self.value(self.options().join(', '));
                }

                //self.options.unshift(valueSet);

                //notify descendants
                //$(self.element).trigger('properties.options:changed', [self.options()]);

                //clear textbox
                self.addValue('');

            }

    };


    TextExteViewModel.prototype.toggleOptions = function (data, event) {
        var self = this;
        //event.preventDefault();
        event.stopPropagation();

        if (self.disabled()) {
            return false;
        }
        self.isClicked = true;
        $(document).trigger("click");

     
        if (!self.isOpen()) {
            showOptions(self);
            $(window).on('resize', this.resizeProxy);
            $(self.element).parents().on('scroll', this.scrollProxy);
            self.isOpen(true);
        } else {
            //ko.cleanNode(self.optionsRegion.activeContainer);
            //$('.text-ext-outer-container').remove();
            //$(window).off('resize', this.resizeProxy);
            //$('body').find('.content').off('scroll', this.scrollProxy);
        }
       

    };

    function hideOptions(self) {
        ko.cleanNode(self.optionsRegion.activeContainer);
        $('.text-ext-outer-container').remove();
        $(window).off('resize', self.resizeProxy);
        $(self.element).parents().off('scroll', self.scrollProxy);
    }


    function selectedValueText(self) {
        var options = self.options(), multiValText = '';

        if (!options) {
            return;
        }
        for (var i = 0; options && i < options.length; i++) {
            var delimeter = multiValText ? ', ' : '';
            multiValText += delimeter + self.getOptionText(options[i]);
        }

        return multiValText;

    }

    TextExteViewModel.prototype.getValue = function (v) {
        var _v = v;
        if (typeof v === 'function') {
            _v = v();
        }
        return _v;
    };

    TextExteViewModel.prototype.getReturnValue = function (property, item) {
        if (typeof property === 'function') {
            return property.call(item, item);
        } else {
            return item ? item[property] : item;
        }
    };

    TextExteViewModel.prototype.getOptionText = function (item) {
        var self = this;

        return self.optionsText() ? self.getValue(self.getReturnValue(self.optionsText(), item)) : item;
    };

    TextExteViewModel.prototype.getOptionValue = function (item) {
        var self = this;

        return self.optionsValue() ? self.getValue(self.getReturnValue(self.optionsValue(), item)) : item;
    };


   

    TextExteViewModel.prototype.resize = function () {
        //var offset, width,
        //    self = this;
        //offset = $(self.container).find('.mi-multi-value-selector').offset();
        //width = $(self.container).find('.mi-multi-value-selector').width();
        //self.topOffset = offset.top;
        //self.leftOffset = offset.left;
        //$(self.containerdiv).css({
        //    'position': 'absolute',
        //    'top': self.topOffset + 40,
        //    'left': self.leftOffset,
        //    'width': width,
        //});
        this.isOpen(false);
        hideOptions(this);
    };

    function options_changed(self, options) {
        //console.log(args);
       
        for (var i = 0; options && i < options.length; i++) {
            if (options[i] !== null) {
                self.options.push(options[i]);
            }
        }

    }

    function multiple_changed(args) {
        //console.log(args);
    }

    function size_changed(args) {
        //console.log(args);
    }

    function value_changed(self, e, value) {
        //console.log(value);
        //self.valueChanged(value);
        //self._value(value);
        //$(mod  el.element).val(value);
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
        //var containerdiv,
        //    offset, width;

        //containerdiv = document.createElement('div');
        //self.containerdiv = containerdiv;
        //$(containerdiv).addClass('text-ext-outer-container');
        //document.body.appendChild(containerdiv);

       
        //self.optionsRegion.setElement(containerdiv);
        //self.optionsRegion.attach(optionsView);
        //ko.applyBindings(self, self.optionsRegion.activeContainer);

        //offset = $(self.container).find('.mi-multi-value-selector').offset();
        //width = $(self.container).find('.mi-multi-value-selector').width();
        //self.topOffset = offset.top;
        //self.leftOffset = offset.left;
        //$(containerdiv).css({
        //    'position': 'absolute',
        //    'top': self.topOffset + 40,
        //    'left': self.leftOffset,
        //    'width': width,
        //    'z-index': 100000,
        //});


        var optionsContainerDiv,
           ctrlOffset, ctrlWidth, ctrlHeight = 30,
           optionsWidth, optionsHeight, optionsTop, optionsLeft;

        // create and append an outer div for optins, with the class 'select-outer-container'
        optionsContainerDiv = document.createElement('div');
        self.optionsContainerDiv = optionsContainerDiv;
        $(optionsContainerDiv).addClass('text-ext-outer-container');
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

            if (ctrlOffset.top + optionsHeight >= $(window).height()) {

                // move options to the top of the Ctrl
                optionsTop = ctrlOffset.top - optionsHeight - 20;

                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(optionsContainerDiv).find('.mi-text-ext-options-container').addClass('top-left');
                }
                else {
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(optionsContainerDiv).find('.mi-text-ext-options-container').addClass('top-right');
                }

            } else {

                optionsTop = self.topOffset + ctrlHeight + 10;

                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(optionsContainerDiv).find('.mi-text-ext-options-container').addClass('bottom-left');
                    //$(optionsContainerDiv).find('.mi-select-options-container').addClass('bottom-right');
                }
                else {
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(optionsContainerDiv).find('.mi-text-ext-options-container').addClass('bottom-right');
                }
            }


            $(optionsContainerDiv).css({ 'left': optionsLeft, 'top': optionsTop });
        }, 1);
    }


    Element.register('mi-text-ext', TextExteViewModel);
    return TextExteViewModel;
});