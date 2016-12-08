define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');
    var utils = require('./utils');

    var converter = require('system/lang/converter'),
        Parser = require('system/text/parser'),
        formatter = require('system/text/formatter'),
        Formatter = Object.resolve(formatter);

    require('ui/elements/more-options/more-options');

    function ToolbarHelper() {
        this.rightToolbar = null;
        this.leftToolbar = null;
        this.vm = null;
        this.buttons = [];
    }
    var base = Object.inherit(utils, ToolbarHelper);

    ToolbarHelper.prototype.init = function ToolbarHelper_init(self, rgHeader) {
        this.vm = self;
        var leftToolbar, rightToolbar, div;

        div = document.createElement('div');
        leftToolbar = document.createElement('mi-tool-bar');
        leftToolbar.className = 'rg-left-tool-bar pull-left';
        div.appendChild(leftToolbar);

        rightToolbar = document.createElement('mi-tool-bar');
        rightToolbar.className = 'rg-right-tool-bar pull-right';
        leftToolbar.insertBefore(createIconButton(this, 'showFilter', self.translator.translate("RG_SEARCH_CAPTION"), 'icon-search', 'rg-filter'), leftToolbar.firstChild);
        div.appendChild(rightToolbar);
        rgHeader.insertBefore(div, rgHeader.firstChild);
        
        this.leftToolbar = leftToolbar;
        this.rightToolbar = rightToolbar;

        this.attachEventHandlers();
        this.hide();
    };

    ToolbarHelper.prototype.handleVisibility = function ToolbarHelper_handleVisibility() {
        var self = this.vm;
        if (!self) {
            return false;
        }
        if (self.showRowFilter()) {
            this.show();
        } else {
            if ($(this.leftToolbar).find('button').length === 2) {
                $(this.leftToolbar).hide();
            }
        }
    };

    ToolbarHelper.prototype.hide = function ToolbarHelper_hide() {
        $(this.leftToolbar).hide();
        $(this.rightToolbar).hide();
    };

    ToolbarHelper.prototype.show = function ToolbarHelper_show() {
        $(this.leftToolbar).show();
        $(this.rightToolbar).show();
    };

    ToolbarHelper.prototype.attachEventHandlers = function ToolbarHelper_attachEventHandlers() {
        this.leftToolbar.addEventListener('click', this);
        this.rightToolbar.addEventListener('click', this);
    };

    ToolbarHelper.prototype.handleEvent = function ToolbarHelper_handleEvent(e) {
        var self = this.vm, action;
        if (e.type === 'click') {
            if (e.target.nodeName === 'BUTTON' && !e.target.disabled) {
                action = e.target.getAttribute('data-action');
                Object.tryMethod(self, 'toolbarItemClickCallback', action, e);
            }
            else if (e.target.nodeName === 'I' && e.target.parentNode.nodeName === 'BUTTON' && !e.target.parentNode.disabled) {
                action = e.target.parentNode.getAttribute('data-action');
                Object.tryMethod(self, 'toolbarItemClickCallback', action, e);
            }
        }
    };

    ToolbarHelper.prototype.disableButton = function ToolbarHelper_disableButton(self, btnClass, boolValue) {
        var i, buttons = self.buttons;
        if (buttons) {
            for (i = 0; i < buttons.length; i++) {
                if (buttons[i].className.split(' ').indexOf(btnClass) >= 0) {
                    buttons[i].disabled = boolValue;
                }
            }
        }
    };

    ToolbarHelper.prototype.setNoAccess = function setNoAccess(self, btnClass, boolValue) {
        var i, buttons = self.buttons;
        if (buttons) {
            for (i = 0; i < buttons.length; i++) {
                if (buttons[i].className.split(' ').indexOf(btnClass) >= 0) {
                    if (buttons[i].tagName && buttons[i].tagName.toLowerCase() === 'mi-more-options-noko') {
                        buttons[i].setAttribute('noaccess', boolValue);
                    }
                    else {
                        if (boolValue) {
                            buttons[i].className += ' no-access';
                        }
                        else {
                            buttons[i].className = buttons[i].className.replace(/ no-access/g, '');
                        }
                    }                    
                }
            }
        }
    };

    ToolbarHelper.prototype.showButton = function showButton(self, btnClass, boolValue) {
        var i, buttons = self.buttons;
        if (buttons) {
            for (i = 0; i < buttons.length; i++) {
                if (buttons[i].className.split(' ').indexOf(btnClass) >= 0) {
                    if (boolValue) {
                        buttons[i].style.visibility = 'visible';
                    }
                    else {
                        buttons[i].style.visibility = 'hidden';
                    }
                }
            }
        }
    };



    ToolbarHelper.prototype.renderToolbars = function renderToolbars(self) {
        var leftToolbar, rightToolbar, i, btn;
        leftToolbar = self.querySelector('.rg-left-tool-bar');
        rightToolbar = self.querySelector('.rg-right-tool-bar');

        if (self._loadConfigurableButtons && leftToolbar && rightToolbar) {
            for (i = 0; i < self._loadConfigurableButtons().length; i++) {
                btn = self._loadConfigurableButtons()[i];
                if (btn.align === 'left') {
                    if (btn.type === 'more-options') {
                        if (btn.iconClass) {
                            leftToolbar.insertBefore(createMoreOptionsButton(this, 'icon', btn.iconClass, btn.btnClass, btn.options), leftToolbar.firstChild);
                        }
                        else {
                            leftToolbar.insertBefore(createMoreOptionsButton(this, 'text', btn.text, btn.btnClass, btn.options), leftToolbar.firstChild);
                        }                        
                    }
                    else if (btn.text) {
                        leftToolbar.insertBefore(createTextButton(this, btn.action, btn.title, btn.text, btn.btnClass), leftToolbar.firstChild);
                    }
                    else {
                        leftToolbar.insertBefore(createIconButton(this, btn.action, btn.title, btn.iconClass, btn.btnClass), leftToolbar.firstChild);
                    }
                }
                else if (btn.align === 'right') {
                    if (btn.type === 'more-options') {
                        if (btn.iconClass) {
                            rightToolbar.insertBefore(createMoreOptionsButton(this, 'icon', btn.iconClass, btn.btnClass, btn.options), rightToolbar.firstChild);
                        }
                        else {
                            rightToolbar.insertBefore(createMoreOptionsButton(this, 'text', btn.text, btn.btnClass, btn.options), rightToolbar.firstChild);
                        }
                    }
                    else if (btn.text) {
                        rightToolbar.insertBefore(createTextButton(this, btn.action, btn.title, btn.text, btn.btnClass), rightToolbar.firstChild);
                    }
                    else {
                        rightToolbar.insertBefore(createIconButton(this, btn.action, btn.title, btn.iconClass, btn.btnClass), rightToolbar.firstChild);
                    }
                }
            }
            this.show();
        }
    };

    function createIconButton(self, action, title, iconClass, btnClass) {
        var button = document.createElement('button'), btnClassName = '';
        var icon = document.createElement('i');
        icon.className = iconClass;
        if (btnClass) {
            btnClassName = btnClass;
        }
        button.className = 'btn btn-icon ' + btnClassName;
        button.title = title;
        button.setAttribute('data-action', action);
        button.appendChild(icon);

        if (!self.buttons) {
            self.buttons = [];
        }
        self.buttons.push(button);
        return button;
    }

    function createTextButton(self, action, title, text, btnClass) {
        var button = document.createElement('button'), btnClassName = '';
        button.innerHTML = text;
        if (btnClass) {
            btnClassName = btnClass;
        }
        button.className = 'btn btn-text ' + btnClassName;
        button.title = title || text;
        button.setAttribute('data-action', action);

        if (!self.buttons) {
            self.buttons = [];
        }
        self.buttons.push(button);
        return button;
    }

     function createMoreOptionsButton(self, type, data, btnClass, options) {
        var moreOptions = document.createElement('mi-more-options-noko'), btnClassName = '';
        if (type === 'icon') {
            moreOptions.setAttribute('icon', data);
        }
        else {
            moreOptions.setAttribute('text', data);
        }        
        if (btnClass) {
            btnClassName = btnClass;
        }
        $(moreOptions).attr('class', btnClassName);
        if (window.CustomElements && !window.CustomElements.useNative) {
            window.CustomElements.upgrade(moreOptions);
        }
        moreOptions.loader = setOptions.bind(null, options);
        moreOptions.moreoptionsCB(moreOptionsClicked.bind(null, self.vm));
        if (!self.buttons) {
            self.buttons = [];
        }
        self.buttons.push(moreOptions);
        return moreOptions;
    }    

    function setOptions(options) {
        var i, optionItems = [], option, dfd = $.Deferred();
        for (i = 0; i < options.length; i++) {
            option = { 'type': 'text', 'text': options[i].text, 'icon': options[i].iconClass, 'action': options[i].action };
            if (options[i].disabled) {
                option.disabled = typeof options[i].disabled === 'function' ? options[i].disabled() : options[i].disabled;
            }
            if (options[i].noaccess) {
                option.noaccess = typeof options[i].noaccess === 'function' ? options[i].noaccess() : options[i].noaccess;
            }
            optionItems.push(option);
        }
        dfd.resolve(optionItems);
        return dfd.promise();
    }

    function moreOptionsClicked(self, data) {
        Object.tryMethod(self, 'toolbarItemClickCallback', data.action);
    }

    return ToolbarHelper;
});