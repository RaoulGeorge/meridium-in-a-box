define(function (require) {
    'use strict';

    var $ = require('jquery');

    var view = require("text!./right-sidePanel-control.html"),
        Translator = require('system/globalization/translator'),
    Event = require('system/lang/event');
    var slidePanelRightProto = Object.create(HTMLElement.prototype);

    slidePanelRightProto.minimumWidth;
    slidePanelRightProto.maximumWidth;
    slidePanelRightProto.limitingElement;
    slidePanelRightProto.setNewWidth;

    /*
     * Set or get the panel's minimum width. This width is what determines the default open size of the panel, and 75% of the width
     * is used as the closing threshold
     *
     * [width] - New minimum width for the panel, leave null to get the current value
     */
    slidePanelRightProto.minWidth = function (width) {
        if (width) {
            this.minimumWidth = width;
            return true;
        }
        return this.minimumWidth;
    };

    /*
     * Set or get the panel's maximum width.
     *
     * [width] - New maximum width for the panel, leave null to get the current value
     */
    slidePanelRightProto.maxWidth = function (width) {
        if (width) {
            this.maximumWidth = width;
            return true;
        }
        return this.maximumWidth;
    };

    /*
     * Set or get the panel's limiting element. When a limiting element is set, the panel cannot be opened past the right edge of the
     * limiting element. It is important to note that the panel will not resize with the limiting element until the panel is moved.
     * Be careful assigning an element that changes often or dramatically.
     *
     * [element] - New limiting element for the panel, leave null to get the current value
     */
    slidePanelRightProto.limitElement = function (element) {
        if (element) {
            this.limitingElement = element;
            return this.limitingElement;
        }
        return this.limitingElement;
    };

    slidePanelRightProto.createdCallback = function () {
        //Initializing variables
        var slidepanel = this;
        this.state = 'closed';
        this.tonguePosition = 0;
        this.backdrop = this.getAttribute("backdrop") ? this.getAttribute("backdrop") : "true";
        this.icon = this.getAttribute("icon") ? this.getAttribute("icon") : "icon-view-recommendation";
        this.iconExpand = this.getAttribute("icon-expand") ? this.getAttribute("icon-expand") : "icon-expand";
        this.hideMaxButton = this.getAttribute("hidemaxbutton") ? this.getAttribute("hidemaxbutton") : "false";

        //Events declaration
        this.slideWidthChangedEvent = new Event();
        this.slideWidthHalfEvent = new Event();
        this.slideWidthZeroEvent = new Event();
        //translator
        this.translator = Object.resolve(Translator);

        

        //EventHandlers
        this._windowResize = this.windowResize.bind(this);
        this._handleClick = this.handleClick.bind(this);
        this._maxButtonClick = this.maxButtonClick.bind(this);
        this._closePanel = this.closePanel.bind(this);
    };


    slidePanelRightProto.attachedCallback = function () {

        //Constructing children element
        var slideTabEl = '<div class="slide-tab" style="visibility: visible"><div class="notificationCount"></div><i class="' + this.icon + ' collapsed"></i></div>';
        var slidePanelEl = '<div class="sliderPanel slide-content"></div>';
        var maxButtonEl = '<button class="btn btn-icon expand-button"><i class="icon-move"></i></button>';
        var slidePanelOpacityEl = '<div class="slide-panel-opacity"></div>';

        //Injecting children element
        $(this).wrapInner(slidePanelEl);
        $(this).prepend(slideTabEl);
        $(this).append(maxButtonEl);
        if (this.backdrop.toLowerCase() !== 'false') {
            $(this).append(slidePanelOpacityEl);
        }
        this.classList.add("slide-container");

        //Storing elements into variables
        this.handle = $(this).find('div.slide-tab');
        this.slideContent = $(this).find('div.slide-content');
        this.slidePanelOpacity = $(this).find('div.slide-panel-opacity');
        this.maxButton = $(this).find('button.expand-button');

        attachEventListeners(this);
        this.positionSelf();
    };

    function attachEventListeners(self) {
        //Event handlers
        $(window).on("resize", self._windowResize);
        self.handle.on("click", self._handleClick);
        self.maxButton.on("click", self._maxButtonClick);
        self.slidePanelOpacity.on("click", self._closePanel);
    }

    slidePanelRightProto.detachedCallback = function () {
        detachEventListeners(this);
    };

    function detachEventListeners(self) {
        //Event handlers detaching
        $(window).off("resize", self._windowResize);
        self.handle.off("click", self._handleClick);
        self.maxButton.off("click", self._maxButtonClick);
        self.slidePanelOpacity.off("click", self._closePanel);
    }

    slidePanelRightProto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var windowWidth = window.innerWidth;
        var percentageWidth = (windowWidth) * (33.2 / 100);
        var widthInPx = percentageWidth + 'px';
        var slidepanelright = $(this);

        if (attrName === 'sliderenable') {
            this.sliderenable = newVal;
            if (this.sliderenable === 'true') {
                slidepanelright.find("div.slide-tab").show();
                slidepanelright.find("div.sliderPanel").width(widthInPx);
                slidepanelright.find("div.sliderPanel").css("float", "right");
            } else {
                slidepanelright.find("div.slide-tab").hide();
                slidepanelright.find("div.sliderPanel").width('100%');
                slidepanelright.find("div.sliderPanel").css("float", "left");
            }
        }

        //Handling notificationCount attr here
        if (attrName === "notification-count") {
            if (newVal) {
                slidepanelright.find("div.notificationCount").text(newVal);
                slidepanelright.find("div.notificationCount")[0].style.display="inline";
            } else {
                slidepanelright.find("div.notificationCount").text("");
                slidepanelright.find("div.notificationCount")[0].style.display = "none";
            }
        }
        //Handling backdrop overlay here
        if (attrName === "backdrop") {
            if (newVal.toLowerCase() === 'false') {
                slidepanelright.find("div.slide-panel-opacity").hide();
            } else {
                slidepanelright.find("div.slide-panel-opacity").show();
            }
        }

        if (attrName === "hidemaxbutton") {
            this.hideMaxButton = newVal.toString();
            if (this.hideMaxButton === "true") {
                slidepanelright.maxButton.hide();
            }
            else {
                slidepanelright.maxButton.show();
            }
        }
    };

    slidePanelRightProto.windowResize = function () {
        if (this.state === 'half-open') {
            this.openHalf();
        } else if (this.state === 'full-open') {
            this.maximize();
        }
    };
    slidePanelRightProto.handleClick = function () {
        if (this.state === 'closed') {
            this.openHalf();
        } else if (this.state === 'half-open' || this.state === 'full-open') {
            this.closePanel();
        }
    };

    slidePanelRightProto.maxButtonClick = function () {
        if (this.state === 'full-open') {
            this.openHalf();
        } else {
            this.maximize();
        }
    };

    slidePanelRightProto.positionSelf = function () {
        var TONGUE_HEIGHT = 60;
        var predecessorCount = this.getPredecessorCount();
        $(this).find('div.slide-tab').css('top', (predecessorCount * TONGUE_HEIGHT + 70));
    };

    slidePanelRightProto.getPredecessorCount = function () {
        var allSlidePanelRight = $('mi-slidepanelright-m');
        var idx = allSlidePanelRight.index(this);
        return idx;
    };

    slidePanelRightProto.maximize = function () {
        $(this).find('.expand-button').attr('title', this.translator.translate('RECOMMENDATIONS_OPEN_HALF'));
        this.style.width = window.innerWidth - 80 + 'px';
        this.slideWidthChangedEvent.raise($(this).width());
        this.state = 'full-open';
    };

    //Open the panel half
    slidePanelRightProto.openHalf = function () {
        $(this).find('.expand-button').attr('title', this.translator.translate('RECOMMENDATIONS_OPEN_FULL'));
        $('mi-slidepanelright-m').not(this).hide();
        this.slidePanelOpacity.show();
        if (this.hideMaxButton === "false") {
            this.maxButton.show();
        }        
        this.style.width = window.innerWidth / 2 + 'px';
        this.style.height = 'calc(100% - 80px)';
        if (this.state === 'closed') {
            this.tonguePosition = this.handle.css('top');
            this.handle.css('top', '10px');
        }
        //Change icons
        $(this).find('.icon-settings').removeClass(this.icon).addClass(this.iconExpand);
        this.slideWidthHalfEvent.raise($(this).width());
        this.state = 'half-open';
    };

    //Close the panel
    slidePanelRightProto.closePanel = function () {
        $('mi-slidepanelright-m').show();
        this.slidePanelOpacity.hide();
        this.maxButton.hide();
        this.style.width = '30px';
        this.style.height = '0px';
        this.handle.css('top', this.tonguePosition);
        $(this).find('.icon-expand').removeClass(this.iconExpand).addClass(this.icon);
        this.slideWidthZeroEvent.raise($(this).width());
        this.state = 'closed';

    };
    var slidePanelRight = document.registerElement("mi-slidepanelright-m", { prototype: slidePanelRightProto });

    return (slidePanelRight);
});