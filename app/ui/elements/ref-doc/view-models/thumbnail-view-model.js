define(function (require) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        view = require('text!../views/refdoc-thumbnail.html'),
        ApplicationContext = require('application/application-context'),
        ApplicationEvents = require('application/application-events'),
        Region = require('spa/region'),
        RefDocs = require('../models/refdoc-collection'),
        RefDocService = require('../services/service'),
        converter = require('system/lang/converter'),
        FeedbackToast = require('logging/feedback-component/feedback-component'),
        Translator = require('system/globalization/translator'),
        Device = require('system/hardware/device');

    require('ui/elements/tool-bar/view-model');
    require('ui/elements/filter/filter-view-model');

    var RefDocThumb = Object.create(HTMLElement.prototype);

    RefDocThumb.createdCallback = function () {
        this.element = this;
        this.service = Object.resolve(RefDocService);
        this.refDocs = Object.resolve(RefDocs);
        this.translator = Object.resolve(Translator);
        this.appEvents = Object.resolve(ApplicationEvents);
        this.entitykey = this.getAttribute('entitykey');
        this.refDocListContainer = null;
        this.filteroptions = null;
        this.initialized = false;
        this.filterValues = null;
        this.device = Object.resolve(Device);
        this.isIOS = this.device.isIOS();
    };

    RefDocThumb.attachedCallback = function () {
        var self = this;
        if (!self.initialized) {
            self.appEvents.connectionChanged.add(self.connectionStatusChanged, self);
            self.initialized = true;
        }
        self.element.innerHTML = view;
        if (self.entitykey) {
            refreshList(self, self.entitykey);
        }
    };

    RefDocThumb.detachedCallback = function () {
        var self = this;
        if (self.initialized) {
            self.appEvents.connectionChanged.remove(self.connectionStatusChanged, self);
            self.initialized = false;
        }
    };

    RefDocThumb.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'entitykey') {
            this.entitykey = newVal;
            refreshList(this, this.entitykey);
        }
    };

    RefDocThumb.attachClickHandlers = function () {
        $(this.element).find('.open').on('click', onOpenClicked.bind(null, this));
    };

    RefDocThumb.detachClickHandlers = function () {
        $(this.element).find('.open').off('click', onOpenClicked.bind(null, this));
    };

    RefDocThumb.offLine = function () {
        return !ApplicationContext.connectionStatus.connected;
    };

    RefDocThumb.generateDOM = function (refDocs) {
        var i,
            refDocContainer = $(this.element).find('.refdoc-thumbnail-list'),
            HardcodedStyle = '',
            HTMLstr = '';
        this.refDocListContainer = refDocContainer;

        this.refDocListContainer.find('.content').remove();

        if (this.offLine()) {
            HTMLstr += '<section class="content block-group"> ';
            HTMLstr += '<section class="block text-info">' + this.translator.translate('REFDOCS_DOCS_NOT_AVAILABLE_OFFLINE') + '</section>';
        }
        else {
            if (refDocs.length > 0) {
                HTMLstr += '<div class="content block-group">';
                for (i = 0; i < refDocs.length; i++) {
                    HTMLstr += '<div class="block refdoc-thumbnail" data-key="' + refDocs[i].key + '" >';
                    HTMLstr += '<span class="icon refdoc-link open" >' +
                        '<i class="' + getFileIcon(refDocs[i]) + '"></i>' +
                        '<br/>' + refDocs[i].name +
                        '</span>' +
                        '</div>';
                }
                HTMLstr += '</div>';
            }
            else {
                HTMLstr += '<section class="content block-group"> ';
                HTMLstr += '<section class="block text-info">' + this.translator.translate('REFDOCS_NO_REFERENCE_DOCUMENTS_AVAILABLE') + '</section>';
            }
        }
        refDocContainer.append(HTMLstr);
        this.attachClickHandlers();
    };

    RefDocThumb.populateCollection = function (data) {
        if (data) {
            this.refDocs.populate(data);
        }
    };

    RefDocThumb.connectionStatusChanged = function () {
        var self = this;
        refreshList(self, self.entitykey);
    };

    function getFileIcon(refdoc) {
        if(refdoc.docType === 'pdf') {
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

    function refreshList(self, entity) {
        self.element.innerHTML = view;
        self.service.getRefDocs(self.entitykey)
            .done(getRefDocs_done.bind(null, self))
            .fail(getRefDocs_fail.bind(null, self));
    }

    function getRefDocs_done(self, data) {
        self.populateCollection(data.item1);
        self.generateDOM(self.refDocs.refdocs);
    }

    function getRefDocs_fail(self) {
        self.populateCollection();
        self.generateDOM(self.refDocs.refdocs);
    }

    function onOpenClicked(self, e) {
        var target = $(e.target).closest('.refdoc-thumbnail'),
            key = target.data('key');

        e.stopPropagation();

        self.service.getRefDocType(key).done(function (typeDTO) {
            var temp = typeDTO.type;
            if (typeDTO.type === 'URL') {
                if (typeof cordova !== 'undefined') {
                    if (self.isIOS) {
                        window.open(typeDTO.documentPath, '_system');
                    }
                    else {
                        cordova.InAppBrowser.open(typeDTO.documentPath, '_blank');
                    }
                } else {
                    window.open(typeDTO.documentPath);
                }
            }
            else {
                self.service.openRefDoc(key, typeDTO)
                    .fail(refDocOpen_fail.bind(null, self));
            }
        });
    }

    function refDocOpen_fail(self) {
        var toast = new FeedbackToast({
            'closeButton': true,
            'timeOut': '200',
            'hideDuration': '200'
        });
        toast.error({
            code: '0', message: self.translator.translate('REFDOCS_FAILED_TO_OPEN_DOCUMENT')
        });
    }

    document.registerElement('mi-ref-doc-thumb', { prototype: RefDocThumb });

    return RefDocThumb;
});