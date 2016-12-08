/// <amd-dependency path="ui/elements/risk-matrix/services/risk-matrix-service" />
/// <amd-dependency path="ui/elements/risk-matrix/risk-assessment" />
/// <amd-dependency path="ui/elements/risk-matrix/models/risk-assessment-dto" />
/// <amd-dependency path="system/ui/busy-indicator" />
/// <amd-dependency path="ui/elements/risk-matrix/mi-risk-matrix-financial" />
/// <amd-dependency path="ui/elements/risk-matrix/mi-risk-matrix-nonfinancial" />
/// <amd-dependency path="ui/elements/risk-matrix/mi-risk-assessment" />

import * as RiskSummaryTypes from 'ui/elements/risk-matrix/views/types/risk-matrix-summary-types';
import React = require('react');
import RiskMatrixSummaryView = require('ui/elements/risk-matrix/views/risk-matrix-summary-view');
import R = require('ramda');
import Object = require('system/lang/object');
import ReactDom = require('react-dom');
import ApplicationEvents = require('application/application-events');
import ErrorMessage = require('system/error/error-message');
import {ElementR} from 'system/react/react-types';
const RiskMatrixService = require('ui/elements/risk-matrix/services/risk-matrix-service');
const RiskAssessment = require('ui/elements/risk-matrix/risk-assessment');
const RiskAssessmentDTO = require('ui/elements/risk-matrix/models/risk-assessment-dto');
const BusyIndicator = require('system/ui/busy-indicator');

require('ui/elements/risk-matrix/mi-risk-matrix-financial');
require('ui/elements/risk-matrix/mi-risk-matrix-nonfinancial');
require('ui/elements/risk-matrix/mi-risk-assessment');

const div = React.DOM.div;

class RiskMatrixSummaryReact extends React.Component<RiskSummaryTypes.RiskMatrixProps, RiskSummaryTypes.RiskMatrixState> {
    public props: RiskSummaryTypes.RiskMatrixProps;
    private settings: RiskSummaryTypes.RiskMatrixSettings;
    private matrix: any;
    private busyIndicator: any;
    private calculator: any;
    private errorOccured: any;
    private value: any;
    private el: HTMLElement | null;

    constructor(props: RiskSummaryTypes.RiskMatrixProps) {
        super(props);
        this.props = props;
        this.settings = {
            calculator: null,
            matrix: null,
            riskRank: '',
            service: Object.resolve(RiskMatrixService),
            value: null
        };
        this.matrix = props.matrix;
        this.state = { matrix: null };
        this.state.matrix = props.matrix;
        this.settings.value = this.setValue(props.settings.value);
        this.errorOccured = Object.resolve(ApplicationEvents).errorOccured;
        this.busyIndicator = Object.resolve(BusyIndicator, 'loading-med');
        this.calculator = null;
        this.value = this.settings.value;
        this.props.clickHandler = this.launchRiskAssessment.bind(null, this);
        this.el = null;
    }

    public attach(el: any): void {
        this.el = el;

        ReactDom.render(this.render(), el);
        this.busyIndicator.hide();
    }

    public render(): ElementR {
        const view = new RiskMatrixSummaryView();

        if (this.state.matrix) {
            this.busyIndicator.hide();
            return view.view(this.props);
        }

        this.showBusyIndicator();
        return div({ className: 'risk-summary-placeholder' });
    }

    public launchRiskAssessment(self: RiskMatrixSummaryReact): void {
        const riskAssessment = new RiskAssessment(),
            config = {
                matrix: self.matrix,
                value: self.props.settings.value,
                calculator: self.settings.calculator,
                riskOf: self.settings.riskOf,
                mitigatedBy: self.settings.mitigatedBy,
                readonly: self.settings.readonly
            };

        riskAssessment.show(config).done(self.dialogClosed.bind(null, self));
    }

    public getValue(): any {
        return this.settings.value;
    }

    public setValue(value: any): void {
        this.settings.value = value;
        if (value) {
            this.tryFixFinancial();
            this.loadRiskMatrix();
        }
    }

    public getMatrix(): any {
        return this.settings.matrix;
    }

    public setMatrix(value: any): void {
        this.settings.matrix = value;
        this.render();
    }

    public getCalculator(): any {
        return this.settings.calculator;
    }

    public setCalculator(value: any): void {
        this.settings.calculator = value;
        this.tryFixFinancial();
    }

    private tryFixFinancial(): void {
        if (this.shouldFixFinancial()) {
            this.fixFinancial();
        }
    }

    private fixFinancial(): void {
        const financial = R.clone(this.getUnmitigatedFinancial());
        this.settings.value.mitigated.risks.push(financial);
    }

    private getUnmitigatedFinancial(): any {
        const value = this.settings.value;
        return R.find(R.propEq('isFinancial', true), value.unmitigated.risks);
    }

    private shouldFixFinancial(): boolean {
        return this.hasCalculatorFunction() && this.hasUnmitigatedFinancial() && !this.hasMitigatedFinancial();
    }

    private hasCalculatorFunction(): boolean {
        return this.settings.calculator && typeof this.settings.calculator === 'function';
    }

    private dialogClosed(self: RiskMatrixSummaryReact, data: any): void {
        if (self.shouldShowBusyIndicator(self, data)) {
            self.showBusyIndicator();
        }
        self.setValue(data);
        self.props.settings.value = data;
        self.attach(self.el);
        self.props.dialogClosedHandler();
    }

    private shouldShowBusyIndicator(self: RiskMatrixSummaryReact, data: any): boolean {
        return !RiskAssessmentDTO.isEqual(self.settings.value.unmitigated, data.unmitigated) ||
            (self.hasMitigatedFinancial() && !RiskAssessmentDTO.isEqual(self.settings.value.mitigated, data.mitigated));
    }

    private hasMitigatedFinancial(): boolean {
        const value = this.settings.value;
        if (R.isNil(value.mitigated) || R.isNil(value.mitigated.risks)) {
            return false;
        }
        return R.any(R.propEq('isFinancial', true), value.mitigated.risks);
    }

    private hasUnmitigatedFinancial(): boolean {
        const value = this.settings.value;
        if (R.isNil(value.unmitigated) || R.isNil(value.unmitigated.risks)) {
            return false;
        }
        return R.any(R.propEq('isFinancial', true), value.unmitigated.risks);
    }

    private loadRiskMatrix(): void {
        const riskMatrixKey =  this.settings.value.unmitigated ? this.settings.value.unmitigated.riskMatrixKey : '';
        if (this.shouldFetchRiskMatrix(riskMatrixKey)) {
            this.settings.service.getRiskMatrixByKey(this.settings.value.unmitigated.riskMatrixKey)
                .done((data: any): void => {
                    this.matrix = data;
                    this.props.matrix = data;
                    this.state.matrix = data;
                    this.attach(this.el);
                })
                .fail((xhr: any, text: string, message: string): void => {
                    const errorMessage = new ErrorMessage('RM1', message, new Error().stack);
                    this.errorOccured.raise(errorMessage);
                    this.busyIndicator.hide();
                });
        } else {
            this.attach(this.el);
        }
    }

    private shouldFetchRiskMatrix(riskMatrixKey: number): boolean {
        return !!riskMatrixKey && (!this.matrix || this.matrix.key !== riskMatrixKey);
    }

    private showBusyIndicator(): void {
        this.busyIndicator.attachTo(this.el);
        this.busyIndicator.show();
    }
}

export = RiskMatrixSummaryReact;