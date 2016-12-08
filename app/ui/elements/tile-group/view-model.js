define(function (require) {
    'use strict';

    var $ = require('jquery');
    var _ = require('lodash');


    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        Converter = require('system/lang/converter'),
        ParameterContainerDTO = require('query/services/dto/parameter-container-dto'),
        Translator = require('system/globalization/translator'),
        ScreenSize = require('ui/screen-size'),
        CASCADE_ATTRIBUTES = [
            'key',
            'number',
            'query',
            'catalogpath',
            'queryparams',
            'text',
            'icon',
            'color',
            'columns',
            'width',
            'tiles',
            'rowfilter',
            'selectionmode'
        ],
        OFFSET = 192,
        XS_OFFSET = 42;

    require('ui/elements/tile-group-item/view-model');
    require('ui/elements/resultgrid/resultgrid-view-model');
    require('ui/elements/page-filter/page-filter-element');

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = function () {
        var tileGroup, rgDiv, resultGrid, pageFilterElement;

        this.loadPromise = null;
        this.__private__ = {
            'screenSize': Object.resolve(ScreenSize),
        };
        addProperties(this);
        this.classList.add('nav-tile-group');
        tileGroup = document.createElement('div');
        tileGroup.className = 'tile-group';
        this.appendChild(tileGroup);

        this.selectedIndex = null;
        this.currentTiles = null;
        this.columns = this.getColumns();
        generateDOM(this);
    };

    function getScreenSize(self) {
        return self.__private__.screenSize;
    }

    proto.attachedCallback = function () {
        var tileGroup = getTileSection(this);

        //if page-filter component does not exist then consider content section height
        this.pageContentHeight = $(tileGroup).closest('mi-page-filter').height() || $(tileGroup).closest('section.content').height();
        
        tileGroup.addEventListener('click', this);
        $(window).bind('resize', setResultgridHeight.bind(this, this));
    };

    proto.attributeChangedCallback = function (attrName, oldValue, newValue) {
        var tiles, idx,
            tileGroup = getTileSection(this);


        if (tileGroup && CASCADE_ATTRIBUTES.indexOf(attrName) > -1) {
            tiles = tileGroup.getElementsByTagName('mi-tile');
            for (idx = 0; idx < tiles.length; idx++) {
                tiles[idx].setAttribute(attrName, newValue);
            }
        }
    };

    proto.handleEvent = function (e) {
        var action;

        if (e.type === 'click') {
            if (e.target.tagName === 'MI-TILE') {
                if (getScreenSize(this).isTooSmallForAllPages()) {
                    openTilesPopup(this);
                } else {
                    makeActive(this, e);
                }
            }
        }
    };

    function openTilesPopup(self) {
        if ($(self).find('.tiles-popup').length) {
            $(self).find('.tiles-popup').remove();
            return;
        }
        var popupDiv = document.createElement('div');
        popupDiv.classList.add('tiles-popup');

        var popupTiles = _.map(self.currentTiles, function (tile, idx) {
            var number = $('<span/>').append(tile.number).addClass('number');
            var text = $('<span/>').append(tile.text).addClass('text');
            return $('<div/>').append([number, text]).addClass('popup-tile').data('idx', idx).on('click', function (e) {
                var index = $(e.currentTarget).data('idx');
                if (parseInt(index) !== parseInt(self.selectedIndex)) {
                    makeActive(self, { detail: index, target: $(self).find('mi-tile')[index] });
                }
                popupDiv.remove();
            });
        });
        $(popupDiv).append(popupTiles).appendTo(self);
    }

    proto.update = function () {
        var dfd;
        if (this.loader && this.currentTiles) {
            this.pause();
            dfd = this.loader();
            dfd.done(compareItems.bind(null, this));
            return dfd.promise();
        }
    };

    proto.updateAll = function () {
        var dfd;
        if (this.loader && this.currentTiles) {
            this.pause();
            dfd = this.loader();
            dfd.done(updateAllTiles.bind(null, this));
            return dfd.promise();
        }
    };

    proto.reload = function () {
        var group = getTileSection(this);

        if (group && !this.currentTiles) {
            this.resume();
            Element.clearDom(group);
            this.loadPromise = this.load().done();
        }
    };

    proto.pause = function () {
        this.paused = true;
    };

    proto.resume = function () {
        this.paused = false;
    };

    proto.load = function () {
        var dfd;
        if (this.loader) {
            this.pause();
            dfd = this.loader();
            dfd.done(generateDOM.bind(null, this));
            return dfd.promise();
        } else {
            return $.Deferred().done().promise();
        }
    };

    proto.getColumns = function getColumns() {
        return Converter.toInteger(this.getAttribute('columns'));  //Number of columns
    };

    proto.getState = function () {
        var activeTile = null, resultgridPlaceholder = [];
        var tileGroupContents;
        activeTile = this.querySelector('mi-tile > .active');
        if(!activeTile) {
            this.selectedIndex = null;
        }
        if (this.selectedIndex !== null) {
            resultgridPlaceholder = this.querySelectorAll('.rg-' + this.selectedIndex);
        }
        tileGroupContents = { 'resultgridPlaceholder': resultgridPlaceholder, 'selectedIndex': this.selectedIndex };
        return tileGroupContents;
    };

    proto.updateState = function(tileGroupContents) {
        $.when(this.loadPromise)
            .always(setState.bind(null, this, tileGroupContents));
    };

    proto.disableButton = function (tileIndex, btnClass, value) {
        var rgDiv = $(document).find('.resultgrid-placeholder.rg-' + tileIndex)[0];
        var resultGrid = $(rgDiv).find('mi-resultgrid')[0];
        if (resultGrid) {
            resultGrid.disableButton(btnClass, value);
        }
    };

    proto.setNoAccess = function (tileIndex, btnClass, value) {
        var rgDiv = $(document).find('.resultgrid-placeholder.rg-' +tileIndex)[0];
        var resultGrid = $(rgDiv).find('mi-resultgrid')[0];
        if (resultGrid) {
            resultGrid.setNoAccess(btnClass, value);
        }
    };

    proto.showButton = function (tileIndex, btnClass, value) {
        var rgDiv = $(document).find('.resultgrid-placeholder.rg-' + tileIndex)[0];
        var resultGrid = $(rgDiv).find('mi-resultgrid')[0];
        if (resultGrid) {
            resultGrid.showButton(btnClass, value);
        }
    };

    function setState(self, tileGroupContents) {
        var tileGroup, activeTile = null, dashboard, index;
        if (tileGroupContents && tileGroupContents.selectedIndex !== null) {
            self.selectedIndex = tileGroupContents.selectedIndex;

            if (tileGroupContents.resultgridPlaceholder.length > 0) {
                self.appendChild(tileGroupContents.resultgridPlaceholder[0]);
            }
            tileGroup = getTileSection(self);
            if (self.selectedIndex !== null) {
                activeTile = tileGroup.querySelector('mi-tile[index="' + self.selectedIndex + '"]');
            }
            dashboard = $(tileGroup).closest('.region').find('mi-dashboard')[0];

            if (activeTile) {
                index = activeTile.getAttribute('index');
                activeTile.setAttribute('selected', true);
                makeActive(self, { detail: index, target: { value: activeTile } });
            }
            else {
                dashboard.style.display = 'block';
            }
        }
    }

    function getOffset(self) {
        return getScreenSize(self).isTooSmallForAllPages() ? XS_OFFSET : OFFSET;
    }

    function populateResultGrid(self, idx, tile) {
        var resultGrid;
        var value = tile.value;
        if (!value) {
            return;
        }

        if (value.query && (value.query.length > 0 || $.isNumeric(value.query))) {
            populateGridFromQuery(self, value, idx);
        } else if (value.catalogpath && (value.catalogpath.length > 0 || $.isNumeric(value.catalogpath))) {
            populateGridFromPath(self, value, idx);
        }

        tile.setAttribute('selected', 'true');
        if (self.contentCallback) {
            var rgDiv = $(document).find('.resultgrid-placeholder.rg-' + idx)[0];
            if (!rgDiv) {
                rgDiv = document.createElement('div');
                rgDiv.className = 'resultgrid-placeholder';
                rgDiv.classList.add('rg-' + idx);
                rgDiv.style.height = self.pageContentHeight - getOffset(self) + 'px';
                if ($('mi-tile .rectangle-box.active').length === 0) {
                    rgDiv.style.display = 'none';
                }
                self.appendChild(rgDiv);
            }
            resultGrid = $(rgDiv).find('mi-resultgrid')[0];
            if (resultGrid && value.rowfilter) {
                resultGrid.setAttribute('showrowfilter', value.rowfilter);
            }
            if (resultGrid && value.selectionmode) {
                resultGrid.setAttribute('selectionmode', value.selectionmode);
            }
            var options = { index: idx, key: value.key, container: rgDiv };
            return self.contentCallback(options);
        }
    }

    function populateGridFromQuery(self, value, index) {
        var resultGrid,
            rgDiv = $(document).find('.resultgrid-placeholder.rg-' + index)[0];
        if (!rgDiv) {
            rgDiv = document.createElement('div');
            rgDiv.className = 'resultgrid-placeholder';
            rgDiv.classList.add('rg-' + index);
            rgDiv.style.height = self.pageContentHeight - getOffset(self) + 'px';
            if ($('mi-tile .rectangle-box.active').length === 0) {
                rgDiv.style.display = 'none';
            }
        }
        resultGrid = $(rgDiv).find('mi-resultgrid')[0];
        if (!resultGrid) {
            resultGrid = document.createElement('mi-resultgrid');
            resultGrid.setAttribute('queryexecutionmode', 'sqlStatement');
            if (value.queryparams) {
                resultGrid.queryParams = value.queryparams;
            }
            resultGrid.setAttribute('data', value.query);
            if (value.rowfilter) {
                resultGrid.setAttribute('showrowfilter', value.rowfilter);
            }
            if (value.selectionmode) {
                resultGrid.setAttribute('selectionmode', value.selectionmode);
            } else {
                resultGrid.setAttribute('selectionmode', 'single');
            }
            Element.upgrade(resultGrid);
            rgDiv.appendChild(resultGrid);
            self.appendChild(rgDiv);
            _.defer(configureResultGrid.bind(null, self, resultGrid, index, value.key));
        }
    }

    function populateGridFromPath(self, value, index) {
        var pageFilterElement = self.querySelector('mi-page-filter');
        var resultGrid,
            rgDiv = $(document).find('.resultgrid-placeholder.rg-' + index)[0];
        if (!rgDiv) {
            rgDiv = document.createElement('div');
            rgDiv.className = 'resultgrid-placeholder';
            rgDiv.classList.add('rg-' + index);
            rgDiv.style.height = self.pageContentHeight - getOffset(self) + 'px';
            if ($('mi-tile .rectangle-box.active').length === 0) {
                rgDiv.style.display = 'none';
            }
        }
        resultGrid = $(rgDiv).find('mi-resultgrid')[0];
        if (!resultGrid) {
            resultGrid = document.createElement('mi-resultgrid');
            resultGrid.setAttribute('queryexecutionmode', 'catalogItemPath');
            if (value.queryparams) {
                resultGrid.queryParams = value.queryparams;
            }
            resultGrid.setAttribute('data', value.catalogpath);
            if (value.rowfilter) {
                resultGrid.setAttribute('showrowfilter', value.rowfilter);
            }
            if (value.selectionmode) {
                resultGrid.setAttribute('selectionmode', value.selectionmode);
            } else {
                resultGrid.setAttribute('selectionmode', 'single');
            }
            Element.upgrade(resultGrid);
            rgDiv.appendChild(resultGrid);
            self.appendChild(rgDiv);
            _.defer(configureResultGrid.bind(null, self, resultGrid, index, value.key));
        }
    }

    function addProperties(self) {
        self.translator = Object.resolve(Translator);

        self.paused = false;
        self._loader = null;
        Element.defineProperty(self, 'loader', {
            get: getLoader.bind(null, self),
            set: setLoader.bind(null, self)
        });

        self._value = null;
        Element.defineProperty(self, 'value', {
            get: getValue.bind(null, self),
            set: setValue.bind(null, self)
        });

        Element.defineProperty(self, 'items', {
            get: getItems.bind(null, self),
            set: setItems.bind(null, self)
        });

        Element.defineProperty(self, 'selectedItems', {
            get: getSelectedItems.bind(null, self),
            set: setSelectedItems.bind(null, self)
        });

        self._contentCallback = null;
        Element.defineProperty(self, 'contentCallback', {
            get: getContentCallback.bind(null, self),
            set: setContentCallback.bind(null, self)
        });

        self._loadConfigurableButtons = null;
        Element.defineProperty(self, 'loadConfigurableButtons', {
            get: getButtons.bind(null, self),
            set: setButtons.bind(null, self)
        });

        self._loadButtonClickCallback = null;
        Element.defineProperty(self, 'loadButtonClickCallback', {
            get: getButtonClickCallback.bind(null, self),
            set: setButtonClickCallback.bind(null, self)
        });

        self.singleSelectCallback = null;
        Element.defineProperty(self, 'loadSingleRowSelectCB', {
            get: getSingleSelectCallback.bind(null, self),
            set: setSingleSelectCallback.bind(null, self)
        });

        self.multiSelectCallback = null;
        Element.defineProperty(self, 'loadMultiRowSelectCB', {
            get: getMultiSelectCallback.bind(null, self),
            set: setMultiSelectCallback.bind(null, self)
        });

        self.gridLoadedCallback = null;
        Element.defineProperty(self, 'loadGridLoadedCB', {
            get: getGridLoadedCallback.bind(null, self),
            set: setGridLoadedCallback.bind(null, self)
        });

        self._passSelectedRowsData = false;
        Element.defineProperty(self, 'passSelectedRowsData', {
            get: getLoadSelectedRows.bind(null, self),
            set: setLoadSelectedRows.bind(null, self)
        });
    }

    function getLoader(self) {
        return self._loader;
    }

    function setLoader(self, value) {
        self._loader = value;
        self.reload();
    }

    function getValue(self) {
        return self._value;
    }

    function setValue(self, value) {
        self._value = value;
    }

    function getItems(self) {
        var tileGroup = getTileSection(self),
            tiles, tileList = [], idx;

        if (tileGroup) {
            tiles = tileGroup.querySelectorAll('mi-tile');
            for (idx = 0; idx < tiles.length; idx++) {
                tileList[tileList.length] = tiles[idx].value;
            }
        }
        return tileList;
    }

    function setItems(self, value) {
        var tileList = getTileSection(self);

        if (tileList) {
            Element.clearDom(tileList);
            if (value) {
                generateDOM(self, value);
            }
        }
    }

    function getSelectedItems(self) {
        var tileGroup = getTileSection(self),
            tiles, tileList = [], idx;

        if (tileGroup) {
            tiles = tileGroup.querySelectorAll('mi-tile[selected="true"]');
            for (idx = 0; idx < tiles.length; idx++) {
                tileList[tileList.length] = tiles[idx].value;
            }
        }
        return tileList;
    }

    function setSelectedItems(self, v) {
        var idx, element, tiles,
            tileGroup  = getTileSection(self);

        if (v) {
            tiles = tileGroup.querySelectorAll('mi-tile');
            for (idx = 0; idx < v.length; idx++) {
                tiles[idx].setAttribute('selected', 'true');
            }
        }
    }

    function getContentCallback(self) {
        return self._contentCallback;
    }

    function setContentCallback(self, value) {
        self._contentCallback = value;
    }

    function getButtons(self) {
        return self._loadConfigurableButtons;
    }

    function setButtons(self, value) {
        self._loadConfigurableButtons = value;
    }

    function getButtonClickCallback(self) {
        return self._loadButtonClickCallback;
    }

    function setButtonClickCallback(self, value) {
        self._loadButtonClickCallback = value;
    }

    function getSingleSelectCallback(self) {
        return self.singleSelectCallback;
    }

    function setSingleSelectCallback(self, value) {
        self.singleSelectCallback = value;
    }

    function getMultiSelectCallback(self) {
        return self.multiSelectCallback;
    }

    function setMultiSelectCallback(self, value) {
        self.multiSelectCallback = value;
    }

    function getGridLoadedCallback(self) {
        return self.gridLoadedCallback;
    }

    function setGridLoadedCallback(self, value) {
        self.gridLoadedCallback = value;
    }

    function getLoadSelectedRows(self) {
        return self._passSelectedRowsData;
    }

    function setLoadSelectedRows(self, value) {
        self._passSelectedRowsData = value;
    }

    function configureResultGrid(self, resultGrid, index, tileKey) {
        assignButtonsToResultGrid(self, resultGrid, index, tileKey);
        if (resultGrid.selectionMode() === "single") {
            assignSingleRowSelectCallback(self, resultGrid, index, tileKey);
        }
        else {
            assignMultiRowSelectCallback(self, resultGrid, index, tileKey);
        }
        assignGridLoadedCallback(self, resultGrid, index, tileKey);
    }

    function assignButtonsToResultGrid(self, resultGrid, index, tileKey) {
        if (self._loadConfigurableButtons) {
            resultGrid.loadConfigurableButtons = self._loadConfigurableButtons.bind(null, index, tileKey);
            assignButtonClickHandlersToResultGrid(self, resultGrid, index, tileKey);
        }
    }

    function assignButtonClickHandlersToResultGrid(self, resultGrid, index, tileKey) {
        if (self._loadButtonClickCallback) {
            resultGrid.toolbarItemClickCallback = assignButtonClickCB.bind(null, self, resultGrid, index, tileKey);
        }
    }

    function assignSingleRowSelectCallback(self, resultGrid, index, tileKey) {
        if (self.singleSelectCallback) {
            resultGrid.onRowSelectCB = self.singleSelectCallback.bind(null, index, tileKey);
        }
    }

    function assignMultiRowSelectCallback(self, resultGrid, index, tileKey) {
        if (self.multiSelectCallback) {
            resultGrid.onRowMultiSelectCB = self.multiSelectCallback.bind(null, index, tileKey);
        }
    }

    function assignGridLoadedCallback(self, resultGrid, index, tileKey) {
        if (self.gridLoadedCallback) {
            resultGrid.gridLoadedCB = assignGridLoadedCB.bind(null, self, resultGrid, index, tileKey);
        }
    }

    function assignButtonClickCB(self, resultGrid, index, tileKey, action, e) {
        var selectedRows;
        if (self._passSelectedRowsData) {
            selectedRows = resultGrid.gridInstance.getSelectedRowsData();
            if (resultGrid.selectionMode() === "single") {
                if (selectedRows) {
                    selectedRows = selectedRows[0];
                }
            }
            self._loadButtonClickCallback.bind(null, index, tileKey, selectedRows, action, e)();
        }
        else {
            self._loadButtonClickCallback.bind(null, index, tileKey, action, e)();
        }
    }

    function assignGridLoadedCB(self, resultGrid, index, tileKey, gridInstance) {
        var selectedRows;
        if (self._passSelectedRowsData) {
            selectedRows = resultGrid.gridInstance.getSelectedRowsData();
            if (resultGrid.selectionMode() === "single") {
                if (selectedRows) {
                    selectedRows = selectedRows[0];
                }
            }
            self.gridLoadedCallback.bind(null, index, tileKey, selectedRows, gridInstance)();
        }
        else {
            self.gridLoadedCallback.bind(null, index, tileKey, gridInstance)();
        }
    }

    function generateDOM(self, data) {
        var i, tile, tileGroup = getTileSection(self),
            attr = self.getAttribute('columns'),
            tileWidth, col;
        if (attr) {
            if (data) {
                col = (parseInt(attr) > data.length) ? data.length : parseInt(attr);
            } else {
                col = parseInt(attr);
            }
            tileWidth = (100 - (col - 1) * 0.5)/col + '%';
            //tileWidth = ((100 -col + 4) / col) + '%';
        }
        if (tileGroup) {
            for (i = 0; i <col; i++) {
                tile = document.createElement('mi-tile');
                tile.setAttribute('width', tileWidth);
                tileGroup.appendChild(tile);
                if (data) {
                    cascadeAttributes(self, tile, i, data[i]);
                    tile.value = data[i];
                }
            }
        }
        if (data) {
            self.currentTiles = self.items;
            for (var j = 0; j < col; j++) {
                if (data[j].selected === true) {
                    makeActive(self, { detail: j, target: { value: data[j] } });
                    break;
                }
            }
            if (getScreenSize(self).isTooSmallForAllPages()) {
                data[0].selected === true;
                makeActive(self, { detail: 0, target: { value: data[0] } });
            }
        }
    }

    function updateAllTiles(self, data) {
        var i, idx, activeTile,
            tileGroup = getTileSection(self);

        if (self.currentTiles) {
            for (idx = 0; idx < self.currentTiles.length; idx++) {
                for (i = 0; i < data.length; i++) {
                    if (self.currentTiles[idx].key === data[i].key) {
                        var tile = tileGroup.getElementsByTagName('mi-tile')[idx];
                        updateResultGrid(self, tile, data[i], idx);
                        tile.setAttribute('number', data[i].number);
                        tile.setAttribute('text', data[i].text);
                        tile.setAttribute('icon', data[i].icon);
                        tile.setAttribute('color', data[i].color);
                        break;
                    }
                }
            }

            if (getScreenSize(self).isTooSmallForAllPages()) {
                data[0].selected === true;
                activeTile = self.getElementsByClassName('active');
                if (activeTile && activeTile[0]) {
                    activeTile[0].classList.remove('active');
                }                
                makeActive(self, { detail: 0, target: { value: data[0] } });
            }
        }
    }

    function compareItems(self, data) {
        var i, idx,
            tileGroup = getTileSection(self);

        if (self.currentTiles) {
            for (idx = 0; idx < self.currentTiles.length; idx++) {
                for (i = 0; i < data.length; i++) {
                    if (self.currentTiles[idx].key === data[i].key) {
                        var tile = tileGroup.getElementsByTagName('mi-tile')[idx];
                        updateTile(self, self.currentTiles[idx], tile, data[i], idx);
                        break;
                    }
                }
            }
        }
    }

    function updateResultGrid(self, tile, value, idx) {
        var rgDiv = $(document).find('.resultgrid-placeholder.rg-' + idx)[0];
        if (rgDiv) {
            rgDiv.parentNode.removeChild(rgDiv);
        }
        var attr = tile.getAttribute('selected');
        if (attr && attr === 'true') {
            tile.removeAttribute('selected');
        }
        if (self.selectedIndex === idx &&
                ((value.query && value.query.length > 0) || (value.catalogpath && value.catalogpath.length > 0) ||
                (self.contentCallback))) {
            populateResultGrid(self, idx, tile);
        }
    }

    function updateTile(self, oldValue, tile, newValue, idx) {
        if (newValue !== oldValue) {
            tile.value = newValue;

            if ((oldValue.query !== newValue.query) || (oldValue.catalogpath !== newValue.catalogpath)) {
                var rgDiv = $(document).find('.resultgrid-placeholder.rg-' + idx)[0];
                if (rgDiv) {
                    rgDiv.parentNode.removeChild(rgDiv);
                }
                var attr = tile.getAttribute('selected');
                if (attr && attr === 'true') {
                    tile.removeAttribute('selected');
                }
                if ((newValue.query && newValue.query.length > 0) && self.selectedIndex === idx) {
                    populateResultGrid(self, idx, tile);
                }
            }

            if (oldValue.number !== newValue.number) {
                tile.setAttribute('number', newValue.number);
            }
            if (oldValue.text !== newValue.text) {
                tile.setAttribute('text', newValue.text);
            }
            if (oldValue.icon !== newValue.icon) {
                tile.setAttribute('icon', newValue.icon);
            }
            if (oldValue.color !== newValue.color) {
                tile.setAttribute('color', newValue.color);
            }
            self.currentTiles[idx] = tile.value;
        }
    }

    function cascadeAttributes(self, dest, index, value) {
        var idx, attr;
        dest.setAttribute('index', index);
        for (idx = 0; idx < CASCADE_ATTRIBUTES.length; idx++) {
            attr = self.getAttribute(CASCADE_ATTRIBUTES[idx]);
            if (attr) {
                dest.setAttribute(CASCADE_ATTRIBUTES[idx], value[attr]);
            }
        }
    }

    function makeActive(self, e) {
        var tileList,tile, attr,
            idx = parseInt(e.detail), prev,
            active = self.getElementsByClassName('active'),
            inactiveTiles = null,
            addInactive = false;

        self.selectedIndex = idx;
        if (active && active.length > 0) {
            prev = parseInt(active[0].parentElement.getAttribute('index'));
            active[0].classList.add('inactive-tile');
            active[0].classList.remove('active');
        } else {
            addInactive = true;
        }
        hideResultGrid();

        var tileGroup = getTileSection(self);
            tileList = tileGroup.querySelectorAll('mi-tile');
            tile = tileList[idx];
            var dashboard = $(tileGroup).closest('.region').find('mi-dashboard')[0];
        if (tile !== undefined && idx !== prev) {
            tile.firstChild.classList.remove('inactive-tile');
            tile.firstChild.classList.add('active');

            attr = tile.getAttribute('selected');
            if(addInactive){
                inactiveTiles = tileGroup.querySelectorAll('mi-tile > :not(.active)');
                for(var index = 0; index < inactiveTiles.length; index++){
                    inactiveTiles[index].classList.add('inactive-tile');
                }
            }
            if (attr && attr === 'true') {
                showResultGrid(tile);
            } else {
                tile.value = e.target.value;
                populateResultGrid(self, parseInt(e.detail), tile);
                raiseSelecting(self, e);
            }
            if (dashboard) {
                dashboard.style.display = 'none';
            }
        } else {
            for (var ind = 0; ind < tileList.length; ind++) {
                tileList[ind].firstChild.classList.remove('inactive-tile');
            }
            if (dashboard) {
                dashboard.style.display = 'block';
                dashboard.redrawAll();
            }
        }
    }

    function raiseSelecting(self, e) {
        var idx = Object.tryMethod(e.target, 'getAttribute', 'index') || 0,
            key = e.target.value.key,
            rgDiv = $(document).find('.resultgrid-placeholder.rg-' + idx)[0];

        if (!rgDiv) {
            rgDiv = document.createElement('div');
            rgDiv.className = 'resultgrid-placeholder';
            rgDiv.classList.add('rg-' + idx);
            rgDiv.style.height = self.pageContentHeight - getOffset(self) + 'px';
            self.appendChild(rgDiv);
        }

        var selectingEvent = new CustomEvent('tile-selected', {
            detail: { index: idx, key: key, container: rgDiv },
            bubbles: true,
            cancelable: true
        });
        self.dispatchEvent(selectingEvent);
    }

    function setResultgridHeight(self) {
        var tileGroup = getTileSection(self);

        //if page-filter component does not exist then consider content section height
        self.pageContentHeight = $(tileGroup).closest('mi-page-filter').height() || $(tileGroup).closest('section.content').height();
             
        var tiles = tileGroup.getElementsByTagName('mi-tile');
        for (var idx = 0; idx < tiles.length; idx++) {
            if ($(document).find('.resultgrid-placeholder.rg-' + idx).length) {
                $(document).find('.resultgrid-placeholder.rg-' + idx)[0].style.height = self.pageContentHeight - getOffset(self) + 'px';
            }
        }
    }

    function hideResultGrid() {
        $(document).find('.resultgrid-placeholder').css('display', 'none');
    }

    function showResultGrid(self) {
        var cssClass = ('.rg-' + self.getAttribute('index'));
        var rgDiv = $(document).find(cssClass), grid = rgDiv.find('mi-resultgrid')[0];
        rgDiv.css('display', 'block');
        _.delay(function(){
            if (grid) {
                grid.repaint();
            }            
        }, 100);                  
    }

    function getTileSection(self) {
        var tileGroups = self.querySelectorAll('.tile-group');
        return tileGroups.length === 0 ? null : tileGroups[tileGroups.length - 1];
    }

    document.registerElement('mi-tile-group', { prototype: proto });

    return proto;
});