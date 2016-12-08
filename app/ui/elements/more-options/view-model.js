define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ko = require('knockout'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        view = require('text!./template.html'),
        contentView = require('text!./content-view.html'),
        Region = require('spa/region');


    var MoreOptions = {};
    MoreOptions.prototype = Object.create(HTMLElement.prototype);

    MoreOptions.prototype.createdCallback = function () {
        var self = this,
            i, icon = '', internalIcon = null, _disabled = null;
        this.element = this;
        this.properties = [];
        this.kom = Object.resolve(KnockoutManager);
        this.innerHTML = view;
        this.bindArrayProperty('options');
        this.bindAttribute('scrollingElement');
        this.value = null;
        this.moreOptionsContent = new Region(null, null);
        this.visible = ko.observable(false);
        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(function () { this.visible(false); }, this);
        this.subscriptions = [];

        Object.defineProperty(self, 'icon', {
            get: function () { return self.internalIcon; }.bind(self),
            set: function (icon) {
                changeIcon.call(null, self, icon);
            }.bind(self)
        });

        //for making options disabled
        Object.defineProperty(self, 'disabled', {
            get: function () { return self._disabled; }.bind(self),
            set: function (disabled) {
                makeOptionsDisabled.call(null, self, disabled);
            }.bind(self)
        });

        //for setting tooltip
        Object.defineProperty(self, 'tooltip', {
            get: function () { }.bind(self),
            set: function (tooltip) {
                setTooltip.call(null, self, tooltip);
            }.bind(self)
        });


    };

    MoreOptions.prototype.bindArrayProperty = function (propertyName) {
        this[propertyName] = this.kom.observableArray();
        this.properties.push(propertyName);
    };

    MoreOptions.prototype.bindAttribute = function (attrName, defaultValue, subscription) {
        this[attrName] = this.kom.observable();
        this[attrName + 'Changed'] = function (oldValue, newValue) {
            this[attrName](newValue);
        }.bind(this);
        this.kom.subscribe(this[attrName], function (newValue) {
            $(this.element).trigger('attributes.' + attrName + ':changed', [newValue]);
        }, this);
        if (subscription) {
            this.kom.subscribe(this[attrName], subscription, this);
        }
        this[attrName](Object.defaultValue(this.element.getAttribute(attrName), defaultValue));
    };


    MoreOptions.prototype.attachedCallback = function () {
        var self = this;
        $(self.element).find('.mi-more-options-icon').on('click', toggleMoreOptions.bind(null, self));
        $(document).on('click', documentClicked.bind(null, self));
    };

    function changeIcon(self, value) {
        if (value) {
            $(self).find('button i').removeAttr("class").addClass(value.trim());
        } else {
            $(self).find('button i').removeAttr("class").addClass('icon-options');
        }
    }

    function makeOptionsDisabled(self, value) {
        self._disabled = value;
        if (value) {
            $(self).find('button').addClass('disabled');
        } else {
            $(self).find('button').removeClass('disabled');
        }
    }

    function setTooltip(self, value) {
        if (value) {
            $(self).find('button').attr('title', value);
        } 
    }

    function documentClicked(self) {
        if (self.visible()) {
            $('.more-options-outer-container').remove();
            self.visible(false);
        }
    }

    MoreOptions.prototype.detachedCallback = function () {
        var self = this;
        $(self.element).find('.mi-more-options-icon').off('click');
        $(document).off('click', documentClicked.bind(null, self));
    };

    MoreOptions.prototype.moreoptionsCB = function (callback) {
        this.callback = callback;
    };

    MoreOptions.prototype.resize = function (self) {
        positionContainer(this);
    };

    MoreOptions.prototype.optionClicked = function (data, e) {
        e.stopPropagation();
        if (data.disabled === true) {
            return;
        }
        toggleMoreOptions(this);
        Object.tryMethod(this, 'callback', data);
    };


    MoreOptions.prototype.selectClicked = function (data, e) {
        e.stopPropagation();
    };

    function optionsvalue_changed(self, val) {
        var data;
        toggleMoreOptions(self);
        data = _.find(self.options, function (option) {
            if (option.value) {
                return option.value() === val;
            }
        });
        Object.tryMethod(self, 'callback', data);

    }


    function positionContainer(self) {
        var containerdiv, ctrlOffset, ctrlWidth, ctrlHeight = 50,
            optionsWidth, optionsHeight, optionsTop, optionsLeft;

        containerdiv = $(self.contentContainer);
        
        ctrlOffset = $(self.element).find('.mi-more-options-icon').offset();
        ctrlWidth = $(self.element).find('.mi-more-options-icon').width();

        self.topOffset = ctrlOffset.top;
        self.leftOffset = ctrlOffset.left;

        $(containerdiv).css({
            'position': 'absolute'
        });

        setTimeout(function () {

            optionsWidth = $(self.contentContainer).width();
            optionsHeight = $(self.contentContainer).height();

            $(containerdiv).find('.more-options-content').removeClass('top-left top-right bottom-left bottom-right');

            if (ctrlOffset.top + optionsHeight >= $(window).height()) {

                // move options to the top of the icon
                optionsTop = ctrlOffset.top - optionsHeight - 10;

                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(containerdiv).find('.more-options-content').addClass('top-left');
                }
                else {
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(containerdiv).find('.more-options-content').addClass('top-right');
                }
                $(containerdiv).find('.more-options-content').css({
                    'box-shadow': '0px 0px 12px 6px rgba(0, 0, 0, 0.175)',
                    '-webkit-box-shadow': '0px 0px 12px 6px rgba(0, 0, 0, 0.175)'
                });
            } else {
                // move options to the bottom of the icon
                optionsTop = self.topOffset + ctrlHeight - 6;

                if (ctrlOffset.left + ctrlWidth - optionsWidth < 80) {
                    optionsLeft = ctrlOffset.left;
                    $(containerdiv).find('.more-options-content').addClass('bottom-left');
                }
                else {
                    optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                    $(containerdiv).find('.more-options-content').addClass('bottom-right');
                }
            }

            $(containerdiv).css({ 'left': optionsLeft, 'top': optionsTop });

        }, 1);
    }

    function toggleMoreOptions(self, e) {
        if (e) {
            e.stopPropagation();
        }
        var scrollingEl = '.content';
        if (self.scrollingElement()) {
            scrollingEl = self.scrollingElement();
        }
        if (self.visible()) {
            $(window).off('resize', self.resizeProxy);
            $('body').find(scrollingEl).off('scroll', self.scrollProxy);
            hideOptions(self);
        } else {
            showOptions(self);
            $(window).on('resize', self.resizeProxy);
            $('body').find(scrollingEl).on('scroll', self.scrollProxy);
        }
        self.visible(!self.visible());
    }

    function showOptions(self) {
        var scrollingEl = 'document';
        var containerdiv;
        var allMoreOptions;
        var i;

        if (self.scrollingElement()) {
            scrollingEl = self.scrollingElement();
        }

        allMoreOptions = $('mi-more-options');
        for (i = 0; i < allMoreOptions.length; i++) {
            if (allMoreOptions[i].visible()) {
                allMoreOptions[i].visible(false);
                $(allMoreOptions[i]).find('.more-options-outer-container').remove();
            }
        }

        containerdiv = document.createElement('div');
        $(containerdiv).addClass('more-options-outer-container');
        document.body.appendChild(containerdiv);

        //containerdiv = $(scrollingEl).append('<div class = "more-options-outer-container"></div>');
        self.contentContainer = $(containerdiv);

        self.moreOptionsContent.setElement(containerdiv);
        self.moreOptionsContent.attach($(contentView));

        ko.applyBindings(self, self.moreOptionsContent.activeContainer);
        for (i = 0; i < self.options.length; i++) {
            if (self.options[i].type === 'select') {
                self.subscriptions.push(self.options[i].value.subscribe(optionsvalue_changed.bind(null, self)));
            }
        }

        positionContainer(self);
    }

    function hideOptions(self) {
        var i;
        for (i = 0; i < self.subscriptions.length; i++) {
            self.subscriptions[i].dispose();
        }
        ko.cleanNode(self.moreOptionsContent.activeContainer);
        self.contentContainer.remove();
    }

    document.registerElement('mi-more-options', { prototype: MoreOptions.prototype });

    return MoreOptions;
});
