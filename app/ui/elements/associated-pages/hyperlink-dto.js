define(function () {
    'use strict';
    function HyperlinkDTO(data) {
        this.hyperLinkKey = data.hyperLinkKey;
        this.familyKey = data.familyKey;
        this.url = data.url;
        this.sequence = data.sequence;
        this.defaultText = data.defaultText;
        this.parentMenuKey = data.parentMenuKey;
        this.condition = data.condition;
        this.isDefaultMenu = data.isDefaultMenu;
        this.displayText = data.displayText;
        this.environment = data.environment;
        this.children = mapChildren(data.children);
        this.hasChildren = null;

        if (!data.url) {
            this.hasChildren = true;
        }

        if (data.defaultText === "-") {
            this.hasChildren = false;
        }
    }

    function mapChildren(children) {
        var links = [];
        for (var i = 0; i < children.length; i++) {
            links.push(new HyperlinkDTO(children[i]));
        }
        return links;
    }

    return HyperlinkDTO;

});