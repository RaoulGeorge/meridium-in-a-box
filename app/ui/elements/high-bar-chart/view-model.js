define(function (require) {
    'use strict';

    var $ = require('jquery');

    var view = require('text!./view.html'),
        translator = Object.resolve(require('system/globalization/translator')),
        parser = require('system/text/parser');

    var proto = Object.create(HTMLElement.prototype);

    proto.attachedCallback = function () {
        var self = this;
        self.setElement();
        self.insertInnerHTML();
        self.loadSettings(self.getAttribute('settings'));
    };

    proto.setElement = function () {
        var self = this;
        self.$element = $(this.element);
    };

    proto.insertInnerHTML = function () {
        var self = this;
        self.innerHTML = view;

        self.upgradeBarChart();
    };

    proto.loadSettings = function (settings) {
        var self = this;

        if (settings) {
            var settingsObj = JSON.parse(settings);

            self.noReadingCount = isNaN(parseInt(settingsObj.noReadingCount))? 0 : parseInt(settingsObj.noReadingCount);
            self.normalCount =  isNaN(parseInt(settingsObj.normalCount)) ? 0 : parseInt(settingsObj.normalCount);
            self.warningCount = isNaN(parseInt(settingsObj.warningCount)) ? 0 : parseInt(settingsObj.warningCount);
            self.alertCount = isNaN(parseInt(settingsObj.alertCount)) ? 0 : parseInt(settingsObj.alertCount);
            self.totalCount = self.noReadingCount + self.normalCount + self.warningCount + self.alertCount;

            if (self.totalCount > 0) {
                $(self).find('.no-indicators-label').hide();
                $(self).find('.bar').show();
                $(self).find('.bar-stack').css('border', 'none');
                self.noReadingBarWidth = (self.noReadingCount / self.totalCount) * 100;
                self.normalBarWidth = (self.normalCount / self.totalCount) * 100;
                self.warningBarWidth = (self.warningCount / self.totalCount) * 100;
                self.alertBarWidth = (self.alertCount / self.totalCount) * 100;

                $(self).find('.no-readings-bar').css('width', self.noReadingBarWidth + '%');
                $(self).find('.normal-bar').css('width', self.normalBarWidth + '%');
                $(self).find('.warning-bar').css('width', self.warningBarWidth + '%');
                $(self).find('.alert-bar').css('width', self.alertBarWidth + '%');

                if (self.noReadingCount !== 0) {
                    $(self).find('.no-readings-bar span').text(self.noReadingCount);
                }
                if (self.normalCount !== 0) {
                    $(self).find('.normal-bar span').text(self.normalCount);
                }
                if (self.warningCount !== 0) {
                    $(self).find('.warning-bar span').text(self.warningCount);
                }
                if (self.alertCount !== 0) {
                    $(self).find('.alert-bar span').text(self.alertCount);
                }
            }
            else {
                $(self).find('.no-indicators-label').show();
                $(self).find('.no-indicators-label').text(translator.translate('NO_HEALTH_INDICATORS'));
                $(self).find('.bar').hide();
                $(self).find('.bar-stack').css('border', '2px solid #999999');

            }

        }
    };

    proto.upgradeBarChart = function () {
        Element.upgrade(this.$element.find('high-bar-chart'));
    };

    document.registerElement('high-bar-chart', { prototype: proto });

    return proto;
});
