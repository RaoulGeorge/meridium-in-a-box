define(function (require) {
	'use strict';

    var $ = require('jquery'),
        DialogViewModel = require('system/ui/dialog-view-model'),
		RiskMatrixService = require('ui/elements/risk-matrix/services/risk-matrix-service'),
		RiskAssessmentDTO = require('ui/elements/risk-matrix/models/risk-assessment-dto'),
		ErrorMessage = require('system/error/error-message'),
        ApplicationEvents = require('application/application-events'),
        RiskRankDTO = require('ui/elements/risk-matrix/models/risk-rank-dto'),
		Translator = require('system/globalization/translator'),
        Formatter = require('system/text/formatter'),
        Parser = require('system/text/parser'),
		R = require('ramda'),
        NUMBER_FORMAT = 'm';

	function RiskAssessment () {
		this.dialog = null;
		this.dfd = null;
		this.service = Object.resolve(RiskMatrixService);
		this.translator = Object.resolve(Translator);
		this.formatter = Object.resolve(Formatter);
        this.errorOccured = Object.resolve(ApplicationEvents).errorOccured;
		this.element = null;
		this.settings = {
			matrix: null,
			value: null,
			riskOf: null,
			mitigatedBy: null,
			readonly: false,
			calculator: null
		};
	}

	RiskAssessment.prototype.show = function (options) {
		var dialogOptions = { height: '100%', width: '100%' },
			title;

		if (options.value) {
			this.settings.value = {};
			title = this.translator.translate('UNMITIGATED_ASSESSMENT_MSG');
			if (options.value.unmitigated) {
				this.settings.value.unmitigated = new RiskAssessmentDTO(options.value.unmitigated);
			}
			if (options.value.mitigated) {
				this.settings.value.mitigated = new RiskAssessmentDTO(options.value.mitigated);
				title = this.translator.translate('MITIGATED_ASSESSMENT_MSG');
			}
		}
		if (options.matrix) {
			this.settings.matrix = options.matrix;
			if (this.settings.matrix.dialogCaption) {
				title = this.settings.matrix.dialogCaption;
			}
		} else if (this.settings.value) {
			this.service.getRiskMatrixByKey(this.settings.value.unmitigated.riskMatrixKey)
				.done(riskMatrixLoaded.bind(null, this))
				.fail(error.bind(null, this));
		}
		this.settings.riskOf = options.riskOf;
		this.settings.mitigatedBy = options.mitigatedBy;
		this.settings.readonly = (options.readonly === true);
		this.settings.calculator = options.calculator;
		this.dialog = new DialogViewModel(this, title, dialogOptions);
		this.dfd = $.Deferred();
		this.dialog.show();
		return this.dfd.promise();
	};

	RiskAssessment.prototype.attach = function (region) {
		var outerDiv;

		outerDiv = document.createElement('div');
		outerDiv.className = 'risk-assessment-dialog';
		generateBody(this, outerDiv);
		generateControls(this, outerDiv);
		region.attach(outerDiv);
		this.element = region.element;
		this.element.addEventListener('click', this);
		this.element.addEventListener('change', this);
	};

	RiskAssessment.prototype.handleEvent = function (e) {
		if (e.type === 'click') {
			clickHandler(this, e);
		} else if (e.type === 'change' && e.target.nodeName === 'MI-RISK-MATRIX-NONFINANCIAL') {
			calculateRiskRank(this);
		}
	};

	function clickHandler (self, e) {
		if (e.target.getAttribute('name') === 'cancel') {
			self.dialog.closeDialog();
		} else if (e.target.getAttribute('name') === 'save') {
			done(self);
		}
	}

	function done (self) {
		var matrix = self.element.querySelector('mi-risk-matrix'),
			basisForAssessment;

		basisForAssessment = self.element.querySelector('textarea[name="basis-for-assessment"]').value;
		if (matrix.value.mitigated) {
			self.settings.value.mitigated.risks = matrix.value.mitigated;
			self.settings.value.mitigated.basisForAssessment = basisForAssessment;
		} else if (matrix.calculator) {
			self.settings.value.unmitigated.risks = matrix.value.unmitigated;
			self.settings.value.unmitigated.basisForAssessment = basisForAssessment;
			self.settings.value.mitigated.risks = matrix.value.mitigated || [];
		} else {
			self.settings.value.unmitigated.risks = matrix.value.unmitigated;
			self.settings.value.unmitigated.basisForAssessment = basisForAssessment;
		}
		self.dfd.resolve(self.settings.value);
		self.dialog.closeDialog();
	}

	function generateControls (self, outerDiv) {
		var div, button, footer;

		footer = document.createElement('div');
		footer.className = 'block-group risk-assessment-footer';
		outerDiv.appendChild(footer);
		div = document.createElement('div');
		div.className = 'risk-controls clearfix pull-right';
		footer.appendChild(div);
		if (!self.settings.readonly) {
		    button = document.createElement('button');
		    button.className = 'btn btn-text pull-right';
		    button.setAttribute('name', 'save');
		    button.appendChild(document.createTextNode(self.translator.translate('SAVE')));
		    div.appendChild(button);
			button = document.createElement('button');
			button.className = 'btn btn-text pull-right';
			button.setAttribute('name', 'cancel');
			button.appendChild(document.createTextNode(self.translator.translate('CANCEL')));
			div.appendChild(button);
		} else {
			button = document.createElement('button');
			button.className = 'btn btn-text pull-right';
			button.setAttribute('name', 'cancel');
			button.appendChild(document.createTextNode(self.translator.translate('OK')));
			div.appendChild(button);
		}
	}

	function generateBody (self, outerDiv) {
		var groupDiv, matrix, risks;

		groupDiv = document.createElement('div');
		groupDiv.className = 'block-group risk-assessment-body';
		outerDiv.appendChild(groupDiv);
		matrix = document.createElement('mi-risk-matrix');
		matrix.calculator = self.settings.calculator;
		if (self.settings.readonly) {
			matrix.setAttribute('readonly', 'readonly');
		}
		if (self.settings.matrix) {
			matrix.matrix = self.settings.matrix;
		}
		risks = { unmitigated: null, mitigated: null };
		if (self.settings.value) {
			risks = { unmitigated: self.settings.value.unmitigated.risks };
			if (self.settings.value.mitigated) {
				risks.mitigated = self.settings.value.mitigated.risks;
			} else if (self.settings.calculator) {
				risks.mitigated = self.settings.value.mitigated = new RiskAssessmentDTO();
			}
		}
		matrix.value = risks;
		groupDiv.appendChild(matrix);
		groupDiv.appendChild(generateSidePanel(self));
	}

	function generateSidePanel (self) {
		var matrixOverride, value, sidePanel;

		sidePanel = document.createElement('div');
		sidePanel.className = 'risk-assessment-side-panel';
		if (self.settings.riskOf) {
			if (self.settings.matrix) {
				matrixOverride = self.settings.matrix.unmitigatedObjectLabel;
			}
			generateSidePanelTextBlock(self, sidePanel, matrixOverride, 'RISK_OF',
				'risk-of-label', self.settings.riskOf);
		}
		if (self.settings.matrix) {
			matrixOverride = self.settings.matrix.unmitigatedRiskLabel;
		}
		if (self.settings.value) {
			if (self.settings.matrix && self.settings.matrix.showAlias) {
				value = self.settings.value.unmitigated.riskRankAlias;
			} else {
				value = self.settings.value.unmitigated.riskRank;
			}
		}
		generateSidePanelTextBlock(self, sidePanel, matrixOverride, 'UNMITIGATED_RISK_RANK',
			'unmitigated-risk-rank-label', value, 'unmitigated-risk-rank');
		if (self.settings.calculator || (self.settings.value && self.settings.value.mitigated)) {
			generateMitigatedSidePanel(self, sidePanel);
		}
		generateSidePanelFooter(self, sidePanel);
		return sidePanel;
	}

	function generateSidePanelFooter (self, sidePanel) {
		var footer, label, textArea, div;

		footer = document.createElement('div');
		footer.className = 'side-panel-footer';
		sidePanel.appendChild(footer);
		div = document.createElement('div');
		div.className = 'form-group';
		footer.appendChild(div);
		label = document.createElement('label');
		label.className = 'control-label';
		label.appendChild(document.createTextNode(self.translator.translate('BASIS_FOR_ASSESSMENT')));
		div.appendChild(label);
		textArea = document.createElement('textarea');
		textArea.setAttribute('name', 'basis-for-assessment');
		textArea.className = 'form-control';
		textArea.setAttribute('rows', '5');
		if (self.settings.readonly) {
			textArea.setAttribute('disabled', 'disabled');
		}
		if (self.settings.value) {
			if (self.settings.value.mitigated) {
				textArea.value = self.settings.value.mitigated.basisForAssessment;
			} else {
				textArea.value = self.settings.value.unmitigated.basisForAssessment;
			}
		}
		div.appendChild(textArea);
	}

	function generateMitigatedSidePanel (self, sidePanel) {
		var matrixOverride, value;

		if (!sidePanel) {
			sidePanel = self.element.querySelector('.risk-assessment-side-panel');
		}
		if (self.settings.mitigatedBy) {
			if (self.settings.matrix) {
				matrixOverride = self.settings.matrix.mitigatedObjectLabel;
			}
			generateSidePanelTextBlock(self, sidePanel, matrixOverride, 'MITIGATED_BY',
				'mitigated-by-label', self.settings.mitigatedBy);
		}
		if (self.settings.value) {
			if (self.settings.matrix && self.settings.matrix.showAlias) {
				value = self.settings.value.mitigated.riskRankAlias;
			} else {
				value = self.settings.value.mitigated.riskRank;
			}
		}
		generateSidePanelTextBlock(self, sidePanel, matrixOverride, 'MITIGATED_RISK_RANK',
			'mitigated-risk-rank-label', value, 'mitigated-risk-rank');
	}

	function generateSidePanelTextBlock (self, sidePanel, matrixOverride, labelDefault, name, text, textName) {
		var div, label, labelText, staticText;

		div = document.createElement('div');
		sidePanel.appendChild(div);
		div.className = 'form-group';
		label = document.createElement('label');
		label.className = 'control-label';
		if (matrixOverride) {
			labelText = matrixOverride;
		}
		if (!labelText) {
			labelText = self.translator.translate(labelDefault);
		}
		label.setAttribute('name', name);
		label.appendChild(document.createTextNode(labelText));
		div.appendChild(label);
		staticText = document.createElement('p');
		staticText.className = 'form-control-static';
		if (textName) {
			staticText.setAttribute('name', textName);
		}
		staticText.appendChild(document.createTextNode(formatFloat(self, text, 4)));
		div.appendChild(staticText);
	}

    function error(self, xhr, text, message) {
        var errorMessage = new ErrorMessage('RM3', message, new Error().stack);
        self.errorOccured.raise(self, errorMessage);
    }

	function riskMatrixLoaded (self, data) {
		var label, matrix;

		self.settings.matrix = data;
		matrix = self.element.querySelector('mi-risk-matrix');
		matrix.matrix = data;
		if (data.unmitigatedObjectLabel) {
			label = self.element.querySelector('label[name="risk-of-label"]');
			Element.clearDom(label);
			label.appendChild(document.createTextNode(data.unmitigatedObjectLabel));
		}
		if (data.unmitigatedRiskLabel) {
			label = self.element.querySelector('label[name="unmitigated-risk-rank-label"]');
			Element.clearDom(label);
			label.appendChild(document.createTextNode(formatFloat(self, data.unmitigatedRiskLabel)));
		}
		if (data.showAlias) {
			label = self.element.querySelector('p[name="unmitigated-risk-rank"]');
			Element.clearDom(label);
			label.appendChild(document.createTextNode(self.settings.value.unmitigated.riskRankAlias));
		}
		if (self.settings.value.mitigated) {
			if (data.mitigatedObjectLabel) {
				label = self.element.querySelector('label[name="mitigated-by-label"]');
				Element.clearDom(label);
				label.appendChild(document.createTextNode(data.mitigatedObjectLabel));
			}
			if (data.mitigatedRiskLabel) {
				label = self.element.querySelector('label[name="mitigated-risk-rank-label"]');
				Element.clearDom(label);
				label.appendChild(document.createTextNode(formatFloat(self, data.mitigatedRiskLabel)));
			}
			if (data.showAlias) {
				label = self.element.querySelector('p[name="mitigated-risk-rank"]');
				Element.clearDom(label);
				label.appendChild(document.createTextNode(self.settings.value.mitigated.riskRankAlias));
			}
		}
	}

	function hasMitigatedValues(matrixValues) {
		return !R.isNil(matrixValues.mitigated);
	}

	function calculateRiskRank (self) {
		var matrixValues, values, risk;

		matrixValues = self.element.querySelector('mi-risk-matrix').value;
		if (self.settings.calculator && hasMitigatedValues(matrixValues)) {
			risk = _calculateRisk(self, matrixValues.mitigated);
			setRiskRank(self, true, risk.rank, risk.alias);

			risk = _calculateRisk(self, matrixValues.unmitigated);
			setRiskRank(self, false, risk.rank, risk.alias);
		} else if (matrixValues.mitigated) {
			values = matrixValues.mitigated;
			risk = _calculateRisk(self, values);
			setRiskRank(self, true, risk.rank, risk.alias);
		} else {
			values = matrixValues.unmitigated;
			risk = _calculateRisk(self, values);
			setRiskRank(self, false, risk.rank, risk.alias);
		}
	}

	function _calculateRisk (self, values) {
		var idx, riskRank = 0, riskRankAlias;
		for (idx = 0; idx < values.length; idx++) {
			if (!values[idx]) {
				continue;
			}
			if (values[idx].isFinancial) {
				continue;
			}
			if (values[idx].notApplicable) {
				continue;
			}
			if (isNaN(values[idx].rank) || !values[idx].rank) {
				continue;
			}
			if (self.settings.matrix.isUsingMaxRisk) {
				if (riskRank < values[idx].rank) {
					riskRank = values[idx].rank;
					riskRankAlias = values[idx].riskRankAlias;
				}
			} else {
				riskRank += values[idx].rank;
			}
		}
		return { rank: riskRank, alias: riskRankAlias };
	}

	function setRiskRank (self, mitigated, riskRank, riskRankAlias) {
		var control;

		if (mitigated) {
			if (!self.settings.value.mitigated) {
				self.settings.value.mitigated = new RiskRankDTO();
			}
			control = self.element.querySelector('p[name="mitigated-risk-rank"]');
			if (self.settings.matrix.showAlias) {
				self.settings.value.mitigated.riskRankAlias = riskRankAlias;
			}
			self.settings.value.mitigated.riskRank = riskRank;
		} else {
			control = self.element.querySelector('p[name="unmitigated-risk-rank"]');
			self.settings.value.unmitigated.riskRank = riskRank;
			if (self.settings.matrix.showAlias) {
				self.settings.value.unmitigated.riskRankAlias = riskRankAlias;
			}
		}
		Element.clearDom(control);
		if (self.settings.matrix.showAlias) {
			riskRank = riskRankAlias;
		} else {
		    riskRank = formatFloat(self, riskRank, 4);
		}
		control.appendChild(document.createTextNode(riskRank));
	}

	function formatFloat(self, value, decimals) {
	    if (!isNaN(Parser.parseFloat(value))) {
	        return self.formatter.format(value, NUMBER_FORMAT + (!decimals ? '' : decimals.toString()));
	    }
	    return value;
	}

	return RiskAssessment;
});
