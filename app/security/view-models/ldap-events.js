define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function LdapEvents() {
        this.folderUpdated = new Event();
        this.folderDeleted = new Event();
        this.folderAdded = new Event();
    }

    LdapEvents.singleton = true;

    return LdapEvents;
});