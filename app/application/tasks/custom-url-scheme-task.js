define(function (require, exports, module) {
    'use strict';
    var Assert = require('mi-assert'),
        ITask = require('./i-task'),
        ApplicationEvents = require('application/application-events'),
        ErrorNotificationHandler = require('logging/error-notification-handler'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        Device = require('system/hardware/device');

    function CustomUrlSchemeTask() {
        Assert.implementsInterface(this, ITask, 'this');
        this.applicationEvents = Object.resolve(ApplicationEvents);
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
    }

    CustomUrlSchemeTask.prototype.execute = function () {
        try{
            try_execute(this);
        } catch(e){
            logger.error(e.stack);
            this.errorNotificationHandler.addError({
                errorMessage: e.message,
                errorDetail: e.stack
            });
        }
    };

    function try_execute(self){
        var device = new Device(),
            params;

        if(device.isMobileApp()){
            params = getParams();

            overrideHandleOpenUrlMethod(self);

            if(params){
                params = stripParams(params);
                setTimeout(navigateToUrl.bind(null, self, params), 3000);
            }
        }
    }

    function getParams(){
        return window.sessionStorage.customUrl;
    }

    function stripParams(params){
        params = params.replace('meridium://','');
        params = params.replace('rte=','');

        return params;
    }

    function navigateToUrl(self, params){
        self.applicationEvents.navigate.raise(params, { tab: true });
        window.sessionStorage.customUrl = null;
    }

    function overrideHandleOpenUrlMethod(self){
        window.handleOpenURL = null;

        window.handleOpenURL = function(url){
            window.sessionStorage.customUrl = url;
            self.execute();
        };
    }

    return CustomUrlSchemeTask;
});
