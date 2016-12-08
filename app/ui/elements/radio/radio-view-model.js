define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var view = require('text!./radio-template.html'),
        ko = require('knockout');

    ko.bindingHandlers.miRadioProperty = {
        createNodes: function (rootElement, options) {

            //append templates
            if (!document.getElementById('mi-radio-tmpl')) {
                document.body.insertAdjacentHTML('beforeend', view);
            }

            //apply first binding
            ko.applyBindingsToNode(rootElement, { template: { name: 'mi-radio-tmpl' } }, options);

        },
        init: function (element, valueAccessor) {

            var options = valueAccessor();

            //extend options with search
            options.id = ko.bindingHandlers.miRadioProperty.getGuid();
            options.textClick = function miRadioProperty_textClick(obj, ev) {
                if (ko.unwrap(this.disable)) {
                    return false;
                }

                $(ev.target).parent().find('input').prop("checked", true);
                $(ev.target).parent().find('input').trigger("change");
                if (typeof (this.checked) === "function") {
                    this.checked(this.value);
                }
            };
            ko.bindingHandlers.miRadioProperty.createNodes(element, options);

            //let this handler control its descendants. 
            return { controlsDescendantBindings: true };
        },
        getGuid: function miRadioProperty_getGuid() {
            return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                    this.s4() + '-' + this.s4() + this.s4() + this.s4();
        },
        s4: function s4() {
            //return Math.floor((1 + Math.random()) * 0x10000)
            //            .toString(16)
            //            .substring(1);

           
                var text = "";

                var charset = "abcdefghijklmnopqrstuvwxyz";

                for (var i = 0; i < 4; i++) {
                    text += charset.charAt(Math.floor(Math.random() * charset.length));
                }
                return text;
            
        },
        update: function (element, valueAccessor) {
            var propertyValue;
            _.each(valueAccessor(), function (binding, propertyName) {
                propertyValue = ko.unwrap(binding);
                //element[propertyName] = propertyValue;
                if (propertyName === 'disable') {
                    $(element).find('input[type="radio"]').prop('disabled', propertyValue);
                   
                }
                else if (propertyName === 'text') {
                    $(element).find('.radio-text').html(propertyValue);

                }
            });
        }
    };


    var miRadioProto = Object.create(HTMLElement.prototype);

    document.registerElement('mi-radio', {
        prototype: miRadioProto
    });


});