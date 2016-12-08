define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var BASE_URL = '/meridium/api/core/uiexport',
        AjaxClient = require('system/http/ajax-client'),
        ApplicationContext = require('application/application-context');

    require('system/lang/object');

    function ExportService() {
        var self = this;
        self.ajaxClient = Object.resolve(AjaxClient);
        self.baseURL = self.ajaxClient.url(BASE_URL);
        self.sessionID = ApplicationContext.session.id;
    }

    ExportService.prototype.exportPage = function ExportService_ExportPage(exportConfiguration, type, fileName) {
        var self = this;
        type = type ? type : 'pdf';
        fileName += '.' + type;
        var links = $("head > link");
        var contentDom = $("#shell-screen > .content-wrapper > .content");
        var contentWidth = $(contentDom).width();       

        //Setting width to avoid highcharts overflow in PDF
        $(contentDom).width('1200px');
        $(document).trigger('resize');

        //Time delay for highcharts to resize its content 
        _.delay(function () {
            var htmlContent = $(contentDom)[0].outerHTML;
            $(contentDom).width(contentWidth);
            $(document).trigger('resize');

            var defaultConfig = {
                htmlString: htmlContent,
                cssLinks: _.map(links, function (item) { return item.outerHTML; }),
                hiddenHtmlSelector: ["button"],
                avoidPageBreaks: ['.avoid-page-break'],
                addPageBreakBefore: ['.add-page-break-before'],
                addPageBreakAfter: ['.add-page-break-after'],
                orientation: 'landscape'
            };
            defaultConfig.orientation = exportConfiguration.orientation ? exportConfiguration.orientation : defaultConfig.orientation;
            defaultConfig.htmlString = exportConfiguration.htmlString ? exportConfiguration.htmlString : defaultConfig.htmlString;
            if (exportConfiguration.cssLinks) {
                $.each(exportConfiguration.cssLinks, function (index, value) {
                    defaultConfig.cssLinks.push(value);
                });
            }
            if (exportConfiguration.hiddenHtmlSelector) {
                $.each(exportConfiguration.hiddenHtmlSelector, function (index, value) {
                    defaultConfig.hiddenHtmlSelector.push(value);
                });
            }

            if (exportConfiguration.avoidPageBreaks) {
                $.each(exportConfiguration.avoidPageBreaks, function (index, value) {
                    defaultConfig.avoidPageBreaks.push(value);
                });
            }
            if (exportConfiguration.addPageBreakBefore) {
                $.each(exportConfiguration.addPageBreakBefore, function (index, value) {
                    defaultConfig.addPageBreakBefore.push(value);
                });
            }
            if (exportConfiguration.addPageBreakAfter) {
                $.each(exportConfiguration.addPageBreakAfter, function (index, value) {
                    defaultConfig.addPageBreakAfter.push(value);
                });
            }

            self.ajaxClient.post(BASE_URL, defaultConfig).done(_.partial(openDownLoadLink, self, type, fileName));

        }, 100);
    };



    function openDownLoadLink(self, type, fileName, exportToken) {
        var url = self.baseURL + '?sessionID=' + encodeURIComponent(self.sessionID);
        url += '&exportToken=' + encodeURIComponent(exportToken);
        url += '&type=' + encodeURIComponent(type);
        url += '&fileName=' + encodeURIComponent(fileName);

        if (typeof cordova !== 'undefined') {
            // To check if running cordova app on surface
            if (window && window.MSApp) {
                window.openInExternalBrowser(url);
            } else {
                cordova.InAppBrowser.open(encodeURI(url), '_system');
            }
        } else {
            window.open(url, '_blank');
        }
    }

    return ExportService;
});