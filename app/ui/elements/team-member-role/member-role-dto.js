define(function (require) {
    "use strict";
    var convert = require('system/lang/converter'),
        //RoleDTO = require('ui/elements/team-member-role/role-dto'),
        ApplicationContext = require('application/application-context');

    function MemberDTO(data) {
        data = data || {};
        this.id = convert.toString(data.id);
        this.key = convert.toString(data.key);
        this.firstName = convert.toString(data.firstName);
        this.lastName = convert.toString(data.lastName);
        this.jobTitle = convert.toString(data.jobTitle);
        this.contentGuid = convert.toString(data.contentGuid);
        this.email = convert.toString(data.email);
        this.phoneNumber = convert.toString(data.phoneNumber);
        this.hasPhoto = convert.toString(data.hasPhoto);
        this.photoURL = convert.toString(data.photoURL);
        this.areaOfResponsibility = convert.toString(data.areaOfResponsibility);
        this.facility = convert.toString(data.facility);
        //this.roles = RoleDTO.fromDataCollection(data.roles);
    }

    MemberDTO.fromDataCollection = function fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }
        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[i] = new MemberDTO(dataCollection[i]);
        }
        return dtos;
    };

    MemberDTO.prototype.PopulateHTML = function MemberDTO_PopulateHTML() {
        var descHTML = '';
        descHTML += '<section class="content block-group"  data-key="' + this.key + '">';
        descHTML += '<div class="block col-10">';
        if (this.hasPhoto && this.photoURL && this.photoURL.length > 0) {
            //var url = 'api/mibin/image?sessionId=' + ApplicationContext.session.id + '&key=' + this.key;
            descHTML += '<img id="thumbnailPhoto" class="thumbnailPhoto" src="' + this.photoURL + '"/><br />';
            //descHTML += '<a href="#team/member/edit?userKey=" ' + this.key.toString() + 'class="user-anchor">';
            descHTML += this.id.toString(); + '</a><br />';
        }
        descHTML += '</div>';
        descHTML += '<div class="block col-30"><b>';
        if (this.firstName) {
            descHTML += this.firstName + ', ';
        }
        descHTML += this.lastName + '</b>';
        if (this.jobTitle) {
            descHTML += '<div>' + this.jobTitle.toString() + '</div>';
        }
        if (this.email) {
            descHTML += '<br />' + this.email.toString();
        }
        if (this.phoneNumber) {
            descHTML += '<br />' + this.phoneNumber.toString();
        }
        descHTML += '</div>';
        descHTML += '</section>';
        return descHTML;
    };

    function toIntegerArray(dataCollection) {
        var i, array = [];
        for (i = 0; i < dataCollection.length; i++) {
            array[i] = convert.toInteger(dataCollection[i][0]);
        }
        return array;
    }

    return MemberDTO;
});