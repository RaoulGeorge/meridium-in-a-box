import * as React from 'react';
import * as ReactDom from 'react-dom';
import {tryMethod} from 'system/lang/object';

import _private = require('system/lang/private');
import Region = require('spa/region');

type ReactView = any;

const bindMethod = (vm: ReactViewModel) => (method: MethodName): void => {
    vm[method] = vm[method].bind(vm);
};

const updateViewAfterMethod = (vm: ReactViewModel) => (method: MethodName): void => {
    const originalMethod = vm[method];
    vm[method] = function (): void {
        originalMethod.apply(vm, arguments);
        vm.updateView();
    };
};

class ReactViewModel {
    constructor(view: ReactView) {
        _private(this).view = view;
        _private(this).mountNode = null;
        _private(this).afterViewUpdate = null;
    }

    public bindMethods(methods: MethodName[]): void {
        methods.forEach(bindMethod(this));
    }

    public updateViewAfter(methods: MethodName[]): void {
        methods.forEach(updateViewAfterMethod(this));
    }

    public attach(region: Region): void {
        tryMethod(this, 'beforeAttach', region);
        _private(this).mountNode = region.element;
        _private(this).afterViewUpdate = this.afterViewUpdate.bind(this);
        this.updateView();
        tryMethod(this, 'afterAttach', region);
    };

    public updateView(): void {
        const element = React.createElement(_private(this).view, { vm: this });
        const mountNode = _private(this).mountNode;
        const callback = _private(this).afterViewUpdate;
        ReactDom.render(element, mountNode, callback);
    };

    public afterViewUpdate(): void {
        // do nothing
    };

    public detach(region: Region): void {
        tryMethod(this, 'beforeDetach', region);
        ReactDom.unmountComponentAtNode(_private(this).mountNode);
        _private(this).afterViewUpdate = null;
        _private(this).mountNode = null;
        tryMethod(this, 'afterDetach', region);
    };
}

export = ReactViewModel;
