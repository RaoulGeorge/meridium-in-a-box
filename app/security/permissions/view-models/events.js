define(function (require) {
    'use strict';

    var Event = require('system/lang/event');

    function PermissionEvents() {
        this.beforeFolderNavigated = new Event();
        this.folderNavigated = new Event();
        this.folderAdded = new Event();
        this.folderUpdated = new Event();
        this.folderDeleted = new Event();
        this.navigationRequested = new Event();
        this.familySelected = new Event();
        this.isFamilyDirty = new Event();
        this.familyType=new Event();
    }

    PermissionEvents.singleton = true;

    return PermissionEvents;
});