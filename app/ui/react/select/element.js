define(function (require) {
    'use strict';

    var React = require('react'),
        ReactDOM = require('react-dom');

    var DropdownComponent = require('../dropdown/dropdown');

    var div = React.DOM.div,
        input = React.DOM.input,
        button = React.DOM.button,
        span = React.DOM.span,
        ul = React.DOM.ul,
        li = React.DOM.li,
        icon = React.DOM.i;

    function Select(props) {
        base.call(this, props);
        this.state = {
            options: [],
            caption: '',
            value: ''
        };

        this.isComponentMounted = false;
    }

    var base = Object.inherit(React.Component, Select);
    var prototype = Select.prototype;

    prototype.componentWillMount = function () {
        var props = this.props;

        var stateFromProps = {};
        stateFromProps.value = props.value;
        stateFromProps.options = [].concat(props.options);
        stateFromProps.caption = props.caption;
        if (props.caption) {
            stateFromProps.options.unshift(props.caption);
        }

        this.setState(stateFromProps);
    };

    prototype.componentDidMount = function () {
        var self = this;
        self.isComponentMounted = true;
    };
    prototype.componentWillUnmount = function () {
        var self = this; 
        self.refs.dropdown && self.refs.dropdown.closePopup();
        self.isComponentMounted = false;
    };

    prototype.render = function () {
        var props = this.props;
        return React.createElement(DropdownComponent, {
            ref: 'dropdown',
            target: Rbutton(this),
            popupDOM: getPopupDOM.bind(null, this)
        });
    };

    function Rbutton(self) {
        return {
            element: button,
            props: {
                'type': 'button',
                'text': self.state.value || self.state.caption,
                'className': 'btn btn-primary mir-dropdown-selector ' + (self.props.className || ''),
                style: self.props.style
            },
            children: [span({ 'key': 'text', 'className': 'mi-selected-value-text pull-left' }, self.state.value || self.state.caption),
                icon({ 'key': 'icon', 'className': 'pull-right icon-arrow' })]
        };
    }

    function getPopupDOM(self) {
        var props = self.props,
            options = self.state.options,
            mapper = optionItem.bind(null, self);

        return div({ style: { 'visibility': 'hidden' }, 'className' : 'r-dropdown-popup-container' },
            div({ 'className': 'r-select-options-container' },
            ul(null, options.map(mapper))));
    }

    function optionItem(self, option) {
        var props = self.props;
        return li({
            key : option,
            className: 'mi-select-option ' + (isActiveOption(self, option) ? 'active' : ''),
            onMouseDown: stopEvent,
            onClick :selectOption.bind(null, self, option)
        }, option);
    }

    function isActiveOption(self, option) {
        return option === self.state.value || (option === self.state.caption && !self.state.value);
    }

    function stopEvent(ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }

    function selectOption(self, option, ev) {
        var value = option === self.state.caption ? '' : option;
        self.props.onChange && self.props.onChange(value);
        if (self.isComponentMounted) {
            self.setState({ value: value });
            self.refs.dropdown && self.refs.dropdown.closePopup();
        }
    }

    return Select;
});