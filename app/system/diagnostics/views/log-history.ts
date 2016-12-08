import {DOM} from 'react';
import {merge} from 'ramda';
import {ElementR} from 'system/react/react-types';
import {mapOrDefault} from 'system/react/react-common';
import {blockGroup, classAttr, heading, Level, NA, translate} from './log-view-common';

import LogMessage = require('../log-message');

interface Props {
    messages: LogMessage[];
    selectedMessage: Nullable<LogMessage>;
    levels: Level[];
    onClick(message: LogMessage): void;
    onRefresh(): void;
}

const {button, div, i, section, tbody, td, thead, tr } = DOM;

const logHistory = (...children: ElementR[]) => section(classAttr('log-history'), ...children);
const icon = (className: string) => i(classAttr(className));
const table = (...children: ElementR[]) => DOM.table(classAttr('table table-hover table-condensed'), ...children);
const th = (className: string, key: string) => DOM.th(classAttr(className), translate(key));

export function LogHistory(props: Props): ElementR {
    return logHistory(
        sectionHeading(props.onRefresh),
        content(props)
    );
}

function sectionHeading(onRefresh: Action): ElementR {
    return blockGroup(
        div(classAttr('text block'), heading('LOG_HISTORY')),
        div(classAttr('icon block'),
            button(merge(classAttr('btn btn-primary btn-icon'), { onClick: onRefresh }),
                icon('icon-refresh')
            )
        )
    );
}

function content(props: Props): ElementR {
    return div(classAttr('condensed-table-container'),
        table(
            thead(NA, columnHeadings()),
            tbody(NA, ...messageRows(props))
        )
    );
}

function columnHeadings(): ElementR {
    return tr(NA,
        th('timestamp', 'DATETIME'),
        th('level', 'LEVEL'),
        th('source', 'SOURCE'),
        th('message', 'MESSAGE')
    );
}

const messageRow = (props: Props) => (message: LogMessage): ElementR => {
    const onClick = () => props.onClick(message);
    const rowClass = props.selectedMessage === message ? classAttr('active') : NA;
    return tr(rowClass,
        cell(onClick, 'timestamp', message.getFormattedTimestamp()),
        cell(onClick, 'level', message.getLevelCaption(props.levels)),
        cell(onClick, 'source', message.fullSource()),
        cell(onClick, 'message', message.text)
    );
};

function cell(onClick: Function, cellClass: string, value: string): ElementR {
    return td(merge(classAttr(cellClass), { onClick }), value);
}

function messageRows(props: Props): ElementR[] {
    return mapOrDefault(messageRow(props), noMessages, props.messages);
}

function noMessages(): ElementR {
    const attrs = merge(classAttr('text-center'), { colSpan: 4 });
    return tr(NA, td(attrs, translate('NO_LOG_ENTRIES')));
}