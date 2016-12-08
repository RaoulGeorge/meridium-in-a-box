define(function(require ) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');


    require('system/lang/object');
    var ko = require('knockout'),
        translator = Object.resolve(require('system/globalization/translator')),
        ErrorHandler = require('system/error-handler/error-handler'),
        parser = require('system/text/parser'),
        Formatter = require('system/text/formatter');
    require('jquery-ui');

    function addCustomBinding (name, bindingDefinition) {
        /// <summary>
        /// Handles registering a custom binding with knockout.  Also will call a dispose
        /// method on the class.  This method should be called at the end of the class implementation
        /// for the binding definition.
        /// </summary>
        /// <param name="name" type="string">Name of the binding.  This is what the user will use in
        /// the data-bind definition.</param>
        /// <param name="bindingDefinition" type="object">Object that defines the class of the definition.  This
        /// method will handled creating a new instance by calling 'new' on this definition.  The class should
        /// implement init, update and dispose methods.</param>
        ko.bindingHandlers[name] = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                var binding = new bindingDefinition(element, valueAccessor, allBindingsAccessor, viewModel);
                $(element).data(name + '-binding', binding);

                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    var data = $(element).data(name + '-binding');
                    if (data.dispose) { data.dispose(element); }
                    $(element).removeData(name + '-binding');
                });

                if (binding.init) {
                    binding.init(element, valueAccessor, allBindingsAccessor, viewModel);
                }

                //  the next two lines make PhoneNumberBinding the "view model" for this binding
                ko.applyBindingsToDescendants(binding, element);
                return { controlsDescendantBindings: true };
            },

            update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                var data = $(element).data(name + '-binding');
                if (data.update) {
                    data.update(element, valueAccessor, allBindingsAccessor, viewModel);
                }
            }
        };
    }

    ko.appendTemplateScript = function(id, url) {
        var dfd = $.Deferred();
        if (document.getElementById(id)) {
            dfd.resolve();
        } else {
            $.ajax({
                url: url,
                dataType: 'html'
            }).done(function(data) {
                var script = $("<script>").attr("id", id).attr("type", 'text/html').html(data);
                $("body").append(script);
                dfd.resolve();
            });
        }
        return dfd.promise();
    };

    ko.bindingHandlers.jqIconButton = {
        init: function(element, valueAccessor) {
            var options = valueAccessor();
            var icon = ko.unwrap(options.icon);
            var text = ko.unwrap(options.text);
            var enabled = Object.defaultValue(ko.unwrap(options.enabled), true);

            if (icon) { $(element).html('<i class="' + icon + '"></i>'); }
        },

        update: function(element, valueAccessor) {
            var options = valueAccessor(),
                    enabled = ko.unwrap(options.enabled),
                    opacity = enabled ? 1 : 0.5;

            $(element).find('i').css('opacity', opacity);
        }
    };

    ko.bindingHandlers.toolTip = {
        init: function (element, valueAccessor) {
            $(element).tooltip({ content: valueAccessor(), html:true });
        },
        update: function (element, valueAccessor) {
            $(element).tooltip({ content: valueAccessor(),  html:true, tooltipClass: "datasheet-tooltip" });
        }
    };

    ko.bindingHandlers.jqButton = {
        init: function(element, valueAccessor) {
            var options = valueAccessor(),
                label = ko.unwrap(options.label),
                enabled = Object.defaultValue(ko.unwrap(options.enabled), true),
                title = ko.unwrap(options.title);

            $(element)
                .attr("title", title)
                .button({
                    disabled: !enabled
                });
            if (options.label) { $(element).button("option", "label", label); }
        },

        update: function(element, valueAccessor) {
            var options = valueAccessor(),
                label = ko.unwrap(options.label),
                enabled = ko.unwrap(options.enabled),
                title = ko.unwrap(options.title);

            $(element)
                .attr("title", title)
                .button("option", "disabled", enabled === false);

            if (options.label) { $(element).button("option", "label", label); }

            if (options.primaryIcon && options.secondaryIcon) {
                $(element).button('option', 'icons', {
                    primary: options.primaryIcon,
                    secondary: options.secondaryIcon
                });
            } else if (options.primaryIcon) {
                $(element).button('option', 'icons', {
                    primary: options.primaryIcon
                });
            }
        }
    };
    //  This binding sets the inner text of the element bound to a localized value
    //  determined by the key passed in to the binding.
    //  For example: <div data-bind="localText: 'SOME_KEY' }"></div>
    ko.bindingHandlers.localText = {
        init: function (element, valueAccessor) {
            var key = ko.utils.unwrapObservable(valueAccessor());
            $(element).text(translator.translate(key));
        },
        update: function (element, valueAccessor) {
            var key = ko.utils.unwrapObservable(valueAccessor());
            $(element).text(translator.translate(key));
        }
    };
    ko.bindingHandlers.required = {
        init: function (element, valueAccessor) {
            if (ko.unwrap(valueAccessor())) {
                $(element).attr('required', 'required');
            } else {
                $(element).removeAttr('required');
            }
        },
        update: function (element, valueAccessor) {
            if (ko.unwrap(valueAccessor())) {
                $(element).attr('required', 'required');
            } else {
                $(element).removeAttr('required');
            }
        }
    };

    ko.bindingHandlers.slide = {
        init: function(element, valueAccessor) {
            var options = valueAccessor();
            var visible = ko.unwrap(options.visible);
            var duration = ko.unwrap(options.duration || 'fast');
            visible ? $(element).slideDown(duration) : $(element).hide();
        },

        update: function(element, valueAccessor) {
            var options = valueAccessor();
            var visible = ko.unwrap(options.visible);
            var duration = ko.unwrap(options.duration || 'fast');
            visible ? $(element).slideDown(duration) : $(element).slideUp(duration);
        }
    };

    ko.bindingHandlers.fade = {
        init: function(element, valueAccessor) {
            var options = valueAccessor();
            var visible = ko.unwrap(options.visible);
            var duration = ko.unwrap(options.duration || 'fast');
            visible ? $(element).fadeIn(duration) : $(element).hide();
        },

        update: function(element, valueAccessor) {
            var options = valueAccessor();
            var visible = ko.unwrap(options.visible);
            var duration = ko.unwrap(options.duration || 'fast');
            visible ? $(element).fadeIn(duration) : $(element).fadeOut(duration);
        }
    };

    ko.utils.setOptionNodeSelectionState = function(optionNode, isSelected) {
        // IE6 sometimes throws "unknown error" if you try to write to .selected
        // directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
        if (navigator.userAgent.indexOf("MSIE 6") >= 0) {
            optionNode.setAttribute("selected", isSelected);
        } else {
            optionNode.selected = isSelected;
        }
    };

    ko.bindingHandlers.groupedOptions = (function () {
        function update(element, valueAccessor, allBindingsAccessor) {
            var i, j, option;
            enforceSelectTag(element);

            var previousSelectedValues = [];
            for (i = 0; i < element.childNodes.length; i++) {
                var node = element.childNodes[i];
                if (node.tagName === "OPTGROUP") {
                    if (node.childNodes !== undefined) {
                        for (var k = 0; k < node.childNodes.length; k++) {
                            var childNode = node.childNodes[k];
                            if (childNode.tagName && childNode.tagName === "OPTION" && childNode.selected) {
                                previousSelectedValues.push(ko.selectExtensions.readValue(childNode));
                            }
                        }
                    }
                } else if (node.tagName && node.tagName === "OPTION" && node.selected) {
                    previousSelectedValues.push(ko.selectExtensions.readValue(node));
                }
            }

            var previousScrollTop = element.scrollTop;

            var value = ko.utils.unwrapObservable(valueAccessor());

            // Clear existing elements
            element.innerHTML = "";

            if (value) {
                var allBindings = allBindingsAccessor();
                if (typeof value.length !== "number") {
                    value = [value];
                }
                if (allBindings['optionsCaption']) {
                    option = document.createElement("OPTION");
                    option.innerHTML = allBindings['optionsCaption'];
                    ko.selectExtensions.writeValue(option, undefined);
                    element.appendChild(option);
                }

                // Group values into optgroups
                var groupedOptions = [];
                var optionsGroupValue = allBindings['optionsGroup']; // undefined if not given
                for (i = 0, j = value.length; i < j; i++) {
                    var optionsGroup = '';
                    if (typeof optionsGroupValue === "function") {
                        optionsGroup = optionsGroupValue(value[i]);
                    } else if (typeof optionsGroupValue === "string") {
                        optionsGroup = ko.utils.unwrapObservable(value[i][optionsGroupValue]);
                    }

                    optionsGroup = optionsGroup || '';

                    if (typeof groupedOptions[optionsGroup] === "undefined") {
                        groupedOptions[optionsGroup] = [];
                    }

                    groupedOptions[optionsGroup].push(value[i]);
                }

                // Create HTML elements
                for (var groupName in groupedOptions) {
                    if (groupedOptions.hasOwnProperty(groupName)) {
                        var optgroup = null;
                        // Add an OPTGROUP for all groups except for ""
                        if (groupName !== "") {
                            optgroup = document.createElement("OPTGROUP");
                            optgroup.label = groupName;
                            element.appendChild(optgroup);
                        }

                        // Create HTML elements for options within this group
                        for (i = 0, j = groupedOptions[groupName].length; i < j; i++) {
                            var valueGroup = groupedOptions[groupName],
                                optionValue = typeof allBindings['optionsValue'] === "string" ?
                                    valueGroup[i][allBindings['optionsValue']] :
                                    valueGroup[i],
                                optionText = optionValue;

                            option = document.createElement("OPTION");
                            // Pick some text to appear in the drop-down list for this data value
                            var optionsTextValue = allBindings['optionsText'];
                            if (typeof optionsTextValue === "function") {
                                // Given a function; run it against the data value
                                optionText = optionsTextValue(valueGroup[i]);
                            } else if (typeof optionsTextValue === "string") {
                                // Given a string; treat it as a property name on the data value
                                optionText = valueGroup[i][optionsTextValue];
                            }

                            optionValue = ko.utils.unwrapObservable(optionValue);
                            optionText = ko.utils.unwrapObservable(optionText);
                            ko.selectExtensions.writeValue(option, optionValue);

                            option.innerHTML = optionText.toString();

                            if (optgroup !== null) {
                                optgroup.appendChild(option);
                            } else {
                                element.appendChild(option);
                            }
                        }
                    }
                }

                updateSelectionState(element, previousSelectedValues);
                restoreScrollTop(element, previousScrollTop);
            }
        }

        function enforceSelectTag(element) {
            if (element.tagName !== "SELECT") {
                throw new Error("groupedOptions binding applies only to SELECT elements");
            }
        }

        function updateSelectionState(element, previousSelectedValues) {
            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var i, j,
                newOptions = element.getElementsByTagName("OPTION"),
                countSelectionsRetained = 0;

            for (i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues,
                    ko.selectExtensions.readValue(newOptions[i])) >= 0) {
                    ko.utils.setOptionNodeSelectionState(newOptions[i], true);
                    countSelectionsRetained++;
                }
            }
        }

        function restoreScrollTop(element, previousScrollTop) {
            if (previousScrollTop) {
                element.scrollTop = previousScrollTop;
            }
        }

        return {
            update: update
        };
    }());


    //  Use this extension to add complex validation to an observable.
    //  ex:
    //      var x = ko.observable(0).extend({ validate: callback });
    //
    //  Callback is the function you want to use to do the validation.  Should always return true/false.
    //  The callback function will be passed the current value of the observable as its sole paramter.
    //      true = valid
    //      false = invalid.
    //  The validation will be triggered whenever the root observable (x) is changed, or whenever any
    //  observables in the callback are changed.
    //
    //  To access whether the observable is valid or not, the extension sets up a sub-observable 'invalid'
    //  on the root observable (x), so we can check for validity by evaluating or binding to x.invalid().
    //
    //  binding example:
    //      <input type="text" data-bind="value: x, css: { 'mi-invalid': x.invalid }, valueUpdate: 'afterkeydown'"/>
    //
    //  This binding toggles the mi-invalid class which causes the input to be styled as valid/invalid appropriately.
    //
    //  If the object this observable is attached to needs to be removed/deleted, you will need to dispose of the
    //  validation subscription manually, or a memory leak will occur and the validation error could still be present
    //  To do so you need to call dispose() on the validationSubscription property that is added to the observable.
    ko.extenders.validate = function(target, options) {
        var validationCallback,
            errorLevel,
            title,
            message,
            gotoCallback,
            controlSelector,
            errorHandler,
            useValidationBar;

        if ($.isFunction(options)) {
            validationCallback = options;
        } else {
            validationCallback = options.validationCallback;
            errorLevel = options.errorLevel;
            title = options.title;
            message = options.message;
            gotoCallback = options.gotoCallback;
            controlSelector = options.controlSelector;
            errorHandler = options.errorHandler || Object.resolve(ErrorHandler);
            useValidationBar = options.useValidationBar === true || options.useValidationBar === false ?
                options.useValidationBar :
                true;
        }

        target.invalid = ko.computed(function() {
            target();
            return !validationCallback(target());
        });

        target.validationError = undefined;

        //TODO hook with new error handler
        function manageError() {
            if (useValidationBar === true)
            {
                if (target.invalid()) {
                    if (!target.validationError) {
                        target.validationError =
                        {
                            title: ko.unwrap(title || translator.translate('VALIDATION_ERROR')),
                            longDesc: ko.unwrap(message || undefined),
                            severity: ko.unwrap(errorLevel || 'error'),
                            sourceCallBack: gotoCallback
                        };

                        errorHandler.addError(target.validationError);
                    }
                } else if (target.validationError) {
                    errorHandler.removeError(target.validationError);
                    target.validationError = undefined;
                }
            }            
        }

        target.validationSubscription = target.invalid.subscribe(manageError);
        manageError();

        return target;
    };

    // Use this extension to prevent a change from occuring to an observable based on the return value from a
    // validation callback method, which must be a boolean true value to allow the value to change.
    // ex:
    //     var a = ko.observable(someObj).extend({ preventChange: function (currentValue, newValue) {
    //         // prevent the value from being changed if the new value is greater than or equal to the current value
    //         return currentValue > newValue;
    //     });
    ko.extenders.preventChange = function(target, callback) {
        //create a writeable computed observable to intercept writes to our observable
        var result = ko.computed({
            read: target,
            write: function(newValue) {
                var current = target();

                var callbackReturnValue = callback.call(this, current, newValue);

                if (callbackReturnValue !== true && callbackReturnValue !== false &&
                    callbackReturnValue !== undefined && callbackReturnValue.done) {

                    callbackReturnValue.done(function() {
                        target(newValue);
                    });
                } else if (callbackReturnValue === true) {
                    target(newValue);
                }
            }
        });

        //return the new computed observable
        return result;
    };

    // Adds a "lastValue" observable to the observable that will contain the most recent previous value.
    // ex:
    //     var b = ko.observable(9).extend({ trackLastValue : 9});
    //     b(6); // b() == 6 and b.lastValue() == 9
    //     b('SomeOtherVal'); // b() == 'SomeOtherVal', b.lastValue() == 6
    ko.extenders.trackLastValue = function(target, initialValue) {
        var lastValue = ko.observable(initialValue);

        var result = ko.computed({
            read: target,
            write: function(newValue) {
                lastValue(target());
                target(newValue);
            }
        });

        result.lastValue = lastValue;

        result(target());
        return result;
    };

    ko.observableArray.fn.trackHasOneItem = function() {
        //create a sub-observable
        this.hasOneItem = ko.observable();

        //update it when the observableArray is updated
        this.subscribe(function(newValue) {
            this.hasOneItem(newValue && newValue.length === 1 ? true : false);
        }, this);

        //trigger change to initialize the value
        this.valueHasMutated();

        //support chaining by returning the array
        return this;
    };

    ko.observableArray.fn.trackHasItems = function() {
        //create a sub-observable
        this.hasItems = ko.observable();

        //update it when the observableArray is updated
        this.subscribe(function(newValue) {
            this.hasItems(newValue && newValue.length ? true : false);
        }, this);

        //trigger change to initialize the value
        this.valueHasMutated();

        //support chaining by returning the array
        return this;
    };


        var namespaceKey = -1;
        function ComboBoxBinding(element, valueAccessor) {
            /// <summary>
            /// Creates and binds to a combo box control.  This control can be made on any container
            /// element.
            /// Binding parameters:
            ///     value: the current selected value for the combo box.  (single selection)
            ///     options: the collection of selection options for the combo box.
            ///     selectedOptions: the list of currently selected values for the combo box.  (multiple selection)
            ///     optionsText: the object field name to pull the display text from.
            ///     allowNull: Whether empty values are valid states.  When false, the first item in options will be
            ///                selected if no value is supplied.
            ///     maxOptions: The maximum number of options to show in the drop down.  As the list is filtered (as
            ///                 the user types) the top matches will be displayed.
            /// </summary>
            var self = this;

            //  This event namespace should be used on any events that are registered outside the containing element.
            //  This allows the events to be cleaned up efficiently in the dispose method.
            namespaceKey++;
            self.namespace = '.combo-box-' + namespaceKey;

            self.accessor = valueAccessor();
            self.optionsText = readMember(self.accessor.optionsText, null);
            self.value = readMember(self.accessor.value());
            self.inputValue = ko.observable(getText(self, self.accessor.value()));
            self.options = readMember(self.accessor.options, []);
            self.multiselect = false;//readMember(self.accessor.multiselect, false);
            self.selectedOptions = readMember(self.accessor.selectedOptions, self.multiselect ? [] : [self.value]);
            self.allowUnmatched = false;//readMember(self.accessor.allowUnmatched, false);
            self.allowNull = readMember(self.accessor.allowNull, false);
            self.separator = readMember(self.accessor.separator, ', ');
            if (self.allowUnmatched) { self.multiselect = false; }
            self.maxOptions = readMember(self.accessor.maxOptions, '-1');
            self.isListOpen = false;
            self.updatingValueBinding = false;
        }

        ComboBoxBinding.prototype.init = function (element, valueAccessor, allBindingsAccessor, viewModel) {
            /// <summary>
            /// Initializes the binding.
            /// </summary>
            var self = this;

            initializeElements(self, element, allBindingsAccessor, viewModel);
            initializeAutocomplete(self, element);
            //if (self.multiselect) {
            //    self.initializeMultiSelect(table);
            //} else {
            initializeSingleSelect(self);
            //}

            //  Set up listeners on the bound data so we can update when changes occur.
            if (ko.isObservable(self.accessor.value)) {
                self.valueSubscription = self.accessor.value.subscribe(function () {
                    if (self.updatingValueBinding) {
                        self.updatingValueBinding = false;
                        return;
                    }
                    self.refresh();
                });
            }
            if (ko.isObservable(self.accessor.options)) {
                self.optionsSubscription = self.accessor.options.subscribe(function () {
                    self.options = self.accessor.options();
                });
            }

            $(window).on('click' + self.namespace, element, window_onClick.bind(null, self));
        };

        ComboBoxBinding.prototype.dispose = function (element) {
            /// <summary>
            /// Cleans up resources used by object (events, etc)
            /// </summary>
            var self = this;

            //  Dispose of the subscriptions to the source data.
            if (self.disableSubscription) {
                self.disableSubscription.dispose();
            }
            if (self.valueSubscription) {
                self.valueSubscription.dispose();
            }
            if (self.optionsSubscription) {
                self.optionsSubscription.dispose();
            }

            //  Dispose of all jQuery event subscriptions.
            $(window).off(self.namespace);
            $(element).off();
            $(element).empty();
            $(element).parents('.mi-ui-scroll-y').off(self.namespace);
            $('body').off(self.namespace);
        };

        ComboBoxBinding.prototype.close = function () {
            /// <summary>
            /// Collapse the drop down if it is open.
            /// </summary>
            var self = this;
            self.input.autocomplete('close');
            self.isListOpen = false;
        };

        ComboBoxBinding.prototype.refresh = function () {
            /// <summary>
            /// Cancels any edits and rolls back to the value that was previously selected.  This is
            /// done by reading in the value from the accessor again.
            /// </summary>
            var self = this;
            self.select(readMember(self.accessor.value()));
        };

        ComboBoxBinding.prototype.select = function (option) {
            var self = this;
            self.value = option;
            //if (this.multiselect) {
            //    if (option && !_.contains(this.selectedOptions, option)) this.selectedOptions.push(option);
            //    this.input.val(getText(this, this.selectedOptions));
            //} else if (this.allowUnmatched) {
            //    this.value = getText(this, option);
            //    this.selectedOptions = [];
            //    if (_.contains(this.options, option)) this.selectedOptions.push(option);
            //} else {
            if (self.selectedOptions.length > 0 && !_.contains(self.selectedOptions, self.Value)) {
                self.selectedOptions.pop();
            }
            self.selectedOptions.push(self.value);
            self.inputValue(getText(self, self.value));
            //}
        };

        ComboBoxBinding.prototype.buttonOnClick = function () {
            var self = this;
            self.input.focus();
            if (self.isListOpen) {
                self.isListOpen = false;
            } else {
                self.input.autocomplete('search', '');
                event.stopImmediatePropagation();
            }
        };

        function initializeElements(self, element, allBindingsAccessor) {
            element = $(element);

            self.inputAttrs = {};
            if (allBindingsAccessor().attr && allBindingsAccessor().attr.input) {
                self.inputAttrs = allBindingsAccessor().attr.input;
            }

            element.empty();
            element.addClass('mi-ui-combo-box');

            self.input = $('<input class="form-control" style="border-width:0px;height:20px" data-bind="value: inputValue, valueUpdate: \'input\', ' +
                'disable: accessor.disable, attr: inputAttrs" style="width: 100%">').appendTo(element);
            var button = $('<i class="input-group-addon icon-arrow" style="padding:0 10px 0 0" data-bind="click: buttonOnClick" tabindex="-1"/>')
                .appendTo(element)
                .button({disabled: readMember(self.accessor.disable) });

            button.removeClass('ui-widget ui-state-default ui-corner-all ui-button-disabled ui-state-disabled ui-button-text-only');

            if (ko.isObservable(self.accessor.disable)) {
                self.disableSubscription = self.accessor.disable.subscribe(function () {
                    button.button('option', 'disabled', self.accessor.disable());
                });
            }

            self.input.on('keydown', function (event) {
                if (event.keyCode === $.ui.keyCode.ESCAPE) {
                    //  Need to defer the execution of the refresh so that
                    //  the knockout binding correctly updates the input.
                    _.defer(function () {
                        self.refresh();
                        self.isListOpen = false;
                    });
                }
            });
            element.parents('.mi-ui-scroll-y').on('scroll' + self.namespace, self.close.bind(self));
            $('body').on('scroll' + self.namespace, self.close.bind(self));
        }

        function initializeAutocomplete(self) {
            function autocompleteSource(request, response) {
                var isEmpty = !request.term;
                var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
                var matches = [];
                $.each(self.options, function (i, option) {
                    var text = getText(self, option);
                    if (isEmpty || matcher.test(text)) {
                        matches.push({
                            label: text.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" +
                                $.ui.autocomplete.escapeRegex(request.term) +
                                ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>"),
                            value: text,
                            option: option
                        });
                        if (self.maxOptions !== -1 && matches.length >= self.maxOptions) {
                            return false;
                        }
                    }
                });
                response(matches);
            }

            function autocompleteSelect(event, ui) {
                //  Don't do the selection if user has hit Tab.  The user must explicitly click on or
                //  hit enter to select the focused list item.
                if (event.keyCode === $.ui.keyCode.TAB) { return; }
                self.isListOpen = false;
                self.select(ui.item.option);
                updateBindings(self);
            }

            function autocompleteChange(event, ui) {
                if (!ui.item) {
                    var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(self.inputValue()) + "$", "i");
                    var inList = false;
                    $.each(self.options, function (i, option) {
                        var text = getText(self, option);
                        if (matcher.test(text)) {
                            self.select(option);
                            self.inputValue(text);
                            inList = true;
                            return false;
                        }
                    });

                    if (!inList) {
                        if (self.allowUnmatched) {
                            self.select(self.inputValue());
                        } else {
                            self.select(self.value);
                        }
                    }
                    updateBindings(self);
                }
            }

            function autocompleteOpen() {
                self.isListOpen = true;
            }

            function autocompleteClose() {
                if (self.multiselect) { updateBindings(self); }
            }

            function autocompleteRenderItem(ul, item) {
                var li = $('<li>').appendTo(ul)
                                  .data('item.autocomplete', item);
                //if (this.multiselect) {
                //    this.multiSelectListItem(li, item);
                //} else {
                singleSelectListItem(li, item);
                //}
                return li;
            }

            function singleSelectListItem(li, item) {
                var a = $('<a>').appendTo(li)
                                .html(item.label)
                                .mouseover(item, singleSelectListItem_onMouseOver)
                                .mouseout(item, singleSelectListItem_onMouseOut);
                if (_.contains(self.selectedOptions, item.option)) {
                    a.addClass('ui-state-highlight');
                }
            }

            function singleSelectListItem_onMouseOver(event) {
                if (_.contains(self.selectedOptions, event.data.option)) {
                    $(event.currentTarget).removeClass('ui-state-highlight');
                }
            }

            function singleSelectListItem_onMouseOut(event) {
                if (_.contains(self.selectedOptions, event.data.option)) {
                    $(event.currentTarget).addClass('ui-state-highlight');
                }
            }

            self.input.autocomplete({
                //  NOTE: Set appendTo to 'body' to ensure the drop-down can always overlay other absolutely positioned
                //  elements.  This would need to be scoped down if we ever wanted to use the 'within' parameter on the
                //  position widget to have the collision detection respect something other than the window.
                appendTo: $('body'),
                delay: 0,
                minLength: 0,
                autoFocus: self.accessor.autoFocus,
                position: { my: "left top", at: "left bottom", collision: "flip" },
                source: autocompleteSource,
                select: autocompleteSelect,
                change: autocompleteChange,
                open: autocompleteOpen,
                close: autocompleteClose
            });
            self.input.data('autocomplete').menu.element.addClass('mi-ui-combo-box');
            self.input.data('autocomplete')._renderItem = autocompleteRenderItem;
        }

        function initializeSingleSelect(self) {
            var hasValue = self.value !== null,
                noSelections = self.selectedOptions.length === 0,
                hasOptions = self.options.length > 0;

            if (!hasValue && noSelections && hasOptions && !self.allowNull) {
                self.select(self.options[0]);
                updateBindings(self);
            } else if (hasValue) {
                self.select(self.value);
            }
        }

        function getText(self, item) {
            function getArrayText(array) {
                return $.map(array, function (item) {
                    return getText(self, item);
                }).join(self.separator);
            }

            function getOptionText(option) {
                if (!option) { return ''; }
                if (self.allowUnmatched && !_.contains(self.options, option)) { return option; }
                if (self.optionsText) {
                    return readMember(option[self.optionsText], '').toString();
                } else {
                    return option.toString();
                }
            }

            return $.isArray(item) ? getArrayText(item) : getOptionText(item);
        }

        function updateBindings(self) {
            if (ko.isObservable(self.accessor.value)) {
                self.updatingValueBinding = true;
                self.accessor.value(self.value);
            }
            if (ko.isObservable(self.accessor.selectedOptions)) {
                self.accessor.selectedOptions(self.selectedOptions);
            }
        }

        function window_onClick(self, event) {
            var selfElement = event.data;

            if (!$.contains(selfElement, event.srcElement)) {
                self.close();
            }
        }

        function readMember(member, defaultValue) {
            return ($.isFunction(member) ? member() : member) || defaultValue;
        }

        addCustomBinding('combo-box', ComboBoxBinding);



    ko.bindingHandlers.sort = {
        init: function (element, valueAccessor) {
            var asc = false;
            element.style.cursor = 'pointer';

            element.onclick = function () {
                var value = valueAccessor();
                var prop = value.prop;
                var data = value.arr;

                var downArrowHtml = '<div class="icon-arrow" style="float: right;"></div>';
                var upArrowHtml = '<div class="icon-up-arrow" style="float: right;"></div>';
                if (!asc) {
                    $(this).parent().find('.icon-up-arrow, .icon-arrow').remove();
                    $(this).append(upArrowHtml);
                } else {
                    $(this).parent().find('.icon-up-arrow, .icon-arrow').remove();
                    $(this).append(downArrowHtml);
                }
                asc = !asc;

                data.sort(function (left, right) {
                    var rec1 = left;
                    var rec2 = right;

                    if (!asc) {
                        rec1 = right;
                        rec2 = left;
                    }

                    var props = prop.split('.');
                    for (var i in props) {
                        if (props.hasOwnProperty(i)) {
                            var propName = props[i];
                            var parenIndex = propName.indexOf('()');
                            if (parenIndex > 0) {
                                propName = propName.substring(0, parenIndex);
                                rec1 = rec1[propName]();
                                rec2 = rec2[propName]();
                            } else {
                                rec1 = rec1[propName];
                                rec2 = rec2[propName];
                            }
                        }
                    }
                    return rec1 === rec2 ? 0 : rec1 < rec2 ? -1 : 1;
                });
            };
        }
    };
    //TODO: Use standarized datepicker
    ko.bindingHandlers.datetime = {
        init: function (element, valueAccessor) {
            element = $(element);
            var options = valueAccessor();
            var ampm = ko.unwrap(Object.defaultValue(options.ampm, false));
            var format = ko.unwrap(Object.defaultValue(options.format, 'hh:mm:ss'));

            var showHour = ko.unwrap(Object.defaultValue(options.showHour, true));
            var showMinute = ko.unwrap(Object.defaultValue(options.showMinute, true));
            var showSecond = ko.unwrap(Object.defaultValue(options.showSecond, true));
            var showMillisec = ko.unwrap(Object.defaultValue(options.showMillisec, false));

            var stepHour = ko.unwrap(Object.defaultValue(options.stepHour, 0.25));
            var stepMinute = ko.unwrap(Object.defaultValue(options.stepMinute, 0.25));
            var stepSecond = ko.unwrap(Object.defaultValue(options.stepSecond, 0.25));
            var stepMillisec = ko.unwrap(Object.defaultValue(options.stepMillisec, 0.5));

            var datetimepickerOptions = {
                ampm: ampm,
                timeFormat: format,
                showHour: showHour,
                showMinute: showMinute,
                showSecond: showSecond,
                showMillisec: showMillisec,
                stepHour: stepHour,
                stepMinute: stepMinute,
                stepSecond: stepSecond,
                stepMillisec: stepMillisec
            };
            element.datetimepicker(datetimepickerOptions);
        }
    };

    function updateFormattedValue(domElement, valueAccessor, allBindingsAccessor) {
        var value = valueAccessor(),
                valueUnwrapped = ko.utils.unwrapObservable(value),
                allBindings = allBindingsAccessor(),
                dataType = ko.utils.unwrapObservable(allBindings.dataType),
                format,
                element = $(domElement),
                isFocused = element.is(':focus'),
                formatter = Object.resolve(Formatter),
                formattedValue;


        switch (dataType) {
            case 'integer':
            case 'I':
                format = allBindings.integerFormat;

                if (isFocused && allBindings.integerFormatEdit) {
                    format = allBindings.integerFormatEdit;
                }
                break;
            case 'decimal':
            case 'N':
                format = allBindings.decimalFormat;

                if (isFocused && allBindings.decimalFormatEdit) {
                    format = allBindings.decimalFormatEdit;
                }
                break;
            case 'dateTime':
            case 'D':
                format = allBindings.dateTimeFormat;

                if (isFocused && allBindings.dateTimeFormatEdit) {
                    format = allBindings.dateTimeFormatEdit;
                }
                break;
            case 'currency':
            case 'C':
                format = allBindings.currencyFormat;

                if (isFocused && allBindings.currencyFormatEdit) {
                    format = allBindings.currencyFormatEdit;
                }
                break;
            default:
                //  No data type... check for a format to use.
                //  If none is found, format will be undefined, which is ok.
                format = allBindings.integerFormat ||
                    allBindings.decimalFormat ||
                    allBindings.dateTimeFormat ||
                    allBindings.currencyFormat;
        }

        formatter = Object.resolve(Formatter);

        formattedValue = formatter.format(parseValue(valueUnwrapped), format);

        //  Set the value to the control
        element.val(formattedValue);
        element.text(formattedValue);
    }

    function parseValue(value) {
        if (isNaN(value) || value === '') {
            return value;
        }
        return parseFloat(value);
    }

    //  Handles binding to a value and taking into account formatting and localization on the
    //  reads and writes.  This only needs to be used for values that can be formatted like
    //  decimals, integers, and date/times.
    ko.bindingHandlers.formattedValue = {
        init: function (domElement, valueAccessor, allBindingsAccessor) {
            //  Only set up an event for two-way binding if the value is an observable.
            if (ko.isObservable(valueAccessor())) {
                var allBindings = allBindingsAccessor(),
                    eventType = allBindings.valueUpdate || 'change',

                    element = $(domElement);

                //  This event handler will handle writing the data from the control back to the observable.
                element.on(eventType, function () {
                    var value = valueAccessor();
                    var dataType = ko.utils.unwrapObservable(allBindings.dataType);
                    var newValue = element.val();

                    if (!dataType) {
                        if (allBindings.integerFormat) {
                            dataType = 'integer';
                        } else if (allBindings.decimalFormat) {
                            dataType = 'decimal';
                        } else if (allBindings.dateTimeFormat) {
                            dataType = 'dateTime';
                        } else if (allBindings.currencyFormat) {
                            dataType = 'currency';
                        }
                    }

                    if (newValue !== '') {
                        switch (dataType) {
                            case 'integer':
                            case 'I':
                                var intValue = parser.parseInt(newValue);
                                if (!isNaN(intValue)) {
                                    newValue = intValue;
                                }
                                break;
                            case 'decimal':
                            case 'N':
                            case 'currency':
                            case 'C':
                                var floatValue = parser.parseFloat(newValue);
                                if (!isNaN(floatValue)) {
                                    newValue = floatValue;
                                }
                                break;
                            case 'dateTime':
                            case 'D':
                                newValue = parser.parseDate(newValue);
                                break;
                        }
                    }
                    value(newValue);
                });

                //  Setup a dispose to handle removing the change event
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    $(element).off();
                });

                /* These focus event handlers force the update method to be called when the field
                   is either focused or losses focus. This is so we can handle changing the formatting
                   based on whether or not the field is being edited.
                */
                element.focusin(function () {
                    ko.bindingHandlers.formattedValue.updateFormat(domElement, valueAccessor, allBindingsAccessor);
                });

                element.focusout(function () {
                    ko.bindingHandlers.formattedValue.updateFormat(domElement, valueAccessor, allBindingsAccessor);
                });
            }
        },

        //  Called whenever the observable being bound to changes.
        update: function (domElement, valueAccessor, allBindingsAccessor) {
            var allBindings = allBindingsAccessor(),
                defaultFormatOnce = domElement.nodeName === 'INPUT' ? true : false,
                formatOnce = Object.defaultValue(allBindings.formatOnce, defaultFormatOnce),
                element = $(domElement);

            if (formatOnce && element.val()) {
                //  once we have formatted the text the first time, don't keep formatting it.
                return;
            }
            else {
                ko.bindingHandlers.formattedValue.updateFormat(domElement, valueAccessor, allBindingsAccessor);
            }
        },

        updateFormat: updateFormattedValue
    };
});