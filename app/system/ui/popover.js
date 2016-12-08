define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var Conductor = require('spa/conductor'),
        Region = require('spa/region');

    require('bootstrap');

    function Popover(content, elem) {
        this.options = null;
        this.content = content;
        this.elem = elem;
        this.popoverRegion = new Region(null, null);
        this.conductor = Object.resolve(Conductor);
        this.isVisible = false;
        this.isHTML = false;
        init(this);
    }

    Popover.prototype.show = function Popover_show() {
        show(this);
    };

    Popover.prototype.hide = function Popover_closePopover() {
        hide(this);
    };

    Popover.prototype.toggle = function Popover_togglePopover() {
        if (this.isVisible) {
            hide(this);
        } else {
            show(this);
        }
    };

    function show(self) {
        $(self.elem).popover('show');

        if (!self.isHTML) {
            self.popoverRegion.setElement($('div.popover'));
            self.conductor.changeScreen(self.content, self.popoverRegion);
        }

        self.isVisible = true;
    }

    function hide(self) {
        $(self.elem).popover('hide');

        if (!self.isHTML) {
            self.conductor.clearScreen(self.popoverRegion);
        }
        
        self.isVisible = false;
    }

    function init(self) {
        if (isScreen(self)) {
            self.options = {
                content: ' ',
                placement: 'bottom',
                container: 'body',
                viewport: 'section.content'
            };
        } else {
            self.isHTML = true;
            self.options = {
                html: true,
                content: self.content,
                placement: 'bottom',
                container: 'body',
                viewport: 'section.content'
            };
        }

        $(self.elem).popover(self.options);
    }

    function isScreen(self) {
        return _.isFunction(self.content.attach);
    }

    return Popover;
});