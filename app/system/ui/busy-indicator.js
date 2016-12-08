define(function(require) {
    'use strict';
    require('scopedQuerySelector');

    function BusyIndicator (loaderClassName) {
        this.container = null;
        this.loaderClassName = loaderClassName || null;
        this.displayCache = null;
        this.positionCache = null;
    }

    BusyIndicator.prototype.attachTo = function (container) {
        if(container) {
            this.displayCache = container.style.overflow;
            this.positionCache = container.style.position;
            attachToContainer(this, container);
        }
    };

    BusyIndicator.prototype.detach = function(){
        this.container = null;
        this.loaderClassName =  null;
        this.displayCache = null;
        this.positionCache = null;
    };

    BusyIndicator.prototype.show = function () {
        var allWraps, i;
        if (this.container) {
            this.container.style.overflow = 'hidden';
            this.container.style.position = this.positionCache ? this.positionCache : 'relative';
            allWraps = this.container.querySelectorAll(":scope > .busy-indicator-wrap");
            for (i = 0; i < allWraps.length; i++) {
                allWraps[i].style.display = 'block';
            }
        }
    };

    BusyIndicator.prototype.hide = function () {
        var allWraps, i;
        if(this.container){
            if(this.displayCache){
                this.container.style.overflow = this.displayCache;
            }else {
                this.container.style.overflow = '';
            }
            if(this.positionCache){
                this.container.style.position = this.positionCache;
            }else{
                this.container.style.position = '';
            }
            allWraps = this.container.querySelectorAll(":scope > .busy-indicator-wrap");
            for(i = 0; i < allWraps.length; i++){
                allWraps[i].style.display = 'none';
            }
        }
    };

    function attachToContainer(self, container){

        self.container = container;

        if(self.container.querySelector(':scope > .busy-indicator-wrap')){
            return;
        }

        var divIndicatorWrap = document.createElement('div'),
            divIndicator = document.createElement('div'),
            loader = document.createElement('div'),
            containerRect = self.container.getBoundingClientRect();

        divIndicatorWrap.classList.add('busy-indicator-wrap');
        divIndicatorWrap.style.display = 'none';
        divIndicator.classList.add('busy-indicator');

        if(self.loaderClassName){
            loader.classList.add(self.loaderClassName);
        }else {
            if (self.container.offsetWidth < 640) {
                loader.classList.add('loading-small');
            } else if (self.container.offsetWidth < 1024 && self.container.offsetWidth > 641) {
                loader.classList.add('loading-med');
            } else if (self.container.offsetWidth < 1440 && self.container.offsetWidth > 1025) {
                loader.classList.add('loading-large');
            } else if (self.container.offsetWidth > 1441) {
                loader.classList.add('loading-extra-large');
            } else {
                loader.classList.add('loading-med');
            }
        }
        divIndicatorWrap.appendChild(divIndicator);
        divIndicator.appendChild(loader);
        self.container.appendChild(divIndicatorWrap);

        divIndicatorWrap.style.top = self.container.clientTop + 'px';
        divIndicatorWrap.style.left = self.container.clientLeft + 'px';

    }

    return BusyIndicator;
});