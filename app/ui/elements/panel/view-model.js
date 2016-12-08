define(function (require) {
    'use strict';

    var $ = require('jquery');


    var CASCADE_ATTRIBUTES = [
            'key',
            'description',
            'page',
            'page-size',
            'scroll-percent',
            'selector',
            'multiselect',
            'checked',
            'has-children',
            'use-html',
            'custom-filter',
            'delay',
            'custom-search'
        ];

    require('ui/elements/list-group/view-model');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function() {
        this.classList.add('expanded');

        createTitleBlock(this);
        createSubTitleBlock(this);

        this.tabBlock = this.querySelector('.tabs');
        if (this.tabBlock) {
            this.tabBlock.classList.add('expanded');
        }

        this.toolBar = this.querySelector('mi-tool-bar');

        this.listGroup = document.createElement('mi-list-group');
        this.listGroup.classList.add('list');
        this.listGroup.classList.add('expanded');
        if (this.toolBar) {
            this.listGroup.classList.add('hide-tool-bar');
            this.toolBar.classList.add('expanded');
        }
        this.appendChild(this.listGroup);
        cascadeAttributes(this, this.listGroup);
        this.listGroup.value = this.value;
        this.listGroup.loader = this.loader;
        this.listGroup.searchCallback = this.searchCallback;
        this.listGroup.filterViewModel = this.filterViewModel;

        createCollapsedBlock(this);

        setupTabs(this);
        changeTitle(this);
        changeSubtitle(this);
        addProperties(this);
    };

    proto.attachedCallback = function() {
        setListHeight(this);
        this.addEventListener('resize', this);
        this.listGroup.addEventListener('change', this);
        this.listGroup.addEventListener('click', this);
        this.titleBlock.addEventListener('click', this);
        this.collapsedBlock.addEventListener('click', this);
    };

    proto.handleEvent = function (e) {
        if (e.type === 'change') {
            setText(this);
        } else if (e.type === 'click' && e.target.tagName === 'I') {
            if (e.target.classList.contains('icon-collapse')) {
                this.classList.toggle('expanded');
                this.classList.toggle('collapsed');
            }
            if (e.target.classList.contains('icon-expand')) {
                this.classList.toggle('expanded');
                this.classList.toggle('collapsed');
            }
        } else if (e.type === 'resize') {
            setListHeight(this);
        } else if (e.type === 'click') {
            if(e.currentTarget.tagName === 'SECTION'){
                titleClick(this);
            }else if (e.target.tagName === 'MI-LI'){
                listGroupClick(this);
            }
        }
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
        if (attrName === 'title') {
            changeTitle(this);
        } if (CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
            this.listGroup.setAttribute(attrName, newVal);
        }
    };

    proto.reload = function() {
        this.listGroup.reload();
    };

    function createTitleBlock (self) {
        var element;

        self.titleBlock = document.createElement('section');
        self.insertBefore(self.titleBlock, self.firstElementChild);
        self.titleBlock.className = 'title list-group-item expanded active-title';
        element = document.createElement('div');
        element.className = 'block-group';
        self.titleBlock.appendChild(element);
        element = document.createElement('span');
        self.titleBlock.firstElementChild.appendChild(element);
        element = document.createElement('i');
        element.className = 'icon-collapse';
        self.titleBlock.firstElementChild.appendChild(element);
    }

    function createSubTitleBlock (self) {
        var element;

        self.subTitleBlock = document.createElement('section');
        self.insertBefore(self.subTitleBlock, self.titleBlock.nextSibling);
        self.subTitleBlock.className = 'sub-title expanded';
        element = document.createElement('div');
        element.className = 'list-group-item';
        self.subTitleBlock.appendChild(element);
        element = document.createElement('span');
        element.className = 'subtitle-header';
        self.subTitleBlock.firstElementChild.appendChild(element);
        element = document.createElement('span');
        element.className = 'subtitle-footer';
        self.subTitleBlock.firstElementChild.appendChild(element);
    }

    function createCollapsedBlock (self) {
        var element, div, verelement;

        self.collapsedBlock = document.createElement('section');
        self.collapsedBlock.className = 'collapsed';
        self.appendChild(self.collapsedBlock);

        element = document.createElement('i');
        element.className = 'icon-expand';
        self.collapsedBlock.appendChild(element);
        div = document.createElement('div');
        div.className = 'block-group';
        self.collapsedBlock.appendChild(div);
        verelement = document.createElement('div');
        verelement.className = 'verticle-block-group';
        div.appendChild(verelement);
        element = document.createElement('span');
        element.className = 'title';
        verelement.appendChild(element);
        element = document.createElement('span');
        element.className = 'subtitle';
        verelement.appendChild(element);
    }

    function addProperties (self) {
        self._value = null;
        self._loader = null;
        self._filterViewModel = null;
        self._searchCallback = null;
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });
        Element.defineProperty(self, 'filterViewModel', {
            get: getFilterViewModel.bind(null, self),
            set: setFilterViewModel.bind(null, self)
        });
        Element.defineProperty(self, 'searchCallback', {
            get: getSearchCallback.bind(null, self),
            set: setSearchCallback.bind(null, self)
        });

        self._listItemIconCallback = null;
        Element.defineProperty(self, 'listItemIconCallback', {
            get: getListItemIconCallback.bind(null, self),
            set: setListItemIconCallback.bind(null, self)
        });
    }

    function getListItemIconCallback(self) {
        return self._listItemIconCallback;
    }

    function setListItemIconCallback(self, value) {
        self._listItemIconCallback = value || null;
        self.listGroup ? self.listGroup.listItemIconCallback = value : '';
    }

    function getValue (self) {
        return self._value;
    }

    function setValue (self, value) {
        if (self.listGroup) {
            self.listGroup.value = value;
        }
        self._value = value;
    }

    function getLoader (self) {
        return self._laoder;
    }

    function setLoader (self, value) {
        if (self.listGroup) {
            self.listGroup.loader = value;
        }
        self._laoder = value;
    }

    function getFilterViewModel (self) {
        return self._filterViewModel;
    }

    function setFilterViewModel (self, value) {
        if (self.listGroup) {
            self.listGroup.filterViewModel = value;
        }
        self._filterViewModel = value;
    }

    function getSearchCallback(self) {
        return self._searchCallback;
    }

    function setSearchCallback(self, value) {
        if (self.listGroup) {
            self.listGroup.value = value;
        }
        self._value = value;
    }

	function setText(self) {
		var	value, text,
			description = self.getAttribute('description') || 'description',
			attr = self.getAttribute('use-html');

		if (!self.listGroup.value) {
			return;
		}

        self._value = self.listGroup.value;
		value = self.value[description];
		text = value instanceof Function ? value.call(self.value) : value;
		if (attr) {
            self.collapsedBlock.querySelector('span.subtitle').innerHTML = text;
		} else {
			self.collapsedBlock.querySelector('span.subtitle').textContent = text;
		}
	}

    function setupTabs (self) {
        var tabs = $(self.element).find('section.expanded section.tabs ul.nav-tabs li');
        if (tabs.length > 0) {
            showTabs(self);
            $(self.element).find('section.tabs li:first-child').addClass('active');
            $(self.element).find('section.tabs li').on('click', tabClick.bind(null, self));
        } else {
            hideTabs(self);
        }
    }

    function tabClick (self, event) {
        var tab = $(event.target).closest('li');

        if (tab.hasClass('active')) {
            return;
        } else {
            tab.siblings().removeClass('active');
            tab.addClass('active');
        }
    }

    function titleClick (self) {
        var titleBlock = $(self.titleBlock),
            listGroup = $(self.listGroup);

        if(titleBlock.hasClass('active-title')) {
            return;
        } else {
            titleBlock.addClass('active-title');
            listGroup.find('.active').removeClass('active');
        }
    }

    function listGroupClick (self) {
        var titleBlock = $(self.titleBlock);

        if (titleBlock.hasClass('active-title')) {
            titleBlock.removeClass('active-title');
        }
    }

    function showTabs (self) {
        self.showtabs = true;
        $(self.element).find('section.expanded section.tabs').show();
        setListHeight(self);
    }

    function hideTabs (self) {
        self.showtabs = false;
        $(self.element).find('section.expanded section.tabs').hide();
        setListHeight(self);
    }

    function changeTitle (self) {
        var newTitle = self.getAttribute('title');
        self.titleBlock.querySelector('span').textContent = newTitle;
        self.collapsedBlock.querySelector('span.title').textContent = newTitle + ' - ';
        if (newTitle) {
            self.titleBlock.firstElementChild.style.display = 'block';
        } else {
            self.titleBlock.firstElementChild.style.display = 'none';
        }
        setListHeight(self);
    }

    function changeSubtitle(self) {
        var subtitleHeader = self.getAttribute('subtitle-header'),
            subtitleFooter = self.getAttribute('subtitle-footer');

        self.subTitleBlock.querySelector('.subtitle-header').textContent = subtitleHeader;
        self.subTitleBlock.querySelector('.subtitle-footer').textContent = subtitleFooter;
        if (subtitleHeader || subtitleFooter) {
            self.subTitleBlock.firstElementChild.style.display = 'block';
        } else {
            self.subTitleBlock.firstElementChild.style.display = 'none';
        }
        setListHeight(self);
    }

    function setListHeight (self) {
        var list = self.querySelector('mi-list-group.list'),
            sibling = list.parentElement.firstElementChild,
            height = 0;

        while (sibling) {
            if (sibling !== list) {
                height += ((sibling.clientHeight < sibling.offsetHeight) ? sibling.offsetHeight : sibling.clientHeight);
            }
            sibling = sibling.nextElementSibling;
        }

        height = height.toString() + 'px';
        list.style.height = 'calc(100% - ' + height + ')';
    }

    function cascadeAttributes(self, dest) {
        var idx, attr;

        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            attr = self.getAttribute(CASCADE_ATTRIBUTES[idx]);
            if (attr) {
                dest.setAttribute(CASCADE_ATTRIBUTES[idx], attr);
            }
        }
    }

    document.registerElement('mi-panel', { prototype: proto });

    return proto;
});
