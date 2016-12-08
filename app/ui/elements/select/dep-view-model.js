define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./template.html'),
        optionsView = require('text!./options-template.html'),
        ko = require('knockout'),
        Region = require('spa/region');
    var Element = require('./element');

    function DropdownViewModel() {
        base.call(this, view, false, true);
        var self = this;


        this.isOpen = ko.observable(false);
        this.selectedItem = ko.observable();

        //overriding transition
        this.optionsRegion = new Region('', 'blah');
        self.optionsContainerDiv = null;

        window.drop = this;

        this.isClicked = false;

        $(document).bind('click', documentClickHandler.bind(null, self));
    }
    
    var base = Object.inherit(Element.ViewModel, DropdownViewModel);



    DropdownViewModel.prototype.beforeCreated = function () {
        var self = this;

        this.bindArrayProperty('options', [], options_changed.bind(null, self), true);
        this.bindProperty('value', '', null, true);

        this.bindProperty('optionsText', null, null, true);
        this.bindProperty('optionsValue', null, null, true);

        this.bindProperty('optionsCaption', '', null, true);

        this.bindProperty('selectedOptions', [], null, true);

       
        this.bindProperty('disabled', false, null, true);
        this.bindProperty('required', false, null, true);
        this.bindProperty('visible', true, null, true);
        this.bindProperty('multiple', false, multiple_changed.bind(null, this), true);
        this.bindProperty('size', false, size_changed.bind(null, this), true);
        this.bindProperty('max', null, null, true);

        //this.bindAttribute('valueChanged', null);
        //this.bindAttribute('selectedOptionsChanged', null);

        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.resize, this);


        this.selectedValueText = ko.computed(selectedValueText.bind(null, this));


        //var innerUpdate = false;
        //this.selectedOptions.subscribe(function (selected) {
        //    if (!innerUpdate) {
        //        innerUpdate = true;
        //        if (selected && selected.length && self.value) {
        //            self.value(selected.join(', '));
        //        } else if (self.value) {
        //            self.value('');
        //        }
        //        innerUpdate = false;
        //    }
        //});

        //this.value.subscribe(function (value) {
        //    if (!innerUpdate) {
        //        innerUpdate = true;

        //        if (value && self.selectedOptions) {
        //            self.selectedOptions(value.split(', '));
        //        } else if (self.selectedOptions) {
        //            self.selectedOptions([]);
        //        }
        //        innerUpdate = false;
        //    }
        //});


        $(this.element).on('properties.options:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.value:changed', value_changed.bind(null, this));
        $(this.element).on('properties.multiple:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.size:changed', function (e, value) { }.bind(this));
        $(this.element).on('properties.selectedOptions:changed', selectedOptions_changed.bind(null, this));

    };

    DropdownViewModel.prototype.afterAttached = function () {

    };


   
    DropdownViewModel.prototype.afterDetached = function () {
        this.optionsValue = ko.observable();
        this.optionsText = ko.observable();
        this.multiple = ko.observable();
        this.optionsCaption = ko.observable();
        this.options = ko.observableArray();
        this.value = ko.observable();
        this.visible = ko.observable();
    };


    DropdownViewModel.prototype.selectValue = function (self,item, event) {

        if (self.disabled()) {
            return false;
        }

        if (!self.multiple()) {
            self.selectedItem(item);

            if (item) {
                var value = self.getOptionValue(item);
                self.value(value);
                $(self.element).trigger('properties.' + 'value' + ':changed', [value]);
            }
            else {
                self.value('');
                $(self.element).trigger('properties.' + 'value' + ':changed', ['']);
            }
            self.isOpen(false);
        }
        else if (self.multiple()) {

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            if (!item) {
                return;
            }

            var values = self.selectedOptions();

            if ($.inArray(self.getOptionValue(item), self.selectedOptions()) === -1) {

                values.push(self.getOptionValue(item));
               
           
            } else {

                values = $.grep(values, function (val) {
                    return val !== self.getOptionValue(item);
                });
                
            }

            self.selectedOptions(values);
            $(self.element).trigger('properties.' + 'selectedOptions' + ':changed', [values]);
            //self.value(values.join(', '));
        }
    };

    DropdownViewModel.prototype.toggleOptions = function (data, event) {

        event.stopPropagation();
        // event.preventDefault();

        var self = this;
        if (self.disabled() || (self.options() && !self.options().length)) {
            return false;
        }
        self.isClicked = true;
        $(document).trigger("click");

        // if (!self.multiple()) {
        if (!self.isOpen()) {
            showOptions(self);
            $(window).on('resize', this.resizeProxy);
            //$('body').find('.content').on('scroll', this.scrollProxy);
            $(self.element).parents().on('scroll', this.scrollProxy);
        } else {
            hideOptionContainer(self);
        }
        self.isOpen(!self.isOpen());
        //}

    };


    DropdownViewModel.prototype.getValue = function (v) {
        var _v = v;
        if (typeof v === 'function') {
            _v = v();
        }
        return _v;
    };

    DropdownViewModel.prototype.getReturnValue = function (property, item) {
        if (typeof property === 'function') {
            return item ? property.call(item, item) : item;
        } else {
            return item ? item[property] : item;
        }
    };

    DropdownViewModel.prototype.getOptionText = function (item) {
        var self = this;
        if (item) {

            return self.optionsText() ? self.getValue(self.getReturnValue(self.optionsText(), item)) : item;
        }
    };

    DropdownViewModel.prototype.getOptionValue = function (item) {
        var self = this;
        if (item) {
            return self.optionsValue() ? self.getValue(self.getReturnValue(self.optionsValue(), item)) : item;
        }
    };


    DropdownViewModel.prototype.isActive = function (item) {
        var self = this;
        if (self.multiple()) {
            return $.inArray(self.getOptionValue(item), self.selectedOptions()) !== -1;
        } else {
            return self.getOptionValue(item) === self.value();
        }


    };

    DropdownViewModel.prototype.resize = function () {

        this.isOpen(false);
        hideOptionContainer(this);
    };


    function hideOptionContainer(self) {
        ko.cleanNode(self.optionsRegion.activeContainer);
        $('.select-outer-container').remove();
        $(window).off('resize', self.resizeProxy);
        $('body').find('.content').off('scroll', self.scrollProxy);
    }

    

    function documentClickHandler(self) {
        if (self.isClicked) {
            self.isClicked = false;
        } else {
            if (self.isOpen()) {
                $('.select-outer-container').remove();
                self.isOpen(false);
            }
        }
    }
   



    function selectedValueText(self) {
       
        if (!self.options) {
            return;
        }
            var selectedItem = null; //self.selectedItem();
            var options = self.options();
            var optionValue = null;
            var _selectedItem = null;
            //if (selectedItem && self.value()) {
            //if (selectedItem) {

            if (!self.multiple()) {
                if (self.value() && options) {
                   


                    for (var i = 0; i < options.length; i++) {

                        _selectedItem = getSelectedItem(self, options[i],self.value());
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

                    for (var k = 0;  k < options.length; k++) {


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

            return self.optionsCaption()?self.optionsCaption():'';
        
    }

    function getSelectedItem(self,item,val) {
        var optionValue = self.getOptionValue(item),selectedItem = null;

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



    function options_changed(self, options) {
        //console.log('options changed',options.length);

        //clearing the values if 
        if (!options.length) {
            if (self.value) {
                self.value('');
            }

            if (self.selectedOptions) {
                self.selectedOptions([]);
            }
        }
    }

   function multiple_changed(args) {
       //console.log(args);
    }

   function size_changed(args) {
       //console.log(args);
   }

   function value_changed(self,e, value) {
       //console.log(value);
       //self.valueChanged(value);
   }


   function selectedOptions_changed(self,e, value) {
       //console.log(value);
       //self.selectedOptionsChanged(value);
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
       $(optionsContainerDiv).addClass('select-outer-container');
       document.body.appendChild(optionsContainerDiv);

       // add the dom element to the options region
       self.optionsRegion.setElement(optionsContainerDiv);
       self.optionsRegion.attach(optionsView);
       ko.applyBindings(self, self.optionsRegion.activeContainer);


       ctrlOffset = $(self.container).find('.mi-dropdown-selector').offset();
       ctrlWidth = $(self.container).find('.mi-dropdown-selector').width();

       self.topOffset = ctrlOffset.top;
       self.leftOffset = ctrlOffset.left;

       $(optionsContainerDiv).css({
           'position': 'absolute',
           'top': self.topOffset + 40,
           'left': self.leftOffset,
           'min-width': ctrlWidth,
           'z-index': 100000,
       }).on('keydown', handleKeys.bind(null,self));



      

       setTimeout(function () {

           optionsWidth = $(optionsContainerDiv).width();
           optionsHeight = $(optionsContainerDiv).height();

           if (ctrlOffset.top + optionsHeight >= $(window).height()) {

               // move options to the top of the Ctrl
               optionsTop = ctrlOffset.top - optionsHeight - 20;

               if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                   optionsLeft = ctrlOffset.left;
                   $(optionsContainerDiv).find('.mi-select-options-container').addClass('top-left');
               }
               else {
                   optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                   $(optionsContainerDiv).find('.mi-select-options-container').addClass('top-right');
               }

           } else {

               optionsTop = self.topOffset + ctrlHeight + 10;

               if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                   optionsLeft = ctrlOffset.left;
                   $(optionsContainerDiv).find('.mi-select-options-container').addClass('bottom-left');
                   //$(optionsContainerDiv).find('.mi-select-options-container').addClass('bottom-right');
               }
               else {
                   optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                   $(optionsContainerDiv).find('.mi-select-options-container').addClass('bottom-right');
               }
           }


           $(optionsContainerDiv).css({ 'left': optionsLeft, 'top': optionsTop }).attr('tabindex', "-1").focus();


           if ($('.mi-select-option.active')) {
               if ($('.mi-select-option.active')[0]) {
                   $('.mi-select-option.active')[0].scrollIntoView();
               }
           }

       }, 1);
   }

   function handleKeys(self, e) {
       switch (e.keyCode) {
           case 40:
               focusNextOption(self);
               break;
           case 39:
               focusNextOption(self);
               break;

           case 38:
               focusPrevOption(self);
               break;
           case 37:
               focusPrevOption(self);
               break;
           case 13:
               selectOption(self,e);
               break;
           default: return;
       }
   }

   function selectOption(self, e) {
       var optionsContainerDiv = self.optionsContainerDiv;
       var focusedElement = $(optionsContainerDiv).find('.mi-select-option.focus');
       if (focusedElement.length) {
           var item = self.options()[$(focusedElement[0]).data('index')];
           self.selectValue(self, item, e);
           if (!self.multiple()) {
               hideOptionContainer(self);
           }
       }
   }


   function focusNextOption(self) {
       var optionsContainerDiv = self.optionsContainerDiv;
       var focusedElement = $(optionsContainerDiv).find('.mi-select-option.focus');
       var activeElement = $(optionsContainerDiv).find('.mi-select-option.active');
       

       $(optionsContainerDiv).find('.mi-select-option').removeClass('focus');

       if (focusedElement.length && $(focusedElement).next('.mi-select-option')) {
           $(focusedElement).next('.mi-select-option').addClass('focus');
       } else if (activeElement.length) {
           $(activeElement).next('.mi-select-option').addClass('focus');
       } else {
           $(optionsContainerDiv).find('.mi-select-option')[0].addClass('focus');
       }

       if ($('.mi-select-option.focus')) {
           if ($('.mi-select-option.focus')[0]) {
               $('.mi-select-option.focus')[0].scrollIntoView();
           }
       }
   }

   function focusPrevOption(self) {
       var optionsContainerDiv = self.optionsContainerDiv;
       var focusedElement = $(optionsContainerDiv).find('.mi-select-option.focus');
       var activeElement = $(optionsContainerDiv).find('.mi-select-option.active');

       $(optionsContainerDiv).find('.mi-select-option').removeClass('focus');

       if (focusedElement.length && $(focusedElement).prev('.mi-select-option')) {
           $(focusedElement).prev('.mi-select-option').addClass('focus');
       } else if (activeElement.length) {
           $(activeElement).prev('.mi-select-option').addClass('focus');
       } else {
           $(optionsContainerDiv).find('.mi-select-option')[0].addClass('focus');
       }

       if ($('.mi-select-option.focus')) {
           if ($('.mi-select-option.focus')[0]) {
               $('.mi-select-option.focus')[0].scrollIntoView();
           }
       }
   }


    Element.register('mi-select', DropdownViewModel);
    return DropdownViewModel;
});