define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Conductor = require('spa/conductor'),
        Region = require('spa/region'),
        Translator = require('system/globalization/translator');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var element;
        addProperties(this);

        this.classList.add('btn');
        this.classList.add('btn-default');
        this.classList.add('btn-icon');
        element = document.createElement('i');
        element.className = 'icon-collection-filter';
        this.appendChild(element);
        this.region = null;
        this.translator = null;
    };

    proto.attachedCallback = function () {
        this.addEventListener('click', this);
        document.querySelector('body').addEventListener('click', this._closeFilterBind);
        this.translator = Object.resolve(Translator);
        this.title = translate(this, 'FILTER');
    };

    proto.detachedCallback = function () {
        var popover;

        if (this.getAttribute('custom-filter') !== 'true') {
            if (this.$filter) {
                popover = document.querySelector(this.popOverId);
                if (popover) {
                    popover.parentElement.removeChild(popover);
                }
                this.$filter = null;
            }
            this.conductor.unloadScreen(this.filterViewModel);
            this.conductor.closeScreen(this.filterViewModel);
        }
        document.querySelector('body').removeEventListener('click', this._closeFilterBind);
    };

    proto.handleEvent = function (e) {
        if (e.type === 'click') {
            if (e.target === this || e.target.parentElement === this) {
                filter(this);
            }
        }
    };

    proto.openFilter = function(){
        filter(this);
    };

    proto.closeFilter = function () {
        closeFilter(this);
    };

    function translate (self, key) {
        return self.translator.translate(key.toUpperCase());
    }

    function filter (self) {
        if (self.getAttribute('custom-filter') === 'true') {
            self.filterViewModel();
        } else {
            if (self.$filter) { return; }
            self.$filter = $(self);
            self.$filter.popover({
                placement: 'bottom',
                content: ' ',
                container: 'body'
            });
            self.$filter.on('shown.bs.popover', self, attachToPopover);
            self.$filter.on('hide.bs.popover', self, detachFromPopover);
            self.$filter.on('hidden.bs.popover', self, destroyPopover);
            self.$filter.popover('show');
        }
    }

    function addProperties (self) {
        self.conductor = Object.resolve(Conductor);

        self._closeFilterBind = closeFilter.bind(null, self);
        self.$filter = null;
        self.popoverId = null;
        self._filterViewModel = null;
        Element.defineProperty(self, 'filterViewModel', {
            get: getFilterViewModel.bind(null, self),
            set: setFilterViewModel.bind(null, self)
        });
    }

    function closeFilter(self, e) {
        var popOver;
        if (self.$filter) {
            popOver = document.querySelector(self.popOverId);
            if (!popOver || popOver.contains(e.target) || e.target === self) {
                return;
            }
            self.$filter.popover('hide');
        }
    }

    function getFilterViewModel(self) {
        return self._filterViewModel;
    }

    function setFilterViewModel(self, value) {
        if (value) {
            self._filterViewModel = value;
            if (self.getAttribute('custom-filter') !== 'true') {
                self.conductor.openScreen(self._filterViewModel);
                self.conductor.loadScreen(self._filterViewModel);
            }
        } else {
            self._filterViewModel = null;
        }
    }

    function attachToPopover(e) {
        var self = e.data;

        self.region = new Region();
        self.popOverId = '#' + e.target.getAttribute('aria-describedby');
        self.region.setElement($(self.popOverId + ' .popover-content'));
        self.conductor.activateScreen(self.filterViewModel);
        self.conductor.attachScreen(self.filterViewModel, self.region);
    }

    function detachFromPopover(e) {
        var self = e.data;

        self.conductor.deactivateScreen(self.filterViewModel);
        self.conductor.detachScreen(self.region);
        self.$filter.off('shown.bs.popover', attachToPopover);
        self.$filter.off('hide.bs.popover', detachFromPopover);
    }

    function destroyPopover(e) {
        var self = e.data;
        if (self.$filter) {
            self.$filter.off('hidden.bs.popover', destroyPopover);
            self.$filter.popover('destroy');
            self.$filter = null;
            self.popoverId = null;
            self.dispatchEvent(new CustomEvent('filter-closed', { bubbles: true }));
        }
    }

    document.registerElement('mi-tool-bar-filter', { prototype: proto });

    return proto;
});
