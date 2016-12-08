define(function (require) {
    'use strict';

    var _ = require('lodash');
    var $ = require('jquery');

    function DefaultConfig(self) {
        var defaultConfig = {
            allowColumnReordering: self.allowColumnReordering(),
            allowColumnResizing: self.allowColumnResizing(),
            columnAutoWidth: self.columnAutoWidth(),
            selection: {
                mode: self.selectionMode()
            },
            scrolling: {
                mode: self.scrollType()
            },
            sorting: loadSortingConfig(self),
            loadPanel: loadPanelConfig(self),
            noDataText: self.noDataCaptioin,
            editing: editConfig(self),
            wordWrapEnabled: self.wordWrapEnabled,
            onContextMenuPreparing: function (args) {
                //To Remove Right click on Column Header
                if (args.target === "header") {
                    args.items = [];
                }
            }
        };

        return defaultConfig;
    }

    function loadSortingConfig(self) {
        return {
            mode: self.sortingMode(),
            ascendingText: self.translator.translate('RG_SORT_ASCENDING_CAPTION'),
            descendingText: self.translator.translate('RG_SORT_DESCENDING_CAPTION'),
            clearText: self.translator.translate('RG_CLEAR_SORTING_CAPTION')
        };
    }

    function editConfig(self) {
        return {
            mode: self.editMode(),
            allowUpdating: self.allowRowEditing(),
            allowAdding: self.allowRowAdding(),
            allowDeleting: self.allowRowDeleting(),
            texts: {
                addRow: self.translator.translate('RG_ADD_ROW_HELP_TEXT'),
                cancelAllChanges: self.translator.translate('RG_CANCEL_CHANGES_HELP_TEXT'),
                deleteRow: self.translator.translate('RG_DELETE'),
                saveAllChanges: self.translator.translate('RG_SAVE_CHANGES_HELP_TEXT'),
                undeleteRow: self.translator.translate('RG_UNDELETE')
            }
        };
    }

    function loadPanelConfig(self) {
        return {
            enabled: true,
            showPane: false,
            text: ''
        };
    }

    return DefaultConfig;
});