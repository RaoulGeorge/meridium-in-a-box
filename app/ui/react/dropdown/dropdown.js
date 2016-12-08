define(function (require) {
    'use strict';

    var $ = require('jquery');

    var React = require('react'),
        ReactDOM = require('react-dom');

    var div = React.DOM.div,
        input = React.DOM.input,
        span = React.DOM.span,
        ul = React.DOM.ul,
        li = React.DOM.li,
        icon = React.DOM.i;

    function Dropdown(props) {
        base.call(this, props);
        this.state = {
            isOpened: false,
            isInitialized: false
        };

        this.popupContainer = null;
    }

    var base = Object.inherit(React.Component, Dropdown);
    var prototype = Dropdown.prototype;

    prototype.closePopup = function () {
        showPopup(this);
    };

    prototype.closePopup = function () {
        hidePopup(this);
    };

    prototype.render = function () {
        var self = this;
        var props = this.props;
        var target = props.target;

        if (self.popupContainer && self.state.isOpened) {
            self.setOptionContainerPosition(self);
        }

        target.props.onFocus = handleElementFocus.bind(null, this);
        target.props.onBlur = hidePopup.bind(null, this);
        target.props.onClick = handleElementFocus.bind(null, this);

        var text = target.props.text;
        delete target.props.text;

        return target.element(target.props, target.children && target.children.length ? target.children : text);
    };

    function handleElementFocus(self) {
        //if (!self.state.isInitialized) {
            generatePopupContents(self);
        //}
        showPopup(self);
    }

    function generatePopupContents(self) {

        var outerContainer = getOuterContainer();
        self.popupContainer = ReactDOM.render(getPopupDOM(self), outerContainer);
        self.element = self.container = ReactDOM.findDOMNode(self);
        //self.setState({isInitialized: true});
       
    }

    function getOuterContainer() {
        //Due to react restriction we can't add dom to body
        var container = document.querySelector('.react-outer-container');
        if (!container) {
            container = document.createElement('div');
            container.classList.add('react-outer-container');
            document.body.appendChild(container);
        }
        return container;
    }

    prototype.setOptionContainerPosition = function (self) {

        var ctrlOffset, ctrlWidth, ctrlHeight, popupOffset,
            optionsContainerDiv, $optionsContainerDiv;

        optionsContainerDiv = self.popupContainer;
        $optionsContainerDiv = $(optionsContainerDiv);

        ctrlOffset = $(self.container).offset();
        ctrlHeight = $(self.element).outerHeight();
        ctrlWidth = $(self.container).width();

        if (!ctrlOffset) {
            return;
        }
       
        $optionsContainerDiv.css({
            'position': 'absolute',
            'min-width': ctrlWidth,
            'z-index': 100000,
        });

       
        popupOffset = getPopupPosition(self, $optionsContainerDiv, ctrlOffset, ctrlWidth, ctrlHeight);

        $optionsContainerDiv.removeClass('top-left top-right bottom-left bottom-right').addClass(popupOffset.className);

        $optionsContainerDiv.css({
            'left': popupOffset.left,
            'top': popupOffset.top,
            'visibility': 'visible'
        });

    };


    function getPopupPosition(self, $optionsContainerDiv, ctrlOffset, ctrlWidth, ctrlHeight) {

        var optionsWidth, optionsHeight, optionsTop, optionsLeft, arrowPosClass, NAV_HEIGHT = 80;

        optionsWidth = $optionsContainerDiv.outerWidth();
        optionsHeight = $optionsContainerDiv.outerHeight();

        // Extra 50px offset because of status bar hiding the dropdown
        if (ctrlOffset.top + optionsHeight + 50 >= $(window).height()) {
            // move options to the top of the Ctrl
            optionsTop = ctrlOffset.top - optionsHeight - 20;

            if (ctrlOffset.left + ctrlWidth - optionsWidth < NAV_HEIGHT) {
                optionsLeft = ctrlOffset.left;
                arrowPosClass = 'top-left';
            }
            else {
                optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth));
                arrowPosClass = 'top-right';
            }

        } else {

            optionsTop = ctrlOffset.top + ctrlHeight + 10;

            if (ctrlOffset.left + ctrlWidth - optionsWidth < NAV_HEIGHT) {
                optionsLeft = ctrlOffset.left;
                arrowPosClass = 'bottom-left';
            }
            else {
                optionsLeft = ctrlOffset.left - (Math.abs(ctrlWidth - optionsWidth)) + 7;
                arrowPosClass = 'bottom-right';
            }
        }
        return {
            top: optionsTop,
            left: optionsLeft,
            className: arrowPosClass
        };
    }

    function getPopupDOM(self) {
        var props = self.props;

        return props.popupDOM();
    }

   

    function togglePopup(self) {
        if (self.state.isOpened) {
            hidePopup(self);
        } else {
            showPopup(self);
        }
    }

    function hidePopup(self) {
        if (self.popupContainer && self.state.isOpened) {
            self.popupContainer.style.visibility = 'hidden';
        }
        self.setState({isOpened : false});
    }

    function showPopup(self) {
       
        self.setState({ isOpened: true });
    }

    return Dropdown;
});