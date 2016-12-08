define(function () {
	'use strict';

	function SeriesDTO (data) {
		data = data || {};
		this.name = data.name || '';
		this.alias = data.alias || '';
		this.defaultAlias = data.defaultAlias || '';
		this.uniqueId = data.uniqueId || '';
		this.chartType = data.chartType || '';
		this.hyperlink = data.hyperlink || 'None';
		this.hyperlinkAlias = data.hyperlinkAlias || '';
		this.color = data.color || '';
		this.yAxis = data.yAxis || 0;
	}

	return SeriesDTO;
});
