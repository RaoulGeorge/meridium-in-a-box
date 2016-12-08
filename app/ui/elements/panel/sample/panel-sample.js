define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ApplicationEvents = require('application/application-events'),
        tabonedata = require('text!./tabonedata.json'),
        tabtwodata = require('text!./tabtwodata.json');

    require('ui/elements/panel/view-model');
    require('ui/elements/tool-bar/view-model');
    require('ui/elements/list-group/view-model');

    function PanelSampleViewModel(applicationEvents) {
        this.titleChanged = applicationEvents.titleChanged;
        this.listone = JSON.parse(tabonedata);
        this.listtwo = JSON.parse(tabtwodata);
        this.panel = null;
        this.searchbox = null;
    }

    PanelSampleViewModel.dependsOn = [ApplicationEvents];

    PanelSampleViewModel.prototype.open = function panelSampleViewModel_open() {
        this.titleChanged.raise('Panel Sample', this);
    };

    PanelSampleViewModel.prototype.attach = function panelSampleViewModel_attach(region) {
        region.attach($(
            '<div class="panel-sample-screen" style="height:100%">'+
            '<mi-panel title="Title" '+
                        ' subtitle-header="subtitle header" ' +
                        ' subtitle-footer="subtitle footer" ' +
                        ' description="groupid">' +
                '<section class="tabs">'+
                    '<li data-loader="loaderOne"><a>Tab One</a></li>'+
                    '<li data-loader="loaderTwo"><a>Tab Two</a></li>'+
                '</section>'+
                '<section class="toolbar">'+
                    '<button class="btn btn-default btn-icon">'+
                        '<i class="icon-plus"></i>'+
                    '</button>'+
                    '<button class="btn btn-default btn-icon">'+
                        '<i class="icon-collection-filter"></i>'+
                    '</button>'+
                '</section>'+
            '</mi-panel>'+
            '</div>'));

        this.panel = region.$element.find('mi-panel')[0];
        this.panel.loader = this.loaderOne.bind(this);

        $(this.panel).find('section.tabs li').on('click', this.tabClicked.bind(this));
        this.panel.searchCB(this.panel.reload.bind(this.panel));
        this.panel.setDelay(0);

        this.searchbox = $(this.panel).find('mi-searchbox')[0];
    };

    PanelSampleViewModel.prototype.tabClicked = function panelSampleViewModel_tabClicked(event) {
        var tab, loader;

        tab = $(event.target).closest('li');
        loader = tab.data('loader');

        this.panel.loader = this[loader].bind(this);
    };

    PanelSampleViewModel.prototype.loaderOne = function panelSampleViewModel_loaderOne() {
        var dfd = $.Deferred(),
            searchterm,
            description,
            filtered;

        searchterm = '';
        if (this.searchbox && this.searchbox.val && this.searchbox.val()) {
            searchterm = this.searchbox.val();
        }

        description = $(this.panel).attr('description');

        filtered = this.listone.filter(searchFilter.bind(null, this, searchterm, description));

        dfd.resolve(filtered);
        return dfd.promise();
    };

    PanelSampleViewModel.prototype.loaderTwo = function panelSampleViewModel_loaderTwo() {
        var dfd = $.Deferred(),
            searchterm,
            description,
            filtered;

        searchterm = '';
        if (this.searchbox && this.searchbox.val && this.searchbox.val()) {
            searchterm = this.searchbox.val();
        }

        description = $(this.panel).attr('description');

        filtered = this.listtwo.filter(searchFilter.bind(null, this, searchterm, description));

        dfd.resolve(filtered);
        return dfd.promise();
    };

    function searchFilter (self, searchterm, description, element) {

        var str;

        if (typeof element[description] === 'function') {
            str = element[description].call();
        } else {
            str = element[description];
        }

        return (str.toLowerCase().indexOf(searchterm) !== -1);
    }

    return PanelSampleViewModel;
});