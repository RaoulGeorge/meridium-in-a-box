define(function(require) {
    'use strict';

    var R = require('ramda'),
        _private = require('system/lang/private'),
        Forward = require('system/lang/forward'),
        mx = require('system/mithril/mithril-extensions'),
        BasePageFilterViewModel = require('ui/elements/page-filter/view-models/page-filter-view-model'),
        PageFilterConnection = require('ui/elements/page-filter/page-filter-connection');

    function PageFilterViewModel(attrs, children) {
        base.call(this);
        this.value = null;
        this.onChange = null;
        this.onPreferenceLoaded = null;
        _private(this).children = children;
        _private(this).onchange = null;
        this.setState(attrs, children);
        _private(this).connection = new PageFilterConnection();
        _private(this).connection.open(pageFilterChanged.bind(null, this), null);
        this.addConnection(_private(this).connection);
        this.loadState(null);
    }
    var base = Object.inherit(BasePageFilterViewModel, PageFilterViewModel);

    var prototype = PageFilterViewModel.prototype;

    prototype.getChildren = Forward.getProperty('children', _private);

    function pageFilterChanged(self, parameters) {
        if (R.equals(self.value, parameters)) { return; }
        self.value = parameters;
        onChange(self);
    }

    function onChange(self) {
        if (self.onChange) {
            self.onChange(mx.event(self));
        }
    }

    prototype.setState = function (attrs, children) {
        this.id(attrs.id);
        this.caption(attrs.caption);
        this.filter(attrs.filter);
        if (attrs.value) {
            this.values(attrs.value);
        }
        this.onChange = attrs.onChange;
        this.onPreferenceLoaded = attrs.onPreferenceLoaded;
        _private(this).children = children;
    };

    prototype.onunload = function () {
        if (_private(this).connection) {
            this.removeConnection(_private(this).connection);
            _private(this).connection = null;
        }
    };

    prototype.setPreferenceLoaded = function (value) {
        base.prototype.setPreferenceLoaded.call(this, value);
        if (value) {
            onPreferenceLoaded(this);
        }
    };

    function onPreferenceLoaded(self) {
       if (self.onPreferenceLoaded) {
           self.onPreferenceLoaded(mx.event(self));
       }
    }

    return PageFilterViewModel;
});