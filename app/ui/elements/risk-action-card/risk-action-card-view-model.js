define(function (require) {
    'use strict';

    var ko = require('knockout'),
        _ = require('lodash'),
        $ = require('jquery'),
        appEvents = Object.resolve(require('application/application-events')),
        translator = Object.resolve(require('system/globalization/translator')),
        statusIconClassMap = { 'A': 'icon-ASM-added', 'M': 'icon-ASM-edited', 'D': 'icon-ASM-removed' };

    require('ui/elements/risk-bar/risk-bar');

    function RiskActionCardViewModel(params, componentInfo) {
        this.showExpand = params.showExpand;
        params.config = params.config || {};
        this.showRiskBar = params.config.showRiskBar;
        this.fields = ko.observableArray();
        this.computeFields = ko.computed(setupFields.bind(null, this, params.config.fields, params.values, params.mitigatedValues));

        this.expandClicked = params.expandClicked;
       
        this.riskBarConfig = params.riskBarConfig;
        this.unmitigated = params.unmitigated;
        this.mitigated = params.mitigated;
        this.name = params.name;
        this.guid = params.guid;
        this.statusIconClass = ko.pureComputed(getStatusIconClass.bind(null, params.status));
        this.headerClass = ko.pureComputed(getHeaderClass.bind(null, this));
        this.showStatus = ko.pureComputed(show_read.bind(null, params.config.showStatus, params.status));
        this.mandatory = ko.pureComputed(show_read.bind(null, params.config.showMandatory, params.mandatory));
        this.consolidated = ko.pureComputed(show_read.bind(null, params.config.showConsolidated, params.consolidated));
        this.maximizeText = translator.translate('MAXIMIZE');

        this.fieldValueMaxWidth = ko.observable('100%').extend({ rateLimit: 100 });
        this.$fieldsContainer = $(componentInfo.element).find('.js-card-fields-list');
        this.boundSetFieldValueMaxWidth = this.setFieldValueMaxWidth.bind(this);
        $(window).on('resize', this.boundSetFieldValueMaxWidth);
    }

    RiskActionCardViewModel.prototype.dispose = function () {
        this.computeFields.dispose();
        $(window).off('resize', this.boundSetFieldValueMaxWidth);
    };

    RiskActionCardViewModel.prototype.setFieldValueMaxWidth = function () {
        //  Gets the width of the grandparent div which is the full 'potential' width for the
        //  field and uses this to set the fields max-width.
        this.fieldValueMaxWidth((this.$fieldsContainer.width() - 40) + 'px');
    };

    RiskActionCardViewModel.prototype.fieldHyperLinkClicked = function (cardField, event) {
        event.stopPropagation();
        appEvents.navigate.raise(cardField.hyperLink, { 'tab': true });
    };

    function setupFields(self, fieldConfig, fieldValues, mitigationFieldValues) {
        var fields = [],
            config = ko.unwrap(fieldConfig),
            values = ko.unwrap(fieldValues),
            mitigationValues = ko.unwrap(mitigationFieldValues);

        _.each(config, mergeFields.bind(null, fields, values, mitigationValues));
        self.fields(fields);
    }

    function mergeFields(fields, values, mitigationValues, field) {
        var relevantValues = (field.context === 'AM') ? mitigationValues : values,
            mergedField,
            value;

        if (!ko.unwrap(field.visible)) {
            return;
        }

        mergedField = { id: field.id, caption: field.caption, value: null, hyperLink: null };
        value = _.find(relevantValues, { id: field.id, context: field.context });

        if (value) {
            mergedField.value = value.value;
            mergedField.hyperLink = value.hyperLink;
        }

        fields.push(mergedField);
    }

    function getStatusIconClass(status) {
        var stat = ko.unwrap(status);
        return statusIconClassMap[stat];
    }

    function getHeaderClass(self) {
        var showExpand = ko.unwrap(self.showExpand),
            accountForBar = ko.unwrap(self.showRiskBar) && self.fields().length < 5;

        if (showExpand && accountForBar) {
            return 'expandAndBar';
        }
        if (showExpand) {
            return 'expand';
        }
        if (accountForBar) {
            return 'bar';
        }
        return '';
    }

    function show_read(showConfig, showValue) {
        return ko.unwrap(showConfig) && ko.unwrap(showValue);
    }
    
    return RiskActionCardViewModel;
});