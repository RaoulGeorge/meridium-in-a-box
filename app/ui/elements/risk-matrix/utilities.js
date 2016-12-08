define(function () {
	'use strict';

	var COLUMN_TEMPLATE = '{c}',
		ROW_TEMPLATE = '{r}',
		PROTECTION_LEVEL_TEMPLATE = '{pl}',
		THRESHOLD_TEMPLATE = '{t}';

	function Utilities() {}

	Utilities.calculateRiskRank = function (weight, isFinancial, xValue, yValue, protectionLevel) {
		if (isFinancial) {
			return xValue * yValue;
		} else {
			return xValue * yValue * (protectionLevel || 1) * weight;
		}
	};

	Utilities.calculateRiskRankAlias = function (mask, columnValue, rowValue, protectionLevel, thresholds, riskRank) {
		var alias = '', threshold;

		alias = mask.replace(COLUMN_TEMPLATE, columnValue);
		alias = alias.replace(ROW_TEMPLATE, rowValue);
		alias = alias.replace(PROTECTION_LEVEL_TEMPLATE, protectionLevel);
		threshold = Utilities.getThreshold(riskRank, thresholds);
		if (threshold) {
			alias = alias.replace(THRESHOLD_TEMPLATE, threshold.alias);
		}
		return alias;
	};

	Utilities.getThreshold = function (riskRank, thresholds) {
		var previousFloor = -1, idx, result;

		if (thresholds && thresholds.length > 0) {
			for (idx = 0; idx < thresholds.length; idx++) {
				if (thresholds[idx].value <= riskRank && thresholds[idx].value > previousFloor) {
					result = thresholds[idx];
					previousFloor = thresholds[idx].value;
				}
			}
		}
		return result;
	};

	Utilities.findRiskRank = function(name, risks){
		var idx;

        for (idx = 0; idx < risks.length; idx++) {
            if (risks[idx] && risks[idx].categoryName === name) {
                return risks[idx];
            }
        }
        return {};
	};

	Utilities.checkRiskRankAlias = function (matrix, alias){
		if (!matrix.showAlias || alias === ' - ') {
            return '';
        } else {
            return alias;
        }
	};

	Utilities.findFinancialCategory = function (risks){
		var idx;

        for (idx = 0; idx < risks.length; idx++) {
            if (risks[idx] && risks[idx].isFinancial) {
                return risks[idx];
            }
        }
	};

	return Utilities;
});
