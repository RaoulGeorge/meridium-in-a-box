define(function(require) {
    'use strict';

    var $ = require('jquery'),
        m = require('mithril'),
        R = require('ramda'),
        Datasheet = require('platform/datasheets/datasheet');

    function DatasheetView(vm, attrs) {
        vm.setState(attrs);
        return m('div', {
            config: configure(vm)
        }, 'Test Datasheet');
    }

    var configure = R.curry(function configure(vm, element, isInitialized, context) {
        if (isInitialized) {
            update(element, context, vm);
        } else {
            initialize(element, context, vm);
        }
    });

    function update(element, context, vm) {
        if (context.options.familyKey !== vm.familyKey) {
            initialize(element, context, vm);
        }

    }

    function initialize(element, context, vm) {
        context.retain = true;
        context.onunload = R.partial(dispose, [element, context]);
        var options = {
            'containerEl': $(element),
            'familyKey': vm.familyKey,
            'entityObj': vm.entityObj,
        };
        context.options = options;
        context.datasheet = createDatasheet(element, vm, options);
    }

    function dispose(/* element, context */) {
        console.log('dispose');
    }

    function createDatasheet(element, vm, opts) {
        var datasheet = new Datasheet(opts);
        datasheet.load()
            .done(R.partial(datasheetLoaded, [vm, datasheet]));
        return datasheet;
    }

    function datasheetLoaded(vm, datasheet) {
        vm.onLoad(datasheet);
    }

    return DatasheetView;
});