define(function (require) {
    'use strict';

    var NavigationViewModel = require('shell/navigation-view-model'),
        R = require('ramda');

    var navigationViewModel;

    function WindowUnloadIsDirtyTask () {
    }

    WindowUnloadIsDirtyTask.prototype.execute = function (e) {
        var returnMessage;
        navigationViewModel = R.defaultTo(navigationViewModel, Object.resolve(NavigationViewModel));
        returnMessage = navigationViewModel.WindowBeforeUnload();
        if (returnMessage) {
            e.returnValue = returnMessage;
            return returnMessage;
        }
    };
    
    return WindowUnloadIsDirtyTask;
});
