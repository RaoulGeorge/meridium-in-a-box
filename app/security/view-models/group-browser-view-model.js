define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        ApplicationEvents = require('application/application-events'),
        DialogBox = require('system/ui/dialog-box'),
        MessageBox = require('system/ui/message-box'),
        ErrorMessage = require('system/error/error-message'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        SecurityService = require('../services/security-service'),
        groupAdapter = require('../adapters/group-adapter'),
        Translator = require('system/globalization/translator'),
        view = require('text!../views/group-browser.html');

    function GroupBrowserViewModel(kom,
        applicationEvents,
        securityService) {

        base.call(this, view);
        this.kom = kom;
        this.applicationEvents = applicationEvents;
        this.securityService = securityService;
        this.selectedGroup = null;
        this.groups = null;
        this.$treeControl = null;
        this.translator = Object.resolve(Translator);
    }

    var base = Object.inherit(KnockoutViewModel, GroupBrowserViewModel);
    GroupBrowserViewModel.factory = function () {
        return new GroupBrowserViewModel(Object.resolve(KnockoutManager),
            Object.resolve(ApplicationEvents),
            Object.resolve(SecurityService)
        );
    };

    ////////////////////
    // API
    ////////////////////

    GroupBrowserViewModel.prototype.show = function show(observableCallback, saveCallback, cancelCallback) {
        var dialogOptions = {
            height: '80%',
            width: '80%',
            buttons: [
                { name: this.translate('CANCEL'), value: 'cancel', cssClass: 'btn-default' },
                { name: this.translate('DONE'), value: 'save', cssClass: 'btn-primary' }
            ]
        };

        this.dialog = new DialogBox(this, 'Group Browser', dialogOptions);
        this.selectedGroup = observableCallback;
        this.saveCallback = saveCallback;
        this.cancelCallback = cancelCallback;

        this.dialog.show();
        this.dfd = $.Deferred();
        return this.dfd.promise();
    };

    GroupBrowserViewModel.prototype.close = function close() {
        this.dialog = null;
    };


    ///////////////////
    // Lifecycle
    ///////////////////

    GroupBrowserViewModel.prototype.load = function load(routeArgs) {
        var dfd = new $.Deferred();
        return dfd.promise();
    };

    GroupBrowserViewModel.prototype.activate = function activate() {
    };

    GroupBrowserViewModel.prototype.attach = function attach(region) {
        var tree;

        base.prototype.attach.call(this, region);
        this.region = region;

        this.$treeControl = this.region.$element.find('mi-tree');
        tree = this.$treeControl.get(0);
        Element.upgrade(tree);

        // Initialize treeControl events.
        this.$treeControl.on('navigated', treeControl_navigated.bind(null, this));

        // Configure the treeControl load behavior.
        tree.loader = loadGroups.bind(null, this);
    };

    GroupBrowserViewModel.prototype.detach = function detach(region) {
        base.prototype.detach.call(this, region);
        this.$treeControl.off('navigated');
    };

    GroupBrowserViewModel.prototype.canUnload = function canUnload() {
        var confirmation = true;
        return confirmation;
    };

    GroupBrowserViewModel.prototype.deactivate = function deactivate(region) {
    };

    GroupBrowserViewModel.prototype.unload = function unload() {
    };

    /////////////////////
    // Behavior
    /////////////////////

    GroupBrowserViewModel.prototype.translate = function translate(key) {
        return this.translator.translate(key);
    };

    GroupBrowserViewModel.prototype.save = function save() {
        if (this.selectedGroup()) {
            return this.saveCallback();
        } else {
            MessageBox.showOk(this.translate('NO_GROUP_SELECTED'),this.translate('SEC_USERS_SELECT_GROUP'));
            return false;
        }
    };

    GroupBrowserViewModel.prototype.cancel = function cancel() {
        return this.cancelCallback();
    };

    /////////////////////
    // Implementation
    /////////////////////

    function loadGroups(self, idx, pageNum, pageSize) {
        var dfd = $.Deferred(),
            tree, value, key;

        tree = self.$treeControl.get(0);
        value = tree.value[idx];
        if (value && value.key) {
            key = value.key;
        }

        if (value.key) {
            self.securityService.getGroupChildren(key)
                .done(getGroups_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self));
        } else {
            self.securityService.getGroupParents(true, true)
                .done(getGroups_done.bind(null, self, dfd))
                .fail(handleAjaxRequestError.bind(null, self));
        }

        return dfd;
    }

    function getGroups_done(self, dfd, dtos) {
        self.groups = groupAdapter.toModelObjectArray(dtos);
        dfd.resolve(self.groups);
    }

    function treeControl_navigated(self, event) {
        var tree = event.target,
            node, key;

        if (!tree) {
            return;
        }

        // Get the key of the currently selected node.
        // Return null if the node doesn't have a key
        // property (as with the title/root node).
        node = getCurrentTreeNodeValue(self, tree);
        console.log(node);
        if (!node.key) {
            self.selectedGroup(false);
        } else {
            self.selectedGroup(node);
        }
    }

    function getCurrentTreeNodeValue(self, tree) {
        tree = tree || self.$treeControl.get(0);

        if (!tree || !tree.value || tree.value.length < 1) {
            return;
        }

        return tree.value[tree.value.length - 1];
    }

    function handleAjaxRequestError(self, response) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = response.statusText,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.applicationEvents.errorOccured.raise(self, errorMessage);
    }

    return GroupBrowserViewModel;
});