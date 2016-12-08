import {AnyFunction, Anything, EventBinding} from './event-binding';

class Event {
    public bindings: EventBinding[];

    constructor() {
        this.bindings = [];
    }

    public add(handler: AnyFunction, context: Anything, ...addl: any[]): EventBinding {
        if (handler === null) { throw 'Event handler must not be null'; }
        if (handler === undefined) { throw 'Event handler must not be undefined'; }
        const args = Array.prototype.slice.call(arguments, 2);
        const binding = new EventBinding(handler, context, args);
        this.bindings.push(binding);
        return binding;
    };

    public raise(...args: any[]): void {
        const length = this.bindings.length;
        for (let i = 0; i !== length; i++) {
            this.bindings[i].execute(args);
        }
    };

    public remove(handler?: AnyFunction | Anything, context?: Anything): void {
        if (arguments.length > 1) {
            removeByHandlerAndContext(this, handler, context);
        } else if (arguments.length > 0) {
            context = handler;
            removeByContext(this, context);
        } else {
            removeAll(this);
        }
    };
}

function removeByHandlerAndContext(event: Event, handler?: AnyFunction, context?: Anything): void {
    const result: EventBinding[] = [];
    const length = event.bindings.length;
    for (let i = 0; i !== length; i++) {
        const binding = event.bindings[i];
        if (binding.handler !== handler || binding.context !== context) {
            result.push(binding);
        } else {
            binding.dispose();
        }
    }
    event.bindings = result;
}

function removeByContext(event: Event, context: Anything): void {
    const result: EventBinding[] = [];
    const length = event.bindings.length;
    for (let i = 0; i !== length; i++) {
        const binding = event.bindings[i];
        if (binding.context !== context) {
            result.push(binding);
        } else {
            binding.dispose();
        }
    }
    event.bindings = result;
}

function removeAll(event: Event): void {
    const length = event.bindings.length;
    for (let i = 0; i !== length; i++) {
        event.bindings[i].dispose();
    }
    event.bindings = [];
}

export = Event;
