define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        Service = require('macros/services/macro-service'),
        MacroDTO = require('macros/models/macro-dto'),
        converter = require('system/lang/converter'),
        Translator = require('system/globalization/translator'),
        MessageBox = require('system/ui/message-box'),
        InputDialog = require('./ui/input-dialog/input-dialog-view-model'),
        DialogViewModel = require('system/ui/dialog-view-model');
    var appEvents = require('application/application-events');
    var jQuery = require('jquery');

    function MacroActionRoute() {
        this.macro = Object.resolve(MacroDTO);
        this.service = Object.resolve(Service);
        this.appEvents = Object.resolve(appEvents);
        this.navigate = this.appEvents.navigate;
        this.translator = Object.resolve(Translator);
    }

    MacroActionRoute.dependsOn = [
    Service,
    MacroDTO
    ];

    MacroActionRoute.prototype.execute = function (config) {
        var dfd = $.Deferred(), i = 0, hasValue = true;
        var self = this;
        var returnData = null;
        var showConfirm = false;
        if (config.query && config.query.length > 0) {
            if (config.query[0].project) {
                self.macro.projectPath = config.query[0].project;
            }
            if (config.query[0].macro) {
                self.macro.macroName = config.query[0].macro;
            }
            i = 0;
            while (hasValue) {
                var propName = 'p' + i;
                if (config.query[0][propName]) {
                    this.macro.inputs.push(config.query[0][propName]);
                } else {
                    hasValue = false;
                }
                i++;
            }
            if (config.query[0]['EntityKey']) {
                self.macro.inputs.push(config.query[0]['EntityKey']);
            }
            if (config.query[0]['confirm']) {
                showConfirm = converter.toBoolean(config.query[0]['confirm'], 'true');
            }
            if (showConfirm) {
                MessageBox.showYesNo(self.translate('MACRO_EXECUTION_CNF_MSG'), self.translate('MACRO_EXECUTION_CNF_MSG_TITLE')).done(function (buttonClicked) {
                    if (buttonClicked === 0) {                        
                        self.runURL(self.macro).done(function (data) {
                            if (data !== "") {
                                returnData = jQuery.parseJSON(data);
                                if (returnData.messageboxtype) {
                                    self.showMessageBox(returnData);
                                }
                                else if (returnData.inputdialog) {
                                    self.showInputDialog(returnData);
                                }
                                else if (returnData.jsmodule) {
                                    self.showJSModule(returnData);
                                }
                            }                                                       
                        });
                    }
                });
            }
            else {
                self.runURL(self.macro).done(function (data) {
                    if (data !== "") {
                        returnData = jQuery.parseJSON(data);
                        if (returnData.messageboxtype) {
                            self.showMessageBox(returnData);
                        }
                        else if (returnData.inputdialog) {
                            self.showInputDialog(returnData);
                        }
                        else if (returnData.jsmodule) {
                            self.showJSModule(returnData);
                        }
                    }
                });
            }
        }
        dfd.resolve();

        return dfd;
    };

    MacroActionRoute.prototype.runURL = function runURL(macro) {
        var dfd = $.Deferred();
        this.service.postWebMacro(macro)
            .done(function (data) {
                dfd.resolve(data);
            })
            .fail(function (error) {
            });
        return dfd.promise();
    };

    MacroActionRoute.prototype.showMessageBox = function showMessageBox(message) {
        var self = this;
        switch (message.messageboxtype.toUpperCase()) {
            case 'OK': {
                MessageBox.showOk(message.message, message.title).done(function (buttonClicked) {
                    if (message.callbacks && message.callbacks.length > 0 && message.callbacks[0] !== "") {
                        if (isMacro(message.callbacks[0])) {
                            if (isActionRoute(message.callbacks[0])) {
                                message.callbacks[0] = message.callbacks[0].substring(1);
                                self.navigate.raise(message.callbacks[0], { isActionRoute: true });
                            }
                            else {
                                var index = getParameterIndex(message.callbacks[0]);
                                var appendURL = '&p' + index + '=' + buttonClicked;
                                self.navigate.raise(message.callbacks[0] + '&' + appendURL, { isActionRoute: true });
                            }
                        } else {
                            self.navigate.raise(message.callbacks[0], { tab: true });
                        }
                    }
                });
                break;
            }
            case 'YESNO': {
                MessageBox.showYesNo(message.message, message.title).done(function (buttonClicked) {
                    if (message.callbacks && message.callbacks.length > 0) {
                        if (message.callbacks[0] !== "") {
                            if (isMacro(message.callbacks[0])) {
                                if (isActionRoute(message.callbacks[0])) {
                                    message.callbacks[0] = message.callbacks[0].substring(1);
                                    self.navigate.raise(message.callbacks[0], { isActionRoute: true });
                                }
                                else {
                                    var index = getParameterIndex(message.callbacks[0]);
                                    var appendURL = '&p' + index + '=' + buttonClicked;
                                    self.navigate.raise(message.callbacks[0] + '&' + appendURL, { isActionRoute: true });
                                }
                            } else {
                                self.navigate.raise(message.callbacks[0], { tab: true });
                            }
                        }
                    }
                });
                break;
            }
            case 'YESNOCANCEL': {
                MessageBox.showYesNoCancel(message.message, message.title).done(function (buttonClicked) {
                    if (message.callbacks && message.callbacks.length > 0) {
                        if (message.callbacks[0] !== "") {
                            if (isMacro(message.callbacks[0])) {
                                if (isActionRoute(message.callbacks[0])) {
                                    message.callbacks[0] = message.callbacks[0].substring(1);
                                    self.navigate.raise(message.callbacks[0], { isActionRoute: true });
                                }
                                else {
                                    var index = getParameterIndex(message.callbacks[0]);
                                    var appendURL = '&p' + index + '=' + buttonClicked;
                                    self.navigate.raise(message.callbacks[0] + '&' + appendURL, { isActionRoute: true });
                                }
                            } else {
                                self.navigate.raise(message.callbacks[0], { tab: true });
                            }
                        }
                    }
                });
                break;
            }
            case 'OKCANCEL': {
                MessageBox.showOkCancel(message.message, message.title).done(function (buttonClicked) {
                    if (message.callbacks && message.callbacks.length > 0) {
                        if (message.callbacks[0] !== "") {
                            if (isMacro(message.callbacks[0])) {
                                if (isActionRoute(message.callbacks[0])) {
                                    message.callbacks[0] = message.callbacks[0].substring(1);
                                    self.navigate.raise(message.callbacks[0], { isActionRoute: true });
                                }
                                else {
                                    var index = getParameterIndex(message.callbacks[0]);
                                    var appendURL = '&p' + index + '=' + buttonClicked;
                                    self.navigate.raise(message.callbacks[0] + '&' + appendURL, { isActionRoute: true });
                                }
                            }
                            else {
                                self.navigate.raise(message.callbacks[0], { tab: true });
                            }
                        }
                    }
                });
                break;
            }
            default: {
                MessageBox.showOk(message.message, message.title).done(function (buttonClicked) {
                    if (message.callbacks && message.callbacks.length > 0 && message.callbacks[0] !== "") {
                        if (isMacro(message.callbacks[0])) {
                            if (isActionRoute(message.callbacks[0])) {
                                message.callbacks[0] = message.callbacks[0].substring(1);
                                self.navigate.raise(message.callbacks[0], { isActionRoute: true });
                            }
                            else {
                                var index = getParameterIndex(message.callbacks[0]);
                                var appendURL = '&p' + index + '=' + buttonClicked;
                                self.navigate.raise(message.callbacks[0] + '&' + appendURL, { isActionRoute: true });
                            }
                        } else {
                            self.navigate.raise(message.callbacks[0], { tab: true });
                        }
                    }
                });
                break;
            }
        }

    };

    MacroActionRoute.prototype.showInputDialog = function showInputDialog(message) {
        var self = this;
        var inputDialog = Object.resolve(InputDialog, message);
        var dialog = new DialogViewModel(inputDialog, message.title, { height: '90%', width: '90%' });
        inputDialog.setDialog(dialog);
        dialog.show();
        var index = getParameterIndex(message.callbacks[0]);
        inputDialog.onClose.add(function (fields) {
            var appendURL = '&p' + index + '=' + JSON.stringify(fields);

            if (isMacro(message.callbacks[0])) {
                if (isActionRoute(message.callbacks[0])) {
                    message.callbacks[0] = message.callbacks[0].substring(1);
                    self.navigate.raise(message.callbacks[0], { isActionRoute: true });
                }
                else {
                    self.navigate.raise(message.callbacks[0] + '&' + appendURL, { isActionRoute: true });
                }
            } else {
                self.navigate.raise(message.callbacks[0], {'tab': true});
            }
        });
    };

    MacroActionRoute.prototype.showJSModule = function showJSModule(message) {
        var self = this;
        require([message.jsmodule], function (constructor) {
            var base;
            base = new constructor();
            base.show(message.params)
                    .done(popupDialogResults.bind(null, message.callbacks[0], self));
        });
    };

    MacroActionRoute.prototype.translate = function MacroActionRoute_translate(key) {
        return this.translator.translate(key);
    };

    //Checking if the callback is a macro or a new tab
    function isMacro(callback) {
        if(callback && (callback.toLowerCase().indexOf('webmacros') >= 0 || callback.toLowerCase().indexOf('!') === 0)) {
            return true;
        }
        return false;
    }

    function isActionRoute(callback) {
        if (callback.indexOf('!') === 0) {
            return true;
        }
        return false;
    }

    function popupDialogResults(callbackURL, self, result) {
        var index = getParameterIndex(callbackURL);
        if(typeof result === "object"){
            callbackURL += '&p' + index + '=' + JSON.stringify(result);
        }
        else {
            callbackURL = callbackURL + '&p' + index.toString() + '=' + result;
        }       
        self.navigate.raise(callbackURL, { isActionRoute: true });
    }

    function getParameterIndex(url) {
        if (url.indexOf('&p') > -1) {
            var newUrl = url.substring(url.lastIndexOf('&p') + 2);
            return Number(newUrl.substring(0, 1)) + 1;
        }
        else {
            return 0;
        }
    }

    return MacroActionRoute;
});