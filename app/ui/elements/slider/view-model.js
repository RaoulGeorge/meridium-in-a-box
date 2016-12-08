define(function (require) {
    'use strict';

    var $ = require('jquery');

    var sliderView = require('text!./view.html');
    var ko = require('knockout');
    require('jquery-ui');
    var proto = Object.create(HTMLElement.prototype);
    proto.createdCallback = function () {
        this.implementation = Object.resolve(SliderViewModel);
        this.implementation.element = this;
        this.implementation.$element = $(this);
        Object.tryMethod(this.implementation, 'created');
    };
    proto.attachedCallback = function () {
        Object.tryMethod(this.implementation, 'attached');
    };
    proto.detachedCallback = function () {
        Object.tryMethod(this.implementation, 'detached');
    };
    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        Object.tryMethod(this.implementation, attrName + 'Changed', oldVal, newVal);
    };

    function SliderViewModel() {
        this.element = null;
        this.$element = null;
        this.$rangeInput = null;
        this.$container = sliderView;
        window.slid = this;

    }

    SliderViewModel.prototype.created = function () {
        var self = this;
        this.Node = document.createElement("div");

        $(this.Node).append();
        $(this.element).html(this.$container);

        this.currentPosX = -1;
        this.currentPosY = -1;
        this.$element.find(".slider-handler").draggable({
            axis: 'x',
            containment: ".slider-container",
            start:function(ev,ui){

            },
            stop:  handleChange.bind(self,self),
            drag: function (e) {
                //console.log(e.pageX);
                if (self.currentPosX === -1) {
                    self.currentPosX = e.pageX;
                    return false;
                }
                // dragged left
                if (self.currentPosX > e.pageX) {
                    //console.log('dragged left');
                }
                else if (self.currentPosX < e.pageX) { // dragged right
                    //console.log('dragged right');
                }
                self.currentPosX = e.pageX;

                //console.log(e.pageX);
                if (self.currentPosY === -1) {
                    self.currentPosY = e.pageY;
                    return false;
                }
                // dragged top
                if (self.currentPosY > e.pageY) {
                    //console.log('dragged top');
                }
                else if (self.currentPosY < e.pageY) { // dragged bottom
                    //console.log('dragged bottom');
                }
                self.currentPosY = e.pageY;
               
            }
        });

        this.$rangeInput = this.$element.find('input[type="range"]');
        this.$rangeInput.on('change', function (ev) {
          
            self.slidervalue(ev.currentTarget.value);
            //self.$element.trigger("change", self.slidervalue());
        });
        
        this.setAccessor('max',max_change.bind(null,self));
        this.setAccessor('min', min_change.bind(null,self));
        this.setAccessor('value', value_change.bind(null, self));
        this.setAccessor('vertical', vertical_change.bind(null, self));

       
    };

    function handleChange(self,ev,ui) {
       
        var bar = self.$element.find(".slider-bar");
        var barHeight = bar.height();
        var barWidth = bar.width();
        var barStart = bar.offset().left;
        var barTop = bar.offset().top;    
        var barRight = barStart + barWidth;
        var barBottom = barTop + barHeight;
        var barPerc;
        var valueToSet;
        if (!self.vertical()) {
            if (self.currentPosX > barRight) {
                self.currentPosX = barRight;
            } else if (self.currentPosX < barStart) {
                self.currentPosX = barStart;
            }

             barPerc = Math.round(((self.currentPosX - barStart) / barWidth) * 100);
            //console.log(barPerc);

             valueToSet = Math.round((parseInt(self.max()) - parseInt(self.min())) * (barPerc / 100));
            //console.log(parseInt(self.min()) + valueToSet);
            raiseChangeEvent(self, valueToSet);
        } else {
            if (self.currentPosY > barBottom) {
                self.currentPosY = barBottom;
            } else if (self.currentPosY < barTop) {
                self.currentPosY = barTop;
            }

             barPerc = Math.round(((self.currentPosY - barTop) / barHeight) * 100);
            //console.log(barPerc);

             valueToSet = Math.round((parseInt(self.max()) - parseInt(self.min())) * (barPerc / 100));
            //console.log(parseInt(self.min()) + valueToSet);
            raiseChangeEvent(self,valueToSet);
        }

    }


    function raiseChangeEvent(self, newValue) {
        //self.element.value = newValue;

        self.element.dispatchEvent(new CustomEvent('change', {
            detail: { oldValue: self.value(), newValue: newValue }
        }));
    }

    function max_change(self,value) {
     
        if (self.$rangeInput) {
            self.$rangeInput.attr("max", value);
        }
    }

    function min_change(self, value) {
       
        if (self.$rangeInput) {
            self.$rangeInput.attr("min", value);
        }
    }

    function value_change(self, value) {
      
        if (self.$rangeInput) {
            self.$rangeInput.val(value);
        }
        
    }
    function vertical_change(self, value) {
        if(value){
            self.$element.find(".slider-bar");
            self.$element.find(".slider-container").addClass("vertical");
            self.$element.find(".mi-slider-container").css("height", "100%");
            self.$element.css("height", "100%");
            self.$element.find(".slider-handler").draggable( "option", "axis", "y" ).css("position","absolute");
        }

    }

    SliderViewModel.prototype.setAccessor = function (attrName, subscription) {
        this[attrName] = ko.observable();
        //this[attrName + '_canSet'] = true;

        //property setter and getter
        Object.defineProperty(this.element, attrName, {
            get: function () { return this[attrName](); }.bind(this),
            set: function (value) {

                //this[attrName + '_canSet'] = false;
                this[attrName](value);
                //this.element.setAttribute(attrName, value);
            }.bind(this)
        });

        //attribute changes
        this[attrName + 'Changed'] = function (oldValue, newValue) {

            //this[attrName + '_canSet'] = false;
            this[attrName](newValue);
            //this.element[attrName] = newValue;
        }.bind(this);


        //Local changes impact attribute and property
        this[attrName].subscribe(function (value) {
            if (subscription) {
                subscription.call(this, value);
            }

            //this.element.setAttribute(attrName, value);
            //this.element[attrName] = value;
        }.bind(this));


        this[attrName](this.element.getAttribute(attrName));
        if (subscription) {
            subscription.call(this, this.element.getAttribute(attrName));
        }
    };

    SliderViewModel.prototype.attached = function () {


    };


    Element.registerElement('mi-slider', { prototype: proto });
    return SliderViewModel;
});