define(function (require) {
    'use strict';

    var $ = require('jquery'),
        view = require('text!./views/login-view.html'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        KnockoutManager = require('system/knockout/knockout-manager'),
        Translator = require('system/globalization/translator'),
        DialogViewModel = require('system/ui/dialog-view-model');

    function LoginViewModel() {
        base.call(this, view);

        this.kom = new KnockoutManager();
        this.buttons = [
                        { name: translate('OK') },
                        { name: translate('CANCEL') }
                    ];
        this.title = translate('ENTER_YOUR_PASSWORD');
        this.icon = 'icon-node-warning';
        this.password = this.kom.observable('');
        this.dfd = null;
        this.dialog = null;
        this.translator = Object.resolve(Translator);
        this.$element = null;
    }

    var base = Object.inherit(KnockoutViewModel, LoginViewModel);

    LoginViewModel.prototype.show = function() {
        this.dialog = new DialogViewModel(this, this.title);
        this.dfd = $.Deferred();

        this.dialog.show();
        this.$element = this.dialog.$wrapper.find('.dialog-message-box');
        setMessageBoxStyle(this);
        return this.dfd;
    };

    LoginViewModel.prototype.buttonClicked = function (clickedButtonIndex) {
        this.dialog.closeDialog();

        this.dfd.resolve(clickedButtonIndex);
    };

    function setMessageBoxStyle(self) {
        var $messageBoxContent = self.$element.parents('.dialog-content');
        $messageBoxContent.addClass('message-box-content');
        $messageBoxContent.siblings('.title').addClass('message-box-title');

        self.dialog.centerDialog();
    }

    function translate(key) {
        var translator = Object.resolve(Translator);

        return translator.translate(key);
    }

    return LoginViewModel;
});
