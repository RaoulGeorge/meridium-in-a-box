define(function (require) {
    'use strict';
    var Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        StateTransCompViewModel = require('./view-model'),
        StateTransitionComponent = {};

    require('system/lang/object');

    StateTransitionComponent.prototype = Object.create(HTMLElement.prototype);

    StateTransitionComponent.prototype.createdCallback = function () {
        var entityKeyAttr,
            disableAttr,
            disableTransitionAttr,
            hideAssignmentsAttr,
            hiddenOpsAttr,
            hideReservedOpsAttr;

        this.attached = false;
        this.conductor = Object.resolve(Conductor);
        this.region = new Region();
        this.viewModel = Object.resolve(StateTransCompViewModel);

        // Set up the entitykey attribute.
        entityKeyAttr = Element.stringAttribute(this, 'entitykey');
        Element.defineProperty(this, 'entitykey', {
            get: this.viewModel.entityKey,
            set: this.viewModel.entityKey
        });
        if(entityKeyAttr){
            this.entitykey = entityKeyAttr;
        }

        // Set up the disable attribute.
        disableAttr = Element.booleanAttribute(this, 'disable');
        Element.defineProperty(this, 'disable', {
            get: this.viewModel.disable,
            set: this.viewModel.disable
        });
        if(disableAttr){
            this.disable = disableAttr;
        }

        // Set up the disabletransition attribute.
        disableTransitionAttr = Element.booleanAttribute(this, 'disabletransition');
        Element.defineProperty(this, 'disabletransition', {
            get: this.viewModel.disableTransition,
            set: this.viewModel.disableTransition
        });
        if(disableTransitionAttr){
            this.disabletransition = disableTransitionAttr;
        }

        // Set up the hideassignments attribute.
        hideAssignmentsAttr = Element.booleanAttribute(this, 'hideassignments');
        Element.defineProperty(this, 'hideassignments', {
            get: this.viewModel.hideAssignments,
            set: this.viewModel.hideAssignments
        });
        if(hideAssignmentsAttr){
            this.hideassignments = hideAssignmentsAttr;
        }

        // Set up the hidereservedops attribute.
        hideReservedOpsAttr = Element.booleanAttribute(this, 'hidereservedops');
        Element.defineProperty(this, 'hidereservedops', {
            get: this.viewModel.hideReservedOperations,
            set: this.viewModel.hideReservedOperations
        });
        if(hideReservedOpsAttr){
            this.hidereservedops = hideReservedOpsAttr;
        }

        // Set up the hiddenops attribute.
        hiddenOpsAttr = Element.stringAttribute(this, 'hiddenops');
        Element.defineProperty(this, 'hiddenops', {
            get: this.getHiddenOps,
            set: this.setHiddenOps
        });
        if(hiddenOpsAttr){
            this.hiddenops = hiddenOpsAttr;
        }
    };

    StateTransitionComponent.prototype.attachedCallback = function () {
        this.attached = true;
        Element.clearDom(this);

        var regionElement = Element.build('section', this, ['fill'], {
            'data-bind': 'halt-bindings: {}'
        });

        this.region.setElement(regionElement);
        this.conductor.changeScreen(this.viewModel, this.region);

        this.viewModel.beforeStateChanged.add(this.beforeStateChanged, this);
        this.viewModel.stateChanged.add(this.stateChanged, this);
    };

    StateTransitionComponent.prototype.detachedCallback = function () {
        this.attached = false;
        this.conductor.clearScreen(this.region);

        this.viewModel.beforeStateChanged.remove(this);
        this.viewModel.stateChanged.remove(this);
    };

    StateTransitionComponent.prototype.beforeStateChanged = function (cancellableTransEvtArgs) {
        Element.raiseEvent(this, 'beforeStateChanged', cancellableTransEvtArgs);
    };

    StateTransitionComponent.prototype.stateChanged = function (transEvtArgs) {
        Element.raiseEvent(this, 'stateChanged', transEvtArgs);
    };

    StateTransitionComponent.prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
        Object.tryMethod(this, attrName + 'Changed', oldValue, newValue);
    };

    StateTransitionComponent.prototype.entitykeyChanged = function (oldValue, newValue) {
        this.entitykey = newValue;
    };

    StateTransitionComponent.prototype.disableChanged = function (oldValue, newValue) {
        this.disable = newValue !== null;
    };

    StateTransitionComponent.prototype.disabletransitionChanged = function (oldValue, newValue) {
        this.disabletransition = newValue !== null;
    };

    StateTransitionComponent.prototype.hideassignmentsChanged = function (oldValue, newValue) {
        this.hideassignments = newValue !== null;
    };

    StateTransitionComponent.prototype.hidereservedopsChanged = function (oldValue, newValue) {
        this.hidereservedops = newValue !== null;
    };

    StateTransitionComponent.prototype.hiddenopsChanged = function(oldValue, newValue) {
        this.hiddenops = newValue;
    };

    StateTransitionComponent.prototype.getHiddenOps = function() {
        // JSON.stringify the object.
        return JSON.stringify(this.viewModel.hiddenOperations());
    };

    StateTransitionComponent.prototype.setHiddenOps = function(value) {
        var parsedValue;

        value = value || '[]';

        // Make sure the value is valid JSON.  Otherwise, treat it as a comma-delimited string.
        parsedValue = isJson(value) ? JSON.parse(value) : parseCsvToArray(value);
        this.viewModel.hiddenOperations(parsedValue);
    };

    function isJson(value) {
        try {
            JSON.parse(value);
            return true;
        } catch (e) {
            return false;
        }
    }

    function parseCsvToArray(value) {
        var arry = value.split(','),
            i = 0;

        for (i = 0; i < arry.length; i++) {
            arry[i] = arry[i].trim();
        }

        return arry;
    }

    Element.registerElement('mi-state-transition', { prototype: StateTransitionComponent.prototype });
    return StateTransitionComponent;
});
