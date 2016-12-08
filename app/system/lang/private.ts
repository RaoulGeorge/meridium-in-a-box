function _private(target: any): Nillable<any> {
    target.__private__ = target.__private__ || {};
    return target.__private__;
}

export = _private;