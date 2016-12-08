define(function (require) {
    'use strict';

    var Translator = require('system/globalization/translator'),
        Formatter = require('system/text/formatter'),
        Parser = require('system/text/parser'),
        RiskRankDTO = require('ui/elements/risk-matrix/models/risk-rank-dto'),
        Converter = require('system/lang/converter'),
        MessageBox = require('system/ui/message-box'),
        R = require('ramda'),
        proto = Object.create(HTMLElement.prototype),
        NUMBER_FORMAT = 'm';

    proto.createdCallback = function () {
        addProperties(this);
        this.errorMsg = null;
    };

    proto.attachedCallback = function () {
        this.addEventListener('change', this);
    };

    proto.attributeChangedCallback = function (attr, oldValue, newValue) {
        var notApplicable;

        if (attr === 'readonly') {
            toggleInputs(this);
        } else if (attr === 'hide-not-applicable') {
            notApplicable = this.querySelector('.notApplicable');
            if (notApplicable) {
                if (newValue !== null) {
                    notApplicable.style.display = 'none';
                } else {
                    notApplicable.style.display = 'block';
                }
            }
        }
    };

    proto.handleEvent = function(e) {
        if (e.type === 'change' && e.target !== this) {
            changeHandler(this, e);
        }
    };

    function addProperties (self) {
        self.translator = Object.resolve(Translator);
        self.formatter = Object.resolve(Formatter);
        self.settings = {
            category: null,
            value: null
        };
        Element.defineProperty(self, 'category', {
            get: getCategory.bind(null, self),
            set: setCategory.bind(null, self)
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

    function hasCalculatorFunction (self) {
        return self.settings.calculator && typeof self.settings.calculator === "function";
    }

    function getCategory (self) {
        return self.settings.category;
    }

    function setCategory (self, value) {
        self.settings.category = value;
        generateDom(self);
    }

    function getCalculator (self) {
        return self.settings.calculator;
    }

    function setCalculator (self, value) {
        self.settings.calculator = value;
    }

    function toggleNotApplicable (self, e) {
        if (elementIsReadOnly(self)) {
            return;
        }
        if (e.target.checked) {
            self.settings.value.unmitigated.notApplicable = true;
            if (hasCalculatorFunction(self)) {
                self.settings.value.mitigated.notApplicable = true;
            }
            clearInputs(self);
            toggleInputs(self);
        } else {
            self.settings.value.unmitigated.notApplicable = false;
            if (hasCalculatorFunction(self)) {
                self.settings.value.mitigated.notApplicable = false;
            }
            updateMitigated(self);
            updateUnmitigated(self);
        }
    }

    function getValue (self) {
        return self.settings.value;
    }

    function setValue (self, v) {
        if (!v || !v.unmitigated) {
            v = {};
            v.unmitigated = new RiskRankDTO();
        }
        self.settings.value = v;
        updateUnmitigated(self);
        updateMitigated(self);
    }

    function generateDom (self) {
        var outerDiv, unmitigatedDiv, mitigatedDiv;

        Element.clearDom(self);
        if (!self.settings.category) {
            return;
        }
        outerDiv = document.createElement('div');
        outerDiv.className = 'block-group risk-matrix-container';
        self.appendChild(outerDiv);
        unmitigatedDiv = document.createElement('div');
        unmitigatedDiv.className = 'unmitigated-financial-risk';
        outerDiv.appendChild(unmitigatedDiv);
        generateCommonContent(self, unmitigatedDiv, 'UNMITIGATED_RISK_CAPTION');
        mitigatedDiv = document.createElement('div');
        mitigatedDiv.className = 'mitigated-financial-risk';
        outerDiv.appendChild(mitigatedDiv);
        generateNotApplicable(self);
        updateUnmitigated(self);
        updateMitigated(self);
    }

    function generateNotApplicable (self) {
        var div, notApplicableLabel, notApplicableCheckbox;

        div = document.createElement('div');
        div.className = 'checkbox notApplicable';
        if (self.getAttribute('hide-not-applicable') !== null) {
            div.style.display = 'none';
        }
        self.appendChild(div);
        notApplicableLabel = document.createElement('label');
        div.appendChild(notApplicableLabel);
        notApplicableCheckbox = document.createElement('input');
        notApplicableCheckbox.setAttribute('type', 'checkbox');
        notApplicableCheckbox.setAttribute('name', 'notApplicable');
        notApplicableLabel.appendChild(notApplicableCheckbox);
        notApplicableLabel.appendChild(document.createTextNode(self.translator.translate('NOT_APPLICABLE_TEXT')));
    }

    function generateTextBox (self, parentDiv, labelText, inputName, showCurrency, disable) {
        var formGroup, label, input, inputParent, currency;

        formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        parentDiv.appendChild(formGroup);
        label = document.createElement('label');
        label.className = 'control-label';
        label.appendChild(document.createTextNode(self.translator.translate(labelText)));
        formGroup.appendChild(label);
        inputParent = formGroup;
        if (showCurrency) {
            inputParent = document.createElement('div');
            inputParent.className = 'input-group';
            formGroup.appendChild(inputParent);
        }
        input = document.createElement('input');
        input.className = 'form-control';
        input.setAttribute('type', 'text');
        input.setAttribute('name', inputName);
        if (disable || elementIsReadOnly(self)) {
            input.setAttribute('disabled', 'disabled');
        }
        inputParent.appendChild(input);
        if (showCurrency) {
            currency = document.createElement('span');
            currency.className = 'input-group-addon';
            currency.appendChild(document.createTextNode(self.settings.category.matrix.currency));
            inputParent.appendChild(currency);
        }
    }

    function generateProbabilityInput (self, parentDiv) {
        if (self.settings.category.pickList.length > 0) {
            generateProbabilityDropdown(self, parentDiv);
        } else {
            generateTextBox(self, parentDiv, 'PROBABILITY_LABEL', 'probability', true);
        }
    }

    function generateProbabilityDropdown (self, parentDiv) {
        var formGroup, label, input;

        formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        parentDiv.appendChild(formGroup);
        label = document.createElement('label');
        label.className = 'control-label';
        label.appendChild(document.createTextNode(self.translator.translate('PROBABILITY_LABEL')));
        formGroup.appendChild(label);
        input = document.createElement('select');
        input.setAttribute('name', 'probability');
        input.className = 'form-control';
        if (elementIsReadOnly(self)) {
            input.setAttribute('disabled', 'disabled');
        }
        loadProbabilityOptions(self, input);
        formGroup.appendChild(input);
    }

    function loadProbabilityOptions (self, input) {
        var option, idx, text, unmitigated, mitigated,
            probabilities = self.settings.category.pickList;

        Element.clearDom(input);
        option = document.createElement('option');
        input.appendChild(option);
        if (self.settings.value) {
            unmitigated = self.settings.value.unmitigated;
            mitigated = self.settings.value.mitigated;
        }
        for (idx = 0; idx < probabilities.length; idx++) {
            if (mitigated && unmitigated && (unmitigated.probability < probabilities[idx].factor)) {
                continue;
            }
            option = document.createElement('option');
            option.value = probabilities[idx].factor;
            text = probabilities[idx].formattedName;
            option.appendChild(document.createTextNode(text));
            input.appendChild(option);
        }
    }

    function toggleInputs (self) {
        var inputs, idx, disabled, unmitigated, notApplicable;

        disabled = elementIsReadOnly(self);
        if (!disabled && self.settings.value) {
            disabled = self.settings.value.unmitigated.notApplicable || false;
        }
        inputs = getAllInputs(self);
        unmitigated = self.querySelector('.unmitigated-financial-risk');
        for (idx = 0; idx < inputs.length; idx++) {
            if (disabled) {
                inputs[idx].setAttribute('disabled', 'disabled');
            } else if (hasCalculatorFunction(self)) {
                inputs[idx].removeAttribute('disabled');
            } else if (unmitigated.contains(inputs[idx])) {
                if (self.settings.value && self.settings.value.mitigated) {
                    inputs[idx].setAttribute('disabled', 'disabled');
                } else {
                    inputs[idx].removeAttribute('disabled');
                }
            } else {
                checkForUnmitigatedValue(self, inputs[idx]);
            }
        }
        notApplicable = self.querySelector('input[name="notApplicable"]');
        if (notApplicable) {
            if (elementIsReadOnly(self) || (hasMitigatedValue(self) && !hasCalculatorFunction(self))) {
                notApplicable.setAttribute('disabled', 'disabled');
            } else {
                notApplicable.removeAttribute('disabled');
            }
        }
    }

    function elementIsReadOnly(self) {
        return self.getAttribute('readonly') !== null;
    }

    function hasMitigatedValue (self) {
        return self.settings.value && self.settings.value.mitigated;
    }

    function checkForUnmitigatedValue (self, input) {
        var name = input.getAttribute('name');

        if (name === 'probability') {
            if (self.settings.value.unmitigated.probability) {
                input.removeAttribute('disabled');
                return;
            }
        }
        if (name === 'production-loss') {
            if (self.settings.value.unmitigated.productionLoss) {
                input.removeAttribute('disabled');
                return;
            }
        }
        if (name === 'maintenance-cost') {
            if (self.settings.value.unmitigated.maintenanceCost) {
                input.removeAttribute('disabled');
                return;
            }
        }
        if (name === 'consequence') {
            if (self.settings.value.unmitigated.consequence) {
                input.removeAttribute('disabled');
                return;
            }
        }
        input.setAttribute('disabled', 'disabled');
    }

    function getAllInputs (self) {
        var selectors;

        selectors = '.unmitigated-financial-risk input:not([name="financial-risk"]):not([name="benefit"]), ' +
                    '.unmitigated-financial-risk select, ' +
                    '.mitigated-financial-risk input:not([name="financial-risk"]):not([name="benefit"]), ' +
                    '.mitigated-financial-risk select';
        if (self.hasChildNodes()) {
            return self.querySelectorAll(selectors);
        } else {
            return [];
        }
    }

    function eventHappenedInMitigatedArea (self, e) {
        return self.querySelector('.mitigated-financial-risk').contains(e.target);
    }

    function changeHandler (self, e) {
        var name = e.target.getAttribute('name'),
            rank, div;

        e.stopPropagation();
        if (name === 'notApplicable') {
            toggleNotApplicable(self, e);
        } else {
            if (eventHappenedInMitigatedArea(self, e)) {
                rank = self.settings.value.mitigated;
                div = '.mitigated-financial-risk';
            } else {
                rank = self.settings.value.unmitigated;
                div = '.unmitigated-financial-risk';
            }
            validateValues(self, e, rank);
            if (self.settings.value.mitigated && eventHappenedInMitigatedArea(self, e)) {
                validateMitigatedValue(self, e, rank, div);
            }
            if (self.errorMsg === null) {                
                if (name === 'probability' || name === 'consequence') {                  
                    calculateFinancialRisk(self, rank, div);
                    if (name === 'probability' && hasCalculatorFunction(self) && !eventHappenedInMitigatedArea(self, e)) {
                        generateMitigatedProbability(self);
                    }
                } else if (name === 'production-loss' || name === 'maintenance-cost') {
                    calculateConsequence(self, rank, div);
                }
                if (self.settings.value.mitigated && !eventHappenedInMitigatedArea(self, e)) {
                    validateMitigatedValue(self, e, rank, div);
                }
                if (self.settings.value.mitigated) {
                    calculateBenefit(self);
                }
            }
        }
        raiseChangeEvent(self);
    }

    function raiseChangeEvent (self) {
        var changeEvent;

        changeEvent = new CustomEvent('change', { bubbles: true });
        self.dispatchEvent(changeEvent);
    }

    function validateValues (self, e, rank) {
        var name = e.target.getAttribute('name');

        switch (name) {
            case 'consequence':
                self.errorMsg = 'RISK_ASSESSMENT_CONSEQUENCE_ERROR_MSG';
                toggleHasError(self, isNumber(e.target.value), e.target, rank.consequence);
                break;
            case 'production-loss':
                self.errorMsg = 'RISK_ASSESSMENT_PRODUCTION_LOSS_ERROR_MSG';
                toggleHasError(self, isNumber(e.target.value), e.target, rank.productionLoss);
                break;
            case 'maintenance-cost':
                self.errorMsg = 'RISK_ASSESSMENT_MAINTENANCE_COST_ERROR_MSG';
                toggleHasError(self, isNumber(e.target.value), e.target, rank.maintenanceCost);
                break;
            case 'probability':
                self.errorMsg = 'SELECT_PROBABILITY';
                toggleHasError(self, e.target.value, e.target, rank.probability);
        }
    }

    function validateMitigatedValue (self, e, rank, div) {
        var name = e.target.getAttribute('name'),
            mitigated = self.settings.value.mitigated,
            unmitigated = self.settings.value.unmitigated;

        if (name === 'consequence') {
            self.errorMsg = 'RISK_ASSESSMENT_CONSEQUENCE_ERROR_MSG';
            var consequence = self.querySelector(div + ' ' + 'input[name="consequence"]').value;
            toggleHasError(self, unmitigated.consequence >= Parser.parseFloat(consequence), e.target, rank.consequence);
        } else if (name === 'production-loss') {
            self.errorMsg = 'PRODUCTION_LOSS_Exceeded_ERROR_MSG';
            var productionLoss = self.querySelector(div + ' ' + 'input[name="production-loss"]').value;
            toggleHasError(self, unmitigated.productionLoss >= Parser.parseFloat(productionLoss), e.target, rank.productionLoss);
        } else if (name === 'maintenance-cost') {
            self.errorMsg = 'MAINTENANCE_COST_Exceeded_ERROR_MSG';
            var maintenanceCost = self.querySelector(div + ' ' + 'input[name="maintenance-cost"]').value;
            toggleHasError(self, unmitigated.maintenanceCost >= Parser.parseFloat(maintenanceCost), e.target, rank.maintenanceCost);
        }
    }

    function calculateFinancialRisk (self, rank, div) {
        var probability, consequence, financialRisk, financialRiskValue;

        if (self.querySelector('select[name="probability"]'))
        {
            probability = self.querySelector(div + ' ' + 'select[name="probability"]').value;
            rank.probability = probability === '' ? null : probability;
        } else {
            probability = self.querySelector(div + ' ' + 'input[name="probability"]').value;
            rank.probability = probability === '' ? null : Parser.parseFloat(probability);
        }
        consequence = self.querySelector(div + ' ' + 'input[name="consequence"]').value;
        rank.consequence = consequence === '' ? null : Parser.parseFloat(consequence);
        if (probability !== null && consequence !== null) {
            financialRisk = self.querySelector(div + ' ' + 'input[name="financial-risk"]');
            financialRiskValue = rank.probability * rank.consequence;
            rank.rank = financialRiskValue;
            financialRisk.value = formatFloat(self, financialRiskValue, 2);
        }
    }

    function calculateConsequence (self, rank, div) {
        var productionLoss, maintenanceCost, consequence, consequenceValue;

        productionLoss = self.querySelector(div + ' ' + 'input[name="production-loss"]').value;
        rank.productionLoss = productionLoss === '' ? null : Parser.parseFloat(productionLoss);
        maintenanceCost = self.querySelector(div + ' ' + 'input[name="maintenance-cost"]').value;
        rank.maintenanceCost = maintenanceCost === '' ? null : Parser.parseFloat(maintenanceCost);
        if (productionLoss !== null && maintenanceCost !== null) {
            consequence = self.querySelector(div + ' ' + 'input[name="consequence"]');
            consequenceValue = rank.productionLoss + rank.maintenanceCost;
            rank.consequence = consequenceValue;
            consequence.value = formatFloat(self, consequenceValue, 2);
            calculateFinancialRisk(self, rank, div);
        }
    }

    function toggleHasError (self, state, target, oldValue) {
        if (state || state === 0) {
            target.parentElement.classList.remove('has-error');
            self.errorMsg = null;
            if (target.name !== 'probability' || !self.settings.category.pickList) {
                target.value = formatFloat(self, target.value, 2);
            }           
        } else {
            target.parentElement.classList.add('has-error');
            var message = self.translator.translate(self.errorMsg);
            var title = self.translator.translate('ERROR');
            var icon = 'icon-riskmatrix-exclamation';
            MessageBox.showOk(message, title, icon);
            target.value = oldValue;
        }
    }

    function isNumber(value) {
        return (!value || !isNaN(Parser.parseFloat(value)));        
    }

    function updateUnmitigated (self) {
        var inputs, unmitigated;

        if (!self.settings.value) {
            return;
        }
        unmitigated = self.settings.value.unmitigated;
        if (!unmitigated) {
            return;
        }
        inputs = self.querySelector('.unmitigated-financial-risk');
        if (inputs) {
            self.querySelector('input[name="notApplicable"]').checked = unmitigated.notApplicable;
            if (unmitigated.notApplicable) {
                clearInputs(self);
            } else {
                updateInputs(self, inputs, unmitigated);
            }
        }
    }

    function clearInputs (self) {
        var inputs = getAllInputs(self), idx;

        if (inputs) {
            for (idx = 0; idx < inputs.length; idx++) {
                inputs[idx].value = null;
            }
            inputs = self.querySelectorAll('input[name="financial-risk"], input[name="benefit"]');
            for (idx = 0; idx < inputs.length; idx++) {
                inputs[idx].value = null;
            }
        }
    }

    function updateMitigated (self) {
        var mitigated, mitigatedDiv, inputs;

        mitigatedDiv = self.querySelector('.mitigated-financial-risk');
        mitigated = self.settings.value.mitigated;
        if (mitigatedDiv && !mitigated) {
            Element.clearDom(mitigatedDiv);
        }
        if (!self.settings.value) {
            toggleInputs(self);
            return;
        }
        if (!mitigated) {
            toggleInputs(self);
            return;
        }
        if (!mitigatedDiv.firstElementChild) {
            generateCommonContent(self, mitigatedDiv, 'MITIGATED_RISK');
            generateTextBox(self, mitigatedDiv, 'BENEFIT_LABEL', 'benefit', false, true);
        }
        if (self.settings.value.unmitigated.notApplicable) {
            clearInputs(self);
        } else {
            inputs = self.querySelector('.mitigated-financial-risk');
            updateInputs(self, inputs, mitigated);
            calculateBenefit(self);
        }
        toggleInputs(self);
    }

    function updateInputs(self, inputs, values) {
        if (inputs.querySelector('select[name="probability"]')) {
            inputs.querySelector('select[name="probability"]').value = values.probability;
        } else {
            inputs.querySelector('input[name="probability"]').value = formatFloat(self, values.probability);
        }
        inputs.querySelector('input[name="production-loss"]').value = formatFloat(self, values.productionLoss, 2);
        inputs.querySelector('input[name="maintenance-cost"]').value = formatFloat(self, values.maintenanceCost, 2);
        inputs.querySelector('input[name="consequence"]').value = formatFloat(self, values.consequence, 2);
        inputs.querySelector('input[name="financial-risk"]').value = formatFloat(self, values.rank, 2);
    }

    function generateMitigatedProbability(self) {
        var select = self.querySelector('.mitigated-financial-risk select');
        loadProbabilityOptions(self, select);
    }

    function generateCommonContent (self, div, caption) {
        var header;

        header = document.createElement('h3');
        header.appendChild(document.createTextNode(self.translator.translate(caption)));
        div.appendChild(header);
        generateProbabilityInput(self, div);
        generateTextBox(self, div, 'PRODUCTION_LOSS_CAPTION', 'production-loss', true);
        generateTextBox(self, div, 'MAINTENANCE_COST', 'maintenance-cost', true);
        generateTextBox(self, div, 'CONSEQUENCE_CAPTION', 'consequence', true);
        generateTextBox(self, div, 'FINANCIAL_RANK_CAPTION', 'financial-risk', false, true);
    }

    function calculateBenefit (self) {
        var benefit = R.isNil(self.settings.value.mitigated.rank) ? '' : self.settings.value.unmitigated.rank - self.settings.value.mitigated.rank;
        self.querySelector('input[name="benefit"]').value = formatFloat(self, benefit, 2);
    }

    function formatFloat(self, value, decimals) {
        if (!isNaN(Parser.parseFloat(value))) {
            return self.formatter.format(value, NUMBER_FORMAT + (!decimals ? '' : decimals.toString()));
        }
        return value;
    }

    document.registerElement('mi-risk-matrix-financial', { prototype: proto });
    return proto;
});
