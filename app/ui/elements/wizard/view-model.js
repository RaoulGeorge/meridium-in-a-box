define(function(require) {
    'use strict';

    var proto = Object.create(HTMLElement.prototype);
    var Translator = require('system/globalization/translator');

    proto.createdCallback = function() {
        var header = Element.build('header', this, ['header']),
            content = Element.build('div', this, ['content']),
            footer = Element.build('footer', this, ['footer']),
            next = Element.build('button', footer, ['next', 'btn', 'btn-primary', 'btn-text'], { name: 'next' }),
            finish = Element.build('button', footer, ['hidden', 'finish', 'btn', 'btn-primary', 'btn-text'], { name: 'finish' }),
            back = Element.build('button', footer, ['hidden', 'back', 'btn', 'btn-primary', 'btn-text'], { name: 'back' });

        this.steps = null;
        this.steps_length = null;
        this.stepItems = [];
        this.translator = Object.resolve(Translator);

        //Create Steps and Title if attributes are provided
        //in the HTML markup.
        if (this.getAttribute('title')) {
            var title = Element.build('h1', header);
            title.textContent = this.getAttribute('title');
        }
        if (this.getAttribute('data-steps')) {
            constructSteps(this, this.getAttribute('data-steps'));
        }

        back.innerHTML = this.translator.translate("PREVIOUS");
        next.innerHTML = this.translator.translate("NEXT");
        finish.innerHTML = this.translator.translate("FINISH");
    };

    proto.attachedCallback = function() {
        var footer = this.querySelector('footer');
        footer.addEventListener('click', this);
    };

    proto.detachedCallback = function() {
        var footer = this.querySelector('footer');
        footer.removeEventListener('click', this);
    };

    proto.handleEvent = function(event) {
        if(event.type === 'click'){
            if(event.target.tagName === 'BUTTON'){
                if(event.target.classList.contains('next') ||
                    event.target.classList.contains('back')){
                    clickHandler(this, event);
                } else if (event.target.classList.contains('finish')){
                    this.dispatchEvent(new CustomEvent('completed', { bubbles: true }));
                }
            }
        }
    };

    proto.attributeChangedCallback = function(attrName, oldValue, newValue) {
        switch(attrName) {
            case 'title': {
                    var title = this.querySelector('h1') || document.createElement('h1'),
                        header = this.querySelector('header');

                    title.textContent = newValue;
                    if (!!!header.querySelector('header')) {
                        header.insertBefore(title, header.querySelector('ul'));
                    }
                }
                break;
            case 'data-steps': {
                    constructSteps(this, newValue);
                }
                break;
            case 'data-active': {
                    var activeItem = this.querySelector('.active');
                    if(!!activeItem){
                        activeItem.classList.remove('active');
                    }
                    if(parseInt(newValue) > 0 && oldValue === "0"){
                        this.querySelector('.back').classList.remove('hidden');
                    }
                    if(newValue === "0" && parseInt(oldValue) > 0){
                        this.querySelector('.back').classList.add('hidden');
                    }
                    if(parseInt(newValue) === this.steps_length - 2){
                        this.querySelector('.next').classList.remove('hidden');
                        this.querySelector('.finish').classList.add('hidden');
                    }
                    if(parseInt(newValue) === this.steps_length - 1){
                        this.querySelector('.finish').classList.remove('hidden');
                        this.querySelector('.next').classList.add('hidden');
                    }
                    if(this.hasAttribute('data-valid')){
                        this.setAttribute('data-valid', 'false');
                    }
                    this.stepItems[newValue].classList.add('active');
                    this.dispatchEvent(new CustomEvent('active-changed', { bubbles: true }));
                }
                break;
            case 'data-valid': {
                    if(newValue === "true"){
                        this.querySelector('.next').removeAttribute('disabled');
                        this.querySelector('.finish').removeAttribute('disabled');
                    }else{
                        this.querySelector('.next').setAttribute('disabled', true);
                        this.querySelector('.finish').setAttribute('disabled', true);
                    }
                }
        }
    };

    function clickHandler(self, event) {
        traverseWizard(self, event.target);
    }

    function traverseWizard(self, target) {
        var active = parseInt(self.getAttribute("data-active"));
        if(target.classList.contains("cancel")){
            console.log("Wizard Canceled");
        }else{
            if(target.classList.contains("next")){
                active++;
                self.setAttribute("data-active", active);
            }
            if(target.classList.contains("back")){
                active--;
                self.setAttribute("data-active", active);
            }
        }
    }

    function constructSteps(self, steps) {
        var header = self.querySelector('header'),
            stepsContainer = Element.build('ul', header);

        self.steps = steps.split(',');
        self.steps_length = self.steps.length;
        //0.4% is provided as padding for each step
        self.step_width = ((100 - (0.4 * self.steps_length)) / self.steps_length);

        self.steps.forEach(function(step) {
            var item = Element.build('li', stepsContainer),
                content = Element.build('div', item);

            item.setAttribute('style', 'width: ' + self.step_width + '%;');
            content.innerHTML = step;

            self.stepItems.push(item);
        });

        self.stepItems[0].classList.add('active');
    }

    Element.registerElement('mi-wizard', { prototype: proto });
    return proto;
});