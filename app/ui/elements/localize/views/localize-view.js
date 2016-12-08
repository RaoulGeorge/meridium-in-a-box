define(function (require) {
    'use strict';

    var m = require('mithril'),
        h = require('system/mithril/html-tags'),
        b = require('system/mithril/bootstrap-tags'),
        Translator = require('system/globalization/translator');

    function LocalizeView(vm) {
        return vm.visible() ? globeButton(vm) : h.span();
    }

    function globeButton(vm) {
        var localize = vm.localize.bind(vm),
            disabled = vm.disabled(),
            translator = Object.resolve(Translator),
            title = translator.translate('LOCALIZE_PHRASE').replace('{0}', vm.phrase());
        return b.inputGroupButton([
            b.iconButton({ onclick: localize, disabled: disabled, title: title }, [
                h.icon('.icon-translation')
            ])
        ]);
    }

    return LocalizeView;
});
