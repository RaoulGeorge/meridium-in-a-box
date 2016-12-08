define(function (require) {
    //require('highcharts');
    require('noData');
    require('highcharts');
    require('highcharts-more');
    require('highcharts-funnel');
    require('highcharts-solid-guage');
    Formatter = require('system/text/formatter');
    
    var ko = require('knockout');
    var blockUI = require('jquery-blockUI');
    var parser = require('system/text/parser');

    
    ko.bindingHandlers.loading = (function () {
        
        function initialize(element, options) {
            var defaultValues = {
                spinnerClass: "loading-med"
            };
            options = $.extend({}, defaultValues, options);
            addLoadingIndicator($(element), options);
        }

        function addLoadingIndicator(element, options) {
            var loadingIndicator = createLoadingIndicator(options);
            loadingIndicator.hide();
            element.append(loadingIndicator);
        }

        function createLoadingIndicator(options) {
            var loadingIndicator = $('<div class="loading-indicator block" style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.5)"></div>'),
                    caption = $('<span class="loading-indicator-caption"></span>'),
                    spinner = $('<span class="loading-indicator-spinner" style="display:inline-block"></span>'),
                    loadingIndicatorContent = $('<span class="loading-indicator-content" style="position:absolute;top:50%;left:50%;"></span>');
            loadingIndicatorContent.append(spinner);
            loadingIndicatorContent.append(caption);
            loadingIndicator.append(loadingIndicatorContent);
            
            return loadingIndicator;
        }

        function show(element, caption) {
            var el = $(element);
            el.css('overflow', 'hidden').css('position', 'relative');                                  
            var width = el.outerWidth(true);

            var loadingIndicator = el.find("> .loading-indicator");

            loadingIndicator.find(".loading-indicator-caption").text(caption);

            var spinner = loadingIndicator.find(".loading-indicator-spinner");
            spinner.removeClass('loading-med loading-large loading-extra-large');
            if (width > 1441) {
                spinner.addClass('loading-extra-large').show();
            } else if (width > 1025) {
                spinner.addClass('loading-large').show();
                spinner.css('font-size', "46px");
            } else {
                spinner.addClass('loading-med').show();
                spinner.css('font-size', "26px");
            } 
           
            loadingIndicator.show();
        }

        function hide(element) {
            var el = $(element);
            el.find("> .loading-indicator").hide();
            el.css('position', '').css('overflow', '');
        }

        return {
            init: function (element, valueAccessor, allBindingsAccessor) {
                initialize(element);
            },
            update: function (element, valueAccessor, allBindingsAccessor) {
                var value = valueAccessor(), allBindings = allBindingsAccessor();
                var unwrapped = ko.utils.unwrapObservable(value);
                var caption = allBindings.caption ? allBindings.caption() : '';
                if (unwrapped === true)
                    show(element,caption);
                else
                    hide(element);
            }
        };
    })();

    ko.bindingHandlers.click2 = (function () {
        var clickAndSpin = function (originalClick) {
            $.blockUI({ message: $('#showBusyDialog') });
            return originalClick;
        }
        return {
            init: function (element, valueAccessor, allBindings, viewmodel, context) {
                //$.blockUI({ message: $('#showBusyDialog') });
                var modded = clickAndSpin(ko.utils.unwrapObservable(valueAccessor));
                ko.bindingHandlers.click.init(element, modded, allBindings, viewmodel, context);
            },
            update: function (element, valueAccessor, allBindings, viewmodel, context) {
                ko.bindingHandlers.CustomLoader.update(element, valueAccessor, allBindings, viewmodel, context);
            }

        }
    }());


    ko.bindingHandlers.delegatedClick = {
        init: function (element, valueAccessor, allBindings, viewmodel, context) {
            var action = valueAccessor();
            ko.utils.domData.set(element, "click", action);
        },
        update: function (element, valueAccessor, allBindings, viewmodel, context) {
            console.log('into update of delegated click');
            ko.bindingHandlers.CustomLoader.update(element, valueAccessor, allBindings);
        }
    };

    ko.bindingHandlers.spinner = (function () {
        "use strict";
        var setupSpinner = function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
            var handler = ko.utils.unwrapObservable(valueAccessor());
            var elemStyle = allBindingsAccessor.get('css');
            //var asyncCmd = ko.asyncCommand({
            //    execute: function (ctx, complete) {
            //        handler(viewModel, complete);
            //    },
            //    canExecute: function (isExecuting) {
            //        return !isExecuting;
            //    }
            //});
            //var commandValueAccessor = function () {
            //    return asyncCmd;
            //};
            //var activityValueAccessor = function () {
            //    return asyncCmd.isExecuting;
            //};
            $(element).click(handler).css(elemStyle);// .__asyncCommand__ = asyncCmd;
            //ko.bindingHandlers.command.init(element, commandValueAccessor, allBindingsAccessor, viewModel, context);
            //ko.bindingHandlers.activity.init(element, activityValueAccessor, allBindingsAccessor, viewModel, context);
        };

        return {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
                //setupSpinner(element, valueAccessor, allBindingsAccessor, viewModel, context);
                var originalClickInit = ko.bindingHandlers.click.init;
                var handler = ko.utils.unwrapObservable(valueAccessor());
                var elemStyle = allBindingsAccessor.get('css');
                $(element).click(handler).css(elemStyle);// .__asyncCommand__ = asyncCmd;
                //$.blockUI({ message: $('#showBusyDialog') });
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, context) {
                debugger;
                ko.bindingHandlers.CustomLoader(element, valueAccessor, allBindingsAccessor);
            }
        };
    }());

    ko.bindingHandlers.readOnly = (function () {
        return {
            update: function (element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor());
                if (value) {
                    element.setAttribute("readOnly", true);
                } else {
                    element.removeAttribute("readOnly");
                }
            }
        };
    }());


    ko.bindingHandlers.highcharts = (function () {
        

        function destroyChart(element) {
            var chart = $(element).highcharts();
            if (chart) {
                chart.destroy();
            }
        }

        function getChartOptions(modelObject) {
            var options = {};
            _.transform(modelObject, addRootProperties, options);
            if (!options.hasOwnProperty("credits")) {
                options.credits = { "enabled" : false};
            }
            return options;
        }

        function addRootProperties(accumulator, value, key) {
            var unwrapedValue = ko.utils.unwrapObservable(value);
            var keys = key.split('.');
            var currentObject = accumulator;
            for (var i = 0; i < keys.length ; i++) {
                if (i === keys.length - 1) {
                    currentObject[keys[i]] = unwrapedValue;
                } else {
                    if (!currentObject.hasOwnProperty(keys[i])) {
                        currentObject[keys[i]] = {};
                    }
                    currentObject = currentObject[keys[i]];
                }
            }
        }

        function createChart(element, chartOptions, useHighstock) {
            chartOptions = getChartOptions(chartOptions);

            if (useHighstock === true) {
                $(element).highcharts('StockChart', chartOptions);

            } else {
                $(element).highcharts(chartOptions);
            }
        }

       return  {
           init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

               //var chartOptions = ko.utils.unwrapObservable(valueAccessor());
               //var useHighstock = allBindings.has('useHighstock');
               //createChart(element, chartOptions, useHighstock);


                // Dispose chart to free up memory
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    // This will be called when the element is removed by Knockout or
                    // if some other part of your code calls ko.removeNode(element)
                    destroyChart(element);
                });

            },
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                // destroy the chart first. adding chart to same DOM element multiple can cause memory leaks
                destroyChart(element);

                var chartOptions = ko.utils.unwrapObservable(valueAccessor());
                var useHighstock = allBindings.has('useHighstock');
                createChart(element, chartOptions, useHighstock);
            }
        };

    })();

    ko.bindingHandlers.colorPicker = (function () {
        function destroyPicker(element) {
            $(element).spectrum('destroy');
        }
        return {
            init: function (element, valueAccesor) {
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    // This will be called when the element is removed by Knockout or
                    // if some other part of your code calls ko.removeNode(element)
                    destroyPicker(element);
                });
            },

            update: function (element, valueAccesor, allBindingsAccessor) {
                var value = valueAccesor(),
                    allBindings = allBindingsAccessor();
                var unwrapped = ko.utils.unwrapObservable(value);
                $(element).spectrum({
                    color: unwrapped,
                    // showInput: true,
                    showButtons: false,
                    showPalette: true,
                    hideAfterPaletteSelect: true,
                    maxPaletteSize: 10,
                    palette: [
        "#000", "#666", "#999", "#ccc", "#f3f3f3",
        "#f00", "#f90", "#ff0", "#0f0", "#0ff",
        "#00f", "#90f", "#f0f", "#f4cccc", "#fce5cd",
        "#fff2cc", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc",
        "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9",
        "#9fc5e8", "#b4a7d6", "#d5a6bd", "#e06666", "#f6b26b",
        "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3",
        "#c27ba0", "#c00", "#e69138", "#f1c232", "#6aa84f",
        "#45818e", "#3d85c6", "#674ea7", "#a64d79", "#900",
        "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394",
        "#351c75", "#741b47", "#600", "#783f04", "#7f6000",
        "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"
                    ],
                    change: function (color) {
                        value(color.toHexString());
                    }
                });
            }
        };
    })();
    
    ko.bindingHandlers.ace = (function () {
        return {
            init: aceBinding_init,
            update: aceBinding_update
        };
        function aceBinding_init (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var editor = ace.edit(element.id);

            editor.getSession().on("change", aceBinding_setObservableOnChange.bind(null, editor, valueAccessor));
            ko.utils.domNodeDisposal.addDisposeCallback(element, aceBinding_dispose.bind(null, editor));
        }
        function aceBinding_update (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                editor = ace.edit(element.id),
                shownValue = editor.getValue();

            if (value === null || value === undefined) {
                value = "";
            }

            if (shownValue !== value) {
                editor.getSession().setValue(value);
                editor.gotoLine(0);
            }
        }

        function aceBinding_setObservableOnChange(editor, valueAccessor, delta) {
            var valueObservable = valueAccessor(),
                shownValue = editor.getValue();
            if (ko.isWriteableObservable(valueObservable) && valueObservable() !== shownValue) {
                valueObservable(shownValue);
            }
        }

        function aceBinding_dispose(editor) {
            editor.destroy();
        }
    })();

    ko.bindingHandlers.formattedNumber = (function () {
        var formatter = Object.resolve(Formatter);
        return {
            init: formattedNumber_init, //init method : called only once
            update: formattedNumber_update
        };

        function formattedNumber_init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var handler = formattedNumber_onInputChanged.bind(null, element, valueAccessor, allBindingsAccessor);
            ko.utils.registerEventHandler(element, 'change', handler);
            //To call knockout validation on element
            ko.bindingHandlers['validationCore'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext); 
        }

        function formattedNumber_update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
           
            var value = ko.utils.unwrapObservable(valueAccessor());
            var formatString = allBindingsAccessor.get('formatString') || 'n';
            var domElement = $(element);
            if (value !== '' && !isNaN(value)) {
                var formattedValue = formatter.format(value, formatString);
                //ko.selectExtensions.writeValue(element, formattedValue);
                //  Set the value to the control
                domElement.val(formattedValue);
                domElement.text(formattedValue);
            }
        }       
        
        function formattedNumber_onInputChanged(element, valueAccessor, allBindingsAccessor) {
            var value = valueAccessor();
            var formattedValue = ko.selectExtensions.readValue(element);
            var formatString = allBindingsAccessor.get('formatString') || 'n';
            var numberValue = parser.parseFloat(formattedValue);

            if (numberValue !== '' && !isNaN(numberValue) && formatString.substring(0, 1) === "p") {
                    numberValue = numberValue / 100;
            }

            value(numberValue);
        }         
    })();   
});
