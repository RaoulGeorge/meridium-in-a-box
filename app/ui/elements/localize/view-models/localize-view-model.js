define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');


    var ApplicationContext = require('application/application-context'),
        LocalizeDialog = require('../localize-dialog'),
        Event = require('system/lang/event'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        Assert = require('mi-assert');

    function LocalizeViewModel() {
        this.type = Object.prop();
        this.phrase = Object.prop('');
        this.key = Object.prop('');
        this.context = Object.prop('');
        this.dialogClosed = Object.resolve(Event);
    }

    LocalizeViewModel.prototype.localize = function () {
        var dfd;
        try {
            dfd = $.Deferred();
            LocalizeDialog.show(parseInt(this.type(), 10), this.phrase(), this.key(), this.context())
                .done(show_done.bind(null, this, dfd))
                .fail(dfd.reject.bind(dfd));
            return dfd.promise();
        } catch (error) {
            handleError(error);
        }
    };

    LocalizeViewModel.prototype.dispose = function dispose() {
        try {
            if (this.dialogClosed) {
                this.dialogClosed.remove();
                this.dialogClosed = null;
            }
        } catch (error) {
            handleError(error);
        }
    };

    LocalizeViewModel.prototype.visible = function visible() {
        return ApplicationContext.user.isSuperUser;
    };

    LocalizeViewModel.prototype.disabled = function disabled() {
        return this.phrase().length === 0;
    };

    function show_done(self, dfd, phrase) {
        var result;
        try {
            assertThis(self);
            Assert.isDeferred(dfd, 'dfd');
            Assert.stringNotEmpty(phrase, 'phrase');
            result = { phrase: phrase };
            self.dialogClosed.raise(self, result);
            dfd.resolve(result);
        } catch (error) {
            handleError(error);
        }
    }

    function assertThis(self) {
        Assert.instanceOf(self, LocalizeViewModel, 'self');
    }

    function handleError(error) {
        logger.error(error.stack);
        throw error;
    }

    return LocalizeViewModel;
});