define(function (require) {
	'use strict';

    var $ = require('jquery'),
        Translator = require('system/globalization/translator'),
        Converter = require('system/lang/converter'),
        Formatter = require('system/text/formatter'),
        Parser = require('system/text/parser'),
        MessageBox = require('system/ui/message-box'),
        RiskCategoryDTO = require('ui/elements/risk-matrix/models/risk-category-dto'),
		RiskRankDTO = require('ui/elements/risk-matrix/models/risk-rank-dto'),       
		R = require('ramda'),
		proto = Object.create(HTMLElement.prototype),
        NUMBER_FORMAT = 'm';

	require('ui/elements/range/component');

	proto.createdCallback = function () {
	    addProperties(this);
        this.slider = null;
	};

	proto.attachedCallback = function () {
		this.addEventListener('click', this);
		this.addEventListener('change', this);
	};

	proto.attributeChangedCallback = function (attr, oldValue, newValue) {
		var notApplicable;

		if (attr === 'readonly') {
			notApplicable = this.querySelector('input[name="notApplicable"]');
			if (notApplicable) {
				if (newValue !== null) {
					notApplicable.setAttribute('disabled', 'disabled');
				} else {
					notApplicable.removeAttribute('disabled');
				}
			}
		} else if (attr === 'lock-probability' || attr === 'lock-consequence') {
			disableCells(this);
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
		if (e.type === 'click') {
			clickHandler(this, e);
		} else if (e.type === 'change' && e.target !== this) {
			if (e.target.nodeName === 'INPUT') {
			    toggleNotApplicable(this, e);
		    }
		} else if (e.type === 'change') {
		    tryCalculate(this);
	    }
	};

	function hasCalculatorFunction (self) {
		return self.settings.calculator && typeof self.settings.calculator === "function";
	}

	function tryCalculate (self) {
	    if (hasCalculatorFunction(self)) {
			self.settings.calculator(self.value.unmitigated).done(setCalculatedMitigated.bind(null, self));
		}
	}

	function addProperties (self) {
		self.translator = Object.resolve(Translator);
	    self.formatter = Object.resolve(Formatter);
		self.settings = {
			category: null,
			value: null,
			calculator: null
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

	function generateDom (self) {
		var div, cellSize, blockGroup, block, caption, probabilityAxis;

		Element.clearDom(self);
		if (!self.settings.category) {
			return;
		}
		div = document.createElement('div');
		div.className = 'x-axis-caption';
		probabilityAxis = self.settings.category.matrix.probabilityAxisValue;
		caption = probabilityAxis === 'XAXIS' ? 'PROBABILITY' : 'CONSEQUENCE';
		caption = self.translator.translate(caption);
		div.appendChild(document.createTextNode(caption));
		self.appendChild(div);
		blockGroup = document.createElement('div');
		blockGroup.className = 'risk-matrix-block-group';
		self.appendChild(blockGroup);
		block = document.createElement('div');
		block.className = 'risk-matrix-block';
		if (self.category.protectionLevels.length !== 0) {
			block.classList.add('has-protection-level');
		}
		blockGroup.appendChild(block);
		div = document.createElement('div');
		div.className = 'y-axis-caption';
		caption = probabilityAxis !== 'XAXIS' ? 'PROBABILITY' : 'CONSEQUENCE';
		caption = self.translator.translate(caption);
		div.appendChild(document.createTextNode(caption));
		block.appendChild(div);
		div = document.createElement('table');
		div.className = 'risk-matrix-container';
		block.appendChild(div);
		cellSize = calculateCellSize(self);
		columnHeaders(self, div, cellSize);
		generateRows(self, div, cellSize);
		appendProtectionLevel(self, blockGroup);
		generateLegends(self);
		generateNotApplicable(self);
		setUnmitigatedValue(self);
		setMitigatedValue(self);
		setNotApplicable(self);
		
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
		if (self.getAttribute('readonly') !== null || (self.settings.value && self.settings.value.mitigated)) {
			notApplicableCheckbox.setAttribute('disabled', 'disabled');
		}
		notApplicableLabel.appendChild(notApplicableCheckbox);
		notApplicableLabel.appendChild(document.createTextNode(self.translator.translate('NOT_APPLICABLE_TEXT')));
	}

	function generateLegends(self) {
	    var legendDiv = document.createElement('div'),
	    	iconMitigate = document.createElement('i'),
	    	iconUnmitigate = document.createElement('i');

	    legendDiv.className = 'legend-icon-container';

	    iconMitigate.className = 'icon-riskmatrix-tick';
	    legendDiv.appendChild(iconMitigate);
	    legendDiv.appendChild(document.createTextNode(self.translator.translate('MITIGATED_RISK')));

	    iconUnmitigate.className = 'icon-riskmatrix-exclamation';
	    legendDiv.appendChild(iconUnmitigate);
	    legendDiv.appendChild(document.createTextNode(self.translator.translate('UNMITIGATED_RISK')));

	    self.appendChild(legendDiv);
	}

	function calculateCellSize (self) {
		var result = { width: '', height: '' };

		//Floats are bad m'k.
		result.width = Math.floor((100  / (self.category.xCollection.length + 1))) + '%';
		result.height = 'calc(' + Math.floor((100 / self.category.yCollection.length)) + '% - 20px';
		return result;
	}

	function columnHeaders (self, parent, cellSize) {
		var headerDiv, columnDiv, idx, columns;

		headerDiv = document.createElement('tr');
		headerDiv.className = 'risk-matrix-row header';
		parent.appendChild(headerDiv);
		columnDiv = createCell(cellSize);
		columnDiv.style.height = 'calc(' + Math.floor((100 / self.category.yCollection.length)) + '% - 20px';
		headerDiv.appendChild(columnDiv);
		columns = self.category.xCollection;
		for (idx = 0; idx < columns.length; idx++) {
			columnDiv = createHeaderCell(self, cellSize, columns[idx]);
			columnDiv.style.height = 'calc(' + Math.floor((100 / self.category.yCollection.length)) + '% - 20px';
			headerDiv.appendChild(columnDiv);
		}
	}

	function createHeaderCell (self, cellSize, data) {
		var columnDiv, innerDiv, titleDiv, valueDiv;

		columnDiv = createCell(cellSize);
		innerDiv = columnDiv.firstElementChild;
		if (data.headerTitle) {
			titleDiv = document.createElement('div');
			titleDiv.className = 'header-title';
			titleDiv.appendChild(document.createTextNode(data.headerTitle));
			innerDiv.appendChild(titleDiv);
		}
		valueDiv = document.createElement('div');
		valueDiv.className = 'header-value';
		valueDiv.appendChild(document.createTextNode(formatFloat(self, data.headerValue)));
		innerDiv.appendChild(valueDiv);
		columnDiv.setAttribute('title', data.formattedDescription);
		return columnDiv;
	}

	function createCell (size) {
		var column = document.createElement('td'),
			div = document.createElement('div');

		column.appendChild(div);
		column.className = 'risk-matrix-cell';
		setCellSize(column, size);
		return column;
	}

	function generateRows (self, div, cellSize) {
		var idx, rows;

		rows = self.category.rowArray;

		for (idx = 0; idx < rows.length; idx++) {
			div.appendChild(createRow(self, rows[idx], cellSize));
		}
	}

	function createRow(self, row, cellSize) {
		var rowDiv, columnDiv, idx;

		rowDiv = document.createElement('tr');
		rowDiv.className = 'risk-matrix-row';

		columnDiv = createHeaderCell(self, cellSize, row);
		columnDiv.classList.add('header');
		rowDiv.appendChild(columnDiv);

		for (idx = 0; idx < row.data.length; idx++) {
			columnDiv = createCell(cellSize);
			columnDiv.classList.add('clickable');
			columnDiv.firstElementChild.appendChild(document.createTextNode(formatFloat(self, row.data[idx].value)));
			columnDiv.setAttribute('title', row.data[idx].threshold.formattedDescription);
			columnDiv.setAttribute('data-probability', formatFloat(self, row.data[idx].probability));
			columnDiv.setAttribute('data-consequence', formatFloat(self, row.data[idx].consequence));
			columnDiv.style.backgroundColor = row.data[idx].threshold.color;
			columnDiv.mi_data = row.data[idx];
			disableCell(self, columnDiv);
			rowDiv.appendChild(columnDiv);
		}
		return rowDiv;
	}

	function setCellSize(cell, size) {
		cell.style.width = size.width;
		cell.style.height = size.height;
	}

	function appendProtectionLevel (self, blockGroup) {
	    var protectionLevelDiv, div, label, input, innerDiv;

		if (self.category.protectionLevels.length === 0) {
			return;
		}
		protectionLevelDiv = document.createElement('div');
		protectionLevelDiv.className = 'risk-protection-level';
		blockGroup.appendChild(protectionLevelDiv);
		innerDiv = document.createElement('div');
		innerDiv.className = 'risk-protection-level-div';
		protectionLevelDiv.appendChild(innerDiv);
		div = document.createElement('div');
		div.className = 'risk-protection-level-slider';		
	    //div.appendChild(document.createTextNode('Slider goes here'));
		attachSlider(self, div);
		innerDiv.appendChild(div);
		div = document.createElement('div');
		div.className = 'protection-level-caption';
		div.appendChild(document.createTextNode(self.translator.translate('PROTECTION_LEVEL')));
		innerDiv.appendChild(div);
		div = document.createElement('div');
		div.className = 'protected-text';
		protectionLevelDiv.appendChild(div);
		label = document.createElement('label');
		label.appendChild(document.createTextNode(self.translator.translate('UNMITIGATED_CAPTION')));
		div.appendChild(label);
		input = document.createElement('input');
		input.className = 'form-control';
		input.setAttribute('name', 'protectionText');
		input.setAttribute('type', 'text');
		input.setAttribute('disabled', 'disabled');
		div.appendChild(input);
	}

	function attachSlider(self, div) {
	    var slider = self.querySelector('mi-range');
	    if (!slider) {
	        slider = document.createElement('mi-range');
	        slider.value = [{
	            value: [self.category.protectionLevels[self.category.protectionLevels.length - 1].factor],
	            valueFormat: 'n1',
	            barColorBefore: '#00bfff',
	            barColorAfter: '#87cefa'
	        }];
	        slider.min = 1;
	        slider.max = self.category.protectionLevels.length;
	        slider.step = 1;
	        slider.landscape = false;
	        $(slider).on('change', protectionLevelChanged.bind(null, self));
	        self.slider = $(slider)[0];
	        div.appendChild(self.slider);
	    }
	}

	function protectionLevelChanged(self, event) {
	    var val = event.currentTarget.value[0].value,
	        newfactor, protectionLevel, idx, 
            lastIdx = self.category.protectionLevels.length - 1,
	        oldVal = self.category.protectionLevels[lastIdx].factor;

	    if (!validProtectionLevel(self, val)) {
            return;
        }

	    for (idx = 0; idx <= lastIdx; idx++) {
	        newfactor = val;

	        self.category.protectionLevels[idx].factor = Converter.toInteger(newfactor);
	        self.category.protectionLevels[idx].nameID = Converter.toString(newfactor);
	        self.category.protectionLevels[idx].descriptionID = Converter.toString(newfactor);
	        self.category.protectionLevels[idx].formattedName = Converter.toString(newfactor);
	        self.category.protectionLevels[idx].formattedDescription = Converter.toString(newfactor);

	        self.category.consequences[lastIdx - idx].factorUI = self.category.consequences[lastIdx - idx].factor * newfactor;
	        self.category.probabilities[idx].factorUI = self.category.probabilities[idx].factor * newfactor;
	    }
	    self.settings.category = new RiskCategoryDTO(self.category, self.category.matrix, val);
	    updateRows(self);
	    updateProtectionLevel(self, newfactor);
	}

	function reloadMatrix(self) {
	    var div = self.querySelector('.risk-matrix-container');
	    while (div.firstChild) {
	        div.removeChild(div.firstChild);
	    }
	    var cellSize = calculateCellSize(self);
	    columnHeaders(self, div, cellSize);
	    generateRows(self, div, cellSize);
	}

	function updateProtectionLevel (self, factor) {
	    if (self.settings.value.mitigated) {
	        self.settings.value.mitigated.protectionLevel = factor;
            if (self.settings.value.mitigated.probability && self.settings.value.mitigated.consequence) {
	            self.settings.value.mitigated.rank =
                        self.settings.value.mitigated.probability * self.settings.value.mitigated.consequence * factor;
            }           
	    } else {
	        self.settings.value.unmitigated.protectionLevel = factor;
            if (self.settings.value.unmitigated.probability && self.settings.value.unmitigated.consequence) {
	            self.settings.value.unmitigated.rank =
                        self.settings.value.unmitigated.probability * self.settings.value.unmitigated.consequence * factor;
            }
            updateProtectionText(self, factor);
	    }        
	    raiseChangeEvent(self);
	}

	function changeValue(self, target) {
	    var rank;
		if (cellDisabled(self, target)) {
			return;
		}
		if (!self.settings.value.mitigated || hasCalculatorFunction(self)) {
			removeUnmitigatedValue(self);
			setUnmitigatedValue(self, target);
			self.settings.value.unmitigated.probability = target.mi_data.probability;
			self.settings.value.unmitigated.consequence = target.mi_data.consequence;
            rank = self.settings.value.unmitigated.probability * self.settings.value.unmitigated.consequence;
            if (self.slider && self.slider !== null) {
                self.settings.value.unmitigated.protectionLevel = self.slider.value[0].value;
                rank *= self.settings.value.unmitigated.protectionLevel;     
            }
			self.settings.value.unmitigated.rank = target.mi_data.rank || rank;
			self.settings.value.unmitigated.riskRankAlias = target.mi_data.riskRankAlias;
			self.settings.value.unmitigated.notApplicable = self.querySelector('input[name="notApplicable"]').checked;			
            raiseChangeEvent(self);
		} else {
			removeMitigatedValue(self);
			setMitigatedValue(self, target);
			if (!self.settings.value.mitigated) {
				self.settings.value.mitigated = new RiskRankDTO();
			}
			self.settings.value.mitigated.probability = target.mi_data.probability;
			self.settings.value.mitigated.consequence = target.mi_data.consequence;
            rank = self.settings.value.mitigated.probability * self.settings.value.mitigated.consequence;
            if (self.slider && self.slider !== null) {
                self.settings.value.mitigated.protectionLevel = self.slider.value[0].value;
                rank *= self.settings.value.mitigated.protectionLevel;
            } 
			self.settings.value.mitigated.rank = target.mi_data.rank || rank;
			self.settings.value.mitigated.riskRankAlias = target.mi_data.riskRankAlias;
			self.settings.value.mitigated.notApplicable = self.querySelector('input[name="notApplicable"]').checked;           
            raiseChangeEvent(self);
	    }     
	}

	function setCalculatedMitigated(self, mitigated) {
		if (R.equals(self.settings.value.mitigated, mitigated)) {
			return;
		}
		removeMitigatedValue(self);
	    self.settings.value.mitigated = new RiskRankDTO();
	    self.settings.value.mitigated.probability = mitigated.probability;
	    self.settings.value.mitigated.consequence = mitigated.consequence;
	    self.settings.value.mitigated.rank = mitigated.rank;
	    self.settings.value.mitigated.key = mitigated.key;
	    self.settings.value.mitigated.categoryName = mitigated.categoryName;
	    self.settings.value.mitigated.isFinancial = mitigated.isFinancial;
	    self.settings.value.mitigated.index = mitigated.index;
	    self.settings.value.mitigated.maintenanceCost = mitigated.maintenanceCost;
	    self.settings.value.mitigated.notApplicable = mitigated.notApplicable;
	    self.settings.value.mitigated.productionLoss = mitigated.productionLoss;
	    self.settings.value.mitigated.weight = mitigated.weight;
	    self.settings.value.mitigated.riskRankAlias = mitigated.riskRankAlias;
	    self.settings.value.mitigated.protectionLevel = mitigated.protectionLevel;
	    self.settings.value.mitigated.probabilities = mitigated.probabilities;
	    setMitigatedValue(self);
	    raiseChangeEvent(self);
	}

	function raiseChangeEvent (self) {
		var changeEvent;

		changeEvent = new CustomEvent('change', { bubbles: true });
		self.dispatchEvent(changeEvent);
	}

	function removeUnmitigatedValue (self) {
	    var selected = self.querySelector('.icon-riskmatrix-exclamation');

	    if (selected && !selected.parentElement.classList.contains('legend-icon-container')) {
			selected.parentElement.removeChild(selected);
		}
	}

	function setUnmitigatedValue (self, target) {
	    var icon, unmitigated;

		if (!target && self.settings.value) {
			unmitigated = self.settings.value.unmitigated;
			if (unmitigated) {
			    if (unmitigated.probability !== null && unmitigated.consequence !== null) {
			        target = self.querySelector('.risk-matrix-cell[data-probability="' + formatFloat(self, unmitigated.probability) +
                                        '"][data-consequence="' + formatFloat(self, unmitigated.consequence) + '"]');
                }				
				if (unmitigated.protectionLevel && unmitigated.protectionLevel !== null) {
				    setProtectionLevel(self, unmitigated.protectionLevel);
				    updateProtectionText(self, unmitigated.protectionLevel);
			    }
		    }
		}
		if (!target) {
			return;
		}
		icon = document.createElement('i');
		icon.className = 'icon-riskmatrix-exclamation';
		target.firstElementChild.appendChild(icon);
	}

	function updateProtectionText(self, factor) {
	    var protectionText = self.querySelector('input[name="protectionText"]');
	    if (protectionText && factor !== null) {
	        protectionText.value = self.slider.value[0].value.toString();
	    }
	}

    function setProtectionLevel(self, protectionLevel) {
	    self.slider.value[0].value = protectionLevel;
        self.settings.category = new RiskCategoryDTO(self.category, self.category.matrix, protectionLevel);
        updateRows(self);
	}

	function updateRows(self) {
        var div, idx, rows, target, icon;

	    rows = self.category.rowArray;
	    for (idx = 0; idx < rows.length; idx++) {
	        editRow(self, rows[idx], idx);
	    }
	}

    function editRow(self, row, index) {
        var valueDiv, innerDiv, rowDiv, rowDivHeader, columnDiv, idx, x;

        rowDiv = $(self).find('.risk-matrix-row')[index +1];
        for (x = 1; x < rowDiv.childNodes.length; x++) {
            valueDiv = rowDiv.childNodes[x];
            innerDiv = valueDiv.firstElementChild;
            innerDiv.removeChild(innerDiv.firstChild);
            var firstChild = innerDiv.firstChild;
            if (firstChild) {
                innerDiv.insertBefore(document.createTextNode(row.data[x -1].value), firstChild);
            } else {
                innerDiv.appendChild(document.createTextNode(row.data[x -1].value));
            }
            innerDiv.parentElement.style.backgroundColor = row.data[x -1].threshold.color;
            valueDiv.mi_data.rank = row.data[x -1].value;
        }
	}

    function validProtectionLevel(self, protectionLevel) {
        if (self.settings.value.mitigated) {
            if (protectionLevel > self.settings.value.unmitigated.protectionLevel) {
                invalidProtectionLevelMsg(self);
                self.slider.value[0].value =
                        self.settings.value.mitigated.protectionLevel ? self.settings.value.mitigated.protectionLevel : self.settings.value.unmitigated.protectionLevel;
                return false;
            }
        }
        return true;
    }

    function invalidProtectionLevelMsg(self) {
        var msg = self.translator.translate('PROTECTION_LEVEL_Exceeded_ERROR_MSG'),
            title = self.translator.translate('WARNING'),
            icon = 'icon-node-warning';
        MessageBox.showOk(msg, title, icon);
    }

	function removeMitigatedValue (self) {
	    var selected = self.querySelector('.icon-riskmatrix-tick');

	    if (selected && !selected.parentElement.classList.contains('legend-icon-container')) {
	        selected.parentElement.removeChild(selected);
	    }
	}

	function setMitigatedValue (self, target) {
		var icon, mitigated;

		if (!target && self.settings.value) {
			mitigated = self.settings.value.mitigated;
			if (mitigated) {
			    if (mitigated.probability !== null && mitigated.consequence !== null) {
			        target = self.querySelector('.risk-matrix-cell[data-probability="' + formatFloat(self, mitigated.probability) +
                                        '"][data-consequence="' + formatFloat(self, mitigated.consequence) + '"]');
			    }				
				if (mitigated.protectionLevel && mitigated.protectionLevel !== null) {
				    setProtectionLevel(self, mitigated.protectionLevel);                   
				}
			}
		}
		if (!target) {
			return;
		}
		icon = document.createElement('i');
		icon.className = 'icon-riskmatrix-tick';
		target.firstElementChild.appendChild(icon);
	}

	function toggleNotApplicable (self, e) {
		if (self.getAttribute('readonly') !== null) {
			return;
		}
		if (e.target.checked) {
			self.querySelector('.risk-matrix-container').setAttribute('disabled', 'disabled');
		    removeUnmitigatedValue(self);
			self.settings.value.unmitigated.notApplicable = true;
		} else {
			self.querySelector('.risk-matrix-container').removeAttribute('disabled');
		    setUnmitigatedValue(self);
			self.settings.value.unmitigated.notApplicable = false;
		}
		raiseChangeEvent(self);
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
		removeUnmitigatedValue(self);
		removeMitigatedValue(self);
		setUnmitigatedValue(self);
		setMitigatedValue(self);
		setNotApplicable(self);
		disableCells(self);
	}

	function setNotApplicable(self) {
		var notApplicable, unmitigated, mitigated;

		if (!self.settings.value) {
			return;
		}
		unmitigated = self.settings.value.unmitigated;
		mitigated = self.settings.value.mitigated;
		notApplicable = self.querySelector('input[name="notApplicable"]');
		if (notApplicable) {
			notApplicable.checked = unmitigated.notApplicable;
			if (unmitigated.notApplicable) {
				self.querySelector('.risk-matrix-container').setAttribute('disabled', 'disabled');
			} else if (self.getAttribute('readonly') === null){
				self.querySelector('.risk-matrix-container').removeAttribute('disabled');
			}
		}
		if (mitigated && notApplicable && !hasCalculatorFunction(self)) {
			notApplicable.setAttribute('disabled', 'disabled');
		}
		else if (notApplicable && self.getAttribute('readonly') === null) {
			notApplicable.removeAttribute('disabled');
		}
	}

	function clickHandler (self, e) {
	    if (cellDisabled(self, e.target)) {
	        return;
	    }
	    if (e.target.mi_data) {
	        changeValue(self, e.target);
	    } else if (e.target.parentElement.mi_data) {
	        changeValue(self, e.target.parentElement);
	    }
	}

	function cellDisabled (self, cell) {
		if (self.getAttribute('readonly') !== null) {
			return true;
		}
		if (self.querySelector('.risk-matrix-container').getAttribute('disabled') !== null) {
			return true;
		}
		if (cell.getAttribute('disabled') !== null) {
			return true;
		}
		return false;
	}

	function disableProbability (self, unmitigated, cell) {
		if (unmitigated.probability < cell.mi_data.probability) {
			return true;
		}
		if (self.getAttribute('lock-probability') === null) {
			return false;
		}
		if (unmitigated.probability !== cell.mi_data.probability) {
			return true;
		}
		return false;
	}

	function disableConsequence (self, unmitigated, cell) {
		if (unmitigated.consequence < cell.mi_data.consequence) {
			return true;
		}
		if (self.getAttribute('lock-consequence') === null && !self.settings.category.matrix.lockMitigatedConsequence) {
			return false;
		}
		if (unmitigated.consequence !== cell.mi_data.consequence) {
			return true;
		}
		return false;
	}

	function disableCell (self, cell) {
		var unmitigated;

		if (!self.settings.value) {
			return;
		}
		unmitigated = self.settings.value.unmitigated;
		if (!self.settings.value.mitigated || self.settings.calculator) {
			cell.removeAttribute('disabled', 'disabled');
		} else if (disableProbability(self, unmitigated, cell)) {
			cell.setAttribute('disabled', 'disabled');
		} else if (disableConsequence(self, unmitigated, cell)) {
			cell.setAttribute('disabled', 'disabled');
		} else {
			cell.removeAttribute('disabled');
		}
	}

	function disableCells (self) {
		var cells, idx;

		if (!self.settings.value) {
			return;
		}
		cells = self.querySelectorAll('.risk-matrix-cell.clickable');
		for (idx = 0; idx < cells.length; idx++) {
			disableCell(self, cells[idx]);
		}
	}

	function formatFloat(self, value, decimals) {
	    if (!isNaN(Parser.parseFloat(value))) {
	        return self.formatter.format(value, NUMBER_FORMAT + (!decimals ? '' : decimals.toString()));
	    }
	    return value;
	}

	document.registerElement('mi-risk-matrix-nonfinancial', { prototype: proto });
	return proto;
});
