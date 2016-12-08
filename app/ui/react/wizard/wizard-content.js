define(function (require) {
    'use strict';

    var React = require('react'),
        ReactDOM = require('react-dom');

    var div = React.DOM.div,
        header = React.DOM.header,
        footer = React.DOM.footer,
        button = React.DOM.button,
        ul = React.DOM.ul,
        li = React.DOM.li,
        input = React.DOM.input;

    function WizardContent(props) {
        base.call(this, props);
        this.contentArr = [props.content];
        this.activeIndex = 0;
        this.enableNextPage = props.enableNextPage;
    }
    var base = Object.inherit(React.Component, WizardContent);
    var prototype = WizardContent.prototype;

    prototype.updateWizardContent = function (content, activeIndex) {
        this.activeIndex = activeIndex;
        this.contentArr[activeIndex] = content;
        this.forceUpdate();
    };

    prototype.render = function () {
        var self = this;
        return div({}, self.contentArr.map(function (content, i) {
            return div({
                key: i,
                className: i === self.activeIndex ? '' : 'hideContent'
            }, React.createElement(content, {
                validation: function (isValid) {
                    if (isValid) {
                        self.props.enableNextPage(isValid);
                    }
                    alert('Validation Done');
                }
            }));
        }));
    };

    return WizardContent;
});