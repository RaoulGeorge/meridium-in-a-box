define(function (require) {
    'use strict';
    var Converter = require('system/lang/converter'),
        ProbabilityDTO = require('ui/elements/risk-matrix/models/probability-dto'),
        ConsequenceDTO = require('ui/elements/risk-matrix/models/consequence-dto'),
        ProtectionLevelDTO = require('ui/elements/risk-matrix/models/protection-level-dto'),
        RiskMatrixCell = require('ui/elements/risk-matrix/models/risk-matrix-cell'),
        Utilities = require('ui/elements/risk-matrix/utilities');

    function RiskCategoryDTO (category, matrix, protectionLevel) {
        category = category || {};
        this.matrix = matrix || {};

        this.index = Converter.toFloat(category.index);
        this.weight = Converter.toNullable(category.weight);
        this.name = Converter.toString(category.name);
        this.formattedName = Converter.toString(category.formattedName);
        this.formattedDescription = Converter.toString(category.formattedDescription);
        this.isFinancial = Converter.toBoolean(category.isFinancial);

        this.probabilities = ProbabilityDTO.fromDataCollection(category.probabilities);
        this.consequences = ConsequenceDTO.fromDataCollection(category.consequences);
        this.protectionLevels = ProtectionLevelDTO.fromDataCollection(category.protectionLevels);
        this.protectionLevel = protectionLevel;
        this.processCategory();
    }

    RiskCategoryDTO.prototype.processCategory = function () {
        RiskCategoryDTO.sortAxis(this.probabilities, this.matrix.probabilitySortOrderValue);
        RiskCategoryDTO.sortAxis(this.consequences, this.matrix.consequenceSortOrderValue);
        this.setXCollection();
        this.setYCollection();
        this.setHeaders(this.xCollection);
        this.setHeaders(this.yCollection);
        this.populateRows();
    };

    RiskCategoryDTO.prototype.setXCollection = function () {
        if (this.matrix.probabilityAxisValue === 'XAXIS') {
            this.xCollection =  this.probabilities;
        } else {
            this.xCollection = this.consequences;
        }
    };

    RiskCategoryDTO.prototype.setYCollection = function () {
        if (this.matrix.probabilityAxisValue !== 'XAXIS') {
            this.yCollection =  this.probabilities;
        } else {
            this.yCollection = this.consequences;
        }
    };

    RiskCategoryDTO.prototype.populateRows = function () {
        var rowIdx, colIdx, cell, row;

        this.rowArray = [];
        if (this.yCollection) {
            for (rowIdx = 0; rowIdx < this.yCollection.length; rowIdx++) {
                row = {
                    headerTitle: this.yCollection[rowIdx].headerTitle,
                    headerValue: this.yCollection[rowIdx].headerValue,
                    data: [],
                    formattedDescription: this.yCollection[rowIdx].formattedDescription
                };
                this.rowArray[this.rowArray.length] = row;
                if (this.xCollection) {
                    for (colIdx = 0; colIdx < this.xCollection.length; colIdx++) {
                        cell = this.populateCell(this.xCollection[colIdx], this.yCollection[rowIdx]);
                        row.data[row.data.length] = cell;
                    }
                }
            }
        }
    };

    RiskCategoryDTO.prototype.populateCell = function (x, y) {
        var cell = new RiskMatrixCell();

        cell.value = Utilities.calculateRiskRank(this.weight, this.isFinancial,
            x.factor, y.factor, this.protectionLevel);
        cell.value = parseFloat(cell.value.toFixed(5));
        cell.rank = cell.value;
        cell.threshold = Utilities.getThreshold(cell.value, this.matrix.thresholds);
        if (this.matrix.hideNumericRiskRank) {
            cell.value = '';
        }
        if (this.matrix.showAlias) {
            cell.value = Utilities.calculateRiskRankAlias(this.matrix.aliasMask,
                x.alias, y.alias, this.protectionLevel, this.matrix.thresholds, cell.value);
            cell.riskRankAlias = cell.value;
        }
        if (this.matrix.probabilityAxisValue === 'XAXIS') {
            cell.probability = x.factor;
            cell.consequence = y.factor;
        } else {
            cell.probability = y.factor;
            cell.consequence = x.factor;
        }

        return cell;
    };

    RiskCategoryDTO.prototype.setHeaders = function (values) {
        var idx, current;

        if (values) {
            for (idx = values.length - 1; idx > -1; idx--) {
                current = values[idx];
                if (!this.matrix.hideProbabilityAndConsequenceNames) {
                    current.headerTitle = current.formattedName;
                }
                if (this.matrix.showAlias) {
                    current.headerValue = current.alias;
                } else {
                    current.headerValue = current.factor;
                }
            }
        }
    };

    RiskCategoryDTO.sortAxis = function (values, order) {
        if (order === 'ASC') {
            return values.sort(sortFactorAscending);
        } else {
            return values.sort(sortFactorDescending);
        }
    };

    RiskCategoryDTO.fromDataCollection = function fromDataCollection (dataCollection, matrix) {
        var i, dtos = [];
        if (dataCollection) {
            for (i = 0; i < dataCollection.length; i++) {
                dtos[i] = new RiskCategoryDTO(dataCollection[i], matrix);
            }
        }
        return dtos;
    };

    function sortFactorDescending(a, b) {
        return b.factorUI - a.factorUI;
    }

    function sortFactorAscending(a, b) {
        return a.factorUI - b.factorUI;
    }

    return RiskCategoryDTO;
});
