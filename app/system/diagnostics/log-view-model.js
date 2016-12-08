var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "lodash", "../lang/ioc", "./views/log-view", "spa/react/react-view-model", "./logger", "./log-manager", "./log-service", "system/text/formatter", "system/globalization/translator", "application/application-context", "application/application-events", "system/ui/message-box"], function (require, exports, _, ioc_1, log_view_1, ReactViewModel, Logger, LogManager, LogService, Formatter, Translator, ApplicationContext, ApplicationEvents, MessageBox) {
    "use strict";
    var HELP_CONTEXT = '../Subsystems/Errors/Content/ErrorsOverview.htm';
    var levels = [
        { value: Logger.levels.trace, text: 'TRACE' },
        { value: Logger.levels.debug, text: 'DEBUG' },
        { value: Logger.levels.info, text: 'INFO' },
        { value: Logger.levels.warn, text: 'WARN' },
        { value: Logger.levels.error, text: 'ERROR' }
    ];
    var LogViewModel = (function (_super) {
        __extends(LogViewModel, _super);
        function LogViewModel(logService, translator, formatter, appEvents) {
            var _this = _super.call(this, log_view_1.LogView) || this;
            _this.logService = logService;
            _this.translator = translator;
            _this.formatter = formatter;
            _this.titleChanged = appEvents.titleChanged;
            _this.messages = [];
            _this.selectedMessage = null;
            _this.bindMethods(['loadMessages', 'setMessages']);
            _this.updateViewAfter(['restoreDefault', 'clearLog', 'selectMessage', 'setLevel', 'refresh']);
            return _this;
        }
        LogViewModel.prototype.activate = function () {
            ApplicationContext.help.helpContext = HELP_CONTEXT;
        };
        LogViewModel.prototype.open = function () {
            try {
                this.titleChanged.raise(this.translate('LOG_VIEWER'), this);
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.translate = function (value) {
            return this.translator.translate(value);
        };
        LogViewModel.prototype.load = function () {
            try {
                this.loadMessages();
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.loadMessages = function () {
            return this.logService.getAllMessages()
                .done(this.setMessages);
        };
        LogViewModel.prototype.setMessages = function (messages) {
            this.messages = messages;
            if (this['isAttached']) {
                this.updateView();
            }
        };
        LogViewModel.prototype.restoreDefault = function () {
            try {
                this.setLevel(getLevel(LogManager.defaultLevel));
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.setLevel = function (level) {
            try {
                LogManager.setLevel(level.value);
                this.logService.saveConfig({ level: level.value });
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.clearLog = function () {
            try {
                this.promptForConfirmation()
                    .done(this.clearLogIfConfirmed());
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.promptForConfirmation = function () {
            var message = this.translate('CONFIRMATION_CLEAR_LOG');
            var title = this.translate('CLEAR_LOG');
            return MessageBox.showOkCancel(message, title);
        };
        LogViewModel.prototype.clearLogIfConfirmed = function () {
            var _this = this;
            return function (buttonClicked) {
                if (buttonClicked !== 0) {
                    return;
                }
                _this.selectedMessage = null;
                _this.logService.clearLog()
                    .done(_this.loadMessages);
            };
        };
        LogViewModel.prototype.selectMessage = function (message) {
            try {
                this.selectedMessage = message;
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.refresh = function () {
            try {
                this.loadMessages();
                this.selectedMessage = null;
            }
            catch (error) {
                handleError(error);
            }
        };
        LogViewModel.prototype.getMessages = function () {
            return this.messages;
        };
        LogViewModel.prototype.getSelectedMessage = function () {
            return this.selectedMessage;
        };
        LogViewModel.prototype.getLevels = function () {
            return this.translateLevels(levels);
        };
        LogViewModel.prototype.translateLevels = function (levels) {
            var i;
            for (i = 0; i < levels.length; i++) {
                var level = levels[i];
                level.text = this.translate(level.text);
            }
            return levels;
        };
        LogViewModel.prototype.getCurrentLevel = function () {
            return getLevel(LogManager.level);
        };
        return LogViewModel;
    }(ReactViewModel));
    LogViewModel = __decorate([
        ioc_1.dependsOn(LogService, Translator, Formatter, ApplicationEvents)
    ], LogViewModel);
    function getLevel(level) {
        return _.find(levels, hasLevel.bind(null, level));
    }
    function hasLevel(level, item) {
        return item.value === level;
    }
    function handleError(error) {
        console.error(error);
        throw error;
    }
    return LogViewModel;
});
