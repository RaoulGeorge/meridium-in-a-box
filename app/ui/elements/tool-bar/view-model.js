define(function () {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var button, icon;

        this._closeOverflowBind = closeOverflow.bind(null, this);
        this.$filter = null;
        this.popoverId = null;

        button = document.createElement('button');
        button.className = 'more-options-icon btn btn-primary btn-icon dropdown-toggle';
        this.appendChild(button);

        icon = document.createElement('icon');
        icon.className = 'icon-options';
        button.appendChild(icon);
        this.throttledPositionEllipsis = _.throttle(this.positionEllipsis.bind(this), 650);
    };

    proto.attachedCallback = function () {
        _.defer(positionEllipsisAfterAttach.bind(null, this));

        window.addEventListener('resize', this);
        document.querySelector('body').addEventListener('click', this._closeOverflowBind);
        this.addEventListener('click', this);
    };

    proto.detachedCallback = function () {
        var popover;

        window.removeEventListener('resize', this);
        document.querySelector('body').removeEventListener('click', this._closeOverflowBind);
        if (this.$filter) {
            popover = document.querySelector(this.popOverId);
            if (popover) {
                popover.parentElement.removeChild(popover);
            }
			this.$filter = null;
        }
    };

    proto.handleEvent = function (e) {
        var moreOptions, toolbarOverflow, original, clone;

        if (e.type === 'resize' && e.target === window) {
            this.throttledPositionEllipsis();
        } else if (e.type === 'click') {
            moreOptions = this.querySelector('.more-options-icon');
            toolbarOverflow = document.querySelector(this.popOverId);
            if (e.target === moreOptions || moreOptions.contains(e.target)) {
                showOverFlow(this);
            } else if (toolbarOverflow && toolbarOverflow.contains(e.target)) {
                clone = e.target;
                while (clone && !original) {
                    if (clone.original) {
                        original = clone.original;
                    }
                    clone = clone.parentElement;
                }
                if (original) {
                    e.cancelBubble = true;
                    original.dispatchEvent(new CustomEvent('click', { bubble: true }));
                }
            }
            if (e.target.parentElement.classList.contains('tool-bar-overflow')) {
                this._closeOverflowBind(this, e);
            }
        }
    };

    proto.positionEllipsis = function () {
        var element = this.firstElementChild,
            moreOptions = this.querySelector('.more-options-icon'),
            contentSectionSize = document.querySelector('.content').getBoundingClientRect(),
            numberOfOverflowElements = 0,
            LEFT_OFFSET = 5,
            parentIsTree,
            hasOverflow = false,
            moreOptionsRectangle, elementRectangle, parentRectangle, left, self;

        self = this;

        if (this.offsetParent === null) {
            return;
        }

        parentRectangle = this.parentElement.getBoundingClientRect();
        parentIsTree = this.parentElement.tagName === 'MI-TREE';
        if (this.$filter) {
            this.$filter.popover('hide');
        }

        if (!element || element === moreOptions) {
            //moreOptions.style.visibility = 'hidden';
        } else {
            moreOptionsRectangle = moreOptions.getBoundingClientRect();
            if (contentSectionSize.width === parentRectangle.width || parentIsTree) {
                left = parentRectangle.width - moreOptionsRectangle.width - LEFT_OFFSET;
            }else{
                left = parentRectangle.left + parentRectangle.width - moreOptionsRectangle.width - LEFT_OFFSET;
            }

            elementRectangle = element.getBoundingClientRect();
            numberOfOverflowElements = getNumberOfOverflowElements(self, moreOptions, elementRectangle, parentRectangle);
            element = this.firstElementChild;

            while (element) {
                elementRectangle = element.getBoundingClientRect();
                if (elementIsEligibleForOverflow(element, moreOptions, elementRectangle, parentRectangle)) {
                    if (elementFloatsRight(element)) {
                        if (numberOfOverflowElements > 0) {
                            hasOverflow = true;
                            element.classList.add('overflow');
                            elementAddRightMargin(element);
                            numberOfOverflowElements--;
                            numberOfOverflowElements = getNumberOfOverflowElements(self, moreOptions, elementRectangle, parentRectangle);
                        } else {
                            elementRemoveRightMargin(element);
                            element.classList.remove('overflow');
                        }
                    } else {
                        if (elementIsOverflowing(element, this)) {
                            hasOverflow = true;
                            element.classList.add('overflow');

                        } else {
                           elementRemoveRightMargin(element);
                           element.classList.remove('overflow');
                        }
                    }
                }

                if (element !== null) {
                    element = element.nextElementSibling;
                }
            }
            if (hasOverflow) {
                moreOptions.style.visibility = 'visible';
                moreOptions.style.left = left.toString() + 'px';
            } else {
                moreOptions.style.visibility = 'hidden';
            }
        }
    };

    function elementAddRightMargin(element){
        var el = $(element);
        if(el.next().text() !=='' && !el.hasClass('more-options-icon')){
            el.next().css({"margin-right":"20px"});
        }
    }

    function elementRemoveRightMargin(element){
        var el = $(element),
            unHidden = [];
        if(el.hasClass('overflow')){
            el.attr('style', '');
        }

        el.parent().children().each(function(i,e){
            if($(this).css('float') === 'right' && !$(this).hasClass('overflow')){
                unHidden.push($(this));
            }
        });

        $.each(unHidden, function(i){
            if(i !== 0 ){
                $(this).attr('style', '');
            }
        });
    }

    function getNumberOfOverflowElements(self, moreOptions, elementRectangle, parentRectangle) {
        var element,
            numberOfOverflowElements = 0;

        element = self.firstElementChild;

        while (element) {
            if (elementIsEligibleForOverflow(element, moreOptions, elementRectangle, parentRectangle)) {
                if (elementIsOverflowing(element, self)) {
                    if (elementFloatsRight(element)) {
                        numberOfOverflowElements++;
                    }
                }
            }
            element = element.nextElementSibling;
        }

        return numberOfOverflowElements;
    }

    function elementFloatsRight(element) {
        return $(element).css('float') === 'right';
    }

    function elementIsEligibleForOverflow(element, moreOptions, elementRectangle, parentRectangle) {
        var isAddItem = element.getAttribute('data-action') === 'addItem';

        return element !== moreOptions && elementRectangle.width !== parentRectangle.width && !isAddItem;
    }

    function elementIsOverflowing(element, toolbar) {
        return $(element).position().top > ($(toolbar).position().top + $(toolbar).height());
    }

    function showOverFlow(self) {
        if (self.$filter) {
            return;
        }
        var popoverLeft, popoverWidth;

        self.$filter = $(self.querySelector('.more-options-icon'));
        self.$filter.popover({ placement: 'bottom', container: 'body', content: ' ' });
        self.$filter.on('shown.bs.popover', self, attachToPopover);
        self.$filter.on('hide.bs.popover', self, detachFromPopover);
        self.$filter.on('hidden.bs.popover', self, destroyPopover);
        self.$filter.popover('show');

        setTimeout(function () {
            popoverLeft = parseInt($(self.popOverId).css('left'));
            popoverWidth = parseInt($(self.popOverId).width());
            $(self.popOverId).css('left', popoverLeft - (popoverWidth - 15));
        }, 250);
    }

    function closeOverflow (self, e) {
        var popOver;
        if (self.$filter) {
            popOver = document.querySelector(self.popOverId);
            if (!popOver || popOver.contains(e.target) || e.target === self) {
                return;
            }
            self.$filter.popover('hide');
        }
    }

    function attachToPopover (e) {
        var self = e.data,
            content, elements = self.querySelectorAll('.overflow'),
            i, clone;

        self.popOverId = '#' + e.target.attributes['aria-describedby'].value;
        content = document.querySelector(self.popOverId + ' .popover-content');
        content.classList.add('tool-bar-overflow');

        for (i = 0; i < elements.length; i++) {
            clone = elements[i].cloneNode();
            clone.original = elements[i];
            content.appendChild(clone);
            clone.textContent = clone.getAttribute('title');
        }

        content.addEventListener('click', self);
    }

    function detachFromPopover(e) {
        var self = e.data, content;

        content = document.querySelector(self.popOverId + ' .popover-content');

        if (content) {
            content.addEventListener('click', self);
        }

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
        }
    }

    function positionEllipsisAfterAttach(self) {
        if (self && self.positionEllipsis && self.positionEllipsis instanceof Function) {
            self.positionEllipsis();
        }
    }


    document.registerElement('mi-tool-bar', { prototype: proto });

    return proto;
});
