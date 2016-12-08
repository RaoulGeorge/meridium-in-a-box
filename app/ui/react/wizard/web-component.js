define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');

    var React = require('react'),
        ReactDOM = require('react-dom'),
        Region = require('spa/region');

    var WizardComponent = require('ui/react/wizard/element');
    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var self = this;
        self._private = {
            steps: [],
            contentType: null,
            activeChanged: null,
            completed: null,
            stateCache: false
        };
        self.wizardComponent = null;
        defineProperties(self, self._private);
    };

    function defineProperties(self, props) {
        _.each(props, defineProperty.bind(null, self));
    }

    function defineProperty(self, value, key) {
        Object.defineProperty(self, key, {
            get: getPropertyVal.bind(null, self, key),
            set: setPropertyVal.bind(null, self, key),
        });
    }

    proto.attachedCallback = function () {
        this.render();
    };

    proto.detachedCallback = function () {
        this.innerHTML = '';
    };

    proto.render = function () {
        var self = this;
        var mountPoint = this.querySelector('.react-mountpoint');
        if (mountPoint) {
            ReactDOM.unmountComponentAtNode(mountPoint);
        } else {
            mountPoint = document.createElement('div');
            mountPoint.className = 'react-mountpoint';
            this.appendChild(mountPoint);
        }
        if (self._private['steps'].length) {
            ReactDOM.render(ReactWizardElement(this), mountPoint);
        }
    };

    proto.appendWizardContent = function (self, activeIndex, wizardComponent) {
        $(self).find('.wizard-steps').hide();
        if ($(self).find('.wizard_step_' + activeIndex).length !== 0 && self.stateCache) {
            $(self).find('.wizard_step_' + activeIndex).show();
        } else {
            var el = self.querySelector('.content');
            var steps = self._private['steps'];
            steps[activeIndex].region = wrapKnockoutView(steps[activeIndex].content, self);
            var koElement = $(self._private['steps'][activeIndex].region.element).wrap("<div/>");
            $(koElement).addClass('wizard-steps wizard_step_' + activeIndex);
            el.appendChild(koElement[0]);
        }
        self.wizardComponent = wizardComponent;
    };

    function ReactWizardElement(self) {
        return React.createElement(WizardComponent, {
            steps: getPropertyVal(self, 'steps'),
            contentType: getPropertyVal(self, 'contentType'),
            stateCache: false,
            appendWizardContent: self.appendWizardContent.bind(null, self),
            activeChanged: getPropertyVal(self, 'activeChanged'),
            completed: getPropertyVal(self, 'completed')
        });
    }

    function wrapKnockoutView(knockOutView, self) {
        var region = new Region();
        region.setElement($('<div/>'));
        var viewInstance = Object.resolve(knockOutView);
        viewInstance.attach(region);
        viewInstance.validate = validate.bind(null, self);
        return region;
    }

    function validate(self, val) {
        self.wizardComponent.enableNextPage(true);
    }

    function getPropertyVal(self, propName) {
        return self._private[propName];
    }

    function setPropertyVal(self, propName, val) {
        self._private[propName] = val;
        self.render();
    }

    document.registerElement('mi-raw-wizard', { prototype: proto });

    return proto;
});