define(function (require) {
    'use strict';

    var m = require('mithril'),
        mx = require('./mithril-extensions');

    function aListGroupItem(href, caption, isActive, onclick) {
        return m('a.list-group-item', {
            href: mx.value(href),
            class: mx.value(isActive || false) ? 'active' : '',
            onclick: onclick
        }, mx.value(caption));
    }

    return {
        aListGroupItem: aListGroupItem,
        button: m.bind(null, 'button.btn.btn-default'),
        primaryButton: m.bind(null, 'button.btn.btn-primary'),
        iconButton: m.bind(null, 'button.btn.btn-icon'),
        panel: m.bind(null, '.panel.panel-default'),
        panelHeading: m.bind(null, '.panel-heading'),
        panelBody:  m.bind(null, '.panel-body.container'),
        layoutRow: m.bind(null, '.row'),
        divListGroup: m.bind(null, '.list-group'),
        inputGroupButton: m.bind(null, 'span.input-group-btn'),
        formGroup: m.bind(null, '.form-group'),
        textBox: m.bind(null, 'input.form-control[type="text"]'),
        table: m.bind(null, 'table.table'),
        dropdown: m.bind(null, '.dropdown'),
        dropdownMenu: m.bind(null, 'ul.dropdown-menu')
    };
});