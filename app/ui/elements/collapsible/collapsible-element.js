define(function (require) {
    'use strict';

    var $ = require('jquery');


    var view = require('text!./template.html'),
        translator = Object.resolve(require('system/globalization/translator'));

    var Collapsible = {};
    Collapsible.prototype = Object.create(HTMLElement.prototype);

    Collapsible.prototype.createdCallback = function() {
        var content = null,
            titleContent = null,
            self = this,
            caption = '',
            hasCustomExpandedSection = false,
            hasCustomCollapsedSection = false,
            changingEvent = null,
            hideTooltip = translator.translate('HIDE'),
            showTooltip = translator.translate('SHOW');

        this.element = this;
        hasCustomExpandedSection = $(this.element).find('section.expanded').length > 0;
        hasCustomCollapsedSection = $(this.element).find('section.collapsed').length > 0;

        if (!hasCustomExpandedSection && !hasCustomCollapsedSection) {
            content = $(this.element).children().detach();
        } else {
            content = $(this.element).find('section.expanded').children().detach();
            titleContent = $(this.element).find('section.collapsed').children().detach();
        }

        this.element.innerHTML = view;
        $(this.element).find('section.expanded').append(content);

        if (hasCustomCollapsedSection) {
            $(this.element).find('section.collapsed').empty();
            $(this.element).find('section.collapsed').append(titleContent);
        }

        caption = $(this.element).attr('caption');
        this.private = {
            caption: '',
            expanded: true
        };

        Object.defineProperty(self, 'caption', {
            get: function () {
                return self.private.caption;
            }.bind(self),
            set: function (value) {
                changeTitle.call(null, self, value);
            }.bind(self)
        });

        Object.defineProperty(self, 'expanded', {
            get: function () {
                return self.private.expanded;
            }.bind(self),
            set: function(value) {
                changeExpansion.call(null, self, value);
            }.bind(self)
        });

        if (caption) {
            this.caption = caption;
        }

        $(this.element).find('i.icon-collapse').attr('title', hideTooltip).on('click', collapse.bind(null, this));
        $(this.element).find('i.icon-expand').attr('title', showTooltip).on('click', expand.bind(null, this));
    };

    Collapsible.prototype.attachedCallback = function() {

    };

    Collapsible.prototype.detachedCallback = function() {

    };

    Collapsible.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'caption') {
            changeTitle.call(null, this, newVal);
        }
    };

    Collapsible.prototype.show = function () {
        expand(this);
    };

    Collapsible.prototype.hide = function() {
        collapse(this);
    };

    function changeTitle (self, newcaption) {
        if (self.private.caption === newcaption) {
            return;
        } else {
            self.private.caption = newcaption;
            self.element.querySelector('section.collapsed span.title').innerHTML = newcaption;
        }
    }

    function changeExpansion(self, newVal) {
        if(self.private.expanded === newVal) {
            return;
        } else {
            self.private.expanded = newVal;
            if (newVal === true) {
                expand(self);
            } else if (newVal === false) {
                collapse(self);
            }
        }
    }

    function collapse(self) {
        if (raiseChangingEvent(self, false)) {
            $(self.element).find('section.expanded').removeClass('active');
            $(self.element).find('section.collapsed').addClass('active');
            self.private.expanded = false;
            raiseChangeEvent(self);
        }
    }

    function expand(self) {
        if (raiseChangingEvent(self, true)) {
            $(self.element).find('section.collapsed').removeClass('active');
            $(self.element).find('section.expanded').addClass('active');
            self.private.expanded = true;
            raiseChangeEvent(self);
        }
    }

    function raiseChangeEvent(self) {
        return self.dispatchEvent(new CustomEvent('change', {
            detail: { expanded: self.private.expanded }
        }));
    }

    function raiseChangingEvent(self, expanding) {
        self.changingEvent = new CustomEvent(
            'changing',
            {
                detail: { expanding: expanding },
                cancelable: true,
                bubbles: true
            });

        return self.dispatchEvent(self.changingEvent);
    }

    document.registerElement('mi-collapsible', { prototype: Collapsible.prototype });

    return Collapsible;
});
