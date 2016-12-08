define(function (require) {
    'use strict';

    var $ = require('jquery');

    var view = require('text!./header-template.html');
    require('ui/elements/header/title/title-view-model');
    require('ui/elements/header/sub-title/sub-title-view-model');
    require('ui/elements/header/icon/icon-view-model');
    require('ui/elements/breadcrumb/view-model');

    var HeaderViewModel = {};
    HeaderViewModel.prototype = Object.create(HTMLElement.prototype);

    HeaderViewModel.prototype.createdCallback = function () {
        $(this).wrapInner(view);
    };

    HeaderViewModel.prototype.attachedCallback = function () {
        var self = this;

        this.icon = $(this).find('mi-icon')[0];
        this.breadcrumbEl = $(this).find('mi-breadcrumb')[0];
        this.titleEl = $(this).find('mi-title')[0];
        if (!this.breadcrumbEl) {
            positionTitle(this);
        } else {
            if (!this.titleEl) {
                positionBreadcrumb(this);
            }
        }
        $(this.icon).on('click', function () {
            self.dispatchEvent(new CustomEvent('icon-clicked', { bubbles: true }));
        });

        var title = $(this).find('mi-title')[0];
        if (title) {
            handleMutationHandler(title);
        }

        var subTitle = $(this).find('mi-sub-title')[0];
        if (subTitle) {
            handleMutationHandler(subTitle);
        }
    };

    

    function handleMutationHandler(element) {

        // create an observer instance
        element.observer = new MutationObserver(function (mutations, element) {
            mutations.forEach(function (mutation) {
                mutation.target.repaint(mutation.target);
            });
        }.bind(element));

        // configuration of the observer:
        var config = { attributes: true, childList: true, characterData: false };

        // pass in the target node, as well as the observer options
        element.observer.observe(element, config);

    }

    function positionTitle(self) {
        var header = $(self).find('.header-container');
        $(header).prepend('<div class="breadcrumb-group-container">    <div class="breadcrumb-group" style="display: none;"></div>   </div>');
        $(self.icon).find('.icon-container').css('margin-top', '-24px');
    }

    function positionBreadcrumb(self) {
        $(self.breadcrumbEl).find('.breadcrumb-group').css('margin-top', '24px');
    }

    document.registerElement('mi-header', { prototype: HeaderViewModel.prototype });

    return HeaderViewModel;

});