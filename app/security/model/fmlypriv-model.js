define(function (require) {
    'use strict';

    var ko = require('knockout');

    function FmlyPrivModel(dto) {
        var self = this;

        dto = dto || {};
        this.key = ko.observable(dto.key);
        this.userKey = ko.observable(dto.userKey);
        this.userDisplay = ko.observable(dto.userDisplay);
        this.groupKey = ko.observable(dto.groupKey);
        this.groupDisplay = ko.observable(dto.groupDisplay);
        this.familyKey = ko.observable(dto.familyKey);
        this.familyDisplay = ko.observable(dto.familyDisplay);
        this.privilege = ko.observable(dto.privilege);
        this.ins = ko.observable(dto.ins);
        this.vw = ko.observable(dto.vw);
        this.upd = ko.observable(dto.upd);
        this.del = ko.observable(dto.del);
        this.hash = ko.observable(dto.hash);
        this.isDeleted = ko.observable(dto.isDeleted);
        this.isDirty = ko.pureComputed(computeHash.bind(null, this));
        this.isSelected=ko.observable(false);
        this.type=ko.computed(function () {
            if (!self.userKey() || self.userKey()===null || self.userKey()==='0') {
                return "Group";
            }
            return "User";
        });
        this.name=ko.computed(function () {
            if (!self.userKey() || self.userKey()===null || self.userKey()==='0') {
                return self.groupDisplay();
            }
            return self.userDisplay();
        });

        this.displayName=function(currentFamily) {
            return this.familyDisplay().length===0?currentFamily:this.familyDisplay();
        };

        this.style=function (currentFamily) {
            if (currentFamily!==this.displayName(currentFamily)) {
                return "parentRow";
            }

            if (this.key()==='0') {
                return "success";
            }

            return "";
        };

        this.isEnabled=
            function (currentFamily) {
                if (currentFamily!==this.displayName(currentFamily)) {
                    return false;
                }
                if (this.isDeleted()) {
                    return false;
                }
                return true;
            };

        this.isParent=function(currentFamily) {
            if (currentFamily!==this.displayName(currentFamily)) {
                return true;
            }
            return false;
        };

        this.isGroup=function() {
            if (!self.userKey() || self.userKey()===null || self.userKey()==='0' || self.userKey()==="") {
                return true;
            }
            return false;
        };

        this.caption=function() {
            if (this.isGroup()) {
                return this.groupDisplay();
            }
            return this.userDisplay();
        };
    }

    function computeHash(self) {
        return self.hash() !== (self.ins() + self.vw() + self.upd() + self.del());
    }

    return FmlyPrivModel;
});