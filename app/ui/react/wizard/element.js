define(function (require) {
    'use strict';

    var React = require('react'),
        ReactDOM = require('react-dom'),
        WizardView = require('./element-view'),
        converter = require('system/lang/converter');

    var div = React.DOM.div,
        header = React.DOM.header,
        footer = React.DOM.footer,
        button = React.DOM.button,
        ul = React.DOM.ul;

    //CONSTANTS 
    var CNT_TYPE_TXT = 'text',
        CNT_TYPE_VM = 'viewModel',
        CNT_TYPE_KO_VM = 'koViewModel';

    function Wizard(props) {
        base.call(this, props);
        //Properties
        this.steps = props.steps;
        this.activeIndex = 0;
        this.contentType = props.contentType;
        this.stateCache = props.stateCache;

        //State Initialization
        this.setInitialState();

        //Callback Functions
        if (props.activeChanged) {
            this.activeChanged = props.activeChanged;
        }
        if (props.completed) {
            this.completed = props.completed;
        }
        this.wizardView = Object.resolve(WizardView);
    }
    var base = Object.inherit(React.Component, Wizard);
    var prototype = Wizard.prototype;

    prototype.setInitialState = function () {
        var self = this;
        self.state = { nextPage: !converter.toBoolean(self.steps[self.activeIndex].validation, 'true') };
    };

    prototype.componentDidMount = function () {
        updateWizardContent(this);
    };

    prototype.componentDidUpdate = function () {
        updateWizardContent(this);
    };

    prototype.enableNextPage = function (validation) {
        this.setState({ nextPage: validation });
    };

    prototype.render = function () {
        var self = this;
        return div({ className: 'r-wizard' },
                    header({ className: 'header' }, div(null, ul({ key: 0 }, self.wizardView.constructSteps(self, self.steps)))),
                    div({ className: 'content', ref: 'content' }, self.wizardView.constructContent(self)),
                    footer({ className: 'footer' }, self.wizardView.constructButton(self))
                );
    };

    function updateWizardContent(self) {
        if (self.contentType === CNT_TYPE_KO_VM) {
            self.props.appendWizardContent(self.activeIndex, self);
        }
    }
 
    return Wizard;
});