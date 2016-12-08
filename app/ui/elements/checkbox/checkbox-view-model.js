define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./checkbox-template.html'),
        ko = require('knockout');

    ko.bindingHandlers.miCheckboxProperty = {
        createNodes: function (rootElement, options) {

            //append templates
            if (!document.getElementById('mi-checkbox-tmpl')) {
                document.body.insertAdjacentHTML('beforeend', view);
            }

            //apply first binding
            ko.applyBindingsToNode(rootElement, { template: { name: 'mi-checkbox-tmpl' } }, options);

        },
        init: function (element, valueAccessor) {

            var options = valueAccessor();

            //extend options with search
            options.id = ko.bindingHandlers.miCheckboxProperty.getGuid();
            options.textClick = function miCheckboxProperty_textClick(obj, ev) {
                if (this.disable) {
                    return false;
                }

                if (typeof (this.checked) === 'function') {
                    this.checked(!this.checked());
                } else if (typeof (this.checked) === 'boolean') {
                    $(ev.target).parent().find('input').prop("checked", !this.checked);
                    this.checked=!this.checked;
                }
            };
                        
            ko.bindingHandlers.miCheckboxProperty.createNodes(element, options);
                     

            //let this handler control its descendants. 
            return { controlsDescendantBindings: true };
        },
        getGuid: function miCheckboxProperty_getGuid() {
            return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                    this.s4() + '-' + this.s4() + this.s4() + this.s4();
        },
        s4: function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
        },
        update: function (element, valueAccessor) {
            var propertyValue;
            var input = $(element).find('input[type="checkbox"]');
            _.each(valueAccessor(), function (binding, propertyName) {
                propertyValue = ko.unwrap(binding);

                if (propertyName === 'disable') {
                    input.prop('disabled', propertyValue);
                }
                else if (propertyName === 'checked') {
                    if (propertyValue === true || propertyValue === false) {
                        input.prop('checked', propertyValue);
                    }
                }
                else if (propertyName === 'text') {
                    $(element).find('.chkbox-text').html(propertyValue);

                }
            });
        }
    };


    var miCheckboxProto = Object.create(HTMLElement.prototype);

    document.registerElement('mi-checkbox', {
        prototype: miCheckboxProto
    });


});