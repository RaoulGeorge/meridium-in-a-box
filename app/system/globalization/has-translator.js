define(function(require) {
    'use strict';

    var Mixin = require('system/lang/mixin'),
        _private = require('system/lang/private'),
        Translator = require('system/globalization/translator');
    
    function HasTranslator() {
        _private(this).translator = Object.resolve(Translator);
    }
    
    var prototype = HasTranslator.prototype;

    prototype.transl = function (key) {
        return _private(this).translator.translate(key);
    };

    return Mixin.create(HasTranslator);
});