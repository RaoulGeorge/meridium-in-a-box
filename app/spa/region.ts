import * as $ from 'jquery';

const COMMENT_NODE = 8;

type RegionElement = HTMLElement | JQuery;

class Region {
    public element: HTMLElement | null;
    public $element: JQuery | null;
    public activeContainer: any | null;
    public screen: any | null;

    constructor(element: Nullable<RegionElement>) {
        this.element = null;
        this.$element = null;
        this.setElement(element);
        this.activeContainer = null;
        this.screen = null;
    }

    public setElement(element: Nullable<RegionElement>): void {
        const regionElement = initRegionElement(element);
        this.element = convertToNativeDomElement(regionElement);
        this.$element = convertToJQueryElement(regionElement);
        deleteContents(this);
    }

    public attach(element: RegionElement): void {
        this.clear();
        this.activeContainer = createActiveContainer();
        appendContentToActiveContainer(this, element);
        appendActiveContainerToRegionElement(this);
    }

    public clear(): void {
        if (!this.activeContainer) { return; }
        disposeActiveContainer(this);
        deleteContents(this);
    }

    public remove(): void {
        if (!this.$element) { throw new Error('region.$element is null'); }
        this.$element.remove();
    }

    public dispose(): void {
        this.clear();
        this.detach();
        this.screen = null;
    }

    public detach(): void {
        this.element = null;
        this.$element = null;
    }

    public removeAndDispose(): void {
        this.remove();
        this.dispose();
    }
}

function initRegionElement(element: Nullable<RegionElement>): RegionElement {
    return element || document.createElement('div');
}

function convertToNativeDomElement(element: RegionElement): HTMLElement {
    return isJQueryElement(element) ? getUnderlyingDomElement(element as JQuery) : element as HTMLElement;
}

function isJQueryElement(element: RegionElement): boolean {
    return element instanceof $;
}

function getUnderlyingDomElement($element: JQuery): HTMLElement {
    return $element.get(0);
}

function convertToJQueryElement(element: RegionElement): JQuery {
    return isJQueryElement(element) ? element as JQuery : $(element);
}

function deleteContents(region: Region): void {
    if (!region.$element) { throw new Error('region.$element is null'); }
    region.$element.empty();
}

function createActiveContainer(): HTMLElement {
    const element = document.createElement('div');
    element.classList.add('region');
    return element;
}

function appendContentToActiveContainer(region: Region, element: RegionElement): void {
    $(region.activeContainer).append(element);
}

function appendActiveContainerToRegionElement(region: Region): void {
    if (isComment(region!.element as HTMLElement)) {
        if (!region.$element) { throw new Error('region.$element is null'); }
        region.$element.after(region.activeContainer);
    } else {
        if (!region.element) { throw new Error('region.element is null'); }
        region.element.appendChild(region.activeContainer);
    }
}

function isComment(element: HTMLElement): boolean {
    return element.nodeType === COMMENT_NODE;
}

function disposeActiveContainer(region: Region): void {
    $(region.activeContainer).remove();
    region.activeContainer = null;
}

export = Region;
