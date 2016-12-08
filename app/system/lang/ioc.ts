export function dependsOn(...dependencies: any[]): Function {
    return (target: Function): void => {
        target['dependsOn'] = dependencies;
    };
}

export function singleton(target: Function): void {
    target['singleton'] = true;
}

export function factory(factory: Function): Function {
    return (target: Function): void => {
        target['factory'] = factory;
    };
}