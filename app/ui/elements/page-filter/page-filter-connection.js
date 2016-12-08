define(function (require) {
    'use strict';

    var PageFilterRemote = require('./page-filter-remote');

    function PageFilterConnection() {
        this.callback = null;
        this.element = null;
        this.filter = null;
        this.remote = Object.resolve(PageFilterRemote);
    }

    PageFilterConnection.prototype.open = function open(callback, element) {
        this.callback = callback;
        this.element = element;
        this.remote.connect(element);
        this.filter = this.remote.pageFilter;
        if (this.remote.isConnected()) {
            this.filter.connect(this);
        } else {
            this.publish();
        }
    };

    PageFilterConnection.prototype.close = function close() {
        if (this.filter) {
            this.filter.disconnect(this);
        }
        this.filter = null;
        this.element = null;
        this.callback = null;
    };

    PageFilterConnection.prototype.publish = function publish(parameters) {
        this.callback(parameters);
    };

    PageFilterConnection.prototype.isSame = function isSame(otherConnection) {
        return this === otherConnection;
    };

    return PageFilterConnection;
});