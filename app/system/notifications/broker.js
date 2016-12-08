define(function (require) {
    'use strict';


    var ErrorNotificationHandler = require('logging/error-notification-handler'),
        FeedbackToast = require('logging/feedback-component/feedback-component'),
        ErrorHandler = require('system/error-handler/error-handler');

    

    function Broker() {
        this.notificationPanel = Object.resolve(ErrorNotificationHandler);
        this.nonInterruptiveErrors = ErrorHandler;
        this.feedback = Object.resolve(FeedbackToast);
    }

    return Broker;
});