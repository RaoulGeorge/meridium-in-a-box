define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ApplicationEvents = require('application/application-events'),
        ErrorMessage = require('system/error/error-message'),
        GroupEvents = require('./group-events'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        MessageBox = require('system/ui/message-box'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        groupAdapter = require('../../adapters/group-adapter'),
        Translator = require('system/globalization/translator'),
        Event = require('system/lang/event'),
        view = require('text!../views/groups-nav.html');

    require('ui/elements/searchbox/view-model');

    function GroupsNavViewModel(kom,
                                 applicationEvents,
                                 groupEvents,
                                 securityService) {

        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.navCollapsed = new Event();
        this.navExpanded = new Event();
        this.events = groupEvents;
        this.translator = Object.resolve(Translator);
        this.$treeControl = null;
        this.$collapsible = null;
        this.canSearch = null;
        this.isDirty = null;
        this.canAdd = null;
        this.users = null; // list of all users loaded from the data source
        this.filteredGroups = null; // computed: this.users list with filter applied
        this.groupSearchbox = null;
        this.groupFilter = null;
        this.selectedGroup=null;
        this.groupPath=null;
        // Observable properties.
        this.flatFolders = null;
        this.skipSelectingCheck = false;
    }

    var base = Object.inherit(KnockoutViewModel, GroupsNavViewModel);
    GroupsNavViewModel.dependsOn = [
        KnockoutManager,
        ApplicationEvents,
        GroupEvents,
        SecurityService
    ];

    ///////////////////
    // Lifecycle
    ///////////////////

    GroupsNavViewModel.prototype.load =
        function groupsNavViewModel_load(routeArgs) {
            var dfd = new $.Deferred();
            this.isDirty = this.kom.observable(false);
            this.groups = this.kom.observableArray();
            this.groupFilter = this.kom.observable();
            this.selectedGroup=this.kom.observable();
            this.groupPath=this.kom.observableArray();
            return dfd.promise();
        };

    GroupsNavViewModel.prototype.unload =
        function groupsNavViewModel_unload() {
        };

    GroupsNavViewModel.prototype.canUnload =
        function groupsNavViewModel_canUnload() {
            var dfd = $.Deferred();
            var self=this;
            if (this.isDirty()) {
                promptLoseChanges(self, confirmUnloadChanges_done.bind(null, self, event,dfd));
            } else {
                dfd.resolve(true);
            }
           return dfd.promise();
        };

    GroupsNavViewModel.prototype.activate =
        function groupsNavViewModel_activate() {
            // Initialize event handlers.
            this.events.folderAdded.add(this.onFolderAdded, this);
            this.events.folderUpdated.add(this.onFolderUpdated, this);
            this.events.folderDeleted.add(this.onFolderDeleted, this);
            this.events.navigationRequested.add(this.onNavigationRequested, this);
            this.events.isGroupDirty.add(this.OnIsGroupDirty, this);
            this.canAdd = this.kom.pureComputed(canAdd_read.bind(null, this));
            this.canSearch = this.kom.pureComputed(canSearch_read.bind(null, this));
        };

    GroupsNavViewModel.prototype.deactivate =
        function groupsNavViewModel_deactivate(region) {
            // Dispose event handlers.
            this.events.folderAdded.remove(this);
            this.events.folderUpdated.remove(this);
            this.events.folderDeleted.remove(this);
            this.events.navigationRequested.remove(this);
            this.events.isGroupDirty.remove(this);
        };

    GroupsNavViewModel.prototype.attach =
        function groupsNavViewModel_attach(region) {
            var tree,
                collapsible;

            base.prototype.attach.call(this, region);
            this.region = region;

            // Get a reference to the tree-control element.
            this.$treeControl = this.region.$element.find('mi-tree');
            tree = this.$treeControl.get(0);
            Element.upgrade(tree);

            this.$collapsible = this.region.$element.find('mi-collapsible');
            collapsible = this.$collapsible.get(0);
            Element.upgrade(collapsible);

            // Initialize treeControl events.
            this.$treeControl.on('navigating', treeControl_selecting.bind(null, this));
            this.$treeControl.on('navigated', treeControl_navigated.bind(null, this));

            // Notify when the collapsible panel expands or collapses.
            this.$collapsible.on('change', collapsible_change.bind(null, this));

            // Configure the treeControl load behavior.
            tree.loader = loadChildren.bind(null, this);
            tree.value = { caption: this.translate('HOME') };

            this.groupSearchbox = this.region.$element.find('mi-tool-bar mi-searchbox')[0];
            if (window.CustomElements && !window.CustomElements.useNative) {
                window.CustomElements.upgrade(this.groupSearchbox);
            }
            this.groupSearchbox.searchCallback = groupSearch.bind(null, this);

          
        };

    GroupsNavViewModel.prototype.detach =
        function groupsNavViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            // Dispose of treeControl events.
            this.$treeControl.off('navigating');
            this.$treeControl.off('navigated');
        };

    /////////////////////
    // Behavior
    /////////////////////
    GroupsNavViewModel.prototype.onGroupAdding =
       function userViewModel_onUserAdding(data, event) {
           var node = getCurrentTreeNodeValue(this, this.$treeControl.get(0)),treeItems;
           var key = node.key ? node.key : null;
           this.events.newGroup.raise(key, event);
       };

    GroupsNavViewModel.prototype.OnIsGroupDirty =
    function group_nav_detail_ViewModel_OnIsGroupDirty(dirty) {
        this.isDirty(dirty);
    };

    GroupsNavViewModel.prototype.translate =
        function groupsNavViewModel_translate(key) {
            return this.translator.translate(key);
        };

    GroupsNavViewModel.prototype.onFolderAdded =
        function groupsNavViewModel_onFolderAdded(group) {
            var tree = this.$treeControl.get(0),treeItems;
            treeItems = tree.listGroup.items;
            treeItems.push(group);
            tree.listGroup.items=sortBy(treeItems);
            tree.listGroup.value=group;
          // tree.refresh();
           // tree.refreshAll();
        };

    GroupsNavViewModel.prototype.onFolderUpdated =
        function groupsNavViewModel_onFolderUpdated(group) {
            var tree = this.$treeControl.get(0),
                node = getCurrentTreeNodeValue(this, tree);

            // Update caption.
            node.key=group.key;
            node.caption = group.caption();
            tree.refresh();
            tree.refreshAll();
        };

    GroupsNavViewModel.prototype.onFolderDeleted =
        function groupsNavViewModel_onFolderDeleted(folderKey) {
            var tree = this.$treeControl.get(0);
            tree.backInHistory(); // go back to the parent node.
            tree.refresh();
            tree.refreshAll();
        };

    GroupsNavViewModel.prototype.onNavigationRequested =
        function groupsNavViewModel_onNavigationRequested(pathArray) {
            var tree = this.$treeControl.get(0);
            // No array passed, nothing to do.
            if (!pathArray || !pathArray.length) {
                return;
            }
                // If the first node has a key, it isn't "Home" and we must add it.
                if (pathArray[0].key && pathArray[0].key) {
                    pathArray.splice(0, 0, {caption: this.translate('CATALOG_NAV_ROOT')});
                }
                // The tree control wants the hierarchy...
                tree.value = pathArray;
        };

    /////////////////////
    // Implementation
    /////////////////////


    function groupSearch(self, newSearchTerm) {
        self.groupFilter(newSearchTerm);
    }

    function loadChildren(self, idx, pageNum, pageSize) {
        var dfd = $.Deferred(),
            tree,
            value,
            key;

        tree = self.$treeControl.get(0);
        value = tree.value[idx];
        if (value && value.key) {
            key = value.key;
        }
        if (value.key!=='0') {
            if (value.key) {
                self.service.getGroupChildren(key, pageSize, pageNum)
                    .done(getGroups_done.bind(null, self, dfd))
                    .fail(handleAjaxRequestError.bind(null, self));
            } else {
                self.service.getGroupParents()
                    .done(getGroups_done.bind(null, self, dfd))
                    .fail(handleAjaxRequestError.bind(null, self));
            }
        } else {
            dfd.resolve();
        }
        return dfd;
    }

    function getGroups_done(self, dfd, dtos) {
        var tree = self.$treeControl.get(0),treeItems;
        var items=sortBy(dtos);
        dfd.resolve(items);
        if (self.selectedGroup()) {
            if (self.selectedGroup().key === '0') {
                self.isDirty(true);
                self.events.navigationRequested.raise(self.groupPath());
            } else {
                if (self.isDirty()) {
                    self.skipSelectingCheck = true;
                }
                self.events.navigationRequested.raise(self.groupPath());
            }
        }
    }

    function treeControl_selecting(self, event) {
        if (self.isDirty()  && !self.skipSelectingCheck) {
            event.preventDefault();
            promptLoseChanges(self, confirmChanges_done.bind(null, self, event));
        } else {
            self.events.beforeFolderNavigated.raise(event);
        }
        self.skipSelectingCheck=false;
    }

    function treeControl_navigated(self, event) {
        var tree = event.target,
            node,
            key;
        if (!tree) {
            return;
        }

        // Get the key of the currently selected node.
        // Use null if the node doesn't have a key
        // property (as with the title/root node).
        node = getCurrentTreeNodeValue(self, tree);
        key = node.key ? node.key : null;
        self.selectedGroup(node);
        self.groupPath(tree.value);
        self.events.folderNavigated.raise(key, event);
    }


    function collapsible_change(self, event) {
        var detail = event.originalEvent.detail;

        if (!detail) {
            return;
        }

        if (detail.expanded) {
            self.navExpanded.raise();
        } else {
            self.navCollapsed.raise();
        }
    }

    function canSearch_read(self) {
        return !self.isDirty();
    }

    function canAdd_read(self) {
        return !self.isDirty();
    }

    function sortBy(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'caption'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
    }

    function getCurrentTreeNodeValue(self, tree) {
        tree = tree || self.$treeControl.get(0);

        if (!tree || !tree.value || tree.value.length < 1) {
            return;
        }

        return tree.value[tree.value.length - 1];
    }

    function confirmChanges_done(self, event, clickedButtonIndex) {
        var tree = event.target,
            key;

        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            self.events.isGroupDirty.raise(false);
            tree.value=event.originalEvent.newValue;
            self.groupPath(tree.value);
            self.events.beforeFolderNavigated.raise(event);
            key = _.last(event.originalEvent.newValue).key ?_.last(event.originalEvent.newValue).key : null;
            self.events.folderNavigated.raise(key, event);
        }
    }

    function confirmUnloadChanges_done(self, event,dfd, clickedButtonIndex) {
        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
           dfd.resolve(true);
        } else {
            dfd.reject(false);
        }
    }

    function promptLoseChanges(self, doneCallback) {
        var msg = self.translate('SEC_GROUP_UNSAVED_CHANGES') +
                '  ' +
                self.translate('ARE_YOU_SURE_CONTINUE'),
            title = self.translate('CONFIRM_NAVIGATION');

        MessageBox.showYesNo(msg, title)
            .done(doneCallback);
    }

    function handleAjaxRequestError(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);

        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    return GroupsNavViewModel;
});