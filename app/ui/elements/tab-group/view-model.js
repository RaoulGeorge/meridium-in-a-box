define(function (require) {
    'use strict';

    var $ = require('jquery');


    //var view = require('text!./view.html'),
    var Converter = require('system/lang/converter');
    require('ui/elements/tab-group-item/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.element = this;
        this.$element = null;
        this.tabs = this.getTabsAttribute();
        this.size = this.getSizeAttribute();
        this.selectedTab = null;
    };

    proto.attachedCallback = function () {
        this.setElement();
        
        this.insertInnerHTML();
        this.upgradeTabs();
        this.cascadeAttributes();
        this.attachHandlers();
    };

    proto.detachedCallback = function () { };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) { };

    proto.getSelectedTab = function () {
        var selectedChild;
        if (!this.selectedTab) {
            selectedChild = getSelectedChild(this);
            if (selectedChild) {
                this.setSelectedTab(selectedChild);
            }
        } else {
            this.setSelectedTab(this.selectedTab);
        }
        return this.selectedTab;
    };

    proto.setElement = function () {
        this.$element = $(this.element);
    };

    proto.upgradeTabs = function () {
        Element.upgrade(this.$element.find('mi-tab'));
    };

    proto.extractInnerHTML = function () {
        return this.$element.html();
    };

    proto.insertInnerHTML = function () {
        var tabGroupDiv = document.createElement('div');
        tabGroupDiv.className = 'tab-group block-group tab-group-default';
        $(this.$element).wrapInner(tabGroupDiv);
    };

    proto.cascadeAttributes = function () {
        var childElements,
            i,
            tabWidthClass;

        tabWidthClass = calculateTabWidth(this.tabs);

        if (this.size === 'small') {
            $(this).find('div.tab-group').height(36).addClass('tab-group-small');
        }

        childElements = this.$element.find('mi-tab');
        for (i = 0; i < childElements.length; i++) {
            childElements[i].setAttribute('tabWidthClass', tabWidthClass);
            if (this.size === 'small') {
                $(childElements[i]).find('div.tab-group-item').addClass('small-tab').removeClass('block');
                $(childElements[i]).find('span.number').hide();
            }
        }
    };

    proto.attachHandlers = function () {
        this.$element.on('click', onClick.bind(null, this));
    };

    proto.getTabsAttribute = function getTabsAttribute() {
        return Converter.toInteger(this.getAttribute('tabs'));  //Number of tabs
    };
    proto.getSizeAttribute = function getSizeAttribute() {
        return this.getAttribute('size') ? this.getAttribute('size').toLowerCase() : "large";
    };

    proto.setSelectedTab = function setSelectedTab(newlySelectedTab) {
        this.selectedTab = {
            'value': newlySelectedTab.value,
            'number': newlySelectedTab.number,
            'text': newlySelectedTab.text
        };
    };

    //to update tab sizes
    proto.updateTabSize = function updateTabSize() {
        this.size = this.getSizeAttribute();
        this.cascadeAttributes();
    };

    function getSelectedChild(self) {
        var childElements,
            i;

        childElements = self.$element.find('mi-tab');
        for (i = 0; i < childElements.length; i++) {
            if (childElements[i].isSelected) {
                return childElements[i];
            }
        }
    }

    function onClick(self, e) {
        var newlySelectedTab,
            target,
            childElements,
            i;


        target = $(e.target);

        //Make sure that the event is not for tab group
        if (target.hasClass('tab-group')) {
            return;
        }

        newlySelectedTab = target.closest('mi-tab')[0];

        childElements = self.$element.find('mi-tab');
        for (i = 0; i < childElements.length; i++) {
            childElements[i].setInactive();
        }
        newlySelectedTab.setActive();
        self.setSelectedTab(newlySelectedTab);
    }

    function calculateTabWidth (tabCount) {
        if (tabCount === 2) {
            return 'two-tab';
        } else if (tabCount === 3) {
            return 'three-tab';
        } else if (tabCount === 4) {
            return 'four-tab';
        } else if (tabCount === 5) {
            return 'five-tab';
        } else if (tabCount === 6) {
            return 'six-tab';
        } else if (tabCount === 7) {
            return 'seven-tab';
        } else if (tabCount === 8) {
            return 'eight-tab';
        }

        return 'one-tab';
    }

    document.registerElement('mi-tab-group', { prototype: proto });

    return proto;
});
