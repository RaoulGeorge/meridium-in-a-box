define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');
    var jQuery = require('jquery');

    var ko = require('knockout'),
        Converter = require('system/lang/converter'),
        KnockoutManager = require('system/knockout/knockout-manager');
    require('system/knockout/bindings/halt-bindings');
    require('system/knockout/bindings/property');

    Element.registeredElements = {};

    function registerElement() {
        var args = Array.prototype.slice.call(arguments, 0),
            name = args[0];
        if (!Element.registeredElements[name]) {
            document.registerElement.apply(document, args);
            Element.registeredElements[name] = true;
        } else {
            console.warn('Attemted to register element ' + name + ' after it was already registered');
        }
    }

    function register(name, ctor) {
        var prototype = Object.create(HTMLElement.prototype);

        prototype.createdCallback = function () {
            this.implementation = Object.resolve(ctor);
            this.implementation.element = this;
            Object.tryMethod(this.implementation, 'created');
        };

        prototype.attachedCallback = function () {
            Object.tryMethod(this.implementation, 'attached');
        };

        prototype.detachedCallback = function () {
            Object.tryMethod(this.implementation, 'detached');
        };

        prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
            Object.tryMethod(this.implementation, attrName + 'Changed', oldValue, newValue);
        };

        document.registerElement(name, { prototype: prototype });
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

        ViewModel.prototype.bindAttribute = function (attrName, defaultValue, subscription) {
            this[attrName] = this.kom.observable();
            this[attrName + 'Changed'] = function (oldValue, newValue) {
                this[attrName](newValue);   
            }.bind(this);
            this.kom.subscribe(this[attrName], function (newValue) {
                $(this.element).trigger('attributes.' + attrName + ':changed', [newValue]);
            }, this);
            if (subscription) {
                this.kom.subscribe(this[attrName], subscription, this);
            }
            this[attrName](Object.defaultValue(this.element.getAttribute(attrName), defaultValue));
        };

        ViewModel.prototype.bindProperty = function (propertyName, defaultValue, subscription,canBounce) {
            this[propertyName] = this.kom.observable();
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
            ko.applyBindingsToDescendants(self, self.container);

            if (self.appendAfterBindings) {
                $(self.element).empty().append(self.container);
            }
        }

        function detachedImpl(self) {
            ko.cleanNode(self.container);
            $(self.container).remove();
            self.kom.dispose();
            self.properties.forEach(deleteProperty.bind(null, self));
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

    function build(name, parent, classes, attributes, text) {
        var i, element = document.createElement(name);        

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

        if (text) {
            element.textContent = text;
        }

        if (parent) {
            parent.appendChild(element);
        }

        return element;
    }

    function booleanAttribute(element, name) {
        var value = element.getAttribute(name);

        return value !== null;
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

    function defineProperty(element, name, definition) {
        var oldValue = element[name];
        Object.defineProperty(element, name, definition);
        element[name] = oldValue;
    }

    function raiseEvent(element, name, detail) {
        element.dispatchEvent(new CustomEvent(name, {
            detail: detail
        }));
    }

    function detach(element) {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    var members = {
        registerElement: registerElement,
        register: register,
        ViewModel: ViewModel,
        upgrade: upgrade,
        build: build,
        booleanAttribute: booleanAttribute,
        intAttribute: intAttribute,
        stringAttribute: stringAttribute,
        clearDom: clearDom,
        defineProperty: defineProperty,
        raiseEvent: raiseEvent,
        detach: detach
    };

    $.extend(Element, members);
    return members;
});