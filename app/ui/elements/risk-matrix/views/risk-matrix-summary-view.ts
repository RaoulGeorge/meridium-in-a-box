/// <amd-dependency path="ui/elements/risk-matrix/utilities" />
import React = require('react');
import Object = require('system/lang/object');
import Parser = require('system/text/parser');
import Translator = require('system/globalization/translator');
import Formatter = require('system/text/formatter');
import * as RiskSummaryTypes from 'ui/elements/risk-matrix/views/types/risk-matrix-summary-types';
import R = require('ramda');
import {ElementR} from 'system/react/react-types';
const Utilities = require('ui/elements/risk-matrix/utilities');

const RISK_CATEGORY_ITEM_CLASS_NAME = 'risk-rank-category-up';
const NO_VALUE_PLACEHOLDER = ' -- ';
const NO_STORED_VALUE_PLACEHOLDER = ' - ';

const {div,text,span} = React.DOM;

class RiskMatrixSummaryView {
    private settings: RiskSummaryTypes.RiskMatrixSettings;
    private financialRank: string;
    private matrix: any;
    private categoryIndex: number;

    constructor() {
        this.financialRank = '';
        this.matrix = null;
        this.categoryIndex = 0;
    }

    public view(props: RiskSummaryTypes.RiskMatrixProps): ElementR {
        this.init(props);
        const drivingValue = this.getDrivingValue();
        const riskRank = Utilities.checkRiskRankAlias(this.matrix, drivingValue.riskRankAlias) || drivingValue.riskRank;
        const threshold = this.getTotalDrivingRiskThreshold(drivingValue, riskRank);
        const categories = this.getCategoriesDiv();
        const noRiskDiv = riskRank ?  undefined : this.getNoRiskDiv();
        const totalRiskValueContainer = this.getTotalRiskValueContainer(drivingValue, riskRank);
        const totalRiskValue = [totalRiskValueContainer, noRiskDiv || this.getTotalsDivText()];
        const totalRiskContainer = div({ className: 'totals-div' }, ...totalRiskValue);

        return div({
            className: 'concise-summary',
            style: this.summaryViewStyle(threshold),
            onClick: props.clickHandler
        }, totalRiskContainer, categories);
    }

    private init(props: RiskSummaryTypes.RiskMatrixProps): void {
        this.settings = props.settings;
        this.matrix = props.matrix;
    }

    private getTotalRiskValueContainer(drivingValue: RiskSummaryTypes.RiskAssesment, riskRank: string):  ElementR {
        let totalRiskValueContainer = div();
        let threshold;

        if (riskRank) {
            threshold = Utilities.getThreshold(drivingValue.riskRank, this.matrix.thresholds);
            totalRiskValueContainer = div({ className: 'number' }, this.getDrivingRiskValue(riskRank, this.totalRiskStyle(threshold)));
        }

        return totalRiskValueContainer;
    }

    private getTotalDrivingRiskThreshold(drivingValue: RiskSummaryTypes.RiskAssesment, riskRank: string): any {
        let threshold;

        if (riskRank) {
            threshold = Utilities.getThreshold(drivingValue.riskRank, this.matrix.thresholds);
        }

        return threshold;
    }

    private summaryViewStyle(threshold: any): any {
        let summaryViewStyle;
        if (threshold) {
            summaryViewStyle = { borderRightColor: null };
            summaryViewStyle.borderRightColor = threshold.color;
        }

        return summaryViewStyle;
    }

    private totalRiskStyle(threshold: any): any {
        let spanNumberStyle;
        if (threshold) {
            spanNumberStyle = { color: null };
            spanNumberStyle.color = threshold.color;
        }

        return spanNumberStyle;
    }

    private getTotalsDivText(): ElementR {
        let totalRiskSpan, drivingRiskInfo;
        const totalRiskLabel = this.createLabel('TOTAL_RISK');

        totalRiskSpan = span({ className: RISK_CATEGORY_ITEM_CLASS_NAME }, totalRiskLabel);
        drivingRiskInfo = this.getDrivingInfoContainer();
        return div({ className: 'text' }, totalRiskSpan, ...drivingRiskInfo);
    }

    private getDrivingInfoContainer(): Array<ElementR> {
        const drivingValue = this.getDrivingValue();
        const riskRank = Utilities.checkRiskRankAlias(this.matrix, drivingValue.riskRankAlias) || drivingValue.riskRank;
        const threshold = this.getTotalDrivingRiskThreshold(drivingValue, riskRank);
        const drivingInfoSpans: any[] = [];
        const color: string = threshold ? threshold.color : '';

        const drivingRiskLabel = this.createLabel('DRIVING_RISK');
        const drivingCategory = drivingValue.drivingRiskCategory || NO_VALUE_PLACEHOLDER;

        const drivingRiskAliasLabel = this.createLabel('DRIVING_RISK_ALIAS');
        const drivingRiskAlias = drivingValue.drivingRiskAlias || NO_VALUE_PLACEHOLDER;

        const drivingRiskThresholdLabel = this.createLabel('DRIVING_RISK_THRESHOLD');
        const drivingRiskThreshold = drivingValue.drivingRiskThreshold || NO_VALUE_PLACEHOLDER;

        drivingInfoSpans.push(this.getDrivingInfoSpan(drivingRiskLabel, drivingCategory));

        if(this.drivingRiskStringExists(drivingRiskAlias)) {
            drivingInfoSpans.push(this.getDrivingInfoSpan(drivingRiskAliasLabel, drivingRiskAlias, color));
        }

        if(this.drivingRiskStringExists(drivingRiskThreshold)) {
            drivingInfoSpans.push(this.getDrivingInfoSpan(drivingRiskThresholdLabel, drivingRiskThreshold, color));
        }

        return drivingInfoSpans;
    }

    private drivingRiskStringExists(value: string): boolean {
        return (value !== NO_VALUE_PLACEHOLDER && value !== NO_STORED_VALUE_PLACEHOLDER);
    }

    private getDrivingInfoSpan(label: string, value: string, color?: string): ElementR {
        const drivingInfoLabel = [text({}, label + ': '), text({style: { color: color }}, value)];
        return span({ className: 'risk-rank-category' }, ...drivingInfoLabel);
    }

    private getDrivingRiskValue(riskRank: string, spanNumberStyle: any): ElementR {
        return span({ className: 'total', style: spanNumberStyle },
            text({}, this.formatFloat(riskRank, 4) || '\u00A0')
        );
    }

    private getDrivingValue(): RiskSummaryTypes.RiskAssesment {
        let drivingValue;
        if (this.settings.value.mitigated) {
            drivingValue = this.settings.value.mitigated;
        } else {
            drivingValue = this.settings.value.unmitigated;
        }

        return drivingValue;
    }

    private getNoRiskDiv(): ElementR {
        const noRiskLabelTop = this.createLabel('NO_RISK_ASSIGNED');
        const noRiskSpanTop = span({ className: RISK_CATEGORY_ITEM_CLASS_NAME }, text({}, noRiskLabelTop));
        const noRiskLabelBottom = this.createLabel('ASSIGN_RISK');
        const noRiskSpanBottom = span({ className: 'risk-rank-category' }, noRiskLabelBottom);

        return div({className: 'no-risk-div' }, noRiskSpanTop, noRiskSpanBottom);
    }

    private getCategoriesDiv(): ElementR {
        const valueSpanStyle = null;
        const categoryRiskRank = 0;
        const value = 0;
        let categoriesDiv = React.createElement('div');
        const categoryDivs = [];

        while (this.categoryIndex < this.matrix.categories.length) {
            categoriesDiv = this.populateCategories(value, categoryRiskRank, valueSpanStyle, categoryDivs);
            this.categoryIndex++;
        }

        this.categoryIndex = 0;

        return categoriesDiv;
    }

    private populateCategories(value: number, categoryRiskRank: number, valueSpanStyle: any, categoryDivs: Array<any>):
                ElementR | any {
        const category = this.matrix.categories[this.categoryIndex];
        const financialRank = this.getFinancialRisk();
        valueSpanStyle = { color: '#666666' };

        if (category.isFinancial) {
            categoryDivs.push(this.getCategoryDiv(financialRank, category, valueSpanStyle));
        } else {
            categoryDivs = this.populateCategoryRiskRanks(category, categoryDivs, valueSpanStyle, categoryRiskRank);
        }

        const categoryDivWrapper = div({ className: 'category-div-wrapper' }, ...categoryDivs);

        return div({ className: 'cats-all-div' }, categoryDivWrapper);
    }

    private populateCategoryRiskRanks(category: RiskSummaryTypes.Category, categoryDivs: Array<any>, valueSpanStyle: any,
                categoryRiskRank: number): Array<ElementR> {
        const value = Utilities.findRiskRank(category.name, this.getDrivingValue().risks);

        if (value.notApplicable) {
            categoryDivs.push(this.getCategoryDiv(this.createLabel('NA'), category, valueSpanStyle));
        } else if (value.riskRankAlias || value.rank) {
            categoryRiskRank = Utilities.checkRiskRankAlias(this.matrix, value.riskRankAlias) || value.rank;
            const threshold = Utilities.getThreshold(value.rank, this.matrix.thresholds);
            if (threshold) {
                valueSpanStyle = { color: threshold.color };
            }
            categoryDivs.push(this.getCategoryDiv(this.formatFloat(categoryRiskRank, 4) || '\u00A0', category, valueSpanStyle));
        } else {
            categoryDivs.push(this.getCategoryDiv(NO_VALUE_PLACEHOLDER, category, valueSpanStyle));
        }

        return categoryDivs;
    }

    private getCategoryDiv(value: string, category: RiskSummaryTypes.Category, valueSpanStyle: any): ElementR {
        const riskCategorySpan = new Array();

        riskCategorySpan.push(span({ className: 'risk-rank-category' }, category.formattedName));

        return div({ className: 'cat-div' }, ...[...riskCategorySpan, this.getCategoryInfo(category, value, valueSpanStyle)]);
    }

    private getCategoryInfo(category: RiskSummaryTypes.Category, value: string, valueSpanStyle: any): ElementR {
        const categoryInfo = [
            this.getRiskValueForCategory(value),
            this.getAliasMaskForCategory(category, valueSpanStyle),
            this.getThresholdForCategory(category, valueSpanStyle)
        ];

        return span({ className: RISK_CATEGORY_ITEM_CLASS_NAME, style: valueSpanStyle }, ...categoryInfo);
    }

    private getThresholdForCategory(category: RiskSummaryTypes.Category, valueSpanStyle: any): ElementR {
        const value = Utilities.findRiskRank(category.name, this.getDrivingValue().risks);
        const threshold = Utilities.getThreshold(value.rank, this.matrix.thresholds);
        const thresholdElementProps = { className: RISK_CATEGORY_ITEM_CLASS_NAME, style: valueSpanStyle };

        let thresholdElement = span(thresholdElementProps);
        if (!category.isFinancial && threshold && !value.notApplicable) {
            thresholdElement = span(thresholdElementProps, threshold.formattedDescription);
        }

        return thresholdElement;
    }

    private getRiskValueForCategory(value: string): string {
        return this.formatFloat(value, 2);
    }

    private getAliasMaskForCategory(category: RiskSummaryTypes.Category, valueSpanStyle: any): ElementR {
        let aliasMask = '';

        if (!category.isFinancial) {
            aliasMask = this.getRiskAliasForCategory(category);
        }

        return span({ className: RISK_CATEGORY_ITEM_CLASS_NAME, style: valueSpanStyle }, aliasMask);
    }

    private getRiskAliasForCategory(category: RiskSummaryTypes.Category): string {
        const assessment = this.settings.value.mitigated || this.settings.value.unmitigated;

        let currentCategoryAlias = '';
        R.forEach((currentRiskRank: any) => {
            if(category.name === currentRiskRank.categoryName) {
                currentCategoryAlias = currentRiskRank.riskRankAlias;
            }
        }, assessment.risks);

        return currentCategoryAlias;
    }

    private formatFloat(value: any, decimals: number): string {
        const formatter = new Formatter();
        const NUMBER_FORMAT = 'm';
        if (!isNaN(Parser.parseFloat(value) as number)) {
            return formatter.format(value, NUMBER_FORMAT + (!decimals ? '' : decimals.toString()));
        }
        return value;
    }

    private getFinancialRisk(): string {
        let financialCategory, financialRank, risks;

        if (this.settings.value.mitigated) {
            risks = this.settings.value.mitigated.risks;
        } else {
            risks = this.settings.value.unmitigated.risks;
        }
        financialCategory = Utilities.findFinancialCategory(risks);
        financialRank = NO_VALUE_PLACEHOLDER;
        if (financialCategory && financialCategory.notApplicable) {
            financialRank = this.createLabel('NA');
        } else if (financialCategory && financialCategory.rank) {
            financialRank = financialCategory.rank;
        }
        return financialRank;
    }

    private createLabel(text: string): string {
        const translator = Object.resolve(Translator);
        return translator.translate(text);
    }
}

export = RiskMatrixSummaryView;