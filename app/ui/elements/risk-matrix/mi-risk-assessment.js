define(function (require) {
	'use strict';

	var Translator = require('system/globalization/translator'),
		RiskAssessment = require('ui/elements/risk-matrix/risk-assessment'),
		proto = Object.create(HTMLElement.prototype);

	require('ui/elements/risk-matrix/mi-risk-matrix');

	proto.createdCallback = function () {
		addProperties(this);

		this.classList.add('btn');
		this.classList.add('btn-primary');
		if (!this.hasChildNodes()) {
			this.appendChild(document.createTextNode(this.translator.translate('ASSESS_RISK')));
		}
	};

	proto.attachedCallback = function () {
		this.addEventListener('click', this);
	};

	proto.handleEvent = function (e) {
		if (e.type === 'click') {
			launchRiskAssessment(this);
		}
	};

	function launchRiskAssessment (self) {
		var riskAssessment = new RiskAssessment(),
			config = {
				matrix: self.settings.matrix,
				value: self.settings.value,
				riskOf: self.getAttribute('risk-of'),
				mitigatedBy: self.getAttribute('mitigated-by'),
				readonly: (self.getAttribute('readonly') !== null),
				calculator: self.settings.calculator
			};

		riskAssessment.show(config).done(dialogClosed.bind(null, self));
	}

	function dialogClosed (self, data) {
		var changeEvent;

		self.settings.value = data;
		changeEvent = new CustomEvent('change', { bubbles: true });
		self.dispatchEvent(changeEvent);
	}

	function addProperties (self) {
		self.translator = Object.resolve(Translator);
		self.settings = {
			matrix: null,
			value : null,
			calculator: null
			};
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

	function setMatrix (self, value) {
		self.settings.matrix = value;
	}

	function getValue (self) {
		return self.settings.value;
	}

	function setValue (self, value) {
		self.settings.value = value;
	}

	function getCalculator (self) {
		return self.settings.calculator;
	}

	function setCalculator (self, value) {
		self.settings.calculator = value;
	}

	document.registerElement('mi-risk-assessment', { prototype: proto });
	return proto;
});
