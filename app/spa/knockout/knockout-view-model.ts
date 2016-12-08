import * as ko from 'knockout';
import Region = require('../region');

class KnockoutViewModel {
    public subscriptions: any[];
    public view: string;
    public preserveContext: boolean;

    constructor(view: string) {
        this.view = view;
        this.subscriptions = [];
        this.preserveContext = false;
    }

    public attach(region: Region): void {
        region.attach($(this.view));
        const regionNode = region.element as Node;

        if (ko.contextFor(regionNode) && this.preserveContext) {
            const childBindingContext = ko.contextFor(regionNode).createChildContext(this);
            ko.applyBindingsToDescendants(childBindingContext, regionNode);
        } else {
            ko.applyBindingsToDescendants(this, regionNode);
        }
    }

    public detach(region: Region): void {
        ko.cleanNode(region.element as Node);
        region.clear();
    }
}

export = KnockoutViewModel;
