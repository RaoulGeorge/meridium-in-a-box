export type AnyFunction = Function | null;
export type Anything = any | undefined | null;
export type ArrayOfAnything = Anything[] | undefined | null;

export class EventBinding {
    public handler: AnyFunction;
    public context: Anything;
    public args: ArrayOfAnything;

    constructor(handler: AnyFunction, context: Anything, args: ArrayOfAnything = []) {
        this.handler = handler;
        this.context = context;
        this.args = args;
    }

    public execute(args: ArrayOfAnything = []): void {
        args = this.args!.concat(args);
        this.handler!.apply(this.context, args);
    }

    public dispose(): void {
        this.handler = null;
        this.context = null;
        this.args = null;
    };
}
