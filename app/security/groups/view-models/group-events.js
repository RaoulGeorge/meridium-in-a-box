define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function GroupEvents() {
        this.beforeFolderNavigated = new Event();
        this.folderNavigated = new Event();
        this.folderAdded = new Event();
        this.folderUpdated = new Event();
        this.folderDeleted = new Event();
        this.navigationRequested = new Event();
        this.groupSelected = new Event();
        this.isGroupDirty = new Event();
        this.newGroup=new Event();
    }

    GroupEvents.singleton = true;

    return GroupEvents;
});