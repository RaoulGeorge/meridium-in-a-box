define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var Converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator');

    require('../more-options-item/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var self, moreoptionsGroup;

        self = this;
        self.internalIcon = null;
        self._disabled = $(self).is('[disabled]');
        self._noaccess = null;
        self._text = null;

        this.isOpen = false;
        this._options = [];

        addProperties(this);

        $(this).empty(); //making empty before adding button

        moreoptionsGroup = addMoreOptionsButton(this);

        this.appendChild(moreoptionsGroup);

        this.resizeProxy = $.proxy(_.debounce(this.resize, 100), this);
        this.scrollProxy = $.proxy(this.scroll, this);

        //variables for getting dimensions of more options icon container
        this.ctrlOffset = null;
        this.ctrlWidth = null;

        //variables for getting dimensions of options container
        this.optionsWidth = null;
        this.optionsHeight = null;
        this.optionsTop = null;
        this.optionsLeft = null;

        //variable storing options outer container
        this.outerContainer = null;

        this.docClickHandler = documentClicked.bind(null, this);

        //defining callback
        Element.defineProperty(self, 'moreoptionsCB', {
            get: getmoreoptionsCB.bind(null, self),
            set: self.handlemoreoptionsCB.bind(self)
        });

        //options 
        Element.defineProperty(self, 'options', {
            get: function () { return self._options; }.bind(self),
            set: function (options) {
                setOptions(self, options);
            }.bind(self)
        });


        Element.defineProperty(self, 'icon', {
            get: function () { return self.internalIcon; }.bind(self),
            set: function (icon) {
                addOptionsIcon(self, icon);
            }.bind(self)
        });

        //text property 
        Element.defineProperty(self, 'text', {
            get: function () { return self._text; }.bind(self),
            set: function (text) {
                addOptionsText(self, text);
            }.bind(self)
        });

        //for making more options disabled
        Element.defineProperty(self, 'disabled', {
            get: function () { return self._disabled; }.bind(self),
            set: function (disabled) {
                makeOptionsDisabled(self, disabled);
            }.bind(self)
        });

        //for making more options not-accessible
        Element.defineProperty(self, 'noaccess', {
            get: function () { return self._noaccess; }.bind(self),
            set: function (noaccess) {
                makeOptionsNotAccessible(self, noaccess);
            }.bind(self)
        });

        //for setting tooltip
        Element.defineProperty(self, 'tooltip', {
            get: function () { }.bind(self),
            set: function (tooltip) {
                setTooltip.call(null, self, tooltip);
            }.bind(self)
        });

        //for loading default icon
        if (!self.internalIcon) {
            addOptionsIcon(self, null);
        }

    };

    proto.attachedCallback = function () {
        var moreoptionsGroup = getMoreOptionsGroup(this);
        moreoptionsGroup.addEventListener('mousedown', this);

        $(document).on('mousedown.mi_opt', this.docClickHandler);
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var self = this;
        if (attrName === 'disabled') {
            var disabled = Converter.toBoolean(newValue, 'true');
            makeOptionsDisabled(self, disabled);
        }
        else if (attrName === 'noaccess') {
            var noaccess = Converter.toBoolean(newValue, 'true');
            makeOptionsNotAccessible(self, noaccess);
        }
        else if (attrName === 'icon'){
            addOptionsIcon(self, newValue);
        }
        else if (attrName === 'text') {
            addOptionsText(self, newValue);
        }
    };

    proto.handlemoreoptionsCB = function (callback, data) {
        var self = this;
        self.callback = callback;
    };

    function setOptions (self, data) {
        self._options = data;
    }

    proto.detachedCallback = function () {
        var moreoptionsGroup = getMoreOptionsGroup(this);
        if (moreoptionsGroup) {
            moreoptionsGroup.removeEventListener('mousedown', this);
        }

        $(document).off('mousedown.mi_opt', this.docClickHandler);
        $(this.contentContainer).remove();
        this.isOpen = false;
    };

    proto.handleEvent = function (e) {
        if (e.type === 'mousedown') {
            e.stopPropagation();
            if (this.loader) {
                this.reload();
            }
        }
    };

    proto.optionClicked = function (data, e) {
        e.stopPropagation();
        if (data.disabled === true || data.noaccess === true) {
            return;
        }
        removeDOM(this);
        Object.tryMethod(this, 'callback', data);
    };

    proto.reload = function () {
        this.load().done();
    };

    proto.load = function () {
        var dfd;
        if (this.disabled) {
            return $.Deferred().done().promise();
        }
        if (this.loader) {
            if (!this.isOpen) {
                $(window).on('resize', this.resizeProxy.bind(null, this));
                $(this).parents().on('scroll', this.scrollProxy.bind(null, this));


                dfd = this.loader();
                dfd.done(generateDOM.bind(null, this));
                return dfd.promise();

            }
            else {
                $(window).off('resize', this.resizeProxy);
                $(this).parents().off('scroll', this.scrollProxy);

                dfd = this.loader();
                dfd.done(removeDOM.bind(null, this));
                return dfd.promise();
            }

        } else {
            return $.Deferred().done().promise();
        }
    };

    proto.resize = function (self) {
        if ($(self).find('.mi-more-options-icon').is(':visible')) {
            positionContainer(this);
        }
        else {
            removeDOM(self);
        }

    };

    proto.deallocateMem = function () {
        var self = this;
        self.internalIcon = null;
        self.isOpen = null;
        self.ctrlOffset = null;
        self.ctrlWidth = null;
        self.optionsWidth = null;
        self.optionsHeight = null;
        self.optionsTop = null;
        self.optionsLeft = null;
        self.outerContainer = null;
        self.disabled = null;
        self.options = null;
        if (self.contentContainer) {
            self.contentContainer = null;
        }
        if (self.isClicked) {
            self.isClicked = null;
        }
        self.callback = null;
        self.loader = null;
        self.scrollProxy = null;
        self.resizeProxy = null;
        self.icon = null;
        self.tooltip = null;
    };

    //Hides the more option on scrolling of parents
    proto.scroll = function (self) {
        removeDOM(self);
        self.isOpen = false;
    };

    function getmoreoptionsCB(self) {
        return self.handlemoreoptionsCB;
    }

    function documentClicked(self, e) {
        if (self.isClicked) {
            self.isClicked = false;
        }
        else if (self.isOpen) {
            //if the current targetted container is not 'more options pop up' window, on the document
            if (!$(e.target).hasClass('more-options-content')) {
                $('.more-options-outer-container').remove();
                self.isOpen = false;
            }
        }
    }

    function addMoreOptionsButton(self) {
        var moreoptionsGroup, moreoptionsIcon, tabDiv, tab;

        moreoptionsGroup = document.createElement('button');
        moreoptionsGroup.className = 'mi-more-options-icon btn btn-icon';

        moreoptionsIcon = document.createElement('i');

        moreoptionsGroup.appendChild(moreoptionsIcon);
        return moreoptionsGroup;
    }

    //for adding class to options icon
    function addOptionsIcon(self, icon) {
        if (icon) {
            self.internalIcon = icon.trim();
        } else {
            self.internalIcon = 'icon-options';
        }
        $(self).find('button i').removeAttr("class").addClass(self.internalIcon);
    }

    //for adding text to options icon
    function addOptionsText(self, text) {
        if (text) {
            self._text = text.trim();
            //for adding text to button
            $(self).find('button').text(self._text);
            //for setting title attribute as it will be useful when long text is there
            $(self).find('button').attr('title', self._text);
            //adding icon for text button
            $(self).find('button').append('<i class="icon-tree-collapse"></i>');
            //adding btn-text to style button
            $(self).find('button').removeClass('btn-icon').addClass('btn-text');
        }
    }

    function makeOptionsDisabled(self, disabled) {
        if (disabled !== undefined) { //for Edge browser
            self._disabled = disabled;
        }
        if (self._disabled) {
            $(self).find('button').addClass('disabled');
        }
        else {
            $(self).find('button').removeClass('disabled');
        }
    }
    //setting/removing no-access class on button
    function makeOptionsNotAccessible(self, noaccess) {
        self._noaccess = noaccess;
        if (noaccess) {
            $(self).find('button').addClass('no-access');
        }
        else {
            $(self).find('button').removeClass('no-access');
        }
    }

    function setTooltip(self, value) {
        if (value) {
            $(self).find('button').attr('title', value);
        }
    }

    function addProperties(self) {
        self._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });
    }

    function getLoader(self) {
        return self._loader;
    }

    function setLoader(self, value) {
        self._loader = value;
        //self.reload(); //commenting this to fix record manager issue where options are opening on click of parent container
    }

    function generateDOM(self, data) {
        var i, moreoptionsItem, moreoptionsItemsContainer, moreoptionsContent, moreoptionsItems, customEvent, textClicked,
            moreoptionsGroup = getMoreOptionsGroup(self);

        self._options = data;
        if (!data.length) {
            self.isOpen = false;
            return;
        }
        self.isOpen = !self.isOpen;

        self.isClicked = true;
        $(document).trigger('mousedown.mi_opt');

        moreoptionsItemsContainer = document.createElement('div');
        $(moreoptionsItemsContainer).addClass('more-options-outer-container');

        self.contentContainer = $(moreoptionsItemsContainer);

        moreoptionsContent = document.createElement('ul');
        $(moreoptionsContent).addClass('more-options-content');

        
        if (moreoptionsGroup) {
            for (i = 0; i < data.length; i++) {
                moreoptionsItem = document.createElement('mi-more-options-item');

                //creating list item
                moreoptionsItems = document.createElement('li');

                //adding disabled class from data
                if (data[i].disabled) {
                    $(moreoptionsItems).addClass('disabled');
                }

                if (data[i].noaccess) {
                    $(moreoptionsItems).addClass('no-access');
                }

                /* jshint ignore:start */
                //adding event listener for list item
                moreoptionsItems.addEventListener('mousedown', function (e) {
                    e.stopPropagation();
                }.bind(self), false);
                moreoptionsItems.addEventListener('click', function (e) {
                    if (e.type === 'click') {
                        var data = $(e.currentTarget).find('mi-more-options-item')[0].value;
                        self.optionClicked(data, e);
                    }

                }.bind(self), false);
                /* jshint ignore:end */

                cascadeAttributes(self, moreoptionsItem, i, data.length);
                moreoptionsItems.appendChild(moreoptionsItem);
                moreoptionsContent.appendChild(moreoptionsItems);
                moreoptionsItem.value = data[i];
            }
        }

        moreoptionsItemsContainer.appendChild(moreoptionsContent);

        document.body.appendChild(moreoptionsItemsContainer);

        positionContainer(self);
    }

    function removeDOM(self) {
        self.isOpen = !self.isOpen;
        $(self.contentContainer).remove();
    }

    function cascadeAttributes(self, dest, index, len) {
        var idx, attr;
        dest.setAttribute('index', index);
    }

    function getMoreOptionsGroup(self) {
        var moreoptionsGroup = self.querySelectorAll('.mi-more-options-icon');
        return moreoptionsGroup.length === 0 ? null : moreoptionsGroup[moreoptionsGroup.length - 1];
    }

    function positionContainer(self) {
        var ctrlHeight = 50,
            optionsTop, optionsLeft;
        calculateOffset(self);
        removeClass(self);

        if (self.ctrlOffset && (self.ctrlOffset.top + self.optionsHeight + ctrlHeight >= $(window).height())) {

            // move options to the top of the icon
            showOptionsTop(self);
            $(self.outerContainer).find('.more-options-content').css({
                'box-shadow': '0px 0px 12px 6px rgba(0, 0, 0, 0.175)',
                '-webkit-box-shadow': '0px 0px 12px 6px rgba(0, 0, 0, 0.175)'
            });
        } else {
            // move options to the bottom of the icon
            showOptionsBottom(self);
        }
    }

    function calculateOffset(self) {
        //getting options container
        self.outerContainer = $(self.contentContainer);

        //getting icon offset
        self.ctrlOffset = $(self).find('.mi-more-options-icon').offset();
        self.ctrlWidth = $(self).find('.mi-more-options-icon').width();

        //setting container position
        $(self.outerContainer).css({
            'position': 'absolute'
        });

        //getting options dimensions
        self.optionsWidth = $(self.outerContainer).width();
        self.optionsHeight = $(self.outerContainer).height();
    }

    function removeClass(self) {
        $(self.outerContainer).find('.more-options-content').removeClass('top-left top-right bottom-left bottom-right');
    }

    // show options to the top of the icon
    function showOptionsTop(self) {
        var optionsTop;

        if (!self.ctrlOffset) {
            return;
        }

        optionsTop = self.ctrlOffset.top - self.optionsHeight - 10;

        // show options to the top left of the icon
        if (self.ctrlOffset && (self.ctrlOffset.left + self.ctrlWidth - self.optionsWidth < 80)) {
            showLeft(self, 'top-left', optionsTop);
        }
            // show options to the top left of the icon
        else {
            showRight(self, 'top-right', optionsTop);
        }

    }

    // show options to the bottom of the icon
    function showOptionsBottom(self) {
        var optionsTop, ctrlHeight = 50;

        if (!self.ctrlOffset) {
            return;
        }

        optionsTop = self.ctrlOffset.top + ctrlHeight - 6;

        // show options to the bottom left of the icon
        if (self.ctrlOffset && (self.ctrlOffset.left + self.ctrlWidth - self.optionsWidth < 80)) {
            showLeft(self, 'bottom-left', optionsTop);
        }
            // show options to the bottom right of the icon
        else {
            showRight(self, 'bottom-right', optionsTop);
        }
    }


    function showLeft(self, className, optionsTop) {
        var optionsLeft;

        optionsLeft = self.ctrlOffset.left;
        addOptionsClass(self, className);

        setOffset(self, optionsLeft, optionsTop);
    }

    function showRight(self, className, optionsTop) {
        var optionsLeft;

        optionsLeft = self.ctrlOffset.left - (Math.abs(self.ctrlWidth - self.optionsWidth));
        //if options having text button adjusting left position
        optionsLeft = !!self.text ? (optionsLeft + 37) : optionsLeft;

        addOptionsClass(self, className);

        setOffset(self, optionsLeft, optionsTop);
    }

    function addOptionsClass(self, className) {
        var moreOptionsContent;

        moreOptionsContent = $(self.outerContainer).find('.more-options-content');
        $(moreOptionsContent).addClass(className);
    }

    //set offset for container
    function setOffset(self, optionsLeft, optionsTop) {
        $(self.outerContainer).css({ 'left': optionsLeft, 'top': optionsTop });
    }

    document.registerElement('mi-more-options-noko', { prototype: proto });

    return proto;
});