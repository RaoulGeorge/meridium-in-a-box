define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator');

    require('ui/elements/breadcrumb-item/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var breadcrumbGroup;

        addProperties(this);

        breadcrumbGroup = document.createElement('div');
        breadcrumbGroup.className = 'breadcrumb-group';

        this.appendChild(breadcrumbGroup);

        this.delimiter = this.getDelimiter();
        if (this.loader) {
            this.reload();
        }
    };

    proto.attachedCallback = function () {
        var breadcrumbGroup = getBreadcrumbGroup(this);
        breadcrumbGroup.addEventListener('click', this);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) { };

    proto.handleEvent = function (e) {
        if (e.type === 'click') {
            if (e.target.tagName === 'MI-BREADCRUMB') {
                invokeCallback(this, e);
            }
        }
    };

    proto.reload = function () {
        this.load().done();
    };

    proto.pause = function () {
        this.paused = true;
    };

    proto.resume = function () {
        this.paused = false;
    };

    proto.load = function () {
        var dfd;
        if (this.loader) {
            this.pause();
            dfd = this.loader();
            dfd.done(generateDOM.bind(null, this));
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    proto.getDelimiter = function getDelimiter() {
        return this.getAttribute('delimiter');
    };

    

    function addProperties(self) {
        self.paused = false;
        self._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });

        self._value = null;
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });

        Element.defineProperty(self, 'items', {
            get: getItems.bind(null, self),
            set: setItems.bind(null, self)
        });

    }

    function getLoader(self) {
        return self._loader;
    }

    function setLoader(self, value) {
        self._loader = value;
        self.reload();
    }

    function getValue(self) {
        return self._value;
    }

    function setValue(self, value) {
        self._value = value;
    }

    function getItems(self) {
        var breadcrumbGroup = getBreadcrumbGroup(self),
            breadcrumb, breadcrumbList = [], idx;

        if (breadcrumbGroup) {
            breadcrumb = breadcrumbGroup.querySelectorAll('mi-breadcrumb');
            for (idx = 0; idx < breadcrumb.length; idx++) {
                breadcrumbList[breadcrumbList.length] = breadcrumb[idx].value;
            }
        }
        return breadcrumbList;

    }

    function setItems(self, value) {
        var breadcrumbList = getBreadcrumbGroup(self);

        if (breadcrumbList) {
            Element.clearDom(breadcrumbList);
            if (value) {
                generateDOM(self, value);
            }
        }
    }

    function generateDOM(self, data) {
        var i, breadcrumb,
            breadcrumbGroup = getBreadcrumbGroup(self),
            attr = self.getAttribute('delimiter'),
            tileWidth;
        if (breadcrumbGroup) {
            for (i = 0; i < data.length; i++) {
                breadcrumb = document.createElement('mi-breadcrumb');
                cascadeAttributes(self, breadcrumb, i);
                breadcrumbGroup.appendChild(breadcrumb);
                breadcrumb.value = data[i];

            }
        }
    }

    function cascadeAttributes(self, dest, index) {
        var idx, attr;
        dest.setAttribute('index', index);
        dest.setAttribute('delimiter', self.delimiter);
    }

    function invokeCallback(self, e) {
        if (self.selectedCallback) {
            self.selectedCallback(e.detail);
        }
    }

    function getBreadcrumbGroup(self) {
        var breadcrumbGroup = self.querySelectorAll('.breadcrumb-group');
        return breadcrumbGroup.length === 0 ? null : breadcrumbGroup[breadcrumbGroup.length - 1];
    }

    document.registerElement('mi-breadcrumb-group', { prototype: proto });

    return proto;
});