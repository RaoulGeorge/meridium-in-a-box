define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function RoleEvents() {
        this.roleSelected = new Event();
        this.isRoleDirty = new Event();
        this.newRole = new Event();
    }

    RoleEvents.singleton = true;

    return RoleEvents;
});