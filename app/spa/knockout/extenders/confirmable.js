define(function (require) {
    'use strict';
    var ko = require('knockout');

    // Defines an extender which will raise a confirmation message if
    // the target observable changes.  No message will be raised if the
    // options.unless callback returns true.
    // See http://stackoverflow.com/a/21482696.
    // TO USE:
    //        myValue = ko.observable().extend({
    //            confirmable: {
    //                message: "Are you sure you want to lose your changes?",
    //                unless: function () { return !isRecordDirty(); },
    //                alwaysNotifySubscribers: true
    //            }
    //        });
    ko.extenders.confirmable = function (target, options) {
        var message = options.message || 'Are you sure?',
            unless = options.unless || function () { return false; },
            // will notify subscribers even if the value doesn't change
            alwaysNotify = options.alwaysNotifySubscribers || false,
            //create a writeable computed observable to intercept writes to our observable
            result = ko.computed({
                read: target,  //always return the original observables value
                write: function (newValue) {
                    var current = target();

                    //ask for confirmation unless you don't have
                    if (unless() || confirm(message)) {
                        target(newValue);
                    } else if(alwaysNotify) {
                        target.notifySubscribers(current);
                    }
                }
            }).extend({ notify: 'always' });

        //return the new computed observable
        return result;
    };
});