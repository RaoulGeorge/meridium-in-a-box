import * as React from 'react';
import {find, merge, propEq} from 'ramda';
import {ElementR, MouseEventHandlerR} from 'system/react/react-types';
import {withTargetProperty} from 'system/react/react-common';
import {classAttr, heading, NA, translate, Level} from './log-view-common';

interface Props {
    currentLevel: Level;
    levels: Level[];
    onLevelChange(level: Level): void;
    onRestoreDefault(): void;
    onClearLog(): void;
}

const {button, div, label, option, section, select, span} = React.DOM;

export function LogSettings(props: Props): ElementR {
    return section(classAttr('log-settings'),
        heading('LOG_SETTINGS'),
        div(classAttr('block-group'),
            section(NA,
                currentLoggingLevel(props),
                actions(props)
            )
        )
    );
}

const onLevelChange = (callback: Action1<Level>, levels: Level[]) => (levelValue: string): void => {
    callback(find(propEq('value', levelValue), levels));
};

function currentLoggingLevel(props: Props): ElementR {
    return div(classAttr('block level form-group'),
        label(NA, translate('CURRENT_LOGGING_LEVEL')),
        select(merge(classAttr('form-control'), {
            value: props.currentLevel.value,
            onChange: withTargetProperty('value', onLevelChange(props.onLevelChange, props.levels))
        }), ...props.levels.map(levelOption))
    );
}

function levelOption(level: Level): ElementR {
    return option({ value: level.value }, level.text);
}

function actions({onRestoreDefault, onClearLog}: Props): ElementR {
    return div(classAttr('block buttons form-group'),
        textButton('RESTORE_DEFAULT', onRestoreDefault),
        span(NA, ' '),
        textButton('CLEAR_LOG', onClearLog)
    );
}

function textButton(label: string, onClick: MouseEventHandlerR): ElementR {
    const attrs = merge(classAttr('btn btn-default'), { onClick });
    return button(attrs, translate(label));
}