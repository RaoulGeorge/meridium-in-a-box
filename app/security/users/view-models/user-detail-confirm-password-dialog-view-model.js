define(function (require) {
    'use strict';

    var $ = require('jquery');

    var KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
		view = require('text!../views/user-detail-confirm-password-dialog.html'),
        DialogViewModel = require('system/ui/dialog-view-model'),
        DialogBox = require('system/ui/dialog-box'),
        ko = require('knockout'),
        Translator = require('system/globalization/translator');


    function UserDetailConfirmPasswordDialogContentViewModel(kom, translator) {
        var self = this;
        base.call(self, view);
        this.kom = kom;
        this.isBusy = ko.observable(false);
        this.confirmPassword = ko.observable();
        this.translator = translator;
        this.canChange = null;
        this.dfd = null;
        this.dialog = new DialogBox(this, this.translate('CONFIRM_PASSWORD'), {closeOnReject: true});
    }

    UserDetailConfirmPasswordDialogContentViewModel.dependsOn = [KnockoutManager, Translator];
    var base = Object.inherit(KnockoutViewModel, UserDetailConfirmPasswordDialogContentViewModel);

    UserDetailConfirmPasswordDialogContentViewModel.prototype.activate =
      function userViewModel_activate() {
          this.canChange = this.kom.pureComputed(canChange_read.bind(null, this));
      };

    UserDetailConfirmPasswordDialogContentViewModel.prototype.attach = function DialogContentViewModel_attach(region) {
        var self = this;
        base.prototype.attach.call(this, region);
        self.region = region;
        document.getElementById('passwordCtrl').focus();
    };

    UserDetailConfirmPasswordDialogContentViewModel.prototype.changePassword = function DialogContentViewModel_ExportFile() {
        this.dfd.resolve(this.confirmPassword());
        this.dialog.closeDialog();
    };

    UserDetailConfirmPasswordDialogContentViewModel.prototype.show =
        function catalogSearchDialog_show(title, folder, catalogItemType) {
            this.confirmPassword(null);
            this.dialog.show();
            this.dfd = $.Deferred();

            return this.dfd.promise();
        };

    UserDetailConfirmPasswordDialogContentViewModel.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    UserDetailConfirmPasswordDialogContentViewModel.prototype.closeDialog = function DialogContentViewModel_closeDialog() {
        this.dialog.closeDialog();
    };

    function canChange_read(self) {
        return self.confirmPassword();
    }

    return UserDetailConfirmPasswordDialogContentViewModel;
});