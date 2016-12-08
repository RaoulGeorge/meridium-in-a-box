define(function(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        ApplicationEvents = require('application/application-events'),
        ErrorMessage = require('system/error/error-message'),
        Translator = require('system/globalization/translator'),
        Region = require('spa/region'),
        Conductor = require('spa/conductor'),
        Event = require('system/lang/event'),
        StateManagementService = require('state-management/services/state-management-service'),
        transitionAdapter = require('state-management/adapters/transition-adapter'),
        assignmentAdapter = require('state-management/adapters/assignment-adapter'),
        operationAdapter = require('state-management/adapters/operation-adapter'),
        PopoverContentViewModel = require('./popover-content-view-model'),
        view = require('text!./view.html');

    require('system/lang/object');

    function StateTransCompViewModel() {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.appEvents = Object.resolve(ApplicationEvents);
        this.translator = Object.resolve(Translator);
        this.popoverContentRegion = Object.resolve(Region);
        this.popoverContentViewModel = Object.resolve(PopoverContentViewModel);
        this.conductor = Object.resolve(Conductor);
        this.service = Object.resolve(StateManagementService);

        this.kom.tracker.hashFunction = createHash.bind(null, this);
        this.isDirty = this.kom.tracker.isDirty;

        this.entityKey = this.kom.observable();
        this.disable = this.kom.observable(false);
        this.disableTransition = this.kom.observable(false);
        this.hideAssignments = this.kom.observable(false);
        this.hiddenOperations = this.kom.observableArray();
        this.transition = this.kom.observable();
        this.assignments = this.kom.observableArray();
        this.hideReservedOperations = this.kom.observable(false);
        this.popoverContentViewModel.transition = this.transition;
        this.popoverContentViewModel.assignments = this.assignments;
        this.popoverContentViewModel.entityKey = this.entityKey;
        this.popoverContentViewModel.disableTransition = this.disableTransition;
        this.popoverContentViewModel.hideAssignments = this.hideAssignments;
        this.popoverContentViewModel.hiddenOperations = this.hiddenOperations;
        this.popoverContentViewModel.hideReservedOperations = this.hideReservedOperations;
        this.popoverContentViewModel.doneEvent.add(popover_done.bind(null, this), this);
        this.popoverContentViewModel.closeEvent.add(popover_close.bind(null, this), this);
        this.popoverContentViewModel.assignmentsChanged.add(popover_assignmentsChanged.bind(null, this), this);
        this.isLoading = this.kom.observable(true);

        // Computed observables.
        this.activeAssignment = this.kom.pureComputed(activeAssignment_read.bind(null, this));
        this.activeState = this.kom.pureComputed(activeState_read.bind(null, this));
        this.activeAssignmentUser = this.kom.pureComputed(activeAssignmentUser_read.bind(null, this));

        // If the entity key changes, we need to reload the data.
        this.kom.subscribe(this.entityKey, entityKey_changed.bind(null, this));

        this.$popoverTarget = null; // hold a reference to the target for the open popover.
        this.region = null;

        // Events
        this.beforeStateChanged = new Event();
        this.stateChanged = new Event();
    }

    var base = Object.inherit(KnockoutViewModel, StateTransCompViewModel);

    StateTransCompViewModel.prototype.attach = function(region) {
        this.region = region;
        base.prototype.attach.apply(this, arguments);
        Element.upgrade('mi-state-transition', this.region);
    };

    StateTransCompViewModel.prototype.detach = function () {
        this.popoverContentViewModel.doneEvent.remove();
        this.kom.dispose();
    };

    StateTransCompViewModel.prototype.showPopover = function (data, event) {
        var $target = $(event.target);

        event.stopPropagation();

        // If we clicked on a child element, we need to switch target context to the button.
        $target = $target.is('button') ? $target : $target.parent('button');

        showPopover(this, $target);
    };

    StateTransCompViewModel.prototype.hidePopover = function (data, event) {
        var $target = $(event.target);

        // If we clicked on a child element, we need to switch target context to the button.
        $target = $target.is('button') ? $target : $target.parent('button');

        hidePopover(this, $target);
    };

    StateTransCompViewModel.prototype.togglePopover = function (data, event) {
        var $target = $(event.target),
            tdata;

        if (this.isLoading()) {
            return;
        }

        // If we clicked on a child element, we need to switch target context to the button.
        $target = $target.is('button') ? $target : $target.parent('button');
        tdata = $target.data('bs.popover');

        // Rather than use the built-in toggle on the popover, we will do
        // this part ourselves.  That way, we can control the lifecycle of
        // the contents.
        tdata && tdata.$tip && tdata.$tip.hasClass('in') ?
            this.hidePopover(tdata, event) :
            this.showPopover(tdata, event);
    };

    StateTransCompViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    ///////////////////
    // IMPLEMENTATION
    ///////////////////

    function document_click(self) {
        if(self.$popoverTarget) {
            hidePopover(self, self.$popoverTarget);
        }
    }

    function popoverContainer_click(event) {
        event.stopPropagation();
    }

    function showPopover(self, $target) {
        // Build the popover content container and attach the view model.
        var popoverElement = Element.build('div', self.region.$element.get(0), ['state-popover-content'], {
            'data-bind': 'halt-bindings: {}'
        });
        self.popoverContentRegion.setElement(popoverElement);
        self.conductor.changeScreen(self.popoverContentViewModel, self.popoverContentRegion);

        // Wire up event handler(s) to hide the popover.
        $(document).on('click.stateTransitionPopover.hide', document_click.bind(null, self));
        $(popoverElement).on('click', popoverContainer_click);

        // If the popover hasn't been configured for the target element,
        // set it up now.
        if (!$target.data('bs.popover')) {
            $target.popover({
                template: '<div class="mi-state popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
                placement: 'bottom',
                trigger: 'manual',
                container: 'body',
                html: true,
                content: popoverElement
            });
        }
        $target.popover('show');
        self.$popoverTarget = $target;
    }

    function hidePopover(self, $target) {
        // Destroy the popover.
        if ($target.data('bs.popover')) {
            // Destroying the popover here makes for a sloppy UX. We will hide, first,
            // and use the hidden event to destroy the popover and clear the screen.
            $target.popover().on('hidden.bs.popover', popover_hidden.bind(null, self, $target));
            $target.popover('hide');
        }
    }

    function popover_hidden(self, $target) {
        $(document).off('click.stateTransitionPopover.hide');
        $target.popover().off('hidden.bs.popover');
        $target.popover('destroy');
        self.conductor.clearScreen(self.popoverContentRegion);
        self.$popoverTarget = null;
    }

    function popover_done(self, dto) {
        var opModel = operationAdapter.toModelObject(dto),
            eventArgs;
        hidePopover(self, self.$popoverTarget);

        // Update the transition data with the value from the popover.
        self.transition().operation(opModel);

        // Raise a cancellable event prior to posting to the server.
        eventArgs = {
            transitionData: transitionAdapter.toDTO(self.transition()),
            cancel: false
        };
        self.beforeStateChanged.raise(eventArgs);
        if (eventArgs.cancel) {
            return;
        }

        // Post the new data to the server and retrieve the updated transition object.
        self.isLoading(true);
        self.service.postTransition(transitionAdapter.toDTO(self.transition()))
                    .done(postTransition_done.bind(null, self))
                    .fail(handleAjaxRequestError.bind(null, self));
    }

    function popover_assignmentsChanged (self) {
        var entityKey = self.transition().entityKey();
        self.service.getAssignments(entityKey)
            .done(getAssignments_done.bind(null, self))
            .fail(handleAjaxRequestError.bind(null, self));
    }

    function popover_close(self) {
        hidePopover(self, self.$popoverTarget);
    }

    function activeAssignment_read(self) {
        if (!self.assignments ||
                !self.assignments() ||
                !self.transition ||
                !self.transition() ||
                !self.transition().activeState ||
                !self.transition().activeState()) {
            return;
        }
        return _.find(self.assignments(), findActiveAssignment.bind(null, self));
    }

    function findActiveAssignment(self, item) {
        var activeState = self.transition().activeState();
        return activeState.key() === item.state().key();
    }

    function activeState_read(self) {
        if(!self.transition ||
            !self.transition() ||
            !self.transition().activeState ||
            !self.transition().activeState() ||
            !self.transition().activeState().caption ||
            !self.transition().activeState().caption()) {
            return;
        }

        return self.transition().activeState().caption();
    }

    function activeAssignmentUser_read(self) {
        if(!self.activeAssignment ||
            !self.activeAssignment() ||
            !self.activeAssignment().assignedUser ||
            !self.activeAssignment().assignedUser()) {
            return;
        }
        return self.activeAssignment().assignedUser().displayName();
    }

    function entityKey_changed(self, newValue) {
        loadEntityStateData(self, newValue);
    }

    function loadEntityStateData(self, entityKey) {
        var getTransition,
            getAssignments;

        if (!entityKey) {
            return;
        }

        self.isLoading(true);

        // Load the transition and assignment data for the entity.
        getTransition = self.service.getTransition(entityKey)
            .done(getTransition_done.bind(null, self))
            .fail(handleAjaxRequestError.bind(null, self));

        getAssignments = self.service.getAssignments(entityKey)
            .done(getAssignments_done.bind(null, self))
            .fail(handleAjaxRequestError.bind(null, self));

        $.when(getTransition, getAssignments)
            .done(loading_done.bind(null, self));
    }

    function getAssignments_done(self, dtos) {
        var assignments = assignmentAdapter.toModelObjectArray(dtos);
        self.assignments(assignments);
        self.kom.tracker.markCurrentStateAsClean();
    }

    function getTransition_done(self, dto) {
        self.transition(transitionAdapter.toModelObject(dto));
    }

    function postTransition_done(self) {
        // Reload the entity state data for this entity.
        var getTransition = self.service.getTransition(self.entityKey())
            .done(getTransition_done.bind(null, self))
            .fail(handleAjaxRequestError.bind(null, self));

        $.when(getTransition).done(transitionPosted.bind(null, self));
    }

    function transitionPosted(self, result) {
        var eventArgs = {
            transitionData: result
        };

        self.stateChanged.raise(eventArgs);
        loading_done(self);
    }

    function loading_done(self) {
        self.isLoading(false);
    }

    function handleAjaxRequestError(self, response) {
        handleError(self, response.statusText);
        loading_done(self);
    }

    function handleError(self, message) {
        var HANDLED_ERROR_CODE = 2,
        messageContent = message,
        errorMessage = new ErrorMessage(HANDLED_ERROR_CODE, messageContent);
        self.appEvents.errorOccured.raise(self, errorMessage);
    }

    function createHash(self) {
        var hashObject = {};

        if (!self.selectedSuccessor ||
            !self.selectedSuccessor()) {
            return;
        }

        hashObject.selectedSuccessor = self.selectedSuccessor().key();

        return JSON.stringify(hashObject);
    }


    return StateTransCompViewModel;
});
