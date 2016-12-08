define(function (require) {
    "use strict";

    var m = require('mithril'),
        mx = require('./mithril-extensions');

    function icon(className) {
        return m('i' + className);
    }

    function idiv(attrs, children) {
        return m('.inline', attrs, children);
    }

    function video(src, width, height) {
        return  m('video[controls]', {
            width: mx.value(width),
            height: mx.value(height),
            src:  mx.value(src)
        });
    }

    return {
        icon: icon,
        idiv: idiv,
        video: video,
        header: m.bind(null, 'header'),
        h1: m.bind(null, 'h1'),
        h2: m.bind(null, 'h2'),
        span: m.bind(null, 'span'),
        div: m.bind(null, 'div'),
        section: m.bind(null, 'section'),
        label: m.bind(null, 'label'),
        table: m.bind(null, 'table'),
        thead: m.bind(null, 'thead'),
        tbody: m.bind(null, 'tbody'),
        tr: m.bind(null, 'tr'),
        th: m.bind(null, 'th'),
        td: m.bind(null, 'td'),
        ul: m.bind(null, 'ul'),
        li: m.bind(null, 'li'),
        a: m.bind(null, 'a'),
        output: m.bind(null, 'output')
    };
});