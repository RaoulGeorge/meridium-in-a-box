define(function (require) {
    'use strict';

    var _ = require('lodash');

    var AjaxRequest = require('system/http/es6-ajax-request'),
        Promise = require('bluebird'),
        Culture = require('system/globalization/culture'),
        Assert = require('mi-assert');

    var LOCALIZER_URL = 'meridium/api/core/localizer',
        LANGUAGES = LOCALIZER_URL + '/languages?transType={0}',
        TRANSLATE_KEY_URL = LOCALIZER_URL + '/translations/objectKey/{0}?localizableType={1}&defaultValue={2}',
        TRANSLATE_CONTEXT_URL = LOCALIZER_URL + '/translations?localizableType={0}&defaultValue={1}&objectContext={2}';

    function LocalizationService() {
        // do nothing
    }

    LocalizationService.prototype.getLanguages = function getLanguages(translationType) {
        var type = arguments.length > 0 ? translationType : 1,
            request = AjaxRequest.get(LANGUAGES.replace('{0}', type));
        return request.send()
            .then(Culture.fromJsonArray);
    };

    LocalizationService.prototype.getTranslationValues = function (type, phrase, key, context) {
        var url = createTranslationsUrl(type, phrase, key, context);
        return AjaxRequest.get(url).send();
    };

    function createTranslationsUrl(type, phrase, key, context) {
        assertKeyOrContext(key, context);
        if (key) {
            return TRANSLATE_KEY_URL
                .replace('{0}', encodeURIComponent(key))
                .replace('{1}', encodeURIComponent(type))
                .replace('{2}', encodeURIComponent(phrase));
        } else {
            return TRANSLATE_CONTEXT_URL
                .replace('{0}', encodeURIComponent(type))
                .replace('{1}', encodeURIComponent(phrase))
                .replace('{2}', encodeURIComponent(context));
        }
    }

    LocalizationService.prototype.saveTranslationValues = function (type, phrase, key, context, values) {
        var promise,
            url = createTranslationsUrl(type, phrase, key, context);
        values = toLocalizedValueDTOs(values);
        if (values.length) {
            return AjaxRequest.put(url, values).send();
        } else {
            promise = Promise.resolve();
            _.defer(promise.resolve.bind(promise));
            return promise;
        }
    };

    function toLocalizedValueDTOs(values) {
        return _(values).map(toLocalizedValueDTO).value();
    }

    function toLocalizedValueDTO(value) {
        return {
            cultureId: value.culture().id,
            translation: value.phrase()
        };
    }

    function assertKeyOrContext(key, context) {
        Assert.assert(key.length + context.length > 0,
            'Either key or context must be populated: key = ' + key + ', context = ' + context);
    }

    return LocalizationService;
});