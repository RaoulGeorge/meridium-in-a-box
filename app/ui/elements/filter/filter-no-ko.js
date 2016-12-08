define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var btnView = require('text!./filter-btn-no-ko-view.html'),
        bodyView = require('text!./filter-body-no-ko-view.html'),
        filterGroupView = require('text!./filter-group-no-ko-view.html'),
        FilterCollection = require('./filter-collection-no-ko'),
        converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator');

    var Conductor = require('spa/conductor'),
        Region = require('spa/region');

    require('ui/elements/select/view-model');
    require('ui/elements/checkbox/view-model');
    require('ui/elements/radio/view-model');


    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var self = this;

        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.resize, this);
        this.translator = Object.resolve(Translator);
        this.isClicked = false;
        this.element = this;
        this.$element = null;
        this.isVisible = false;
        this.loader = null;
        this.filterOptions = [];
        this.filterCollection = new FilterCollection();
        this.filterVMRegion = null;
        this.tags = [];
        this.customHTML = this.getAttribute('custom-html');
        this.customFilter = this.getAttribute('custom-filter');
        this.documentClickHandlerFn = documentClickHandler.bind(null, self);
        self.conductor = Object.resolve(Conductor);

        self._filterViewModel = null;
        Element.defineProperty(self, 'filterViewModel', {
            get: getFilterViewModel.bind(null, self),
            set: setFilterViewModel.bind(null, self)
        });


        this._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });
        this.callback = null;
        Element.defineProperty(self, 'filterCB', {
            get: function () { return self.callback; },
            set: function (val) { self.callback = val; }
        });
        this._popupWidth = null;
        Element.defineProperty(self, 'popupWidth', {
            get: function () { return self._popupWidth; },
            set: function (val) { self._popupWidth = val; }
        });

        this._showHeading = true;
        Element.defineProperty(self, 'showHeading', {
            get: function () { return self._showHeading; },
            set: function (val) { if (val !== undefined) { self._showHeading = converter.toBoolean(val, 'true'); }}
        });
        this._showTags = true;
        Element.defineProperty(self, 'showTags', {
            get: function () { return self._showTags; },
            set: function (val) { if (val !== undefined) { self._showTags = converter.toBoolean(val, 'true'); }}
        });
        this._maxHeight = null;
        Element.defineProperty(self, 'maxHeight', {
            get: function () { return self._maxHeight; },
            set: function (val) { self._maxHeight = val;}
        });

    };

    proto.attachedCallback = function () {
        this.setElement();
        this.htmlToDisplay = this.element.innerHTML;
        this.element.innerHTML = btnView;
        this.attachClickHandlers();
    };

    proto.detachedCallback = function () {
        if (this.custonFilter) {
            this.conductor.unloadScreen(this.filterViewModel);
            this.conductor.closeScreen(this.filterViewModel);
        }
        $(document).off('mousedown.mifilter', this.documentClickHandlerFn);
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var self = this;
        if (attrName === 'custom-html') {
            self.customHTML = newVal;
            removeFilterBody(self);
            if (newVal === 'true') {
                buildFilter(self);
            }
        }
        else if (attrName === 'custom-filter') {
            self.customFilter = newVal;
            removeFilterBody(self);
            if (newVal === 'true' && self.isVisible) {
                self.conductor.openScreen(self._filterViewModel);
                self.conductor.loadScreen(self._filterViewModel);

                buildFilter(self);

            }
        }
    };

    //proto.filterCB = function (callback) {
    //    this.callback = callback;
    //};

    proto.load = function () {
        var dfd;
        if (this.loader) {
            dfd = this.loader();
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    proto.setElement = function () {
        this.$element = $(this.element);
    };

    proto.attachClickHandlers = function () {
        this.$element.find('.icon-container').on('click', toggleFilter.bind(null, this));
        $(document).on('mousedown.mifilter', this.documentClickHandlerFn);
        this.find = findInDom.bind(null, this);
    };

    proto.detachClickHandlers = function () {
    };

    proto.resize = function (self) {
        if ($(self).find('.icon-container').is(':visible') && self.isVisible) {
            positionContainer(this);
        }
    };

    function getFilterViewModel(self) {
        return self._filterViewModel;
    }

    function setFilterViewModel(self, value) {
        if (value) {
            self._filterViewModel = value;
            if (self.getAttribute('custom-filter') === 'true') {
                self.conductor.openScreen(self._filterViewModel);
                self.conductor.loadScreen(self._filterViewModel);
            }
        } else {
            self._filterViewModel = null;
        }
    }

    function attachToPopover(self) {

        var region = new Region();
        self.filterVMRegion = region;

        region.setElement($('.filter-outer-container .filters-noko'));
        self.conductor.activateScreen(self.filterViewModel);
        self.conductor.attachScreen(self.filterViewModel, region);
    }

    function detachFromPopover(self) {
        self.conductor.deactivateScreen(self.filterVMRegion);
        self.conductor.detachScreen(self.filterVMRegion);
    }

    function documentClickHandler(self, e, elem) {

        if (self.isClicked) {
            self.isClicked = false;
        } else if (!$('.filter-outer-container').find(e.target).length && !$('.filter-outer-container').find(elem).length) {
            hideFilter(self);
        }
    }

    function findInDom(self, selector) {
        return $(self.htmlToDisplay).find(selector)[0];
    }

    function getLoader(self) {
        return self._loader;
    }

    function setLoader(self, value) {
        self._loader = value;
        self.isPopulated = false;
        self.filterCollection.clear();
    }

    function toggleFilter(self, e) {
        e.stopPropagation();
        if (self.isVisible) {
            hideFilter(self);
        } else {

            showFilter(self);
        }
    }

    function hideFilter(self) {
        self.isVisible = false;

        $(window).off('resize', self.resizeProxy.bind(null, self));
        $(self).parents().off('scroll', self.scrollProxy.bind(null, self));


        if (self.contentContainer) {
            $(self.contentContainer).off('click', "**");
        }
        if (self.customFilter === 'true') {
            detachFromPopover(self);
        }
        removeFilterBody(self);
    }

    function showFilter(self) {
        self.isClicked = true;
        self.isVisible = true;
        $(document).trigger('mousedown.mifilter');
        if (self.customHTML === 'true' || self.customFilter === 'true') {
            buildFilter(self);

        } else {
            self.load().done(loaderDone.bind(null, self));
        }
    }

    function loaderDone(self, data) {
        self.filterOptions = data;
        buildFilter(self);
    }

    function buildFilter(self) {
        buildFilterContainer(self);
        //self.sortSelector = $(self.$element.find('mi-select')[0]);
        //self.sortSelector.data('options', ['item 1', 'item 2']);
        //self.sortSelector.data('value', 'item 1');

        if (self.customHTML === 'true') {
            $('.filter-outer-container .filters-noko').empty().append(self.htmlToDisplay);
        }
        else if (self.customFilter === 'true') {
            attachToPopover(self);
        } else {
            if (self.filterOptions.sortOptions && self.filterOptions.sortOptions.length) {
                buildSortOptions(self);
            } else {
                $('.filter-outer-container .sort-header').hide();
            }
            buildFilterOptions(self);
        }

        calculateOffset(self);
        positionContainer(self);
        setMaxHeight(self);
    }

    function setMaxHeight(self) {
        if (self._maxHeight!==null) {
            $('.filter-outer-container .filter-body').css({ 'max-height': self._maxHeight+'px' });
        }
    }

    function buildSortOptions(self) {
        var sortContainer = $('.filter-outer-container .sort-header')[0],
            sortDropdown,
            i;

        $(sortContainer).append('<mi-select class="sort-dropdown"></mi-select>');
        sortDropdown = $(sortContainer).find('.sort-dropdown')[0];
        for (i = 0; i < self.filterOptions.sortOptions.length; i++) {
            // $(sortDropdown).append('<option value="' + self.filterOptions.sortOptions[i] + '">' + self.filterOptions.sortOptions[i] + '</option>');
        }
        $(sortDropdown).data('options', self.filterOptions.sortOptions);
        $(sortDropdown).attr('data-options', JSON.stringify(self.filterOptions.sortOptions));
        attachSortHandler(self);
    }

    function attachSortHandler(self) {
        $('.filter-outer-container .sort-header .sort-dropdown').on('valueChange', function (e) {
            e.preventDefault();
            filterCallback(self, 'sort', $(this).val());
        });
    }

    function filterCallback(self, type, value) {
        Object.tryMethod(self, 'callback', type, value);
    }

    function buildFilterOptions(self) {
        if (!self.isPopulated) {
            populateFilterGroups(self);
            self.isPopulated = true;
        }
        renderFilterGroups(self);
        attachFilterGroupHandlers(self);

        self.contentContainer.find('.clear-all a').on('click', removeAllTags.bind(null, self));
    }


    function populateFilterGroups(self) {
        self.filterCollection.populateGroups(self.filterOptions);
    }

    function renderFilterGroups(self) {
        var i,
            collection = self.filterCollection,
            groups = collection.filterGroups;

        self.tags = [];

        for (i = 0; i < groups.length; i++) {
            renderFilterGroup(self, groups[i], i);
        }
    }

    function renderFilterGroup(self, group, index) {
        var filterBodyEl = self.contentContainer.find('.filter-body').get(0),
            filterGroupEl = $(filterGroupView),
            i,
            headerEl,
            itemEl;

        filterGroupEl.data('group-index', index);
        headerEl = filterGroupEl.find('header');
        itemEl = filterGroupEl.find('.form-item div').get(0);
        renderFilterHeader(headerEl, group.caption);

        if (self.filterCollection.filterGroups[index].type === 'select') {
            renderSelectGroupItem(self, itemEl, group, index);
        }
        else {
            for (i = 0; i < group.items.length; i++) {
                renderFilterGroupItem(self, itemEl, group.items[i], i, index);
            }
        }

        $(filterBodyEl).append(filterGroupEl);
    }

    function renderFilterHeader(el, caption) {
        $(el).append(caption);
    }

    function renderSelectGroupItem(self, el, group, index) {
        var control = !group.hideCaption ? $('<mi-select data-optionsvalue="value" data-optionstext="text" data-optionscaption="' + self.filterCollection.filterGroups[index].caption + '"></mi-select><br />')
                .data({ 'group-index': index }) : $('<mi-select data-optionsvalue="value" data-optionstext="text"></mi-select><br />')
                .data({ 'group-index': index });

        for (var i = 0; i < group.items.length; i++) {
            if (group.items[i].isSelected) {
                $(control[0]).data('value', group.items[i].value);
                $(control[0]).attr('data-value', group.items[i].value);
                addTag(self, { target: control[0] }, group.items[i].value, group.caption, group.items[i].text);
                break;
            }
        }
        $(control).data('options', group.items);
        $(control).attr('data-options', JSON.stringify(group.items));

        $(el).append(control);
    }

    function renderFilterGroupItem(self, el, item, index, groupIndex) {
        var control, name;
        if (self.filterCollection.filterGroups[groupIndex].type === 'checkbox') {
            control = $('<mi-checkbox-noko  value="' + item.value + '" text="' + item.text + '" ></mi-checkbox-noko><br />')
                .data({ 'group-index': groupIndex, 'item-index': index, item: item });
        } else if (self.filterCollection.filterGroups[groupIndex].type === 'radio') {
            control = $('<mi-radio-noko  value="' + item.value + '" text="' + item.text + '" name="' + self.filterCollection.filterGroups[groupIndex].caption + '" ></mi-radio-noko>')
                .data({ 'group-index': groupIndex, 'item-index': index, item: item });
        }

        $(el).append(control);
        if (item.isSelected && self.filterCollection.filterGroups[groupIndex].type === 'checkbox') {           
            addTag(self, { target: control[0] }, item.value, name, item.text);
            $(control[0]).attr('checked', item.isSelected);
        } else if (item.isSelected && self.filterCollection.filterGroups[groupIndex].type === 'radio') {
            name = self.filterCollection.filterGroups[groupIndex].caption;
            addTag(self, { target: control[0] }, item.value, name, item.text);
            control[0].setAttribute('checked', item.isSelected);
        }
        $(el).append(control);
    }

    function attachFilterGroupHandlers(self) {
        var filterBodyEl = self.contentContainer.find('.filter-body');
        filterBodyEl.find('mi-checkbox-noko').on('checkedChange', filterItem_changed.bind(null, self));
        filterBodyEl.find('mi-radio-noko').on('checkedChange', filterRadioItem_Changed.bind(null, self));
        filterBodyEl.find('mi-select').on('valueChange', filterSelectItem_Changed.bind(null, self));

    }

    function filterSelectItem_Changed(self, e, value) {
        e.preventDefault();

        var itemData = $(e.target).data();
        var groupIndex = parseInt(itemData['group-index']);
        var group = self.filterCollection.filterGroups[groupIndex];
        var name = group.caption;

        if (value) {
            //removing old tag
            removeTagFromDOMByName(self, name);

            var selectedOption = _.find(group.items,
            function (opt) {
                if (opt && opt.value === value) {
                    return opt;
                }
            });

            //adding new tag
            addTag(self, e, value, name, selectedOption.text);
        } else {
            removeFromTagList(self, value);
            var tagToRemove = $(e.target).data('tag');
            if (tagToRemove) {
                tagToRemove.remove();
            }

        }


        var type = group.type;
        var items = self.filterCollection.filterGroups[groupIndex].items;
        var item;
        for (var i = 0; i < items.length; i++) {
            items[i].isSelected = false;
            if (items[i].value !== undefined && items[i].value !== null && value !== undefined && value !== null && items[i].value.toString() === value.toString()) {
                items[i].isSelected = true;
                item = items[i];
            }
        }
        self.filterCollection.filterGroups[groupIndex].items = items;
        // itemData.item.isSelected = checked;
        updateFilterGroup(self, type, item);
    }

    function filterRadioItem_Changed(self, e, checked, value, name) {
        if (checked) {


            //removing old tag
            removeTagFromDOMByName(self, name);

            //adding new tag
            addTag(self, e, value, name, value);
        } else {
            removeFromTagList(self, value);
            var tagToRemove = $(e.target).data('tag');
            tagToRemove.remove();


        }

        var itemData = $(e.target).data();
        var groupIndex = parseInt(itemData['group-index']);
        var group = self.filterCollection.filterGroups[groupIndex];
        var type = group.type;


        var items = self.filterCollection.filterGroups[groupIndex].items;
        var item;
        for (var i = 0; i < items.length; i++) {
            items[i].isSelected = false;
        }
        self.filterCollection.filterGroups[groupIndex].items = items;


        self.filterCollection.filterGroups[groupIndex].items[itemData['item-index']].isSelected = checked;
        itemData.item.isSelected = checked;
        updateFilterGroup(self, type, itemData.item);


    }

    function filterItem_changed(self, e, checked, value) {
        var text = e.target.text;
        if (checked) {
            addTag(self, e, value, null, text);
        } else {
            removeFromTagList(self, value);
            var tagToRemove = $(e.target).data('tag');
            tagToRemove.remove();
        }

        var itemData = $(e.target).data();
        var groupIndex = parseInt(itemData['group-index']);
        var group = self.filterCollection.filterGroups[groupIndex];
        var type = group.type;
        self.filterCollection.filterGroups[groupIndex].items[parseInt(itemData['item-index'])].isSelected = checked;
        itemData.item.isSelected = checked;
        updateFilterGroup(self, type, itemData.item);
    }

    function removeFromTagList(self, value) {

        var index = self.tags.indexOf(value);
        if (index >= 0) {
            self.tags.splice(index, 1);
        }

        if (!self.tags.length) {
            self.contentContainer.find(".tag-section").hide();
            self.contentContainer.find(".clear-all").hide();
            calculateOffset(self);
            positionContainer(self);
        }
    }


    function removeAllTags(self) {
        var tags = self.contentContainer.find('.tag-section').find('.tag');
        for (var i = 0; i < tags.length; i++) {
            var data = $(tags[i]).data();
            removeTag(self, data.value, data.item, { target: tags[i] });
        }
    }

    function removeTagFromDOMByName(self, name) {
        var oldTag = self.contentContainer.find('.tag-section').find('.tag[name="' + name + '"]');
        var oldValue = oldTag.data('value');
        var index = self.tags.indexOf(oldValue);
        self.tags.splice(index, 1);
        oldTag.remove();
    }

    function updateFilterGroup(self, type, data) {
        var i,
           collection = self.filterCollection,
           groups = collection.filterGroups;
        Object.tryMethod(self, 'callback', type, data, self.tags);
    }


    function addTag(self, e, value, name, text) {
        self.contentContainer.find(".tag-section").show();
        self.contentContainer.find(".clear-all").show();


        self.tags.push(value);
        //For Checkbox
        //var tag = $('<div class="tag tag-style"><span><span>' + value + '</span></span><i class="icon-node-error icon-style"></i></div>');
        //tag.data({ 'value': value, 'item': e }).find(".icon-style").on('click', removeTag.bind(null, self, value, e));
        //$(e.target).data('tag', tag);
        //tag.appendTo(self.contentContainer.find(".tag-section"));


        var tag = $('<div class="tag tag-style"><span><span>' + text + '</span></span><i class="icon-node-error icon-style"></i></div>');
        tag.attr('name', name).data({ 'value': value, 'item': e }).find(".icon-style").on('click', removeTag.bind(null, self, value, e));
        $(e.target).data('tag', tag);
        tag.appendTo(self.contentContainer.find(".tag-section"));
    }

    function removeTag(self, value, item, e) {
        $(e.target).closest(".tag").remove();
        removeFromTagList(self, value);




        var itemData = $(item.target).data();
        var groupIndex = parseInt(itemData['group-index']);
        var group = self.filterCollection.filterGroups[groupIndex];
        var type = group.type;


        if (type === 'checkbox' || type === 'radio') {
            item.target.checked = false;
        } else {
            $(item.target).data('value', '');
            $(item.target).attr('data-value', "");
        }

        if (type === 'checkbox') {
            self.filterCollection.filterGroups[groupIndex].items[parseInt(itemData['item-index'])].isSelected = false;
            //itemData.item.isSelected = checked;
        } else if (type === 'radio' || type === 'select') {
            var items = self.filterCollection.filterGroups[groupIndex].items;
            for (var i = 0; i < items.length; i++) {
                items[i].isSelected = false;
            }
            self.filterCollection.filterGroups[groupIndex].items = items;
        }

        updateFilterGroup(self, type, $(item.target).data().item);
    }


    function buildFilterContainer(self) {
        var containerdiv,
            currentcontainer;

        currentcontainer = $('.content-wrapper');
        containerdiv = document.createElement('div');
        $(containerdiv).addClass('filter-outer-container');

        self.contentContainer = $(containerdiv);
        $(currentcontainer).after(containerdiv);
        $(containerdiv).append(bodyView).on('mousedown.mifilter', function stopPropagation(e) { e.stopPropagation(); });
        $(containerdiv).find('.clear-all a').html(self.translator.translate('MF_CLEAR_ALL'));
        $($(containerdiv).find('.filter-header header')[0]).text(self.translator.translate('FILTER_HEADER_CAPTION'));

        $($(containerdiv).find('.filter-header')[0]).removeClass('hide');
        self.contentContainer.find(".tag-section").removeClass('hide');
        if (!self.showHeading) {
            $($(containerdiv).find('.filter-header')[0]).addClass('hide');
        }

        if (!self.showTags) {
            self.contentContainer.find(".tag-section").hide().addClass('hide');
        }
        //calculateOffset(self);
        //positionContainer(self);
    }

    function removeFilterBody(self) {
        $('.filter-outer-container').remove();
    }

    //function calculateOffset(self) {
    //    var offset;

    //    offset = $(self.element).find('.icon-container').offset();
    //    if (offset) {
    //        self.topOffset = offset.top;
    //        self.leftOffset = offset.left;
    //    }
    //}

    //function positionContainer(self) {
    //    if (self.contentContainer) {
    //        var alignClass = '';
    //        if (window.innerWidth < self.leftOffset + 250) {
    //            self.leftOffset = self.leftOffset - 215 + 'px';
    //            alignClass = 'align-left';

    //        }
    //        self.contentContainer.css({
    //            'position': 'absolute',
    //            'top': self.topOffset + 42 + 'px',
    //            'left': self.leftOffset
    //        });
    //        self.contentContainer.find('.filters').addClass(alignClass);
    //    }
    //}






    function positionContainer(self) {
        var ctrlHeight = 50,
            filtersTop, filtersLeft;
        calculateOffset(self);
        removeClass(self);

        if (self.ctrlOffset && (self.ctrlOffset.top + self.filtersHeight + ctrlHeight >= $(window).height())) {

            // move filters to the top of the icon
            showFiltersTop(self);
            //$(self.outerContainer).find('.filter-container');
        } else {
            // move filters to the bottom of the icon
            showFiltersBottom(self);
        }

        $(window).on('resize', self.resizeProxy.bind(null, self));
        $(self).parents().on('scroll', self.scrollProxy.bind(null, self));
    }

    function calculateOffset(self) {
        //getting filters container
        self.outerContainer = $(self.contentContainer);

        //getting icon offset
        self.ctrlOffset = $(self).find('.icon-container').offset();
        self.ctrlWidth = $(self).find('.icon-container').width() + 25;


        //setting popup width
        if (self._popupWidth !== null) {
            $(self.outerContainer).find('.filters-noko').css('width', self._popupWidth + 'px');
        }

        //setting container position
        $(self.outerContainer).css({
            'position': 'absolute'
        });

        //getting filters dimensions
        self.filtersWidth = $(self.outerContainer).find('.filters-noko').width();
        self.filtersHeight = $(self.outerContainer).find('.filters-noko').height();
    }

    function removeClass(self) {
        $(self.outerContainer).find('.filters-noko').removeClass('top-left top-right bottom-left bottom-right');
    }

    // show filters to the top of the icon
    function showFiltersTop(self) {
        var filtersTop;

        if (!self.ctrlOffset) {
            return;
        }

        filtersTop = self.ctrlOffset.top - self.filtersHeight - 10;

        // show filters to the top left of the icon
        if (self.ctrlOffset && (self.ctrlOffset.left + self.ctrlWidth - self.filtersWidth < 80)) {
            showLeft(self, 'top-left', filtersTop);
        }
            // show filters to the top left of the icon
        else {
            showRight(self, 'top-right', filtersTop);
        }

    }

    // show filters to the bottom of the icon
    function showFiltersBottom(self) {
        var filtersTop, ctrlHeight = 50;
        if (!self.ctrlOffset) {
            return;
        }
        filtersTop = self.ctrlOffset.top + ctrlHeight - 6;

        // show filters to the bottom left of the icon
        if (self.ctrlOffset && (self.ctrlOffset.left + self.ctrlWidth - self.filtersWidth < 80)) {
            showLeft(self, 'bottom-left', filtersTop);
        }
            // show filters to the bottom right of the icon
        else {
            showRight(self, 'bottom-right', filtersTop);
        }
    }


    function showLeft(self, className, filtersTop) {
        var filtersLeft;

        filtersLeft = self.ctrlOffset.left;
        addFiltersClass(self, className);

        setOffset(self, filtersLeft, filtersTop);
    }

    function showRight(self, className, filtersTop) {
        var filtersLeft;

        filtersLeft = self.ctrlOffset.left - (Math.abs(self.ctrlWidth - self.filtersWidth));
        if (self._popupWidth !== null) {
            filtersLeft -= 12;
        }
        addFiltersClass(self, className);

        setOffset(self, filtersLeft, filtersTop);
    }

    function addFiltersClass(self, className) {
        var filtersContent;

        filtersContent = $(self.outerContainer).find('.filters-noko');
        $(filtersContent).addClass(className);
    }

    //set offset for container
    function setOffset(self, filtersLeft, filtersTop) {
        $(self.outerContainer).css({ 'left': filtersLeft, 'top': filtersTop });
    }

    document.registerElement('mi-filter-no-ko', { prototype: proto });

    return proto;
});
