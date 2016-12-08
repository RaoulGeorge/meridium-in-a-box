define(function () {
	'use strict';

	function RiskMatrixCell() {
		this.value = '';
		this.rank = 0.0;
		this.riskRankAlias = '';
		this.threshold = null;
		this.probability = 0.0;
		this.consequence = 0.0;
	}

	return RiskMatrixCell;
});
