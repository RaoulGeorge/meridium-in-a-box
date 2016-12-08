define(function(require) {
    'use strict';

    var _ = require('lodash');

    var ko = require('knockout'),
        Event = require('system/lang/event'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        StateAssignmentDialog = require('state-management/state-assignment-dialog'),
        operationAdapter = require('state-management/adapters/operation-adapter'),
        OperationModel = require('state-management/model/operation-model'),
        view = require('text!./popover-content.html');

    require('system/lang/object');

    function StatePopoverContentViewModel() {
        base.call(this, view);
        this.kom = Object.resolve(KnockoutManager);
        this.translator = Object.resolve(Translator);
        this.stateAssignmentDialog = Object.resolve(StateAssignmentDialog);

        // Observables (set by the container view model)
        this.transition = null;
        this.assignments = null;
        this.entityKey = null;
        this.disableTransition = null;
        this.hideAssignments = null;
        this.hiddenOperations = null;
        this.hideReservedOperations = null;

        // Computed observables (set in attach).
        this.canDisplaySuccessors = null;
        this.selectedSuccessor = null;
        this.successorAssignment = null;
        this.canClickDone = null;
        this.availableSuccessors = null;

        this.doneEvent = new Event();
        this.closeEvent = new Event();
        this.assignmentsChanged = new Event();

        this.region = null;
    }

    var base = Object.inherit(KnockoutViewModel, StatePopoverContentViewModel);

    StatePopoverContentViewModel.prototype.activate = function() {
        // Computed observables.
        this.canDisplaySuccessors = this.kom.pureComputed(canDisplaySuccessors_read.bind(null, this));
        this.selectedSuccessor = this.kom.pureComputed(selectedSuccessor_read.bind(null, this));
        this.successorAssignment = this.kom.pureComputed(successorAssignment_read.bind(null, this));
        this.canClickDone = this.kom.pureComputed(canClickDone_read.bind(null, this));
        this.availableSuccessors = this.kom.pureComputed(availableSuccessors_read.bind(null, this));
    };

    StatePopoverContentViewModel.prototype.attach = function(region) {
        this.region = region;
        base.prototype.attach.apply(this, arguments);
    };

    StatePopoverContentViewModel.prototype.deactivate = function () {
        this.kom.dispose();
    };

    StatePopoverContentViewModel.prototype.detach = function() {
        base.prototype.detach.apply(this, arguments);
    };

    StatePopoverContentViewModel.prototype.selectOperation =
        function statePopoverContentViewModel_selectOperation(data, event) {
            var selectedOption = ko.dataFor(event.target);
            if(this.disableTransition && this.disableTransition()) {
                return;
            }
            if (!(selectedOption instanceof OperationModel)) {
                return;
            }
            if (this.selectedSuccessor && this.selectedSuccessor()) {
                this.selectedSuccessor().isSelected(false);
            }
            selectedOption.isSelected(true);
        };

    StatePopoverContentViewModel.prototype.showAssignmentsDialog = function () {
        if(this.hideAssignments && this.hideAssignments()) {
            return;
        }
        if (this.entityKey && this.entityKey()) {
            this.stateAssignmentDialog.show(this.entityKey())
                .done(this.assignmentsChanged.raise.bind(this.assignmentsChanged));
            this.closeEvent.raise();
        }
    };

    StatePopoverContentViewModel.prototype.done = function () {
        if(this.disableTransition && this.disableTransition()) {
            return;
        }
        if (this.selectedSuccessor && this.selectedSuccessor()) {
            this.doneEvent.raise(operationAdapter.toDTO(this.selectedSuccessor()));
        }
    };

    StatePopoverContentViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    ///////////////////
    // IMPLEMENTATION
    ///////////////////

    function selectedSuccessor_read(self) {
        if(!self.transition ||
           !self.transition() ||
           !self.transition().successors ||
           !self.transition().successors() ||
           !self.transition().successors().length) {
            return;
        }
        return _.find(self.transition().successors(), isSelected);
    }

    function isSelected(item) {
        return item.isSelected();
    }

    function canDisplaySuccessors_read(self) {
        return self.transition &&
               self.transition() &&
               self.transition().successors &&
               self.transition().successors() &&
               self.transition().successors().length;
    }

    function availableSuccessors_read(self) {
        if (!self.canDisplaySuccessors()) {
            return;
        }

        return _.filter(self.transition().successors(), filterHiddenOperations.bind(null, self.hiddenOperations(), self.hideReservedOperations()));
    }

    function filterHiddenOperations(hiddenOps, hideReservedOps, item) {
        var hideRes = hideReservedOps && item.isReserved(),
            hideLst = _.contains(hiddenOps, item.id());

        return !(hideRes || hideLst);
    }

    function successorAssignment_read(self) {
        if (!self.assignments ||
            !self.assignments() ||
            !self.selectedSuccessor ||
            !self.selectedSuccessor()) {
            return;
        }
        return _.find(self.assignments(), findSuccessorAssignment.bind(null, self));
    }

    function findSuccessorAssignment(self, item) {
        return self.selectedSuccessor().key() === item.state().key();
    }

    function canClickDone_read(self) {
        if(self.disableTransition && self.disableTransition()) {
            return false;
        }
        return self.selectedSuccessor && self.selectedSuccessor() ? true : false;
    }

    return StatePopoverContentViewModel;
});
