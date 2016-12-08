define(function(require, exports, module) {
    'use strict';

    var AjaxClient = require('system/http/ajax-client'),
        Assert = require('mi-assert'),
        ITask = require('./i-task'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        ErrorNotificationHandler = require('logging/error-notification-handler'),
        FamilyPrivDTO = require('security/services/fmlypriv-dto'),
        ApplicationContext = require('application/application-context');

    var API_URL = 'meridium/api/core/metadata/familyIds';

    function PopulateFamilyIdTask() {
        Assert.implementsInterface(this, ITask, 'this');
        this.ajaxClient = Object.resolve(AjaxClient);
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
    }

    PopulateFamilyIdTask.prototype.execute = function() {
        var privCollection = ApplicationContext.user.privileges;

        this.ajaxClient.post(API_URL, privCollection)
            .done(setApplicationContext)
            .fail(getPrivCollectionFail.bind(null, this));
    };

    function setApplicationContext(hydratedFamilyPrivDTOs) {
        ApplicationContext.user.privileges = null;
        ApplicationContext.user.privileges = FamilyPrivDTO.fromDataCollection(hydratedFamilyPrivDTOs);
    }

    function getPrivCollectionFail(self) {
        var e = {
            name: 'Error',
            message: 'Unable to populate family ID',
            stack: 'Unable to populate family ID - app/application/tasks/populate-family-id-task.js'
        };

        logger.error(e.stack);
        self.errorNotificationHandler.addError({
            errorMessage: e.message,
            errorDetail: e.stack
        });
    }

    return PopulateFamilyIdTask;
});