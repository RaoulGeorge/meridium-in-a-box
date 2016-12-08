define(function (require) {
    'use strict';

    var ko = require('knockout'),            
    Translator = require('system/globalization/translator');
    require('knockouteditables');
    require('knockoutvalidation');
    require('system/lang/object');
    
    function PrivilegesModel() {
        var self = this;

        //self.translator = Object.resolve(Translator);
        self.key = ko.observable();
        self.name = ko.observable();
        self.isGroupPrivilege = ko.observable();
        self.canView = ko.observable(false);
        self.canUpdate = ko.observable(false);
        self.canDelete = ko.observable(false);
        self.isSuperUser = ko.observable(false);
        
    }

    return PrivilegesModel;
});