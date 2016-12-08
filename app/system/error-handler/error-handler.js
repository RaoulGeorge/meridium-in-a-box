define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var view = require('text!./views/error-handler-view.html'),
        MessageBox = require('system/ui/message-box'),
        Event = require('system/lang/event'),
        Translator = require('system/globalization/translator');

    function ErrorHandlerViewModel(parentContainer, errorData) {
     
        this.errorHandlerClosedEvent = new Event();
        this.errorHandlerShowEvent = new Event();
        this.translator = Object.resolve(Translator);
        this.init(parentContainer, errorData);
    }

    
    function goPrevious(self) {
        self.currentErrorNumber = self.currentErrorNumber - 1;
        self.updateView();
    }
    function goNext(self) {
        self.currentErrorNumber = self.currentErrorNumber + 1;
        self.updateView();
    }
    function viewDetails(self) {
        MessageBox.showOk(self.errorArray[self.currentErrorNumber].longDesc, self.errorArray[self.currentErrorNumber].title, 'fa fa-warning fa-2x');
    }
    function goToSource(self) {
        self.errorArray[self.currentErrorNumber].sourceCallBack();
    }

    ErrorHandlerViewModel.prototype.init = function errorHandlerViewModel_init(parentContainer, errorData) {
        if (!parentContainer) {
            parentContainer = $('section.content-wrapper > section.content > div.region');
        }

        this.errorArray = !errorData ? [] : errorData;

         //Initiating default values here
        this.currentErrorNumber = 0;

        parentContainer.children('div.error-handler').remove();

        //Create error-handler div only if it is not existing
        if (parentContainer.children('div.error-handler').eq(0).length === 0) {
            parentContainer.prepend(view);

            this.errorContainer = parentContainer.children('div.error-handler');

            //Setting localization string here
            this.errorContainer.find('span.current-error-view-details').text(this.translate('VIEW_DETAILS'));
            this.errorContainer.find('span.go-to-source-link').text(this.translate('GO_TO_SOURCE'));
            this.errorContainer.find('span.current-error-text').text(this.translate('ERROR'));
            this.errorContainer.find('span.of-text').text(this.translate('OF'));

            //attaching event handler here
            //For going previous
            this.errorContainer.find('i.previous').on('click', goPrevious.bind(null, this));

            //For going next error
            this.errorContainer.find('i.next').on('click', goNext.bind(null, this));

            //Handling click event of view Details
            this.errorContainer.find('span.current-error-view-details').on('click', viewDetails.bind(null, this));

            //Handling click event of go-to-source
            this.errorContainer.find('span.go-to-source-link').on('click', goToSource.bind(null, this));
            this.updateView();
        }
    };

   
    ErrorHandlerViewModel.prototype.showErrorHandler = function errorHandlerViewModel_showErrorHandler() {
        this.errorContainer.show();
        this.errorContainer.siblings().height('calc(100% - ' + this.errorContainer.outerHeight() + 'px)'); 
        this.errorHandlerShowEvent.raise(this.errorContainer.outerHeight());
    };

    ErrorHandlerViewModel.prototype.hideErrorHandler = function errorHandlerViewModel_hideErrorHandler() {
        this.errorContainer.hide();
        this.errorContainer.siblings().height('100%');
        this.errorHandlerClosedEvent.raise(this.errorContainer.outerHeight());
    };

    ErrorHandlerViewModel.prototype.addError = function errorHandlerViewModel_addError(errorData) {
        //Inserting new set of errors into same array so that all arrays can be displayed in same div
        this.errorArray.push(errorData);
        this.updateView();
    };

    ErrorHandlerViewModel.prototype.removeError = function errorHandlerViewModel_removeError(toRemove) {
        //If toRemove is the object
        var indexToRemove = (typeof toRemove === 'object') ? this.errorArray.indexOf(toRemove) : toRemove;

        this.errorArray.splice(indexToRemove, 1);

        //Updating the currentErrorNumber
        if (this.errorArray.length === this.currentErrorNumber && this.errorArray.length > 0) {
            this.currentErrorNumber = (this.errorArray.length - 1);
        }

        this.updateView();
    };

    ErrorHandlerViewModel.prototype.updateView = function ErrorHandlerViewModel_updateView(parentContainer, data) {

        //Making error-handler container visible if it is hidden
        if (this.errorArray.length > 0) {
            this.showErrorHandler();
        } else {
            this.hideErrorHandler();
            return "No error to show";
        }

        //toggling previous button
        if (this.currentErrorNumber === 0) {
            this.errorContainer.find('i.previous').css('visibility', 'hidden');
        } else {
            this.errorContainer.find('i.previous').css('visibility', 'visible');
        }
        
        //toggling next button
        if (this.currentErrorNumber === (this.errorArray.length - 1)) {
            this.errorContainer.find('i.next').css('visibility', 'hidden');
        } else {
            this.errorContainer.find('i.next').css('visibility', 'visible');
        }

        //setting class of error-handler based on the error Type
        this.errorContainer.removeClass('error warning info').addClass(this.errorArray[this.currentErrorNumber].severity);
        //setting current error text
        this.errorContainer.find('span.current-error').text(this.errorArray[this.currentErrorNumber].title);
        //setting current error number
        this.errorContainer.find('span.current-error-number').text(this.currentErrorNumber + 1);
        //setting total numbers of errors
        this.errorContainer.find('span.total-errors').text(this.errorArray.length);

        //toggle details link in case no longDesc provided
        this.errorContainer.find('.current-error-view-details').css('display',
             this.errorArray[this.currentErrorNumber].longDesc ? 'inline' : 'none');

        //toggle source link in case none provided.
        this.errorContainer.find('.go-to-source-link').css('display',
            _.isFunction(this.errorArray[this.currentErrorNumber].sourceCallBack) ? 'inline' : 'none');


        
        this.handleDivider();

    };

    //Get the count of active errors
    ErrorHandlerViewModel.prototype.getTotalErrors = function errorHandlerViewModel_getTotalErrors(severity) {
        if (severity) {
            return _.filter(this.errorArray, function (error) { return error.severity === severity; }).length;
        } else {
            return this.errorArray.length;
        }
    };

    //Get the count of active errors
    ErrorHandlerViewModel.prototype.handleDivider = function errorHandlerViewModel_handlerDivider(severity) {
        if (this.errorContainer.find('.current-error-view-details').is(':hidden') || this.errorContainer.find('.go-to-source-link').is(':hidden')) {
            this.errorContainer.find('span.vert-line').hide();
        } else {
            this.errorContainer.find('span.vert-line').show();
        }
    };

    ErrorHandlerViewModel.prototype.translate = function ErrorHandlerViewModel_translate(key) {
        return this.translator.translate(key);
    };

    return ErrorHandlerViewModel;
});