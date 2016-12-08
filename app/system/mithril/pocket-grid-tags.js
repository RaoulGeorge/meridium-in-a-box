define(function (require) {
    'use strict';

    var m = require('mithril');

    function group(attrs, children) {
        return m('.block-group', attrs, children);
    }

    function block(attrs, children) {
        return m('.block', attrs, children);
    }

    return {
        group: group,
        block: block
    };
});