/* global define */
define(function(require) {
    "use strict";

    var $ = require('jquery'),        
        Translator = require('system/globalization/translator');

    function RefDocContainerView(refDocs) {
        this.translator = Object.resolve(Translator);
        this.refDocs = refDocs;
    }

    RefDocContainerView.prototype.getView = function () {
        var html = '',
            i;

        if (this.refDocs.length > 0) {
            for (i = 0; i < this.refDocs.length; i++) {
                html += '<section class="content block-group"  data-key="' + this.refDocs[i].key + '">';
                html += '<div class="block col-15"><span class="icon"><i class="' + getFileIcon(this.refDocs[i]) + '"></i></span>' + this.refDocs[i].name + '</div>';
                html += '<div class="block col-25">' + this.refDocs[i].desc + '</div>';

                if (this.refDocs[i].isStoredDocument && this.refDocs[i].docType !== "") {
                    html += '<div class="block col-10"> <div> ' + this.translator.translate('YES') + '</div></div>';
                } else {
                    html += '<div class="block col-10"> <div> ' + this.translator.translate('NO') + '</div></div>';
                }

                html += '<div class="block col-10"><div>' +  this.refDocs[i].size + '</div></div>';

                html += '<div class="block col-5"> <button class="btn btn-icon section-icon edit" title="' + this.translator.translate('EDIT') + '"> <i class="icon-edit"></i> </button></div>';
                html += '<div class="block col-5"> <button class="btn btn-icon section-icon unlink" title="' + this.translator.translate('UNLINK') + '"> <i class="icon-unlink"></i> </button></div>';

                if (this.refDocs[i].isURL || this.refDocs[i].isUncPath) {
                    html += '<div class="block col-5"> <button class="btn btn-icon section-icon open" title="' + this.translator.translate('OPEN_IN_NEW_WINDOW') + '"> <i class="icon-open-in-new-window"></i> </button></div>';
                }

                if (this.refDocs[i].isStoredDocument && this.refDocs[i].docType !== "") {
                    html += '<div class="block col-5"> <button class="btn btn-icon section-icon download" title="' + this.translator.translate('DOWNLOAD') + '"> <i class="icon-download"></i> </button></div>';
                } 

                html += '</section>';
            }
        } else {
            html += '<section class="content block-group"> ';
            html += '<section class="block text-info">' + this.translator.translate('REFDOCS_NO_REFERENCE_DOCUMENTS_AVAILABLE') + '</section>';
        }

        return html;
    };

    function getFileIcon(refdoc) {
        if (refdoc.docType === 'pdf') {
            return 'icon-image';
        } else if (refdoc.docType === 'js') {
            return 'icon-code';
        } else if (refdoc.docType === 'xls' || refdoc.docType === 'xlsx') {
            return 'icon-grid';
        } else if (refdoc.docType === 'doc' || refdoc.docType === 'docx') {
            return 'icon-doc';
        } else if (refdoc.docType === 'jpg' || refdoc.docType === 'jpeg' || refdoc.docType === 'png' || refdoc.docType === 'bmp' || refdoc.docType === 'gif') {
            return 'icon-image';
        } else if (refdoc.docType === 'txt') {
            return 'icon-doc';
        }

        return "icon-doc";
    }

    return RefDocContainerView;
});