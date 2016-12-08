define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    var view = require('text!./template.html');

    require('ui/elements/column/view-model');

    var ColumnGroupViewModel = {};
    ColumnGroupViewModel.prototype = Object.create(HTMLElement.prototype);

    ColumnGroupViewModel.prototype.createdCallback = function () {
        this.element = this;

        var columns,
            self = this;

        columns = this.innerHTML;
        $(this.element).empty();
        this.innerHTML = view;
        this.getElementsByClassName('columns-view')[0].insertAdjacentHTML('beforeend', columns);
        
        this.numberOfColumns = $(self.element).find('mi-column').length,
        $(this.element).find('i.toggle-switch').on('click', toggle.bind(null, this));
        setColumnWidth(self);
    };

    ColumnGroupViewModel.prototype.attachedCallback = function () {

    };

    ColumnGroupViewModel.prototype.detachedCallback = function () {

    };

    ColumnGroupViewModel.prototype.attributeChangedCallback = function (/* attrName, oldVal, newVal */) {

    };

    ColumnGroupViewModel.prototype.reload = function () {

    };

    function setColumnWidth(self) {
        var width = (100 / self.numberOfColumns) + '%';

        _.defer(function () { $('mi-column').width(width); });
    }


    function toggle(/* self */) {
        if ($('i.toggle-switch').hasClass('icon-double-arrow-up')) {
            $('section.columns-container').hide();
            $('section.columns-toggle i').removeClass('icon-double-arrow-up');
            $('section.columns-toggle i').addClass('icon-arrow-down');
        } else {
            $('section.columns-container').show();
            $('section.columns-toggle i').addClass('icon-double-arrow-up');
            $('section.columns-toggle i').removeClass('icon-arrow-down');
        }
    }

    document.registerElement('mi-column-group', { prototype: ColumnGroupViewModel.prototype });

    return ColumnGroupViewModel;
});