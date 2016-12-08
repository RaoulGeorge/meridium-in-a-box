define(function(require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var DialogViewModel = require('system/ui/dialog-view-model');

    require('system/lang/object');

    function DialogBox(content, title, options) {
        base.call(this, content, title, options);
        this.handlingButtonClick = false;
        this.dfd = null;
        this.showHelp(false);
        this.showClose(false);
        this.showCheck(false);
    }
    
    var base = Object.inherit(DialogViewModel, DialogBox);

    DialogBox.prototype.show = function () {
        base.prototype.show.call(this);

        loadButtons(this);
        this.dialogContentRegion.$element
            .css('overflow-y', 'auto')
            .addClass('dialog-box');

        this.dfd = $.Deferred();
        return this.dfd.promise();
    };

    DialogBox.prototype.setContent = function (content) {
        base.prototype.setContent.call(this, content);
    };

    /**
    * Button list should be formatted like  [
    *    { name: 'Button 1', value: 'button1Result', cssClass: 'class'}, 
    *    {...}
    * ]
    */
    function loadButtons(self) {
        if (!self.options || !self.options.buttons) {
            return;
        }

        var buttons = self.options.buttons || [];

        // Adding the buttons
        var $wrapper = self.dialogShellRegion.$element.find('.dialog-wrapper');
        if (buttons.length > 0) {
            var $buttonPane = $('<div class="button-bar clearfix text-right"></div>')
                .appendTo($wrapper);

            _.each(buttons, function (button, index) {
                var btnClass = button.cssClass ? button.cssClass : 'btn-default';
                $('<button class="btn pull-right ' + btnClass + '">' +
                    '<span>' + button.name + '</span></button>')
                    .on('click', buttonClicked.bind(null, self, index, button.value || button.name))
                    .appendTo($buttonPane);
            });

            $('<div class="clearfix"></div>').appendTo($buttonPane);
            
            self.centerDialog();
        }
    }
    
    function buttonClicked(self, buttonIndex, buttonValue) {
        if (self.handlingButtonClick) { return; }
        self.handlingButtonClick = true;

        // when a button is clicked if the viewmodel being shown has a method 
        // with the same name as the "value" property for the button, then we call
        // that method and use its return value to determine if we close the dialog or not.        
        var returnVal = Object.tryMethod(self.content, buttonValue);
        
        // if the method returned false we leave the dialog open
        if (returnVal === false) {
            self.handlingButtonClick = false;
            return;
        }

        // if the method returned anything else we close the dialog. If it was 
        // a deferred that was returned then we wait until it is resolved.
        $.when(returnVal).done(function(data) {
            self.dfd.resolve(buttonIndex, buttonValue, data);
            self.closeDialog();
            self.handlingButtonClick = false;
        })
        // If the returned deferred/promise is rejected we leave the dialog open
        // unless options.closeOnReject is true
        .fail(function (data) {
            if (self.options.closeOnReject) {
                self.dfd.reject(buttonIndex, buttonValue, data);
                self.closeDialog();               
            }
            self.handlingButtonClick = false;
        });
    }

    DialogBox.prototype.closeDialog = function () {
        removeButtons(this);

        base.prototype.closeDialog.apply(this, arguments);
    };

    function removeButtons(self) {
        var $wrapper = self.dialogShellRegion.$element.find('.dialog-wrapper'),
            $buttonBar = $('.button-bar', $wrapper),
            buttons = $buttonBar.find('button');

        _.each(buttons, removeButtonAndEventHandlers);
        $buttonBar.remove();

        self.centerDialog();
    }
    function removeButtonAndEventHandlers(button) {
        $(button).off().remove();
    }

    return DialogBox;
});