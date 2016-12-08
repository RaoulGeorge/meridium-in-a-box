define(function (require) {
    'use strict';

    var $ = require('jquery');


    var view = require('text!./template.html');

    require('ui/elements/list-group/view-model');

    var ColumnViewModel = {};
    ColumnViewModel.prototype = Object.create(HTMLElement.prototype);

    ColumnViewModel.prototype.createdCallback = function () {
        this.element = this;

        var title, listgroup, desc, key,
            self = this;

        $(this.element).empty();
        this.innerHTML = view;

        title = $(this.element).attr('title');
        desc = $(this.element).attr('description');
        key = $(this.element).attr('key');

        if (title) {
            $(this.element).find('section.title').attr('title', title);
            $(this.element).find('section.title span').text(title);
        }

        if (desc) {
            $(this.element).find('mi-list-group').attr('description', desc);
        }

        if (key) {
            $(this.element).find('mi-list-group').attr('key', key);
        }

        listgroup = $(this.element).find('mi-list-group')[0];

        Object.defineProperty(this, 'value', {
            get: function () { return listgroup.value; }.bind(this),
            set: function (v) {
                listgroup.value = v;
            }.bind(this)
        });
        Object.defineProperty(this, 'loader', {
            get: function () { return listgroup.loader; }.bind(this),
            set: function (value) {
                if (listgroup.loader !== value) {
                    listgroup.loader = value;
                }
            }.bind(this)
        });

        $(listgroup).on('change', function () {
            $(self.element).trigger('change', listgroup.value);
            var desc, selection;

            desc = $(self.element).attr('description');
            selection = '';

            if (listgroup.value && typeof listgroup.value[desc] === 'function') {
                selection = listgroup.value[desc].call(listgroup.value);
            } else if (listgroup.value && listgroup.value[desc]) {
                selection = listgroup.value[desc];
            }
        });
    };

    ColumnViewModel.prototype.attachedCallback = function () {

    };

    ColumnViewModel.prototype.detachedCallback = function () {

    };

    ColumnViewModel.prototype.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'description') {
            $(this.element).find('mi-list-group').attr('description', newVal);
        }
    };

    ColumnViewModel.prototype.reload = function () {
        var listgroup = $(this.element).find('mi-list-group')[0];
        listgroup.reload.call(listgroup);
    };

    document.registerElement('mi-column', { prototype: ColumnViewModel.prototype });

    return ColumnViewModel;
});