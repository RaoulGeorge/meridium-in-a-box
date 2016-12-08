import * as React from 'react';
import {objOf} from 'ramda';
import {ElementR} from 'system/react/react-types';
import {resolve} from 'system/lang/object';

import Translator = require('system/globalization/translator');

export interface Level {
    value: string;
    text: string;
}

export const {div, h2} = React.DOM;
export const NA = undefined;

export const idAttr = objOf('id');
export const classAttr = objOf('className');
export const blockGroup = (...children: ElementR[]) => div(classAttr('block-group'), ...children);

export function translate(key: string): string {
    const translator = resolve(Translator);
    return translator.translate(key);
}

export function heading(key: string): ElementR {
    return h2(NA, translate(key));
}
