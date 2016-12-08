export interface RiskAssesment {
    key: string;
    riskMatrixKey: string;
    id: string;
    globalId: string;
    familyId: string;
    financialRiskRank: number;
    riskRank: number;
    drivingRiskRank: number;
    riskRankAlias: string;
    riskThreshold: string;
    riskThresholdAlias: string;
    drivingRiskCategory: string;
    drivingRiskAlias: string;
    drivingRiskThreshold: string;
    drivingRiskThresholdAlias: string;
    basisForAssessment: string;
    risks: any;
};

export interface Category {
    index: number;
    weight: any;
    name: string;
    formattedName: string;
    formattedDescription: string;
    isFinancial: boolean;
    probabilities: any;
    consequences: any;
    protectionLevels: any;
    matrix: any;
};

export interface RiskMatrixSettings {
    value: any;
    calculator?: any;
    matrix?: any;
    riskRank?: string;
    service?: any;
    riskOf?: any;
    mitigatedBy?: any;
    readonly?: any;
};

export interface RiskMatrixProps {
    settings: RiskMatrixSettings;
    matrix?: any | null;
    clickHandler?: any | null;
    dialogClosedHandler?: any;
};

export interface RiskMatrixState {
    matrix: any;
};