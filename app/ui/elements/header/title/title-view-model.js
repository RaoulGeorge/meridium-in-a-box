define(function (require) {
    'use strict';

    var $ = require('jquery');

    var view = require('text!./title-template.html');

    var TitleViewModel = {};
    TitleViewModel.prototype = Object.create(HTMLElement.prototype);

    TitleViewModel.prototype.createdCallback = function () {
        var element = this;

        var title = '',
            internalTitle = null;

        $(element).html(view);

        title = $(element).attr('title');

        if (title) {
            //$(element).find('h1').text(title);
            element.querySelector('h1').innerHTML = title;
        }
    };

    TitleViewModel.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        var element = this;
        if (attrName === 'title') {
            element.querySelector('h1').innerHTML = newVal;
            setWidthForTitleContainer(element);
        }

    };

    TitleViewModel.prototype.repaint = function () {
        var element = this;
        setWidthForTitleContainer(element);
    };

    function setWidthForTitleContainer(element) {
        //getting width of buttons inside mi-icon
        var iconWidth = getIconWidth(element);
        var elementsWidth = 0;
        var elementsLength = getElementsLength(element);
        var currentElement;

        for (var i = 0; i < elementsLength; i++) {
            //getting current element
            currentElement = $($(element).nextAll().not('mi-sub-title, .custom-subtitle')[i]);
            elementsWidth += $(currentElement).innerWidth(); //getting width of elements including hidden elements
        }
        //+30 px for padding
        elementsWidth = elementsWidth + 30 + 'px' || '30px';
        //setting width of title container
        setTitleContainerWidth(element, iconWidth, elementsWidth);
                
    }

    function getIconWidth(element) {
        return $(element).parent().find('mi-icon .icon-container').css('width') || '0px';
    }
   
    function getElementsLength(element) {
        return $(element).nextAll().not('mi-sub-title, .custom-subtitle').length;
    }
    //setting width of title container
    function setTitleContainerWidth(element, iconWidth, elementsWidth) {
        $(element).find('.title-container').css('width', 'calc(100% - ' + iconWidth + ' - ' + elementsWidth + ')');
    }

    function changeTitle(element, value) {
        element.querySelector('h1').innerHTML = value;
        //$(element).find('h1').text(value);
    }

    document.registerElement('mi-title', { prototype: TitleViewModel.prototype });

    return TitleViewModel;

});