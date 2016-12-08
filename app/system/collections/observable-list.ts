import * as ko from 'knockout';

class ObservableList {
    public items: ko.ObservableArray<any>;

    constructor(items: any[] = []) {
        this.items = ko.observableArray(items);
    }

    public count(): number {
        return this.items().length;
    }

    public item(i: number): any {
        return this.items()[i];
    }

    public add(item: any): void {
        this.items.push(item);
    }

    public remove(item: any): any[] {
        return this.items.remove(item);
    }

    public clear(): void {
        this.items([]);
    }

    public indexOf(item: any): number {
        return this.items.indexOf(item);
    }

    public moveUp(item: any): void {
        const selectedIndex = this.items.indexOf(item);
        if (selectedIndex === 0) { return; }
        this.items()[selectedIndex] = this.items()[selectedIndex - 1];
        this.items()[selectedIndex - 1] = item;
        this.items.valueHasMutated();
    };

    public moveDown(item: any): void {
        const selectedIndex = this.items.indexOf(item);
        if (selectedIndex === this.items().length - 1) { return; }
        this.items()[selectedIndex] = this.items()[selectedIndex + 1];
        this.items()[selectedIndex + 1] = item;
        this.items.valueHasMutated();
    };

    public dispose(): void {
        this.items([]);
    }
}

export = ObservableList;
