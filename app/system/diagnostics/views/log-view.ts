import {partial} from 'ramda';
import {createElement, DOM} from 'react';
import {ElementR} from 'system/react/react-types';
import {classAttr, idAttr, Level} from './log-view-common';
import {LogSettings} from './log-settings';
import {LogHistory} from './log-history';
import {LogDetail} from './log-detail';

import LogMessage = require('../log-message');

export interface LogViewSource {
    restoreDefault(): void;
    clearLog(): void;
    getMessages(): LogMessage[];
    getSelectedMessage(): Nullable<LogMessage>;
    getLevels(): Level[];
    selectMessage(message: LogMessage): void;
    setLevel(level: Level): void;
    getCurrentLevel(): Level;
    refresh(): void;
}

type LogViewProps = { vm: LogViewSource };

const {div} = DOM;
const page = partial(div, [idAttr('log-screen')]);
const messageContainer = partial(div, [classAttr('log-history-message-container block')]);

export function LogView({vm}: LogViewProps): ElementR {
    return page(
        settings(vm),
        messageContainer(
            history(vm),
            detail(vm)
        )
    );
}

function settings(vm: LogViewSource): ElementR {
    return createElement(LogSettings, {
        currentLevel: vm.getCurrentLevel(),
        levels: vm.getLevels(),
        onLevelChange: vm.setLevel,
        onRestoreDefault: vm.restoreDefault,
        onClearLog: vm.clearLog
    });
}

function history(vm: LogViewSource): ElementR {
    return createElement(LogHistory, {
        messages: vm.getMessages(),
        selectedMessage: vm.getSelectedMessage(),
        levels: vm.getLevels(),
        onClick: vm.selectMessage,
        onRefresh: vm.refresh
    });
}

function detail(vm: LogViewSource): ElementR {
    return createElement(LogDetail, {
        message: vm.getSelectedMessage()
    });
}
