define(function (require) {
    'use strict';

    var $ = require('jquery');


    var Converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator');

    require('ui/elements/breadcrumb-item/view-model');
    require('ui/elements/more-options/more-options');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var breadcrumbcontainer, breadcrumbGroup;

        addProperties(this);

        breadcrumbcontainer = document.createElement('div');
        breadcrumbcontainer.className = 'breadcrumb-group-container';
        this.appendChild(breadcrumbcontainer);

        

        breadcrumbGroup = document.createElement('div');
        breadcrumbGroup.className = 'breadcrumb-group';

        breadcrumbcontainer.appendChild(breadcrumbGroup);


        

        //this.appendChild(breadcrumbGroup);

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
            if (e.target.tagName === 'MI-BREADCRUMB-ITEM') {
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

    proto.moreOptionsLoader = function () {
        var dfd = $.Deferred(),
            i,
            dataInMoreOptions = [],
            obj;

        for (i = 0; i < this.data.length - 2; i++) {
            obj = {};
            $.extend(obj, this.data[i]);
            obj.type = 'text';
            obj.text = getDisplayValue(this.data[i].text, this);
            
            dataInMoreOptions.push(obj);
        }
        dfd.resolve(dataInMoreOptions);
        return dfd;
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
            breadcrumb = breadcrumbGroup.querySelectorAll('mi-breadcrumb-item');
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
            attr = self.getAttribute('delimiter');

        self.data = data;
        if (breadcrumbGroup) {
            if (data.length > 2) {
                showEllipses(self, breadcrumbGroup);
            }
            for (i = 0; i < data.length; i++) {
                breadcrumb = document.createElement('mi-breadcrumb-item');
                cascadeAttributes(self, breadcrumb, i, data.length);
                breadcrumbGroup.appendChild(breadcrumb);
                data[i].displayValue = getDisplayValue(data[i].text, self);
                breadcrumb.value = data[i];
            }
        }
    }

    function getDisplayValue(datum, self) {
        //console.log(datum);
        var i,
            MAX_LENGTH = 10,
            OFFSET = MAX_LENGTH/2, 
            len = datum.length,
            lowerbound = OFFSET,
            upperbound = datum.length - OFFSET;

        if (len > MAX_LENGTH && self.getAttribute('showfulltext') === null) {
            return datum.substr(0, lowerbound) + '...' + datum.substr(upperbound, len);
        } 
        return datum;
    }

    function showEllipses(self, breadcrumbGroup) {
        //var ellipsesSpan;

        //ellipsesSpan = document.createElement('span');
        //ellipsesSpan.className = 'ellipses';
        //ellipsesSpan.textContent = '...' + self.getAttribute('delimiter');
        //breadcrumbGroup.appendChild(ellipsesSpan);

        var halt = $('<div/>').attr('data-bind', 'halt-bindings').css('display', 'inline-block');
        var moreOptions = $("<mi-more-options-noko/>");
        moreOptions.prop('icon', 'icon-more');
        if (window.CustomElements && !window.CustomElements.useNative) {
            window.CustomElements.upgrade(moreOptions.get(0));
        }
        self.moreOptions = moreOptions.get(0);
        self.moreOptions.loader = self.moreOptionsLoader.bind(self);

        halt.append(moreOptions);

        self.moreOptions.moreoptionsCB(moreOptionsClicked.bind(null, self));
        breadcrumbGroup.appendChild(halt[0]);

    }

    function moreOptionsClicked(self, data) {
        if (self.selectedCallback) {
            self.selectedCallback(data);
        }
    }

    function cascadeAttributes(self, dest, index, len) {
        var idx, attr;
        dest.setAttribute('index', index);
        dest.setAttribute('delimiter', self.delimiter);

        if (index > len - 3) {
            dest.setAttribute('active', 'true');
        } else {
            dest.setAttribute('active', 'false');
        }
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

    document.registerElement('mi-breadcrumb', { prototype: proto });

    return proto;
});