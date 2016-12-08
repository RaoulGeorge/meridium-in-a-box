import RiskMatrixSummaryReact = require('ui/elements/risk-matrix/component/risk-matrix-summary-react');
const Element = require('system/lang/element');

class MiRiskMatrixSummary extends HTMLElement {
    private reactComponent: RiskMatrixSummaryReact;

    constructor() {
        super();
    }

    public createdCallback(): void {
        this.setValue(this, null);

        Element.defineProperty(this, 'matrix', {
            get: this.getMatrix.bind(null, this),
            set: this.setMatrix.bind(null, this)
        });
        Element.defineProperty(this, 'value', {
            get: this.getValue.bind(null, this),
            set: this.setValue.bind(null, this)
        });
        Element.defineProperty(this, 'calculator', {
            get: this.getCalculator.bind(null, this),
            set: this.setCalculator.bind(null, this)
        });
    }

    public attributeChangedCallback(attr: string, oldValue: any, newValue: any): void {
        const CASCADE_ATTRIBUTES = [
            'readonly',
            'risk-of',
            'mitigated-by'
        ];

        let button;

        if (CASCADE_ATTRIBUTES.indexOf(attr) > -1) {
            button = this.querySelector('mi-risk-assessment');
            if (button) {
                if (newValue !== null) {
                    button.setAttribute(attr, newValue);
                } else {
                    button.removeAttribute(attr);
                }
                this.reactComponent.attach(this);
            }
        }
    }

    public getMatrix(self: MiRiskMatrixSummary): any {
        return self.reactComponent.getMatrix();
    }

    public setMatrix(self: MiRiskMatrixSummary, value: any): void {
        self.reactComponent.setMatrix(value);
        self.reactComponent.attach(self);
    }

    public getValue(self: MiRiskMatrixSummary): any {
        return self.reactComponent.getValue();
    }

    public setValue(self: MiRiskMatrixSummary, value: any): void {
        const props = {
            settings: {
                value
            },
            dialogClosedHandler: self.dispatch.bind(null, self)
        };
        self.reactComponent = new RiskMatrixSummaryReact(props);
        self.reactComponent.setValue(value);
        self.reactComponent.attach(self);
    }

    private dispatch(self: any): void {
        const changeEvent = new CustomEvent('change', { bubbles: true });
        self.dispatchEvent(changeEvent);
    }

    public getCalculator(self: MiRiskMatrixSummary): any {
        return self.reactComponent.getCalculator();
    }

    public setCalculator(self: MiRiskMatrixSummary, value: any): void {
        self.reactComponent.setValue(value);
        self.reactComponent.attach(self);
    }
}

document['registerElement']('mi-risk-matrix-summary', { prototype: MiRiskMatrixSummary.prototype });

export = MiRiskMatrixSummary;