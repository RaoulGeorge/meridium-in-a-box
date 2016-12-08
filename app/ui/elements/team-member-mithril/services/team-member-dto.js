define(function () {
    'use strict';

    var m = require('mithril'),
        convert = require('system/lang/converter');

    function TeamMemberDTO(data) {
        data = data || {};
        this.id = convert.toString(data.id);
        this.entityKey = convert.toString(data.key);
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
    }

    TeamMemberDTO.fromDataCollection = function MemberDTO_fromDataCollection(dataCollection) {
        if (dataCollection === undefined) {
            return undefined;
        }

        var i, dtos = [];
        for (i = 0; i < dataCollection.length; i++) {
            dtos[dtos.length] = new TeamMemberDTO(dataCollection[i]);
        }
        return dtos;
    };

    TeamMemberDTO.prototype.PopulateHTML = function TeamMemberDTO_PopulateHTML() {
        var descHTML = '';
        descHTML += '<section class="content block-group"  data-key="' + this.entityKey + '">';
        descHTML += '<div class="block col-10">';
        if (this.hasPhoto && this.photoURL && this.photoURL.length > 0) {
            descHTML += '<img id="thumbnailPhoto" class="thumbnailPhoto" src="' + this.photoURL + '"/><br />';
            descHTML += this.id.toString(); + '</a><br />';
        }
        descHTML += '</div>';
        descHTML += '<div class="block col-30"><b>';
        descHTML += this.lastName;
        if (this.firstName) {
            descHTML += ', ' + this.firstName;
        }
        descHTML += '</b>';
        if (this.jobTitle) {
            descHTML += '<div>' + this.jobTitle.toString() + '</div>';
        }
        if (this.email) {
            descHTML += '<div>' + this.email.toString() + '</div>';
        }
        if (this.phoneNumber) {
            descHTML += '<div>' + this.phoneNumber.toString() + '</div>';
        }
        descHTML += '</div>';
        descHTML += '</section>';
        return m.trust(descHTML);
    };

    TeamMemberDTO.fromMembersContextDTO = function fromDataCollection(dto) {
        return new TeamMemberDTO({ entityKey: dto.entityKey, id: dto.description });
    };

    function toIntegerArray(dataCollection) {
        var i, array = [];
        for (i = 0; i < dataCollection.length; i++) {
            array[i] = convert.toInteger(dataCollection[i][0]);
        }
        return array;
    }

    TeamMemberDTO.fromJson = function (json) {
        var item = new TeamMemberDTO();
        item.description = json.description || '';
        item.isComplete = json.isComplete || false;
        return item;
    };

    TeamMemberDTO.prototype.toJson = function () {
        return {
            description: this.description,
            isComplete: this.isComplete
        };
    };

    return TeamMemberDTO;
});