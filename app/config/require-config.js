(function () {
    'use strict';
    window.require = {
        urlArgs: 'v=1.0',
        waitSeconds: 30,
        paths: {
            'ace': '../lib/ace/ace',
            'bowser':'../lib/bowser',
            'backbone': '../lib/backbone-1.1.2',
            'bootstrap': '../lib/bootstrap-3.1.1',
            'collapse': '../lib/collapse',
            'dropdown': '../lib/dropdown',
            'enquire': '../lib/enquire-2.1.2',
            'globalize': '../lib/globalize',
            'hammer': '../lib/hammer.min',
            'handlebars': '../lib/handlebars-1.3.0',
            'highcharts': '../lib/highstock-2.1.8/highstock',
            'highcharts-more': '../lib/highstock-2.1.8/highcharts-more',
            'highcharts-funnel': '../lib/highstock-2.1.8/funnel',
            'highcharts-drilldown': '../lib/highstock-2.1.8/drilldown',
            'highcharts-solid-guage': '../lib/highstock-2.1.8/solid-gauge',
            'highcharts-3d': '../lib/highstock-2.1.8/highcharts-3d',
            'highcharts-rounded-corners': '../lib/highstock-2.1.8/rounded-corners',
            'highcharts-exporting': '../lib/highstock-2.1.8/exporting',
            'highcharts-boost': '../lib/highstock-2.1.8/boost',
            'highcharts-heatmap': '../lib/highstock-2.1.8/heatmap',
            'iscroll': '../lib/iscroll',
            'interact': '../lib/interact-1.0.25',
            'jed': '../lib/jed-0.5.0',
            'jquery': '../lib/jquery-2.1.1',
            'jquery-deparam': '../lib/jquery-deparam',
            'jquery-ui': '../lib/legacy/jquery-ui-1.9.1',
            'jquery-blockUI': '../lib/jquery.blockUI',
            'jSignalR': '../lib/jquery.signalR-2.1.0',
            'signalr.hubs': '../app/signalr/hubs',
            'knockout': '../lib/knockout-3.4.0',
            'knockoutvalidation': '../lib/knockout.validation',
            'knockouteditables': '../lib/ko.editables',
            'komapping': '../lib/knockout.mapping',
            'kobindings': '../lib/knockout.custombindings',
            'kodelegated': '../lib/knockout.delegatedevents',
            'sortablejs': '../lib/sortable.min',
            'kosortable': '../lib/knockout-sortable',
            'moment': '../lib/moment-2.8.2',
            'moment-timezone': '../lib/moment-timezone-with-data-0.5.5',
            'text': '../lib/text',
            'indexedDBShim': '../lib/IndexedDBShim',
            'cache': '../lib/cache',
            'kinetic': '../lib/kinetic-v3.10.4',
            'canvg': '../lib/jointjs/canvg',
            'sort': '../lib/jquery.sortable.min',
            'noData': '../lib/highstock-2.1.8/no-data-to-display',
            'toastr': '../lib/toastr',
            'base64': '../lib/jointjs/base64',
            'datepicker': '../lib/legacy/jquery-ui-timepicker-addon',
            'shortcut': '../lib/shortcut-2.01.B',
            'platform': './platform',
            'datatable': '../lib/legacy/jquery.dataTables',
            'geometry': '../lib/jointjs/geometry',
            'vectorizer': '../lib/jointjs/vectorizer',
            'jointDiaCell': '../lib/jointjs/joint.dia.cell',
            'jointDiaElement': '../lib/jointjs/joint.dia.element',
            'jointDiaGraph': '../lib/jointjs/joint.dia.graph',
            'jointDiaLink': '../lib/jointjs/joint.dia.link',
            'jointDiaPaper': '../lib/jointjs/joint.dia.paper',
            'lodash': '../lib/lodash-2.2.1',
            'lodash-latest': '../lib/lodash-4.14.0',
            'jointJQuerySortElements': '../lib/jquery.sortElements',
            'jointShapesBasic': '../lib/jointjs/joint.shapes.basic',
            'jointShapesDevs': '../lib/jointjs/joint.shapes.devs',
            'jointUiStencil': '../lib/jointjs/joint.ui.stencil',
            'jointallclean': '../lib/jointjs/joint.all.clean',
            'jointuiselectionView': '../lib/jointjs/joint.ui.selectionView',
            'jointuipaperScroller': '../lib/jointjs/joint.ui.paperScroller',
            'keyboard': '../lib/jointjs/keyboard',
            'ElementInspector': '../lib/jointjs/ElementInspector',
            'jointuiclipboard': '../lib/jointjs/joint.ui.clipboard',
            'jointdiacommand': '../lib/jointjs/joint.dia.command',
            'jointdiavalidator': '../lib/jointjs/joint.dia.validator',
            'jointuihalo': '../lib/jointjs/joint.ui.halo',
            'LightLinkView': '../lib/LightLinkView',
            'jquery-mousewheel': '../lib/jquery-mousewheel',
            'DirectedGraph': '../lib/jointjs/joint.layout.DirectedGraph',
            'devExWebJS': '../lib/dx.webappjs',
            'pretty-print': '../lib/pretty-print',
            'FormatRaster': '../lib/jointjs/joint.format.raster',
            'FormatSvg': '../lib/jointjs/joint.format.svg',
            'Rgbcolor': '../lib/jointjs/rgbcolor',
            'Stackblur': '../lib/jointjs/StackBlur',
            'mi-assert': '../lib/mi-assert',
            'uuid': '../lib/uuid',
            'spectrum': '../lib/spectrum',
            'later': '../lib/later',
            'mithril': '../lib/mithril-0.2.1-pre',
            'localforage': '../lib/localforage-1.2.2/localforage',
            'asyncStorage': '../lib/localforage-1.2.2/drivers/indexeddb',
            'localStorageWrapper': '../lib/localforage-1.2.2/drivers/localstorage',
            'webSQLStorage': '../lib/localforage-1.2.2/drivers/websql',
            'detect':  '../lib/detect',
            'scopedQuerySelector': '../lib/scopedQuerySelectorShim',
            'ramda': '../lib/ramda-0.22.1',
			'machina': '../lib/machina',
            'folktale-data': '../lib/folktale-data-1.0.0',
            'leaflet': '../lib/leaflet-0.7.7',
            'leaflet-providers': '../lib/leaflet-plugins/leaflet-extras/leaflet-providers',
            'google-map': '../lib/leaflet-plugins/leaflet-plugins-shramov/layer/tile/Google',
            'bing-map': '../lib/leaflet-plugins/leaflet-plugins-shramov/layer/tile/Bing',
            'bing-map-control': '../lib/leaflet-plugins/bing-map-control/bing-map-control',
            'leaflet-owm': '../lib/leaflet-plugins/leaflet-openweathermap/leaflet-openweathermap',
            'leaflet-esri': '../lib/leaflet-plugins/leaflet-esri/leaflet-esri',
            'oboe': '../lib/oboe-2.1.1',
            'sjcl': '../lib/sjcl-1.0.4',
            'react': '../lib/fb/react-15.2.1',
            'react-dom': '../lib/fb/react-dom-15.2.1',
            'immutable': '../lib/fb/immutable-3.8.1',
            'bluebird': '../lib/bluebird-3.4.1',
            'angular':'../lib/angular',
            'angular-route':'../lib/angular-route'
        },
        shim: {
            'backbone': {
                deps: ['lodash', 'jquery'],
                exports: 'Backbone'
            },
            'bootstrap': {
                deps: ['jquery']
            },
            'globalize': { exports: 'Globalize' },
            'hammer': { exports: 'Hammer' },
            'handlebars': { exports: 'Handlebars' },
            'highcharts': { exports: 'Highcharts' },
            'highcharts-3d': { deps: ['highcharts'] },
            'highcharts-more': { deps: ['highcharts'] },
            'highcharts-funnel': { deps: ['highcharts'] },
            'highcharts-solid-guage': { deps: ['highcharts', 'highcharts-more'] },
            'highcharts-drilldown': { deps: ['highcharts'] },
            'highcharts-rounded-corners': { deps: ['highcharts'] },
            'highcharts-exporting': { deps: ['highcharts'] },
            'highcharts-boost': { deps: ['highcharts'] },
            'highcharts-heatmap': { deps: ['highcharts'] },
            'iscroll': { exports: 'iScroll' },
            'jquery': { exports: '$' },
            'jquery-ui': { deps: ['jquery'] },
            'lodash': { exports: '_' },
            'lodash-latest': { exports: '_' },
            'sort': {
                deps: ['jquery']
            },
            'noData': {
                deps: ['highcharts']
            },
            'cache': { exports: 'Cache' },
            'kinetic': { exports: 'Kinetic' },
            'toastr': { deps: ['jquery'] },
            'datepicker': { deps: ['jquery-ui'] },
            'jSignalR': {
                deps: ['jquery'],
                exports: '$.connection'
            },
            'signalr.hubs': {
                deps: ['jSignalR']
            },
            jointJQuerySortElements: {
                deps: ['jquery']
            },
            vectorizer: {
                deps: ['lodash'],
                exports: 'V'
            },
            geometry: {
                exports: 'g'
            },
            keyboard: {
                exports: 'KeyboardJS'
            },
            ElementInspector: {
                deps: ['backbone'],
                exports: 'ElementInspector'
            },
            'jointallclean': {
                deps: ['geometry', 'vectorizer', 'jquery', 'lodash', 'backbone', '../lib/jointjs/get-transform-to-element-polyfill'],
                exports: 'joint',
                init: function (geometry, vectorizer) {
                    this.g = geometry;
                    this.V = vectorizer;
                }
            },
            jointDiaCell: {
                deps: ['jointallclean']
            },
            DirectedGraph: {
                deps: ['jointallclean']
            },
            jointDiaElement: {
                deps: ['jointallclean']
            },
            jointDiaGraph: {
                deps: ['jointallclean']
            },
            jointDiaLink: {
                deps: ['jointDiaCell', '../lib/jointjs/get-transform-to-element-polyfill']
            }, FormatRaster: {
                deps: ['jointDiaPaper', '../lib/jointjs/get-transform-to-element-polyfill']
            },
            FormatSvg: {
                deps: ['jointDiaPaper', '../lib/jointjs/get-transform-to-element-polyfill']
            },
            jointDiaPaper: {
                deps: ['vectorizer', 'jointDiaElement', 'jointDiaLink', '../lib/jointjs/get-transform-to-element-polyfill']
            },
            jointShapesBasic: {
                deps: ['jointDiaGraph', 'jointDiaPaper', '../lib/jointjs/get-transform-to-element-polyfill'],
                exports: 'joint'
            },
            jointShapesDevs: {
                deps: ['jointShapesBasic', '../lib/jointjs/get-transform-to-element-polyfill'],
                exports: 'joint'
            },
            jointUiStencil: {
                deps: ['jointallclean', 'jquery'],
                exports: 'joint'
            },
            jointuiselectionView: {
                deps: ['jointallclean'],
                exports: 'joint'
            },
            jointdiavalidator: {
                deps: ['jointallclean'],
                exports: 'joint'
            },
            jointdiacommand: {
                deps: ['jointallclean'],
                exports: 'joint'
            },
            jointuipaperScroller:
            {
                deps: ['jointallclean'],
                exports: 'joint'
            },
            jointuihalo:
            {
                deps: ['jointallclean', 'handlebars'],
                exports: 'joint'
            },
            jointuiclipboard: {
                deps: ['jointallclean'],
                exports: 'joint'
            },
            later: {
                exports: 'later'
            },
            LightLinkView: {
                exports: 'LinkView'
            },
            shortcut: {
                exports: 'shortcut'
            },
            'pretty-print': {
                exports: 'prettyPrint'
            },
            spectrum: {
                deps: ['jquery'],
                exports: 'spectrum'
            },
            machina: {
                deps: ['lodash'],
                exports: 'machina'
            },
            leaflet: {
                deps: ['gis/meridium-leaflet-config'],
                exports: 'L'
            },
            'google-map':{
                deps:['leaflet'],
                exports: 'googleMap'
            },
            'bing-map':{
                deps:['leaflet'],
                exports: 'bingMap'
            },
            'bing-map-control':{
                deps:['leaflet'],
                exports: 'bing-map-control'
            },
            'leaflet-owm':{
                deps:['leaflet'],
                exports: 'leaflet-owm'
            },
            'leaflet-esri':{
                deps:['leaflet'],
                exports: 'leaflet-esri'
            },
            oboe: {
                exports: 'oboe'
            },
            sjcl: {
                exports: 'sjcl'
            },
            'angular': {
                deps:['bootstrap'],
                exports: 'angular'
            },
            'angular-route': {
              exports: 'ngRoute',
              deps: ['angular']
            } 
        },
        map: {
            '*': {
                'spa/ko': 'spa/knockout',
                'underscore': 'lodash'
            }
        }
    };
}());
