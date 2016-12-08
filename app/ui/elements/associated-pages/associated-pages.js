define(function (require) {
    'use strict';

    var $ = require('jquery');

    var Converter = require('system/lang/converter');
    var AssociatedPagesService = require('./associated-pages-service');
    var AssocPageModel = require('./hyperlink-dto');
    require('ui/elements/slide-panel-right/right-sidePanel-control');
    require('ui/elements/tree/view-model');
    var appEvents = require('application/application-events');
    var Translator = require('system/globalization/translator');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var self = this;
        var dfd = $.Deferred();
        self.appEvents = Object.resolve(appEvents);
        self.navigate = self.appEvents.navigate;
        self.$el = $(self);
        self.data = [];
        self.familykey = self.getFamilyKey();
        self.entitykey = self.getEntityKey();
        self.associatedPagesService = Object.resolve(AssociatedPagesService);
        self.translator = Object.resolve(Translator);
        defineProperties(self);
        $(self).append('<mi-slidepanelright sliderenable="true" icon="icon-duplicate-entries" title="' + self.translator.translate('ASSOCIATED_PAGES_TITLE') + '"><div class="assoc-page-placeholder"></div></mi-slidepanelright>');
        self.rightPanelControl = $('mi-slidepanelright')[0];
        Element.upgrade(self.rightPanelControl);
        getPagesFromService(self, self.familykey, dfd);
        dfd.done(createAssocPages.bind(null, self));
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var self = this;
        var dfd = $.Deferred();
        if (attrName === 'familykey') {
            
            self.familykey = newValue;
            self.data = [];
            self.dataKeys = {};
            setFamilyKey(newValue);
            $('.assoc-page-placeholder', this).empty();
            getPagesFromService(self, self.familykey,dfd);
            dfd.done(createAssocPages.bind(null, self));
           
        }
        else if (attrName === 'entitykey') {
            self.entitykey = newValue;
            setEntityKey(newValue);
        }
    };

    proto.attachedCallback = function () {

    };


    function getPagesFromService(self, familykey, dfd) {
        if (familykey !== '') {
            self.associatedPagesService.getAssocPages(familykey).done(function (assocPages) {
                populateAssocPagesData(assocPages, self);
                dfd.resolve();
            }).fail(function (err) {
                console.error(err);
            });
        }
    }

    proto.getFamilyKey = function getFamilyKey() {
        return this.getAttribute('familykey');
    };

    proto.getEntityKey = function getEntityKey() {
        return this.getAttribute('entitykey');
    };

    proto.loadAssociatedPages = function loadAssociatedPages(self, familykey, idx, pageNum, pageSize) {
        var dfd = $.Deferred(),key, url;
        var value = self.tree.value[idx];
        if(value && value.hyperLinkKey){
            key = value.hyperLinkKey;
        }
        if (value && value.url) {
            url = value.url;
        }
        if (key) {
            var data = self.dataKeys[key];
            //debugger
            if (data.length === 0) {
                //debugger
                selectedElementNavigateUrl(self, url);
                dfd.resolve(null);
            }
            dfd.resolve(data);
        } else {
            dfd.resolve(self.data);
        }
        $(self).find('mi-tree').on('selected', selectedElementNavigateUrl.bind(null, self));
        //debugger

        

        return dfd;
    };

    proto.initAssociatedPages = function initAssociatedPages(self, selector, familykey) {
        var tree = $('<mi-tree selector="none" multiselect="false" ' +
            ' key="hyperLinkKey" description="displayText" page="1" ' +
            ' page-size="25" scroll-percent="0.75" root-name="' + self.translator.translate('NO_ASSOCIATED_PAGES') + '" has-children="hasChildren"' +
            'custom-filter="false" custom-search="false" allow-add="false"></mi-tree>');
        // has-children property used to show/hide chevron icons
        self.tree = tree.get(0);
        Element.upgrade(self.tree);
        selector.appendChild(self.tree);

        $(selector).find('mi-tree')[0].loader = self.loadAssociatedPages.bind(null, self, familykey);

        //Showing 'No Associated Pages' when there are no associated pages associated with a familykey
        handleNoAssocDisplay(self);

        $(self).change(function () {
            handleNoAssocDisplay(self);
        });

        // Fix Double scroll issue on IE11
        $("div.sliderPanel").mouseover(function () {
            $("mi-list-group.nav-list-group  .list-group").css("overflow-x", "auto");
        }).mouseout(function () {
            $("div.rm-datasheet-container").css("overflow", "auto");
            $("div.rm-datasheet-container").css("overflow-x", "hidden");
        });

    };

    //Fix Home/No Associated Pages issue
    function handleNoAssocDisplay(self) {
        var i;
        if (self.data.length === 0) {
            //$($(self).find(".list-group-item")[0]).text('No Associated Pages');
            $($(self).find(".list-group-item")[0]).find('i').hide();
        }
        else {
                $($(self).find(".list-group-item")[0]).hide();
                //Default Associated Pages
                for (i = 0; i < self.data.length; i++) {
                    checkIsDefaultMenu(self, i);
                }
        }
        }


    //Checking for Default Associated Pages
    function checkIsDefaultMenu(self, i) {
        if (self.data[i].isDefaultMenu === true) {
            $($($(self).find('.list-group')[1]).find('.list-group-item')[i]).css({ 'font-weight': 'bold' });
        }
    }

    function defineProperties(self) {
        self._value = null;
        Element.defineProperty(self, 'value', {
            get: function () { return this._value; }.bind(self),
            set: function (value) {
                this._value = value;
                setFamilyKey(this);
            }.bind(self)
        });
    }

    function setFamilyKey(self) {
        if (!self.value) {
            return;
        }
        self.querySelector('.familykey').textContent = self.value['familykey'];
    }

    function setEntityKey(self) {
        if (!self.value) {
            return;
        }
        self.querySelector('.entitykey').textContent = self.value['entitykey'];
    }

    function createAssocPages(self) {
        var assocPageTitle, assocPageTitleText, selector, firstChild, assocPagesNull;
        selector = $(self).find('.assoc-page-placeholder')[0];
        firstChild = document.createElement('div');
        firstChild.className = 'assoc-pages';
        selector.appendChild(firstChild);
        assocPageTitle = document.createElement('h1');
        assocPageTitle.className = 'assoc-page-title-box';
        firstChild.appendChild(assocPageTitle);
        assocPageTitleText = document.createTextNode(self.translator.translate('ASSOCIATED_PAGES_TITLE'));
        assocPageTitle.appendChild(assocPageTitleText);
        self.initAssociatedPages(self, selector.firstElementChild, self.familykey);
    }

    function populateAssocPagesData(assocPages, self) {
        
        var assocPagesModels = [];
        self.dataKeys = {};
        for (var i = 0; i < assocPages.length; i++) {
            var assocPageModel = new AssocPageModel(assocPages[i]);
            assocPagesModels.push(assocPageModel);
            self.dataKeys[assocPageModel.hyperLinkKey] = assocPageModel.children;

            if (assocPageModel.children.length) {
                formDataKeys(self,assocPageModel.children);
            }

        }
        self.data = assocPagesModels;
    }


    function formDataKeys(self,assocPages){
        for (var i = 0; i < assocPages.length; i++) {
            var assocPageModel = assocPages[i];
            self.dataKeys[assocPageModel.hyperLinkKey] = assocPageModel.children;
            if (assocPageModel.children.length) {
                formDataKeys(self, assocPageModel.children);
            }
        }
    }

    function selectedElementNavigateUrl(self, url) {
        if (url) {
            var isMacroURL = false;
            if (url.indexOf('webmacros/macrorunner') > -1 || url.indexOf('!') === 0) {
                isMacroURL = true;
            }
            if (url.charAt(0) === '#' || url.charAt(0) === '!') {
                //Internal url

                //For existing URLs
                if (/\{[0-9]\}/.test(url)) {
                    url = url.replace(/\{[0-9]\}/, self.entitykey); //Replacing first ocurrence {1} with entitykey
                    url = url.replace(/\{[0-9]\}/, self.familykey); //Replacing second ocurrence {2} with familykey

                    if (isMacroURL) {
                        url = url.substring(1);
                        self.navigate.raise(url, { isActionRoute: true });
                    }
                    else {
                        self.navigate.raise(url, { tab: true });
                    }
                }

                //Replacing Named parameters for Entity Key and Family Key
                if (/\[ENTY_KEY\]/.test(url) || /\[enty_key\]/.test(url) || /\[FMLY_KEY\]/.test(url) || /\[fmly_key\]/.test(url)) {
                    url = url.replace('[ENTY_KEY]', self.entitykey);
                    url = url.replace('[FMLY_KEY]', self.familykey);
                    url = url.replace('[enty_key]', self.entitykey);
                    url = url.replace('[fmly_key]', self.familykey);
                }

                //For sending field values
                if (/\[([A-Z]|[a-z]|[0-9]|\_)*\]/.test(url)) {
                    var fieldIdArr = /\[([A-Z]|[a-z]|[0-9]|\_)*\]/g.exec(url);
                    var tempField = fieldIdArr[0];
                    var fieldId = tempField.slice(1, tempField.length - 1);
                    self.associatedPagesService.getDataSheetDetails(self.entitykey).done(function (response) {
                        for (var i = 0; i < response.fields.length; i++) {
                            if (response.fields[i].id.toLowerCase() === fieldId.toLowerCase()) {
                                url = url.replace(tempField, response.fields[i].dbValue);
                                fieldIdArr = /\[([A-Z]|[a-z]|[0-9]|\_)*\]/g.exec(url);
                                if (fieldIdArr !== null) {
                                    tempField = fieldIdArr[0];
                                    fieldId = tempField.slice(1, tempField.length - 1);
                                    i = -1;
                                    continue;
                                }
                            }
                        }
                        if (isMacroURL) {
                            url = url.substring(1);
                            self.navigate.raise(url, { isActionRoute: true });
                        }
                        else {
                            self.navigate.raise(url, { tab: true });
                        }
                    }).fail(function (err) {
                        console.error(err);
                    });
                }
                else {
                    if (isMacroURL) {
                        url = url.substring(1);
                        self.navigate.raise(url, { isActionRoute: true });
                    }
                    else {
                        self.navigate.raise(url, { tab: true });
                    }
                }
            }
            else {
                // External url
                window.open(url);
            }
        }
    }

    document.registerElement('mi-associated-pages', { prototype: proto });

    return proto;
});