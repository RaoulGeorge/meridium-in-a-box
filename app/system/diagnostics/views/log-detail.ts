import {DOM} from 'react';
import {ElementR} from 'system/react/react-types';
import {elementOrNothing} from 'system/react/react-common';
import {blockGroup, classAttr, heading, NA, translate} from './log-view-common';

import LogMessage = require('../log-message');

interface Props {
    message: Nullable<LogMessage>;
}

const {div, label, output, section} = DOM;

export function LogDetail({message}: Props): ElementR {
    return section({className: 'message-detail'},
        heading('MESSAGE'),
        elementOrNothing(selectedMessage, message)
    );
}

function selectedMessage(message: LogMessage): ElementR {
    return div(NA,
        blockGroup(
            messageField('timestamp', 'DATETIME', message.getFormattedTimestamp()),
            messageField('level', 'LEVEL', message.level),
            messageField('source', 'SOURCE', message.fullSource()),
            blockGroup(
                messageField('message', null, message.text)
            )
        )
    );
}

function messageField(id: string, key: Nullable<string>, value: string): ElementR {
    const caption = !!key ? label(NA, translate(key)) : '';
    return div(classAttr(id + ' form-group block'), caption, output(NA, value));
}
