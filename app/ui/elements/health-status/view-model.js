define(function (require) {
    'use strict';

    var $ = require('jquery');


    var translator = Object.resolve(require('system/globalization/translator')),
        alertText = translator.translate('ALERT'),
        warningText = translator.translate('WARNING_NORMAL_CASE'),
        noStatusText = translator.translate('NO_STATUS'),
        normalText = translator.translate('NORMAL'),
        outOfSyncText = translator.translate('HEALTH_STATUS_OUT_OF_SYNC'),
        scoreAndIconMap = {
            '110': { iconClass: 'icon-alert status-icon', description: alertText },
            '100': { iconClass: 'icon-alert status-icon', description: alertText },
            '90': { iconClass: 'icon-alert-out-of-sync status-icon', description: alertText + ' ' + outOfSyncText },
            '80': { iconClass: 'icon-warning status-icon', description: warningText },
            '70': { iconClass: 'icon-warning-out-of-sync status-icon', description: warningText + ' ' + outOfSyncText },
            '60': { iconClass: 'icon-no-data status-icon', description: noStatusText },
            '50': { iconClass: 'icon-no-data-out-of-sync status-icon', description: noStatusText + ' ' + outOfSyncText },
            '40': { iconClass: 'icon-normal-out-of-sync status-icon', description: normalText + ' ' + outOfSyncText },
            '30': { iconClass: 'icon-normal status-icon', description: normalText },
            'default': { iconClass: 'icon-no-health status-icon' }
        };

    var proto = Object.create(HTMLElement.prototype);

    proto.extractInnerHTML = function () {
        return this.$element.html();
    };

    proto.insertInnerHTML = function () {
        this.innerHTML = '<i></i>';
        $(this).find('i').addClass(this.currentIcon);
    };

    proto.setElement = function () {
        this.$element = $(this.element);
    };

    proto.upgradeHealthIndicatorStatus = function () {
        Element.upgrade(this.$element.find('mi-health-status'));
    };

    proto.attachHandlers = function () {
    };

    proto.attachedCallback = function () {
        this.setElement();
        this.insertInnerHTML();
        this.upgradeHealthIndicatorStatus();
        this.attachHandlers();
        this.setStatusStyle();
    };

    proto.createdCallback = function () {
        this.currentIcon = scoreAndIconMap['default'];
        this.score = this.getAttribute('score');
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'score') {
            this.score = newVal;
            this.setStatusStyle();
        }
    };

    proto.setStatusStyle = function () {
        var newIcon = scoreAndIconMap[this.score] || scoreAndIconMap['default'];

        $(this).find('i').removeClass(this.currentIcon.iconClass);
        $(this).find('i').addClass(newIcon.iconClass);
        $(this).find('i').attr('title', newIcon.description);

        this.currentIcon = newIcon;
    };

    document.registerElement('mi-health-status', { prototype: proto });

    return proto;
});