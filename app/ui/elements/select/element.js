define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');
    var jQuery = require('jquery');

    var ko = require('knockout'),
        Converter = require('system/lang/converter'),
        KnockoutManager = require('system/knockout/knockout-manager');
    require('system/knockout/bindings/halt-bindings');
    require('./mi-property');

    function register(name, ctor) {
        var prototype = Object.create(HTMLElement.prototype);

        prototype.createdCallback = function () {
            this.implementation = Object.resolve(ctor,this);
            this.implementation.element = this;
            Object.tryMethod(this.implementation, 'created');
        };

        prototype.attachedCallback = function () {
            if (this.implementation) {
                Object.tryMethod(this.implementation, 'attached');
            }
        };

        prototype.detachedCallback = function () {
            if (this.implementation) {
                Object.tryMethod(this.implementation, 'detached');
            }
        };

        prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
            Object.tryMethod(this.implementation, attrName.toLowerCase() + 'Changed', oldValue, newValue);
        };

        //document.registerElement(name, { prototype: prototype });
        Element.registerElement(name, { prototype: prototype });
    }

    var ViewModel = (function () {
        function ViewModel(view, preserveContext,appendAfterBindings) {
            this.kom = Object.resolve(KnockoutManager);
            this.properties = [];
            this.view = view;
            this.preserveContext = preserveContext || false;
            this.appendAfterBindings = appendAfterBindings || false;
            this.container = null;
            this.element = null;
            this.state = null;
        }

        ViewModel.prototype.created = function () {
            Object.tryMethod(this, 'beforeCreated');
            createdImpl(this);
            Object.tryMethod(this, 'afterCreated');
        };

        ViewModel.prototype.attached = function () {
            Object.tryMethod(this, 'beforeAttached');
            attachedImpl(this);
            Object.tryMethod(this, 'afterAttached');
        };

        ViewModel.prototype.detached = function () {
            Object.tryMethod(this, 'beforeDetached');
            detachedImpl(this);
            Object.tryMethod(this, 'afterDetached');
        };

        ViewModel.prototype.bindAttribute = function (attrName, defaultValue, subscription, canBounce) {
            //this[attrName] = this.kom.observable();
            var notifyDescendant = canBounce || false;
            this['data-' + attrName.toLowerCase() + 'Changed'] = function (oldValue, newValue) {
                //console.log('elem', attrName, newValue);
                var value = $(this.element).data(attrName.toLowerCase());
                if (this[attrName]) {
                    this[attrName](value);
                }
            }.bind(this);
            this.kom.subscribe(this[attrName], function (newValue) {
                if (!notifyDescendant) {
                    $(this.element).trigger('attributes.' + attrName + ':changed', [newValue]);
                }
            }, this);
            if (subscription) {
                this.kom.subscribe(this[attrName], subscription, this);
            }

            if (typeof $(this.element).attr("data-" + attrName.toLowerCase()) === 'undefined') {
                this.element.setAttribute("data-" + attrName.toLowerCase(), defaultValue);
            }
            else {
               this[attrName]($(this.element).data(attrName.toLowerCase()));
            }
        };

        ViewModel.prototype.bindProperty = function (propertyName, defaultValue, subscription,canBounce) {
            this[propertyName] = this.kom.observable();
            var notifyDescendant = canBounce || false;
            Object.defineProperty(this.element, propertyName, {
                get: function () { return this[propertyName](); }.bind(this),
                set: function (value) {
                    if (this[propertyName]) {
                        this[propertyName](value);
                    }
                   
                }.bind(this)
            });
            this.properties.push(propertyName);
            this.kom.subscribe(this[propertyName], function (newValue) {
                if (!notifyDescendant) {
                    $(this.element).trigger('properties.' + propertyName + ':changed', [newValue]);
                }
            }, this);

            if (subscription) {
                this.kom.subscribe(this[propertyName], subscription, this);
            }
            this[propertyName](Object.defaultValue(this.element[propertyName], defaultValue));
        };

        ViewModel.prototype.bindArrayProperty = function (propertyName, defaultValue, subscription, canBounce) {
            this[propertyName] = this.kom.observableArray();
            var notifyDescendant = canBounce || false;
            Object.defineProperty(this.element, propertyName, {
                get: function () { return this[propertyName](); }.bind(this),
                set: function (value) { this[propertyName](value); }.bind(this)
            });
            this.properties.push(propertyName);
            this.kom.subscribe(this[propertyName], function (newValue) {
                if (!notifyDescendant) {
                    $(this.element).trigger('properties.' + propertyName + ':changed', [newValue]);
                }
            }, this);

            if (subscription) {
                this.kom.subscribe(this[propertyName], subscription, this);
            }
            this[propertyName](Object.defaultValue(this.element[propertyName], defaultValue));
        };

        function createdImpl(self) {
            self.state = 'created';
            var container = document.createElement('div'),
                $container = $(container),
                $view = $(self.view);
            if (!self.preserveContext) {
                $container.attr('data-bind', 'halt-bindings');
            }

            $container.append($view);
            if (!self.appendAfterBindings) {
                $(self.element).empty().append($container);
            }
            self.container = container;
        }

        function attachedImpl(self) {
            if (self.state === 'detached') {
                var container = document.createElement('div'),
                $container = $(container),
                $view = $(self.view);
                if (!self.preserveContext) {
                    $container.attr('data-bind', 'halt-bindings');
                }

                $container.append($view);
                if (!self.appendAfterBindings) {
                    $(self.element).empty().append($container);
                }
                self.container = container;
            }

            self.state = 'attached';
            ko.applyBindingsToDescendants(self, self.container);

            if (self.appendAfterBindings) {
                $(self.element).empty().append(self.container);
            }
        }

        function detachedImpl(self) {
            self.state = 'detached';
            ko.cleanNode(self.container);
            $(self.container).remove();
            //self.kom.dispose();
            //self.properties.forEach(deleteProperty.bind(null, self));
        }

        function deleteProperty(self, property) {
            delete self[property];
        }

        return ViewModel;
    }());

    function upgrade(element, container) {
        if (!window.CustomElements) { return; }
        if (window.CustomElements.useNative) { return; }

        if (_.isArray(element)) {
            upgradeAll(element, container);
        } else if (_.isString(element)) {
            upgradeSelector(element, container);
        } else if (element instanceof jQuery) {
            upgradeJQueryObject(element);
        } else {
            upgradeDomElement(element);
        }
    }

    function upgradeAll(elements, container) {
        for (var i = 0; i !== elements.length; i++) {
            upgrade(elements[i], container);
        }
    }

    function upgradeSelector(selector, container) {
        if (container && container.$element) {
            container = container.$element;
        }
        upgradeJQueryObject($(selector, container));
    }

    function upgradeJQueryObject(jqObject) {        
        jqObject.each(function (i, element) {
            upgradeDomElement(element);
        });
    }

    function upgradeDomElement(element) {
        window.CustomElements.upgrade(element);
    }

    function build(name, parent, classes, attributes) {
        var i, element = document.createElement(name);
        if (parent) {
            parent.appendChild(element);
        }

        if (classes) {
            for (i = 0; i !== classes.length; i++) {
                element.classList.add(classes[i]);
            }
        }

        if (attributes) {
            _.each(attributes, function (value, key) {
                if (attributes.hasOwnProperty(key)) {
                    element.setAttribute(key, value);
                }                
            });
        }
        return element;
    }

    function booleanAttribute(element, name, defaultValue) {
        var value = element.getAttribute(name);
        if (value) {
            return Converter.toBoolean(value, 'true');
        } else {
            return defaultValue;
        }
    }

    function intAttribute(element, name, defaultValue) {
        var value = element.getAttribute(name);
        if (value) {
            return Converter.toInteger(value);
        } else {
            return defaultValue;
        }
    }

    function stringAttribute(element, name, defaultValue) {
        var value = element.getAttribute(name);
        if (value) {
            return Converter.toString(value);
        } else {
            return defaultValue;
        }
    }

    function clearDom(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    var members = {
        register: register,
        ViewModel: ViewModel,
        upgrade: upgrade,
        build: build,
        booleanAttribute: booleanAttribute,
        intAttribute: intAttribute,
        stringAttribute: stringAttribute,
        clearDom: clearDom
    };

    //$.extend(Element, members);
    return members;
});
