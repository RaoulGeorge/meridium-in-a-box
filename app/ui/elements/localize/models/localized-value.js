define(function (require) {
    'use strict';

    var m = require('mithril'),
        Assert = require('mi-assert');

    function LocalizedValue(culture, phrase) {
        Assert.ok(culture, 'culture');
        Assert.isString(phrase, 'phrase');
        this.culture = m.prop(culture);
        this.phrase = m.prop(phrase);
        this.selected = m.prop(false);
    }

    LocalizedValue.fromCulture = function fromCulture(culture) {
        return new LocalizedValue(culture, '');
    };

    LocalizedValue.getPhraseOrDefault = function (localizedValue, defaultPhrase) {
        return LocalizedValue.hasPhrase(localizedValue) ? localizedValue.phrase() : defaultPhrase;
    };

    LocalizedValue.hasPhrase = function (localizedValue) {
        if (!localizedValue) { return false; }
        return !!localizedValue.phrase();
    };

    return LocalizedValue;
});