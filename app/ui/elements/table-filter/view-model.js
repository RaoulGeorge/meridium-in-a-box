define(function (require) {
    'use strict';
    var view = require('text!./template.html'),
        ko = require('knockout'),
        Region = require('spa/region');

    function TableFilterViewModel() {
        base.call(this, view, false, true);
        var self = this;


        this.isOpen = ko.observable(false);
       
        this.optionsRegion = new Region();

        //this._values = ko.observableArray([]);
        this._filterOptions = ko.observable({});
        window.tf = this;
    }
    
    var base = Object.inherit(Element.ViewModel, TableFilterViewModel);
    TableFilterViewModel.prototype.afterAttached = function () {
       
    };
   
    TableFilterViewModel.prototype.afterDetached = function () {
        //this.filterOptions = ko.observable();
        //this.values = ko.observable();
    };


    TableFilterViewModel.prototype.toggleOptions = function (data, event) {

        var self = this;
        if (self.disabled()) {
            return false;
        }
     
        //if (!self.isOpen()) {
        //    showOptions(self);
        //} else {
        //    hideOptionContainer(self);
        //}

        self.isOpen(!self.isOpen());

    };


   

    TableFilterViewModel.prototype.beforeAttached = function () {
        var self = this;

        this.bindArrayProperty('title', null);
        this.bindAttribute('values', [], values_changed.bind(null,this,null));
        this.bindArrayProperty('filterOptions', [], filterOptions_changed.bind(null, this,null), true);
       


        this.bindProperty('disabled', false);
        this.bindProperty('required', false);
        this.bindProperty('visible', true);

        //$(this.element).on('properties.values:changed', values_changed.bind(null, this));
        //$(this.element).on('properties.filterOptions:changed', filterOptions_changed.bind(null, this));

    };

    TableFilterViewModel.prototype.getValue = function (v) {
        var _v = v;
        if (typeof v === 'function') {
            _v = v();
        }
        return _v;
    };

    TableFilterViewModel.prototype.getReturnValue = function (property, item) {
        if (typeof property === 'function') {
            return item ? property.call(item, item) : item;
        } else {
            return item ? item[property] : item;
        }
    };


   
   function values_changed(self,e,value) {
       //console.log(value);


   }

   function filterOptions_changed(self,e, value) {
       //console.log(value);
      
       var _value = [];
       for (var i = 0; value && i < value.length; i++) {
           
           _value.push(new filterModel(value[i], handleValuesChanges.bind(null,self)));
          
       }

       self._filterOptions(_value);
   }

   function handleValuesChanges(self, value) {
       var options = self._filterOptions(), values = [];
       for (var i = 0; i < options.length; i++) {
           values.push(options[i].selected());
       }
       //self.values(values);
       //$(self.element).trigger('properties.values:changed', [values]);
   }



   function filterModel(filter, handleChange) {
       /*jshint validthis: true */
       var self = this;
       self.caption = filter.caption;
       self.options = ko.observableArray(filter.options);
       self.selected = filter.selected || ko.observable(filter.caption || filter.options[0] ? filter.options[0]['value'] : '');
       self.selected.subscribe(handleChange);
   }

    Element.register('mi-table-filter', TableFilterViewModel);
    return TableFilterViewModel;
});