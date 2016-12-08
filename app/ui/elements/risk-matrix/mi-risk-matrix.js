define(function (require) {
    'use strict';

    var Translator = require('system/globalization/translator'),
        Formatter = require('system/text/formatter'),
        Parser = require('system/text/parser'),
        RiskMatrixService = require('ui/elements/risk-matrix/services/risk-matrix-service'),
        ErrorMessage = require('system/error/error-message'),
        ApplicationEvents = require('application/application-events'),
        proto = Object.create(HTMLElement.prototype),
        CASCADE_ATTRIBUTES = [
            'readonly',
            'lock-consequence',
            'lock-probability',
            'hide-not-applicable'
        ],
        NUMBER_FORMAT = 'm';

    require('ui/elements/risk-matrix/mi-risk-matrix-financial');
    require('ui/elements/risk-matrix/mi-risk-matrix-nonfinancial');

    proto.createdCallback = function () {
        addProperties(this);
    };

    proto.attachedCallback = function () {
        this.addEventListener('change', this);
        this.addEventListener('click', this);
    };

    proto.attributeChangedCallback = function (attr, oldValue, newValue) {
        var target;

        if (attr === 'risk-matrix-key') {
            loadRiskMatrix(this);
        } else if (CASCADE_ATTRIBUTES.indexOf(attr) > -1) {
            target = this.querySelector('.risk-matrix-tab');
            if (!target) {
                return;
            }
            if (newValue !== null) {
                target.firstElementChild.setAttribute(attr, newValue);
            } else {
                target.firstElementChild.removeAttribute(attr);
            }
        }
    };

    proto.handleEvent = function (e) {
        if (e.type === 'click') {
            clickHandler(this, e);
        } else if (e.type === 'change') {
            updateValue(this, e);
        }
    };

    function hasCalculatorFunction (self) {
		return self.settings.calculator && typeof self.settings.calculator === "function";
	}

    function updateValue (self, e) {
        var active = self.querySelector('.nav li.active a');

        if (e.target.nodeName !== 'MI-RISK-MATRIX-FINANCIAL' &&
            e.target.nodeName !== 'MI-RISK-MATRIX-NONFINANCIAL') {
            return;
        }
        active.mi_data.value = e.target.value;
        setTabTitle(self, active);
    }

    function addProperties (self) {
        self.translator = Object.resolve(Translator);
        self.formatter = Object.resolve(Formatter);
        self.settings = {
            matrix: null,
            service: null,
            value: null,
            calculator: null
        };
        self.settings.service = Object.resolve(RiskMatrixService);
        self.errorOccured = Object.resolve(ApplicationEvents).errorOccured;
        Element.defineProperty(self, 'matrix', {
            get: getMatrix.bind(null, self),
            set: setMatrix.bind(null, self)
        });
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });
        Element.defineProperty(self, 'calculator', {
            get: getCalculator.bind(null, self),
            set: setCalculator.bind(null, self)
        });
    }

    function getMatrix (self) {
        return self.settings.matrix;
    }

    function setMatrix(self, value) {
        if (value && value.categories.length > 0) {
            self.settings.matrix = value;
        }
        generateDom(self);
    }

    function getValue (self) {
        var idx, tabs, values = {unmitigated: [], mitigated: []};

        tabs = self.querySelectorAll('.nav li a');
        for (idx = 0; idx < tabs.length; idx++) {
            values.unmitigated[values.unmitigated.length] = tabs[idx].mi_data.value.unmitigated;
            if (tabs[idx].mi_data.value.mitigated) {
                values.mitigated[values.mitigated.length] = tabs[idx].mi_data.value.mitigated;
            }
        }
        if (values.mitigated.length === 0) {
            values.mitigated = null;
        }
        self.settings.value = values;
        return values;
    }

    function setValue (self, v) {
        var idx, tabs, tab, tabArea;

        self.settings.value = v;
        tabs = self.querySelectorAll('.nav li a');
        for (idx = 0; idx < tabs.length; idx++) {
            tabs[idx].mi_data.value = { unmitigated: null, mitigated: null };
            setTabTitle(self, tabs[idx]);
        }
        v = v || [];
        updateTab(self, 'unmitigated', v);
        updateTab(self, 'mitigated', v);
        tab = self.querySelector('.nav li.active a');
        tabArea = self.querySelector('.risk-matrix-tab');
        if (tabArea && tabArea.firstElementChild) {
            tabArea.firstElementChild.value = tab.mi_data.value;
        }
    }

    function getCalculator (self) {
        return self.settings.calculator;
    }

    function setCalculator (self, value) {
        self.settings.calculator = value;
    }

    function updateTab (self, property, value) {
        var idx, tab;

        if (value[property] && value[property].length > 0) {
            for (idx = 0; idx < value[property].length; idx++) {
                if (value[property][idx]) {
                    tab = self.querySelector('.nav li a[data-category="' + value[property][idx].categoryName + '"]');
                    if (tab) {
                        tab.mi_data.value[property] = value[property][idx];
                        setTabTitle(self, tab);
                    }
                }
            }
        }
    }

    function loadRiskMatrix (self) {
        self.settings.service.getRiskMatrixByKey(self.getAttribute('risk-matrix-key'))
            .done(riskMatrixLoaded.bind(null, self))
            .fail(error.bind(null, self));
    }

    function riskMatrixLoaded (self, data) {
        self.matrix = data;
    }

    function generateDom (self) {
        var ul, li, a, idx, category, tab, valueSpan, categorySpan, tabWidth;

        Element.clearDom(self);
        if (!self.matrix) {
            return;
        }
        ul = document.createElement('ul');
        ul.className = 'nav nav-pills';
        tabWidth = 'calc(' + Math.floor(100/self.matrix.categories.length) + '% - 6px)';
        for (idx = 0; idx < self.matrix.categories.length; idx++) {
            category = self.matrix.categories[idx];
            li = document.createElement('li');
            if (idx === 0) {
                li.className = 'active';
            }
            li.style.width = tabWidth;
            ul.appendChild(li);
            a = document.createElement('a');
            a.mi_data = { category: category, value: { unmitigated: null, mitigated: null } };
            a.setAttribute('href', '#');
            a.setAttribute('data-category', category.name);
            valueSpan = document.createElement('span');
            valueSpan.className = 'risk-rank-tab-title';
            a.appendChild(valueSpan);
            categorySpan = document.createElement('span');
            categorySpan.appendChild(document.createTextNode(category.formattedName));
            a.appendChild(categorySpan);
            setTabTitle(self, a);
            li.appendChild(a);
        }
        self.appendChild(ul);
        tab = document.createElement('div');
        tab.className = 'risk-matrix-tab';
        self.appendChild(tab);
        if (self.settings.value) {
            updateTab(self, 'unmitigated', self.settings.value);
            updateTab(self, 'mitigated', self.settings.value);
        }
        setTabContents(self);
    }

    function setTabTitle(self, tab) {
        var tabValue = tab.mi_data,
            value, riskRank;

        if (tabValue.value) {
            if (tabValue.value.mitigated) {
                value = getRiskValue(self, tabValue.value.mitigated, tabValue.category.isFinancial);
            }
            if (!value) {
                value = getRiskValue(self, tabValue.value.unmitigated, tabValue.category.isFinancial);
            }
        }
        riskRank = tab.querySelector('.risk-rank-tab-title');
        Element.clearDom(riskRank);

        if (tabValue.category.isFinancial) {
            value = formatFloat(self, value, 2);
        } else {
            value = formatFloat(self, value, 4);
        }
        riskRank.appendChild(document.createTextNode(value || '\u00A0'));
    }

    function getRiskValue (self, risk, isFinancial) {
        if (!risk) {
            return '';
        }
        if (risk.notApplicable) {
            return self.translator.translate('NA');
        }
        return checkRiskRankAlias(self, risk.riskRankAlias, isFinancial) || risk.rank;
    }

    function checkRiskRankAlias(self, alias, isFinancial) {
        if (isFinancial || !self.settings.matrix.showAlias || alias === ' - ') {
            return '';
        } else {
            return alias;
        }
    }

    function setTabContents (self) {
        var active = self.querySelector('li.active a'),
            category = active.mi_data.category,
            value = active.mi_data.value,
            div = self.querySelector('.risk-matrix-tab'),
            element;

        Element.clearDom(div);
        if (category.isFinancial) {
            element = document.createElement('mi-risk-matrix-financial');
            element.calculator = self.settings.calculator;
        } else {
            element = document.createElement('mi-risk-matrix-nonfinancial');
            element.calculator = self.settings.calculator;
        }
        if (self.getAttribute('readonly') !== null) {
            element.setAttribute('readonly', 'readonly');
        }

        category.pickList = getPopulatedProbabilities(self, value);
        element.category = category;
        element.value = value;
        cascadeAttributes(self, element);
        div.appendChild(element);
    }

    function getPopulatedProbabilities(self, value) {
        if (!value.mitigated && !value.unmitigated) { return []; }
        var risk = hasCalculatorFunction(self) ? value.unmitigated : value.mitigated ? value.mitigated : value.unmitigated;
        return risk.probabilities || [];
    }

    function cascadeAttributes(self, dest) {
        var idx, attr;

        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            attr = self.getAttribute(CASCADE_ATTRIBUTES[idx]);
            if (attr !== null) {
                dest.setAttribute(CASCADE_ATTRIBUTES[idx], attr);
            } else {
                dest.removeAttribute(CASCADE_ATTRIBUTES[idx]);
            }
        }
    }

    function clickHandler (self, e) {
        var nav, li, active;

        nav = self.querySelector('.nav');
        if (nav.contains(e.target)) {
            e.stopPropagation();
            e.preventDefault();
            active = self.querySelector('li.active');
            li = e.target;
            while (li && li.nodeName !== 'LI') {
                li = li.parentElement;
            }
            if (li) {
                if (active) {
                    active.classList.remove('active');
                }
                li.classList.add('active');
            }
            setTabContents(self);
        }
    }

    function formatFloat(self, value, decimals) {
        if (!isNaN(Parser.parseFloat(value))) {
            return self.formatter.format(value, NUMBER_FORMAT + (!decimals ? '' : decimals.toString()));
        }
        return value;
    }

    function error(self, xhr, text, message) {
        var errorMessage = new ErrorMessage('RM2', message, new Error().stack);
        self.errorOccured.raise(self, errorMessage);
    }

    document.registerElement('mi-risk-matrix', { prototype: proto });
    return proto;
});
