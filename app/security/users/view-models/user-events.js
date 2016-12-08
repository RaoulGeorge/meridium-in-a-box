define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function UserEvents() {
        this.userSelected = new Event();
        this.isUserDirty = new Event();
        this.newUser = new Event();
        this.defaultSiteChanged = new Event();
        this.userSitesChanged = new Event();
    }

    UserEvents.singleton = true;

    return UserEvents;
});