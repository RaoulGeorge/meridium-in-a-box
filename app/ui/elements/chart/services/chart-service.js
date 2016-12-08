define(function(require) {
	'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var AjaxClient = require('system/http/ajax-client'),
        AjaxRequest = require('system/http/ajax-request'),
        TimezoneDTO = require('security/services/timezone-dto'),
        LOCALIZER_URL = 'meridium/api/core/localizer',
        TRANSLATE_CONTEXT_URL = LOCALIZER_URL + '/translations?localizableType={0}&defaultValue={1}&objectContext={2}',
        GLOBALIZATION_URL = 'meridium/api/core/globalization';

	function ChartService () {
		this.ajaxClient = Object.resolve(AjaxClient);
	}

	ChartService.prototype.getByKey = function (key) {
		return this.ajaxClient.get('meridium/api/core/catalog/item/' + key);
	};

	ChartService.prototype.getByPath = function (path) {
		return this.ajaxClient.get('meridium/api/core/catalog/item?path=' + path);
	};

    ChartService.prototype.getTimezones = function () {
        var dfd = $.Deferred();
        this.ajaxClient.get(GLOBALIZATION_URL + '/timezone', {
        }).done(function (data) {
            dfd.resolve(new TimezoneDTO.fromDataCollection(data));
        }).fail(function (response) {
            dfd.reject(response);
        });
        return dfd.promise();
    };

    ChartService.prototype.getTranslation = function (language, phrase, context) {
        var dfd = $.Deferred(),
            url = createTranslationsUrl(phrase, context);
        AjaxRequest.get(url).send(dfd)
            .done(getTranslation_done.bind(null, dfd, language, phrase));
        return dfd.promise();
    };

    function createTranslationsUrl(phrase, context) {
        var GRAPH_LOCALIZE_TYPE = 28;
        return TRANSLATE_CONTEXT_URL
            .replace('{0}', encodeURIComponent(GRAPH_LOCALIZE_TYPE))
            .replace('{1}', encodeURIComponent(phrase))
            .replace('{2}', encodeURIComponent(context));
    }

    function getTranslation_done(dfd, language, phrase, data) {
        var item = _.find(data, { cultureId: language });
        if (item) {
            phrase = item.value;
        }
        dfd.resolve(phrase);
    }

	return ChartService;
});
