/// <amd-dependency path="jed" />
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "system/lang/ioc", "jed"], function (require, exports, ioc_1) {
    "use strict";
    var Jed = require('jed');
    var Translator = (function () {
        function Translator() {
            this.jed = null;
        }
        Translator.prototype.setLocale = function (locale) {
            this.jed = new Jed(locale);
        };
        Translator.prototype.translate = function (key, domain, context) {
            if (!key) {
                return key;
            }
            if (!this.jed) {
                return key;
            }
            var request = this.jed.translate(key);
            if (domain) {
                request.onDomain(domain);
            }
            if (context) {
                request.withContext(context);
            }
            return request.fetch();
        };
        ;
        return Translator;
    }());
    Translator = __decorate([
        ioc_1.singleton
    ], Translator);
    return Translator;
});
