define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        ApplicationEvents = require('application/application-events'),
        Region = require('spa/region'),
        view = require('text!./template.html'),
        Translator = require('system/globalization/translator'),
        CASCADE_ATTRIBUTES = [
            'title',
            'count',
            'text',
            'icon',
            'color',
            'delay',
            'details'
        ],
        CASCADE_COLORS = [
                'blue',
                'green',
                'gold',
                'red',
                'gray'
        ];

    require('bootstrap');
    require('ui/elements/tab-group/view-model');
    require('ui/elements/tab-group-item/view-model');
    require('ui/elements/tool-bar/view-model');
    require('system/lang/object');
    require('system/lang/string');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        this.element = this;
        this.element.innerHTML = view;
        this.title = this.getAttribute('title');
        this.boxGroup = null;
        this.scrollGroup = null;
        this.selectedIndx = null;
        this.inFour = null;
        addProperties(this);
        //this.$element = null;
        //this.selectedBox = null;

        //base.call(this, view);
        this.translator = Object.resolve(Translator);

        if (this.loader) {
            this.load();
        }
    };

    proto.attachedCallback = function () {
        //this.element.innerHTML = view;
        //this.tabGroup = $(this.element).find('mi-tab-group')[0];
        //Element.upgrade(this.tabGroup1);
        //var boxGroup = getBoxSection(this);
        //boxGroup.addEventListener('click', this);
        //this.JSONfile = this.getAttribute('JSONfile');
        //this.populateBoxGroup(this.getAttribute('JSONfile'));
        //this.JSONdata = this.getAttribute('JSONdata');
        //this.populateBoxGroup(this.getAttribute('JSONdata'));
        this.boxGroup = $(this.element).find('.box-element');
        this.scrollGroup = $(this.element).find('.sliding-window');
        //if (this.title) {
        //    setTitle(this.title);
        //}
        //this.backgroundClickListener();
    };

    proto.detachedCallback = function () {
        //base.prototype.detach.call(this, region);
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'title') {
            $(this.element).find('span.title')[0].innerHTML = this.getAttribute('title');
            //setTitle(this);
        }
        //if (attrName === 'JSONfile') {
        //    populateBoxGroup(this);
        //}
    };

    proto.handleEvent = function (e) {
        var action;
        if (e.type === 'click') {
            if (e.target.tagName === 'square_one') {
                //makeActive(this, e.target.value, e.selecting);
            }
        }
    };

    //proto.reload = function () {
    //    var box = getBoxSection(this);

    //    if (box) {
    //        this.resume();
    //        Element.clearDom(box);
    //        this.load().done();
    //    }
    //};

    //proto.pause = function () {
    //    this.paused = true;
    //};

    //proto.resume = function () {
    //    this.paused = false;
    //};

    proto.load = function () {
        var dfd;
        if (this.loader) {
            //this.pause();
            dfd = this.loader();
            dfd.done(populateBoxGroup.bind(null, this));
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    //function loaderDone(self, data) {
    //    if (data) {
    //        populateBoxGroup(self, data);
    //    }
    //}

    proto.backgroundClickListener = function () {

        $('.scrollright').click(function (event) {
            event.preventDefault();
            //var zz = $('.sliding-window').attr('index');
            $('.table-container').animate({scrollRight:'+=304'}, 'slow',function(){
                $(this).animate({ scrollRight: 0 }, 0, function () { });
                $('.sliding-window>:first', this).appendTo($('.sliding-window', this));
            });

            $('.table-container2').animate({ scrollRight: '+=304' }, 'slow', function () {
                $(this).animate({ scrollRight: 0 }, 0, function () { });
                $('.sliding-window2>:first', this).appendTo($('.sliding-window2', this));
            });

        });

        $('.scrollleft').click(function (event) {
            event.preventDefault();
            //var zz = $('.sliding-window').attr('index');
            $('.sliding-window>:last').prependTo($('.sliding-window'));
           	$('.table-container').animate({ scrollRight: 304 }, 0).animate({ scrollRight: 0 }, 'slow');

           	$('.sliding-window2>:last').prependTo($('.sliding-window2'));
           	$('.table-container2').animate({ scrollRight: 304 }, 0).animate({ scrollRight: 0 }, 'slow');
       });

    };

    function populateBoxGroup(self, data) {
        self.inFour = data;
        for (var i = 0; i < data.length; i++) {
            var classname = '', text = '';
            if (data[i].color) {
                for (var x = 0; x < CASCADE_ATTRIBUTES.length; x++) {
                    if (data[i].color === CASCADE_ATTRIBUTES[x]) {
                        self.$element.find('.square_one').addClass(CASCADE_ATTRIBUTES[x]);
                    }
                }
            }
            if (data[i].icon) {
                text = text + '<i class="' + data[i].icon + '"></i><br>';
            }            
            text = text + '<span class="number">' + data[i].number + '</span>';
            text = text + '<span class="text">' + data[i].text + '</span>';
            self.boxGroup.find('.square_one')[i].innerHTML = text;
            self.boxGroup.find('.square_one')[i].style.color = data[i].color;
            self.boxGroup.find('.square_one')[i].style.borderRightColor = data[i].color;
            //self.selectedIndx = i;
            self.boxGroup.find('.square_one')[i].addEventListener('click', self);
        }
        self.boxGroup.on('click', onBoxClicked.bind(null, self));
    }

    function populateScroll(self, index) {
        var scrollGroup = $(self.element).find('.sliding-window')[0];
        var scrollDetails = $(self.element).find('.sliding-window2')[0];
        scrollGroup.setAttribute('index', index);
        var i = parseInt(index);
        for (i; i < (self.inFour.length + parseInt(index)) ; i++) {
            var x = i;
            if (x >= self.inFour.length) {
                x = i - self.inFour.length;
            }
            //var classname = '', text = '';
            var scrollDiv, spanNumber, spanText, rightNavDiv, divDetails, pDetails;

            scrollDiv = document.createElement('div');
            scrollDiv.className = 'scroll_one';
            scrollDiv.setAttribute('index', x);
            
            spanNumber = document.createElement('span');
            spanNumber.className = 'number';
            spanNumber.innerHTML = self.inFour[x].number;
            scrollDiv.appendChild(spanNumber);
            spanText = document.createElement('span');
            spanText.className = 'text';
            spanText.innerHTML = self.inFour[x].text;
            scrollDiv.appendChild(spanText);
            scrollDiv.style.color = self.inFour[x].color;
            scrollDiv.style.borderRightColor = self.inFour[x].color;
            scrollGroup.appendChild(scrollDiv);

            rightNavDiv = document.createElement('div');
            rightNavDiv.className = "scrollright";
            rightNavDiv.innerHTML = '<i class="icon-right-arrow"></i>';
            rightNavDiv.addEventListener('click', self);

            scrollDiv.appendChild(rightNavDiv);

            //scrollGroup.appendChild(rightNavDiv);

            divDetails = document.createElement('div');
            divDetails.className = "notification-area";
            pDetails = document.createElement('p');
            pDetails.innerHTML = self.inFour[x].details;
            //var xx = $(self.element).find('.notification-area');
            divDetails.appendChild(pDetails);
            scrollDetails.appendChild(divDetails);

            //text = text + '<span class="number">' + self.inFour[x].number + '</span>';
            //text = text + '<span class="text">' + self.inFour[x].text + '</span>';
            //var xx = self.scrollGroup.find('.scroll_one')[x];
            //self.scrollGroup.find('.scroll_one')[x].innerHTML = text;
            //self.scrollGroup.find('.scroll_one')[x].style.color = self.inFour[x].color;
            //self.scrollGroup.find('.scroll_one')[x].style.borderRightColor = self.inFour[x].color;
        }

        self.backgroundClickListener();
        //populateDetails(index);
    }

    //function populateDetails(index) {
       
    //    var pDetails = document.createElement('p');
    //    pDetails.innerHTML = self.inFour[index].details;
    //    var xx = $(self.element).find('.notification-area');
    //    $(self.element).find('.notification-area').appendChild(pDetails);

    //    //$(self.element).find('.notification-area').innerHTML = self.inFour[index].details;
    //}

    function onBoxClicked(self, e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        //var xx = e.target.getAttribute('index');
        self.selectedIndx = e.target.getAttribute('index');
        populateScroll(self, e.target.getAttribute('index'));
        hideTiles(self);
        //self.backgroundClickListener();
    }

    proto.setTabWidth = function () {
        this.$element.find('.tab-group-item').addClass(this.tabWidthClass);
    };

    function myFunction(dataFromServer) {
        var parsedJSON = JSON.parse(dataFromServer.d);
        for (var i = 0; i < parsedJSON.length; i++) {
            alert(parsedJSON[i].Id);
        }
    }

    //function populateTile1() {
    //    this.tab1 = $(this.element).find('mi-list-group')[0];
    //    Element.upgrade(this.listGroup1);

    //    $(this.tab1).attr('description', this.getAttribute('description-1'));
    //    $(this.tab1).attr('key', this.getAttribute('key-1'));
    //}

   // proto.tab1Clicked = function tab1Clicked() {
   //     this.region.$element.find('.tabs-notification-area').html('<kbd> Reference Document clicked </kbd> <br />');
   // };

   // proto.tab2Clicked = function tab2Clicked() {
   //     this.region.$element.find('.tabs-notification-area').html('<kbd> Linked Assets clicked </kbd> <br />');
   // };

   //proto.tab3Clicked = function tab3Clicked() {
   //     this.region.$element.find('.tabs-notification-area').html('<kbd> Team Members clicked </kbd> <br />');
   // };

   // proto.tab4Clicked = function tab4Clicked() {
   //     this.region.$element.find('.tabs-notification-area').html('<kbd> Analyses clicked </kbd> <br />');
   // };


    //function loadUntilValueFound(self) {
    //    if (!self.value) {
    //        return;
    //    }

    //    if (!makeActive(self, self.value)) {
    //        if (self.paused) {
    //            self.value = null;
    //        } else {
    //            nextPage(self);
    //            self.load().done(loadUntilValueFound.bind(null, self));
    //        }
    //    }
    //}

    function setTitle(self) {
        $(self.element).find('span.title')[0].innerHTML = self.getAttribute('title');
    }

    function hideTiles(self) {
        $(self.element).find('.scroll-section').css('display', 'block');
        $(self.element).find('.tiles-section').css('display', 'none');
    }

    function hideScroll(self) {
        $(self.element).find('.scroll-section').css('display', 'none');
        $(self.element).find('.tiles-section').css('display', 'block');
    }

    //function changeTitle(self) {
    //    var newTitle = self.getAttribute('title');       
    //    if (newTitle) {
    //        var span = $(self.element).find('span.title');
    //        if (span.hasOwnProperty('textContent')) {
    //            span.textContent = newTitle;
    //        } else {
    //            span.innerText = newTitle;
    //        }

    //        var xx1 = $(self.element).find('span.title');
    //        $(self.element).find('span.title').innerHTML = newTitle;
    //        self.titleSection = $(self.element).find('.title-section');
    //        self.titleSection.innerText = newTitle;
    //        var xx2 = $(self.titleSection).find('span.title');
    //        $(self.titleSection).find('span.title').textContent = newTitle;
    //    }
    //}

    //function getBoxSection(self) {
    //    var boxGroups = self.querySelectorAll('.box-element');
    //    return boxGroups.length === 0 ? null : boxGroups[boxGroups.length - 1];
    //}

    function addProperties(self) {
        self.translator = Object.resolve(Translator);
        self._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });
        Element.defineProperty(self, 'selected', {
            get: getSelected.bind(null, self),
            set: setSelected.bind(null, self)
        });
    }

    function getLoader(self) {
        return self._loader;
    }

    function setLoader(self, value) {
        self._loader = value;
        self.load();
    }

    function getSelected(self) {
        return self._value;
    }

    function setSelected(self, value) {
        self._selected = value;
    }

    document.registerElement('mi-bulletin-board', { prototype: proto });

    return proto;

});