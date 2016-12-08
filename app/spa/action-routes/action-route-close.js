define(function(require, exports, module) {
    'use strict';

    var $ = require('jquery'),
        Translator = require('system/globalization/translator');

    function ActionRouteClose(busyIndicator) {
        this.busyIndicator = busyIndicator;
        this.closeButton = null;
        this.translator = Object.resolve(Translator);
        this.boundClickHandler = busyIndicatorClickHandler.bind(null, this);
    }

    ActionRouteClose.prototype.handleBusyIndicatorClose = function() {
        setTimeout(addButtonAfterTenSeconds.bind(null, this), 10000);
    };

    function addButtonAfterTenSeconds(self) {
        if (busyIndicatorIsShowing() && $('button.action-route-indicator-close').length === 0) { //change to work with stacked action routes
            var translationString = self.translator.translate('CLOSE_LOADING_INDICATOR');

            attachButtonToDom(translationString);

            self.closeButton = document.querySelector('button.action-route-indicator-close');

            self.closeButton.addEventListener('click', self.boundClickHandler);
        }
    }

    function attachButtonToDom(translationString) {
        $('#shell').prepend('<button class="btn action-route-indicator-close">' + translationString + '</button>');
    }

    function busyIndicatorClickHandler(self) {
        self.busyIndicator.hide();
        self.closeButton.removeEventListener('click', self.boundClickHandler);
        $(self.closeButton).remove();
    }

    function busyIndicatorIsShowing() {
        var busyIndicatorElement = document.querySelector('#shell').querySelector('.busy-indicator-wrap');

        return busyIndicatorElement.style.display === 'block';
    }

    return ActionRouteClose;
});