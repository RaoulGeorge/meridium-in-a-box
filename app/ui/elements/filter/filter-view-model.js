define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        view = require('text!./filter-template.html'),
        genericView = require('text!./generic-filter-view.html'),
        FilterGroup = require('./filter-group'),
        Region = require('spa/region'),
        Translator = require('system/globalization/translator');

    require('ui/elements/select/view-model');
    require('ui/elements/checkbox/checkbox-view-model');


    function FilterViewModel() {
        base.call(this, view, false);
        this.translator = Object.resolve(Translator);
        this.visible = ko.observable(false);
        this.filterOptions = ko.observableArray();
        this.sortOptions = ko.observableArray();
        this.values = [];
        this.type = ko.observable();
        this.hasSelection = ko.computed(hasSelection_computed.bind(null, this));
        this.isRightOriented = null;
        this.x = null;
        this.y = null;
        this.topOffset = 0;
        this.leftOffset = 0;
        this.genericFilterRegion = new Region(null, null);
        this.isClicked = false;
        $(document).bind('click', documentClickHandler.bind(null, this));        
    }

    var base = Object.inherit(Element.ViewModel, FilterViewModel);

    FilterViewModel.prototype.beforeCreated = function () {
        this.bindProperty('type', null);
        this.bindProperty('sortvalue', null);
        this.bindProperty('sortcaption', null);
        this.bindArrayProperty('filteroptions', null);
        this.bindArrayProperty('sortoptions', null);
        this.bindAttribute('value', null);
        this.bindAttribute('sortvalue', null);
        this.bindAttribute('sortcaption', this.translator.translate("SORT_BY"));
        this.bindProperty('orientation', 'left');

        $(this.element).on('properties.sortoptions:changed',
             sortOptions_changed.bind(null, this));

        $(this.element).on('properties.filteroptions:changed',
            filterOptions_changed.bind(null, this));

        $(this.element).on('properties.type:changed',
           type_changed.bind(null, this));

        $(this.element).on('properties.orientation:changed',
             orientation_changed.bind(null, this));

        this.isRightOriented = ko.computed(isRightOriented_computed.bind(null, this));
        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.resize, this);
        this.ignoreValueChange = false;


    };

    function documentClickHandler(self) {
        if (self.isClicked) {
            self.isClicked = false;
        } else {
            if (self.visible()) {
                $('.filter-outer-container').remove();
                self.visible(false);
            }
        }
    }

    FilterViewModel.prototype.toggleFilter = function () {
        event.stopPropagation();

        this.isClicked = true;
        $(document).trigger("click");

        if (!this.visible()) {
            showFilter(this);
            $(window).on('resize', this.resizeProxy);
            $('body').find('.content').on('scroll', this.scrollProxy);


        } else {
            ko.cleanNode(this.genericFilterRegion.activeContainer);
            this.contentContainer.remove();
            $(window).off('resize', this.resizeProxy);
            $('body').find('.content').off('scroll', this.scrollProxy);

        }

        this.visible(!this.visible());

    };

    FilterViewModel.prototype.removeFilter = function (data) {
        data.isSelected(false);
    };

    FilterViewModel.prototype.resize = function () {
        calculateOffset(this);
        positionContainer(this);
    };

    function calculateOffset(self) {
        var offset;

        offset = $(self.element).find('.icon-container').offset();

        // jQuery's offset function returns undefined if it can't find the element
        if (offset) {
            self.topOffset = offset.top;
            self.leftOffset = offset.left;
        }
    }

    function positionContainer(self) {
        if (self.contentContainer) {
            var alignClass = '';
            if (window.innerWidth < self.leftOffset + 250) {
                self.leftOffset = self.leftOffset - 215 + 'px';
                alignClass = 'align-left';

            }
            self.contentContainer.css({
                'position': 'absolute',
                'top': self.topOffset + 42 + 'px',
                'left': self.leftOffset
            });
            self.contentContainer.find('.filters').addClass(alignClass);
        }
    }

    FilterViewModel.prototype.clearSelection = function (self) {
        var i, j,
           filteroption,
           option;
        
        self.ignoreValueChange = true;
        //to clear filter options
        for (i = 0; i < self.filterOptions().length; i++) {
            filteroption = self.filterOptions()[i];
            for (j = 0; j < filteroption.options().length; j++) {
                option = filteroption.options()[j];
                if (option.isSelected() === true) { option.isSelected(false); }
            }
        }

        self.values = [];
        self.value('');
        self.ignoreValueChange = false;
    };

    FilterViewModel.prototype.afterDetached = function () {

    };

    function filterOptions_changed(self, e, filterOptions) {
        var i, j, option;

        if (self.filterOptions().length === 0) {
            for (i = 0; i < filterOptions.length; i++) {
                self.filterOptions.push(new FilterGroup(filterOptions[i]));
                self.filterOptions()[i].valueChanged.add(_valueChanged.bind(null, self));
                for (j = 0; j < filterOptions[i].options.length; j++) {
                    option = filterOptions[i].options[j].option;
                    if (option.isSelected) {
                        self.values.push(option.value);
                    }
                }
            }
        }
    }

    function sortOptions_changed(self, e, sortOptions) {
        var i;
        if (sortOptions && self.sortOptions().length === 0) {
            for (i = 0; i < sortOptions.length; i++) {
                self.sortOptions.push(sortOptions[i]);
            }
        }
    }

    function type_changed(self, e, type) {
        self.type(type);
    }

    function hasSelection_computed(self) {
        var i, j,
            filteroption,
            option;

        for (i = 0; i < self.filterOptions().length; i++) {
            filteroption = self.filterOptions()[i];
            for (j = 0; j < filteroption.options().length; j++) {
                option = filteroption.options()[j];
                if (option.isSelected() === true) { return true; }
            }
        }
        return false;
    }

    function _valueChanged(self, caption, text, newValue, value) {
        var filterstring,
            indexToBeRemoved;

        if (self.ignoreValueChange) {
            return;
        }

        if (newValue === true) {
            self.values.push(value);
        } else {
            indexToBeRemoved = _.findIndex(self.values, function (val) { return val === value; });

            if (indexToBeRemoved !== -1) {
                self.values.splice(indexToBeRemoved, 1);
            }
        }
        filterstring = self.values.join();
        self.value(filterstring);
    }

    function orientation_changed(self, e, orientation) {
        self.orientation(orientation);
    }

    function isRightOriented_computed(self) {
        return (self.orientation() === 'right');
    }

    function showFilter(self) {
        var containerdiv,
            currentcontainer;

        currentcontainer = $('.content-wrapper');
        containerdiv = document.createElement('div');
        $(containerdiv).addClass('filter-outer-container');

        self.contentContainer = $(containerdiv);
        $(currentcontainer).after(containerdiv);
        self.genericFilterRegion.setElement(containerdiv);
        self.genericFilterRegion.attach($(genericView));
        ko.applyBindings(self, self.genericFilterRegion.activeContainer);
        $('.filter-outer-container').click(function (e) { e.stopPropagation(); });
        calculateOffset(self);
        positionContainer(self);
    }

    Element.register('mi-filter', FilterViewModel);

    return FilterViewModel;
});