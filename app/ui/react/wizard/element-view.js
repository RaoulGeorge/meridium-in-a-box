define(function (require) {
    'use strict';

    var React = require('react'),
        ReactDOM = require('react-dom'),
        WizardContent = require('./wizard-content'),
        converter = require('system/lang/converter');

    var div = React.DOM.div,
        header = React.DOM.header,
        footer = React.DOM.footer,
        button = React.DOM.button,
        ul = React.DOM.ul,
        li = React.DOM.li,
        input = React.DOM.input;

    //CONSTANTS 
    var CNT_TYPE_TXT = 'text',
        CNT_TYPE_VM = 'viewModel',
        CNT_TYPE_KO_VM = 'koViewModel';

    function WizardView(props) {
        base.call(this, props);
    }
    var base = Object.inherit(React.Component, WizardView);
    var prototype = WizardView.prototype;

    prototype.constructSteps = function constructSteps(self, steps) {
        var step_width = ((100 - (0.4 * steps.length)) / steps.length);

        return steps.map(function (step, i) {
            return li({
                key: i,
                style: {
                    width: step_width + '%'
                },
                className: i === self.activeIndex ? 'active' : ''
            },
                    div(null, step.title)
                );
        });
    };

    prototype.constructContent = function constructContent(self) {
        var clientComponent = self.steps[self.activeIndex].content;
        var viewModel = null;
        if (self.contentType === CNT_TYPE_TXT) {
            viewModel = clientComponent;
        } else if (self.contentType === CNT_TYPE_VM && self.stateCache) {
            viewModel = React.createElement(WizardContent, {
                ref: 'wizardContent',
                content: clientComponent,
                enableNextPage: self.enableNextPage.bind(self)
            });
        } else if (self.contentType === CNT_TYPE_VM) {
            viewModel = React.createElement(clientComponent, {
                validation: function (isValid) {
                    if (isValid) {
                        self.setState({ nextPage: true });
                    }
                }
            });
        } else if (self.contentType === CNT_TYPE_KO_VM) {
            viewModel = '';
        } else {
            console.log("<!---- Invalid Content Type ---->");
        }
        return viewModel;
    };

    prototype.constructButton = function constructButton(self) {
        var buttonClass = ' btn btn-primary btn-text';
        var nextButtonClass = '', prevButtonClass = '', finishButtonClass = '';

        if (self.activeIndex === 0) {//first Step
            nextButtonClass = 'next';
            prevButtonClass = 'back hidden';
            finishButtonClass = 'finish hidden';
        } else if ((self.steps.length - 1) === self.activeIndex) {//Last Step
            nextButtonClass = 'next hidden';
            prevButtonClass = 'back';
            finishButtonClass = 'finish';
        } else {//Inbetween Steps
            nextButtonClass = 'next';
            prevButtonClass = 'back';
            finishButtonClass = 'finish hidden';
        }

        return [button(
            {
                key: 0,
                className: nextButtonClass + buttonClass,
                onClick: navigateContent.bind(null, self, 'next'),
                disabled: !self.state.nextPage
            }, 'Next'),
            button(
            {
                key: 1,
                className: finishButtonClass + buttonClass,
                onClick: finishButton.bind(null, self),
                disabled: !self.state.nextPage
            }, 'Finish'),
            button(
            {
                key: 2,
                className: prevButtonClass + buttonClass,
                onClick: navigateContent.bind(null, self, 'prev')
            }, 'Previous')];
    };

    function navigateContent(self, direction) {
        if (direction === 'next') {
            self.activeIndex = self.activeIndex + 1;
        } else {
            self.activeIndex = self.activeIndex - 1;

        }
        self.setState({ nextPage: !converter.toBoolean(self.steps[self.activeIndex].validation, 'true') });
        if (self.stateCache) {
            var clientComponent = self.steps[self.activeIndex].content;
            self.refs.wizardContent.updateWizardContent(clientComponent, self.activeIndex);
        }

        //Callback to user
        if (self.activeChanged) {
            self.activeChanged.call(self.activeIndex);
        }
    }

    function finishButton(self) {
        if (self.completed) {
            self.completed.call(self.activeIndex);
        }
    }

    return WizardView;
});