define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var ApplicationEvents = require('application/application-events'),
        ErrorMessage = require('system/error/error-message'),
        Events = require('./events'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        MessageBox = require('system/ui/message-box'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../../services/security-service'),
        Adapter = require('../../adapters/group-adapter'),
        Translator = require('system/globalization/translator'),
        Event = require('system/lang/event'),
        view = require('text!../views/permissions-nav.html');

    require('ui/elements/searchbox/view-model');

    function PermissionsNavViewModel(kom,
                                 applicationEvents,
                                 events,
                                 securityService) {

        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.service = securityService;
        this.navCollapsed = new Event();
        this.navExpanded = new Event();
        this.events = events;
        this.translator = Object.resolve(Translator);
        this.$treeControl = null;
        this.$relListElement=null;
        this.$collapsible = null;
        this.isFamilyVisisble = kom.observable(true);
        this.isDirty = null;
        // Observable properties.
        this.skipSelectingCheck = false;

        this.currEntNode = null;
        this.currRelNode = null;
    }

    var base = Object.inherit(KnockoutViewModel, PermissionsNavViewModel);
    PermissionsNavViewModel.dependsOn = [
        KnockoutManager,
        ApplicationEvents,
        Events,
        SecurityService
    ];

    ///////////////////
    // Lifecycle
    ///////////////////

    PermissionsNavViewModel.prototype.load =
        function navViewModel_load(routeArgs) {
            var dfd = new $.Deferred();
            this.isDirty = this.kom.observable(false);
            return dfd.promise();
        };

    PermissionsNavViewModel.prototype.unload =
        function navViewModel_unload() {
        };

    PermissionsNavViewModel.prototype.canUnload =
        function navViewModel_canUnload() {
            return true;
        };

    PermissionsNavViewModel.prototype.activate =
        function navViewModel_activate() {
            // Initialize event handlers.
            this.events.navigationRequested.add(this.onNavigationRequested, this);
            this.events.isFamilyDirty.add(this.OnIsFamilyDirty, this);
        };

    PermissionsNavViewModel.prototype.deactivate =
        function navViewModel_deactivate(region) {
            // Dispose event handlers.
            this.events.navigationRequested.remove(this);
            this.events.isFamilyDirty.remove(this);
        };

    PermissionsNavViewModel.prototype.attach =
        function navViewModel_attach(region) {
            var tree,relTree,
                collapsible;
            var self = this;

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
            tree.searchCallback = this.onSearchFamilies.bind(this);

            this.$relListElement = self.region.$element.find('#rel-list');
            relTree = this.$relListElement.get(0);
            Element.upgrade(relTree);
            relTree.loader = LoadRelMetadata.bind(null, this);
            this.$relListElement.on('selected', relTreeControl_navigating.bind(null, this));
            this.$relListElement.on('selecting', relTreeControl_selecting.bind(null, this));
            relTree.searchCallback = search_relation.bind(null, this);


            // Notify when the collapsible panel expands or collapses.
            this.$collapsible.on('change', collapsible_change.bind(null, this));

            // Configure the treeControl load behavior.
            tree.loader = loadChildren.bind(null, this);

            if (this.isFamilyVisisble()) {
                if (this.currEntNode) {
                    tree.value = this.currEntNode;
                }
                else {
                    tree.value = { caption: this.translate('HOME') };
                }
            }
            else {
                if (this.currRelNode) {
                    relTree.value = this.currRelNode;
                }
                else {
                    relTree.value = null;
                }
            }
        };

    PermissionsNavViewModel.prototype.detach =
        function navViewModel_detach(region) {
            base.prototype.detach.call(this, region);

            // Dispose of treeControl events.
            this.$treeControl.off('navigating');
            this.$treeControl.off('navigated');
        };

    /////////////////////
    // Behavior
    /////////////////////
    PermissionsNavViewModel.prototype.OnIsFamilyDirty =
    function nav_detail_ViewModel_OnIsFamilyDirty(dirty) {
        this.isDirty(dirty);
    };

    PermissionsNavViewModel.prototype.translate =
        function navViewModel_translate(key) {
            return this.translator.translate(key);
        };

    PermissionsNavViewModel.prototype.onNavigationRequested =
        function groupsNavViewModel_onNavigationRequested(pathArray) {
            var tree = this.$treeControl.get(0);
            // No array passed, nothing to do.
            if (!pathArray || !pathArray.length) {
                return;
            }
                // If the first node has a key, it isn't "Home" and we must add it.
                if (pathArray[0].key && pathArray[0].key) {
                    pathArray.splice(0, 0, {caption: this.translate('HOME')});
                }
                // The tree control wants the hierarchy...
                tree.value = pathArray;
        };


    PermissionsNavViewModel.prototype.onSearchFamilies =
        function groupsNavViewModel_onSearchFamilies(term, idx, pageNum, pageSize) {
            if(!term) {
                return $.Deferred().promise().done();
            }
            return this.service.searchFamilies(term, pageSize, pageNum)
                .fail(handleAjaxRequestError.bind(null, this));
        };

    PermissionsNavViewModel.prototype.showEntityFamilies = function PermissionsNavViewModel_showEntityFamiliesClicked() {
        var self = this;
        if (self.isDirty() ) {
            promptLoseChanges(self, confirmShowEntityChanges_done.bind(null, self, event));
        } else {
            self.familyType = 'entity';
            self.isFamilyVisisble(true);
            clearRelationshipValue(self);

            var tree = self.$treeControl.get(0);
            if (this.currEntNode) {
                tree.value = this.currEntNode;
            }
            else {
                tree.value = { caption: this.translate('HOME') };
            }

            self.events.familyType.raise(self.familyType);
            var node = getCurrentTreeNodeValue(this, tree);
            self.events.folderNavigated.raise(node);
        }
    };

    PermissionsNavViewModel.prototype.showRelationshipFamilies = function PermissionsNavViewModel_showRelationshipFamilies() {
        var self = this;
        if (self.isDirty() ) {
            promptLoseChanges(self, confirmShowRelationshipChanges_done.bind(null, self, event));
        } else {
            self.familyType = 'relationship';
            self.isFamilyVisisble(false);
            clearTreeValue(self);

            var tree = self.$relListElement.get(0);
            if (this.currRelNode) {
                tree.value = this.currRelNode;
            }
            else {
                tree.value = null;
            }

            self.events.familyType.raise(self.familyType);
            var node = getCurrentRelationshipNodeValue(self, tree);
            self.events.folderNavigated.raise(node);
        }
    };

    PermissionsNavViewModel.prototype.setValue = function (x, e) {
        this.$relListElement.get(0).value = e.originalEvent.searchResult;
        this.$relListElement.get(0).reload();
    };

    /////////////////////
    // Implementation
    /////////////////////
    function search_relation(self, searchString) {
        var dfd = $.Deferred();
        var filteredRelList = [];

        if (searchString) {
            if (searchString.trim().length > 0) {
                filteredRelList = _.where(self.$relListElement.get(0).items, function (item) {
                    return item.caption.toLowerCase().startsWith(searchString.trim().toLowerCase());
                });
                filteredRelList = _.sortBy(filteredRelList, function (item) {
                    return item.caption.toLowerCase();
                });
                dfd.resolve(filteredRelList);

            } else {
                dfd.resolve([]);
            }
        } else {
            dfd.resolve(self.$relListElement.get(0).items);
        }

        return dfd.promise();
    }

    function relTreeControl_selecting(self, event) {
        if (self.isDirty() && !self.skipSelectingCheck) {
            event.preventDefault();
            promptLoseChanges(self, confirmChanges_done.bind(null, self, event));
        } else {
            self.events.beforeFolderNavigated.raise(event);
        }
        self.skipSelectingCheck = false;
    }

    function relTreeControl_navigating(self, event) {
        var tree = event.target,
            node,
            key;
        if (!tree) {
            return;
        }
        // Get the key of the currently selected node.
        // Use null if the node doesn't have a key
        // property (as with the title/root node).
        node = getCurrentRelationshipNodeValue(self, tree);
        if (!node) {
            return;
        }
        key = node.key ? node.key : null;
        self.currRelNode = node;

        self.events.folderNavigated.raise(node, event);
    }

    function LoadRelMetadata(self) {
        var dfd = $.Deferred();
        self.service.getRelationshipFamilies()
            .done(getRelationshipFamilies_done.bind(null, self, dfd))
            .fail(handleAjaxRequestError.bind(null, self));
        return dfd.promise();
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
        if (value.key) {
            self.service.getEntityFamilies(key, pageSize, pageNum)
                .done(getFamilies_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self));
        } else {
            self.service.getEntityFamiliesRoot()
                .done(getFamilies_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self));
        }
        return dfd;
    }

    function getFamilies_done(self, dfd, dtos) {
        dfd.resolve(sortBy(dtos));
    }

    function getRelationshipFamilies_done(self, dfd, dtos) {
        self.relList = [dtos];
        dfd.resolve(sortBy(dtos));
    }

    function sortBy(dtos) {
        return _.sortBy(dtos, sortByCaseInsensitive.bind(null, 'caption'));
    }

    function sortByCaseInsensitive(property, item) {
        return item[property].toLowerCase();
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
        self.currEntNode = tree.value;

        self.events.folderNavigated.raise(node, event);
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

    function clearTreeValue(self) {
       var tree =  self.$treeControl.get(0);
       tree.value = [{ caption: self.translate('HOME') }];
    }

    function clearRelationshipValue(self) {
        var tree =  self.$relListElement.get(0);
        tree.value = null;
    }

    function getCurrentTreeNodeValue(self, tree) {
        tree = tree || self.$treeControl.get(0);

        if (!tree || !tree.value || tree.value.length < 1) {
            return;
        }

        return tree.value[tree.value.length - 1];
    }

    function getCurrentRelationshipNodeValue(self, tree) {
        tree = tree || self.$relListElement.get(0);

        if (!tree || !tree.value || tree.value.length < 1) {
            return;
        }
        return tree.value;
    }

    function confirmChanges_done(self, event, clickedButtonIndex) {
        var tree = event.target,
            node;

        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            self.events.isFamilyDirty.raise(false);
            tree.value=event.originalEvent.newValue;
            self.events.beforeFolderNavigated.raise(event);
            node = _.last(event.originalEvent.newValue) ?_.last(event.originalEvent.newValue) : null;
            self.events.folderNavigated.raise(node, event);
        }
    }

    function confirmShowEntityChanges_done(self, event, clickedButtonIndex) {
        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            self.events.isFamilyDirty.raise(false);
            self.familyType = 'entity';
            self.isFamilyVisisble(true);
            clearRelationshipValue(self);
            self.events.familyType.raise(self.familyType);
        }
    }

    function confirmShowRelationshipChanges_done(self, event, clickedButtonIndex) {
        if (clickedButtonIndex === 0) { // Yes, the user is okay with losing his changes.
            self.events.isFamilyDirty.raise(false);
            self.familyType = 'relationship';
            self.isFamilyVisisble(false);
            clearTreeValue(self);
            self.events.familyType.raise(self.familyType);
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


    return PermissionsNavViewModel;
});
