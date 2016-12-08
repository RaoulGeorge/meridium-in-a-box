define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash'),
        Assert = require('mi-assert'),
        m = require('mithril'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        TeamMemberViewModel = require('./view-models/team-member-view-model'),
        TeamMemberView = require('./views/team-member-list-view');

    require('ui/elements/list-group-item/view-model');
    require('ui/elements/searchbox/view-model');
    require('ui/elements/tool-bar/view-model');
    require('ui/elements/tool-bar-filter/view-model');

    var TeamMemberElement = {};

    TeamMemberElement.prototype = Object.create(HTMLElement.prototype);

    TeamMemberElement.prototype.createdCallback = function () {
        try {
            tryCreatedCallback(this);
        } catch (error) {
            handleError(error);
        }
    };
 
    function tryCreatedCallback(self) {
        self.private = {
            vm: Object.resolve(TeamMemberViewModel),
            view: TeamMemberView,
            root: null
        };
        Object.defineProperty(self, 'readonly', { get: readonly_get.bind(null, self) });
        Object.defineProperty(self, 'entitykey', { get: entitykey_get.bind(null, self) });
        Object.defineProperty(self, 'relationshipid', { get: relationshipid_get.bind(null, self) });
        Object.defineProperty(self, 'secgroupid', { get: secgroupid_get.bind(null, self) });
        Object.defineProperty(self, 'roleid', { get: roleid_get.bind(null, self) });
        Object.defineProperty(self, 'membercount', { get: memberCount_get.bind(null, self) });
    }

    function vm(self, value) {
        assertThis(self);
        if (value !== undefined) {
            self.private.vm = value;
        }
        return self.private.vm;
    }

    function readonly_get(self) {
        assertThis(self);
        return vm(self).readonly();
    }

    function entitykey_get(self) {
        assertThis(self);
        return vm(self).entitykey();
    }

    function relationshipid_get(self) {
        assertThis(self);
        return vm(self).relationshipid();
    }

    function secgroupid_get(self) {
        assertThis(self);
        return vm(self).secgroupid();
    }

    function roleid_get(self) {
        assertThis(self);
        return vm(self).roleid();
    }

    function memberCount_get(self){
        assertThis(self);
        return vm(self).members().length;
    }

    function handleError(error) {
        logger.error(error.stack);
        console.error(error.stack);
        throw error;
    }

    TeamMemberElement.prototype.attachedCallback = function () {
        vm(this).readonly(this.getAttribute('readonly') || false);
        vm(this).entitykey(this.getAttribute('entitykey') || '');
        vm(this).relationshipid(this.getAttribute('relationshipid') || '');
        vm(this).secgroupid(this.getAttribute('secgroupid') || '');
        vm(this).roleid(this.getAttribute('roleid') || '');

        try {
            tryAttachedCallback(this);
        } catch (error) {
            handleError(error);
        }
    };

    function tryAttachedCallback(self) {
        initRoot(self);
        attachToRoot(self);
    }

    function initRoot(self) {
        assertThis(self);
        setRoot(self, Element.build('div', self, ['teammember-container-m']));
    }

    function setRoot(self, root) {
        assertThis(self);
        self.private.root = root;
    }

    function attachToRoot(self) {
        assertRoot(self);
        assertView(TeamMemberView);
        m.mount(getRoot(self), { controller: vm.bind(null, self), view: TeamMemberView });
    }

    function getRoot(self) {
        assertThis(self);
        var root = self.private.root;
        assertRoot(self, root);
        return root;
    }

    TeamMemberElement.prototype.detachedCallback = function () {
        try {
            tryDetachedCallback(this);
        } catch (error) {
            handleError(error);
        }
    };

    function tryDetachedCallback(self) {
        detachFromRoot(self);
        disposeRoot(self);
        disposeVm(self);
    }

    function detachFromRoot(self) {
        assertRoot(self);
        m.mount(getRoot(self), null);
    }

    function disposeRoot(self) {
        assertThis(self);
        assertRoot(self);
        self.removeChild(getRoot(self));
        setRoot(self, null);
    }

    function disposeVm(self) {
        vm(self).dispose();
        vm(self, null);
    }

    TeamMemberElement.prototype.attributeChangedCallback = function attributeChangedCallback(attrName, oldValue, newValue) {
        var property = vm(this)[attrName];
        if (property) {
            property(newValue || '');
            //m.redraw();
            vm(this).reload();
        }
    };

    function assertThis(self) {
        Assert.instanceOf(self, HTMLElement, 'self');
        Assert.isNotUndefined(self.private.vm, 'self.vm');
        Assert.isNotUndefined(self.private.view, 'self.view');
        Assert.isNotUndefined(self.private.root, 'self.root');
    }

    function assertRoot(self, root) {
        if (Assert.enabled) {
            root = root || getRoot(self);
            Assert.instanceOf(root, HTMLElement, 'root');
        }
    }

    function assertVm(vm) {
        if (Assert.enabled) {
            Assert.instanceOf(vm, TeamMemberViewModel, 'vm');
        }
    }

    function assertView(view) {
        if (Assert.enabled) {
            Assert.isFunction(view, 'view');
        }
    }

    function assertMember(member) {
        if (Assert.enabled) {
            Assert.ok(member, 'member');
            Assert.isString(member.key, 'member.key');
            Assert.isString(member.name, 'member.name');
        }
    }

    Element.registerElement('mi-team-member', { prototype: TeamMemberElement.prototype });
    return TeamMemberElement;
});