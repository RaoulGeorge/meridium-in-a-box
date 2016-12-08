import * as _ from 'lodash';
import {dependsOn} from '../lang/ioc';
import {LogView, LogViewSource} from './views/log-view';

import Event = require('system/lang/event');
import ReactViewModel = require('spa/react/react-view-model');
import Logger = require('./logger');
import LogManager = require('./log-manager');
import LogService = require('./log-service');
import LogMessage = require('./log-message');
import Formatter = require('system/text/formatter');
import Translator = require('system/globalization/translator');
import ApplicationContext = require('application/application-context');
import ApplicationEvents = require('application/application-events');
import MessageBox = require('system/ui/message-box');

const HELP_CONTEXT = '../Subsystems/Errors/Content/ErrorsOverview.htm';

interface Level {
    value: string;
    text: string;
}

const levels: Level[] = [
    { value: Logger.levels.trace, text: 'TRACE' },
    { value: Logger.levels.debug, text: 'DEBUG' },
    { value: Logger.levels.info, text: 'INFO' },
    { value: Logger.levels.warn, text: 'WARN' },
    { value: Logger.levels.error, text: 'ERROR' }
];

@dependsOn(LogService, Translator, Formatter, ApplicationEvents)
class LogViewModel extends ReactViewModel implements LogViewSource {
    private logService: LogService;
    private translator: Translator;
    private formatter: Formatter;
    private titleChanged: Event;
    private messages: LogMessage[];
    private selectedMessage: Nullable<LogMessage>;

    constructor(logService: LogService,  translator: Translator, formatter: Formatter, appEvents: ApplicationEvents) {
        super(LogView);
        this.logService = logService;
        this.translator = translator;
        this.formatter = formatter;
        this.titleChanged = appEvents.titleChanged;
        this.messages = [];
        this.selectedMessage = null;

        this.bindMethods(['loadMessages', 'setMessages']);
        this.updateViewAfter(['restoreDefault', 'clearLog', 'selectMessage', 'setLevel', 'refresh']);
    }

    public activate(): void {
        ApplicationContext.help.helpContext = HELP_CONTEXT;
    }

    public open(): void {
        try {
            this.titleChanged.raise(this.translate('LOG_VIEWER'), this);
        } catch (error) {
            handleError(error);
        }
    }

    private translate(value: string): string {
        return this.translator.translate(value);
    }

    public load(): void {
        try {
            this.loadMessages();
        } catch(error) {
            handleError(error);
        }
    }

    private loadMessages(): JQueryPromise<LogMessage[]> {
        return this.logService.getAllMessages()
            .done(this.setMessages);
    }

    private setMessages(messages: LogMessage[]): void {
        this.messages = messages;
        if (this['isAttached']) {
            this.updateView();
        }
    }

    public restoreDefault(): void {
        try {
            this.setLevel(getLevel(LogManager.defaultLevel));
        } catch (error) {
            handleError(error);
        }
    }

    public setLevel(level: Level): void {
        try {
            LogManager.setLevel(level.value);
            this.logService.saveConfig({level: level.value});
        } catch (error) {
            handleError(error);
        }
    }

    public clearLog(): void {
        try {
            this.promptForConfirmation()
                .done(this.clearLogIfConfirmed());
        } catch (error) {
            handleError(error);
        }
    }

    private promptForConfirmation(): JQueryDeferred<number> {
        const message = this.translate('CONFIRMATION_CLEAR_LOG');
        const title = this.translate('CLEAR_LOG');
        return MessageBox.showOkCancel(message, title);
    }

    private clearLogIfConfirmed(): JQueryPromiseCallback<number> {
        return (buttonClicked: number): void => {
            if (buttonClicked !== 0) { return; }
            this.selectedMessage = null;
            this.logService.clearLog()
                .done(this.loadMessages);
        };
    }

    public selectMessage(message: LogMessage): void {
        try {
            this.selectedMessage = message;
        } catch (error) {
            handleError(error);
        }
    }

    public refresh(): void {
        try {
            this.loadMessages();
            this.selectedMessage = null;
        } catch (error) {
            handleError(error);
        }
    }

    public getMessages(): LogMessage[] {
        return this.messages;
    }

    public getSelectedMessage(): Nullable<LogMessage> {
        return this.selectedMessage;
    }

    public getLevels(): Level[] {
        return this.translateLevels(levels);
    }

    private translateLevels(levels: Level[]): Level[] {
        let i;
        for (i = 0; i < levels.length; i++) {
            const level = levels[i];
            level.text = this.translate(level.text);
        }
        return levels;
    }

    public getCurrentLevel(): Level {
        return getLevel(LogManager.level);
    }
}

function getLevel(level: string): Level {
    return _.find(levels, hasLevel.bind(null, level));
}

function hasLevel(level: string, item: Level): boolean {
    return item.value === level;
}

function handleError(error: Error): never {
    console.error(error);
    throw error;
}

export = LogViewModel;
