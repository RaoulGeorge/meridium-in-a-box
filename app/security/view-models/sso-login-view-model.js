define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');

    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        DatasourceService = require('security/services/datasource-service'),
        SecurityService = require('security/services/security-service'),
        AjaxClient = require('system/http/ajax-client'),
        ApplicationContext = require('application/application-context'),
        ApplicationEvents = require('application/application-events'),
        MessageBox = require('system/ui/message-box'),
        Translator = require('system/globalization/translator'),
        Formatter = require('system/text/formatter'),
        LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        view = require('text!../views/sso-login.html'),
        MERIDIUM_SESSION = 'meridium-session',
        MERIDIUM_CULTURE = 'meridium-culture',
        MERIDIUM_USER_NAME = 'meridium-user-name',
        MERIDIUM_DATA_SOURCE = 'meridium-data-source';

    function SSOLoginViewModel(datasourceService, securityService,  translator, formatter) {
        base.call(this, view);
        this.datasourceService = datasourceService;
        this.securityService = securityService;
        this.translator = translator;
        this.formatter = formatter;
        this.applicationEvents = Object.resolve(ApplicationEvents);
        this.datasources = ko.observableArray();
        this.datasource = ko.observable();
        this.loginDeferred = null;
        this.loginCaption = ko.observable('Login');
        this.apiServer = ko.observable(location.host);
        this.extraURL = ko.observable('');
        this.showLogonForm = ko.observable(true);
        this.showLogoutForm = ko.observable(false);
        this.host = ko.observable('');
    }

    var base = Object.inherit(KnockoutViewModel, SSOLoginViewModel);
    SSOLoginViewModel.dependsOn = [DatasourceService, SecurityService, Translator, Formatter];

   
    SSOLoginViewModel.prototype.activate = function securityViewModel_activate(action) {
        this.applicationEvents.signout.add(signout, this,this);
        var sessionItem = localStorage.getItem(MERIDIUM_SESSION),
            self = this;
        this.extraURL(parseURL(window.location.href));
        createCookie("meridium_extraURL", this.extraURL().hash, 10);
        readCookie("meridium_extraURL");
        this.loginDeferred = new $.Deferred();
        loadSSO(this);
        return this.loginDeferred.promise();
    };


    function signout (self, e) {
        self.showLogonForm(false);
        self.showLogoutForm(true);
    }

    function parseURL(url) {
        var parser = document.createElement('a'),
            searchObject = {},
            queries, split, i;
        // Let the browser do the work
        parser.href = url;
        // Convert query string to object
        queries = parser.search.replace(/^\?/, '').split('&');
        for( i = 0; i < queries.length; i++ ) {
            split = queries[i].split('=');
            searchObject[split[0]] = split[1];
        }
        return {
            protocol: parser.protocol,
            host: parser.host,
            hostname: parser.hostname,
            port: parser.port,
            pathname: parser.pathname,
            search: parser.search,
            searchObject: searchObject,
            hash: parser.hash
        };
    }

    SSOLoginViewModel.prototype.load =
        function ssoLogingViewModel_load(routeArgs) {
            var dfd = new $.Deferred();
            return dfd.promise();
        };

    SSOLoginViewModel.prototype.login = function securityViewModel_login() {
        createCookie("meridium_datasource", this.datasource().id, 10);
        readCookie("meridium_datasource");
        this.securityService.ssologin(this.host().idpUrl)
            .done(ssologinURL_done.bind(null, this))
            .fail(ssologinURL_fail.bind(null, {}));
    };


    function loadSSO(self) {
        AjaxClient.setServer(self.apiServer());
        self.datasourceService.getHost(self.apiServer())
           .done(getHost_done.bind(null, self))
           .fail(getHost_fail);
    }

    function showLoginInput_read(self) {
        return !!self.userId();
    }

    function getHost_done(self, host) {
        self.host(host);
        if (self.host().ssoAuthEnabled) {
            self.datasourceService.getFilteredDatasources(self.apiServer())
             .done(getDatasources_done.bind(null, self))
             .fail(getDatasources_fail);
        } else {
            window.location = "sso-no-auth.html";
        }
    }

    function getHost_fail(response) {
        LogManager.pushContext('getHost_fail');
        MessageBox.showOk('Unable to retrieve host information');
        logger.error('Error loading host information', response);
        LogManager.popContext();
        window.location = "sso-no-auth.html";
    }

    function getDatasources_done(self, datasources) {
        var defaultSource = localStorage.getItem(MERIDIUM_DATA_SOURCE),
                    idx;

        self.datasources(datasources);

        if (defaultSource) {
            for (idx = 0; idx < datasources.length; idx++) {
                if (datasources[idx].id === defaultSource) {
                    self.datasource(datasources[idx]);
                    continue;
                }
            }
        }

        if (self.datasources().length === 1) {
            createCookie("meridium_datasource", datasources[0].id, 10);
            readCookie("meridium_datasource");
            self.securityService.ssologin(self.host().idpUrl)
                .done(ssologinURL_done.bind(null, self))
                .fail(ssologinURL_fail.bind(null, {}));
        }
    }

    function createCookie(name, value, days) {
        var expires;

        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        } else {
            expires = "";
        }
        document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
    }

    function readCookie(name) {
        var nameEQ = encodeURIComponent(name) + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name, "", -1);
    }

    function ssologinURL_done(self, idpUrl) {
        window.location = idpUrl;
    }

    function getDatasources_fail(response) {
        LogManager.pushContext('getDatasources_fail');
        MessageBox.showOk('Unable to retrieve datasources');
        logger.error('Error loading datasources', response);
        LogManager.popContext();
    }

    function ssologinURL_fail(response, loginInfo) {
        console.log(response);
        console.log(loginInfo);
       // window.location = "index.html";
    }


    return SSOLoginViewModel;
});

