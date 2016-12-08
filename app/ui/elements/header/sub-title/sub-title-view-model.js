define(function (require) {
    'use strict';

    var $ = require('jquery');

    var view = require('text!./sub-title-template.html');

    var SubTitleViewModel = {};
    SubTitleViewModel.prototype = Object.create(HTMLElement.prototype);

    SubTitleViewModel.prototype.createdCallback = function () {
        var element = this;

        var subtitle = '',
            internalSubTitle = null;


        Object.defineProperty(element, 'subtitle', {
            get: function () { return element.internalSubTitle; }.bind(element),
            set: function (subtitle) {
                changeSubTitle.call(null, element, subtitle);
            }.bind(element)
        });

        $(element).html(view);

        subtitle = $(element).attr('subtitle');
        $(element).attr('title', subtitle);

        if (subtitle) {
            $(element).find('h3').html(subtitle);
        }
    };

    SubTitleViewModel.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var element = this;

        if (attrName === 'subtitle') {
            $(element).find('h3').html(newVal);
            $(element).attr('title', newVal);
            setWidthForSubTitleContainer(element);
        }
    };

    SubTitleViewModel.prototype.repaint = function () {
        var element = this;
        setWidthForSubTitleContainer(element);

    };

    function changeSubTitle(element, value) {
        $(element).find('h3').html(value);
        $(element).attr('title', value);
        setWidthForSubTitleContainer(element);
    }

    function setWidthForSubTitleContainer(element) {
        //getting width of buttons inside mi-icon
        var iconWidth = getIconWidth(element);
        var elementsWidth = 0;
        var elementsLength = getElementsLength(element);
        var currentElement;

        for (var i = 0; i < elementsLength; i++) {
            //getting current element
            currentElement = $($(element).nextAll()[i]);

            elementsWidth += $(currentElement).width();
        }
        //+30 px for padding
        elementsWidth = elementsWidth + 30 + 'px' || '30px';
        //setting width of sub title container
        setSubTitleContainerWidth(element, iconWidth, elementsWidth);
    }

    function getIconWidth(element) {
        return $(element).parent().find('mi-icon .icon-container').css('width') || '0px';
    }

    function getElementsLength(element) {
        return $(element).nextAll().length;
    }
    //setting width of sub title container
    function setSubTitleContainerWidth(element, iconWidth, elementsWidth) {
        $(element).find('.sub-title-container').css('width', 'calc(100% - ' + iconWidth + ' - ' + elementsWidth + ')');
    }
    
    document.registerElement('mi-sub-title', { prototype: SubTitleViewModel.prototype });

    return SubTitleViewModel;

});