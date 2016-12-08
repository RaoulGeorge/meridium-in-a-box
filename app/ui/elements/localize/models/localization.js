define(function (require) {
    'use strict';

    var _ = require('lodash');

    var m = require('mithril'),
        Assert = require('mi-assert'),
        ApplicationContext = require('application/application-context'),
        LocalizedValue = require('./localized-value');

    function Localization(cultures, type, phrase, key, context) {
        Assert.isNumber(type, 'type');
        Assert.stringNotEmpty(phrase, 'phrase');
        Assert.isString(key, 'key');
        Assert.isString(context, 'context');
        assertKeyOrContext(key, context);
        this.cultures = m.prop();
        this.type = m.prop(type);
        this.phrase = m.prop(phrase || '');
        this.key = m.prop(key);
        this.context = m.prop(context);
        this.values = m.prop();
        this.updateCultures(cultures);
    }

    Localization.prototype.updateCultures = function updateCultures(cultures) {
        this.cultures(cultures);
        this.values(_.map(this.cultures(), LocalizedValue.fromCulture));
    };

    Localization.prototype.add = function add(data) {
        var value = _.find(this.values(), whereCulturesAreEqual.bind(null, data.cultureId));
        if (value) {
            value.phrase(data.value || '');
        }
    };

    function whereCulturesAreEqual(culture, value) {
        Assert.stringNotEmpty(culture, 'culture');
        Assert.instanceOf(value, LocalizedValue, 'value');
        return culture === value.culture().id;
    }

    Localization.prototype.addAll = function addAll(data) {
        _.forEach(data, this.add, this);
    };

    Localization.prototype.currentPhrase = function currentPhrase() {
        var value,
            culture = ApplicationContext.session.licensedCultureId;
        if (culture) {
            value = currentValue(this, culture);
            return LocalizedValue.getPhraseOrDefault(value, this.phrase());
        } else {
            return this.phrase();
        }
    };

    function currentValue(self, culture) {
        Assert.ok(self, 'self');
        Assert.stringNotEmpty(culture, 'culture');
        return _.find(self.values(), whereCulturesAreEqual.bind(null, culture)) || null;
    }

    function assertKeyOrContext(key, context) {
        Assert.assert(key.length + context.length > 0,
            'Either key or context must be populated: key = ' + key + ', context = ' + context);
    }

    return Localization;
});