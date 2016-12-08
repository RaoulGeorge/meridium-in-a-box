define(function (require, exports, module) {
    'use strict';

    var m = require('mithril'),
        mx = require('system/mithril/mithril-extensions'),
        h = require('system/mithril/html-tags'),
        b = require('system/mithril/bootstrap-tags'),
        dx = require('system/mithril/devex-tags'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        BusyIndicator = require('system/ui/busy-indicator'),
        Assert = require('mi-assert');

    function LocalizeDialogView(vm) {
        try {
            Assert.isObject(vm, 'vm');
            return container(vm, [
                title(vm),
                defaultValue(vm),
                localizedValues(vm)
            ]);
        } catch (error) {
            logger.error(error.stack);
            throw error;
        }
    }

    function container(vm, children) {
        return h.div({
            className: 'localize-dialog',
            config: container_config.bind(null, vm)
        }, children);
    }

    function title(vm) {
        assertVm(vm);
        return h.h1(vm.text('SPECIFY_LOCALIZED_VALUES'));
    }

    function defaultValue(vm) {
        assertVm(vm);
        return b.formGroup([
            h.label(vm.text('DEFAULT_VALUE')),
            b.textBox({ value: vm.localization.phrase(), disabled: true })
        ]);
    }

    function localizedValues(vm) {
        assertVm(vm);
        return dx.dataGrid([
            dx.table([
                h.thead([
                    dx.dataRow([
                        h.td(vm.text('CULTURE')),
                        h.td(vm.text('VALUE_LABEL'))
                    ])
                ]),
                dx.rowsView(mx.map(vm.localization.values(), row, noValues.bind(null, vm)))
            ])
        ]);
    }

    function row(value) {
        Assert.isObject(value, 'value');
        Assert.ok(value.culture(), 'value.culture');
        Assert.isString(value.phrase(), 'value.phrase');
        return dx.dataRow(isSelected(value), [
            h.td(value.culture().toString()),
            h.td([
                b.textBox({
                    onchange: m.withAttr('value', value.phrase),
                    onfocus: value.selected.bind(null, true),
                    onblur: value.selected.bind(null, false),
                    value: value.phrase()
                })
            ])
        ]);
    }

    function isSelected(value) {
        return value.selected() ? { className: 'dx-selection' } : {};
    }

    function noValues(vm) {
        assertVm(vm);
        return h.tr([
            h.td({ colspan: 2, className: 'text-center' }, vm.text('NO_LICENSED_CULTURES'))
        ]);
    }

    function container_config(vm, element, isInitialized, context) {
        var busyIndicator = getBusyIndicator(element, context);
        if (vm.working()) {
            busyIndicator.show();
        } else {
            busyIndicator.hide();
        }
    }

    function getBusyIndicator(element, context) {
        if (!context.indicator) {
            context.indicator = Object.resolve(BusyIndicator, 'loading-large');
            context.indicator.attachTo(element);
        }
        if (!context.onunload) {
            context.onunload = container_unload.bind(null, context);
        }
        return context.indicator;
    }

    function container_unload(context) {
        context.indicator.container = null;
        context.indicator = null;
    }

    function assertVm(vm) {
        Assert.isObject(vm, 'vm');
        Assert.isFunction(vm.text, 'vm.text');
        Assert.isObject(vm.localization, 'vm.localization');
        Assert.isFunction(vm.localization.phrase, 'vm.localization.phrase');
    }

    return LocalizeDialogView;
});
