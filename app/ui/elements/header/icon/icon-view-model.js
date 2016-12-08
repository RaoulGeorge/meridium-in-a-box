define(function (require) {
    'use strict';

    var $ = require('jquery');

    var view = require('text!./icon-template.html');

    var IconViewModel = {};
    IconViewModel.prototype = Object.create(HTMLElement.prototype);

    IconViewModel.prototype.createdCallback = function () {
        var element = this,
            self = this;

        var icon = '',
            internalIcon = null;

        Object.defineProperty(element, 'icon', {
            get: function () { return element.internalIcon; }.bind(element),
            set: function (icon) {
                changeIcon.call(null, element, icon);
            }.bind(element)
        });

        $(element).html(view);

        icon = $(element).attr('icon');
        if (icon) {
            $(element).find('button i').addClass(icon);
        } else {
            $(element).find('button i').addClass('icon-less-than');
        }

        //$(element).find('button').on("click", function () {
        //    self.dispatchEvent(new CustomEvent('icon-clicked', { bubbles: true }));
        //});
    };

    IconViewModel.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var element = this;

        if (attrName === 'icon') {
            $(element).find('button i').removeClass().addClass(newVal);
        }
    };

    function changeIcon(element, value) {
        if (value) {
            $(element).find('button i').removeClass().addClass(value);
        } else {
            $(element).find('button i').removeClass().addClass('icon-less-than');
        }
    }

    document.registerElement('mi-icon', { prototype: IconViewModel.prototype });

    return IconViewModel;

});