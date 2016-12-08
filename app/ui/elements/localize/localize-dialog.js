define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');


    var DialogBox = require('system/ui/dialog-box'),
        LocalizeDialogViewModel = require('./view-models/localize-dialog-view-model'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        Assert = require('mi-assert');

    function show(type, phrase, key, context, options) {
        var dfd, vm, dialog;
        try {
            Assert.isNumber(type, 'type');
            Assert.stringNotEmpty(phrase, 'phrase');
            Assert.isString(key, 'key');
            Assert.isString(context, 'context');
            assertKeyOrContext(key, context);
            options = options || {};
            dfd = $.Deferred();
            vm = Object.resolve(LocalizeDialogViewModel, type, phrase, key, context);
            dialog = newDialog(vm, options);
            dialog.show().done(show_done.bind(null, dfd, vm));
            return dfd.promise();
        } catch (error) {
            handleError(error);
        }
    }

    function newDialog(vm, options) {
        Assert.isObject(vm, 'vm');
        Assert.isObject(options, 'options');
        return new DialogBox(vm, vm.title(), {
            buttons: [
                { name: vm.text('SAVE'), value: 'save', cssClass: 'btn-primary btn-localize-save'},
                { name: vm.text('CANCEL'), value: 'cancel', cssClass: 'btn-default'}
            ],
            height: options.height || '60%',
            width: options.width || '50%'
        });
    }

    function show_done(dfd, vm, cancelled) {
        try {
            Assert.isNumber(cancelled, 'cancelled');
            if (cancelled) {
                cancel(dfd);
            } else {
                saved(dfd, vm);
            }
        } catch (error) {
            handleError(error);
        }
    }

    function cancel(dfd) {
        Assert.isDeferred(dfd, 'dfd');
        dfd.reject();
    }

    function saved(dfd, vm) {
        Assert.isDeferred(dfd, 'dfd');
        Assert.isObject(vm, 'vm');
        dfd.resolve(vm.localization.currentPhrase());
    }

    function handleError(error) {
        logger.error(error.stack);
        throw error;
    }

    function assertKeyOrContext(key, context) {
        Assert.assert(key.length + context.length > 0,
            'Either key or context must be populated: key = ' + key + ', context = ' + context);
    }

    return {
        show: show
    };
});