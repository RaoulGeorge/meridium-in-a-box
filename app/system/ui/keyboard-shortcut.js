define(function (require) {
    'use strict';
    var shortcut = require('shortcut');
    function KeyboardShortcuts() { }

    KeyboardShortcuts.prototype.createShortcut = function createShortcut(keyCombo, callback, options) {
        var shrtCut = {
            keyCombo: keyCombo,
            callback: callback,
            options: options
        };

        return shrtCut;
    };

    KeyboardShortcuts.prototype.registerShortcuts = function registerShortcuts(shortcuts) {
        if (!shortcut || !shortcuts) { return; }
        for (var i = 0; i < shortcuts.length; i++) {
            var keyboardShortcut = shortcuts[i];
            shortcut.add(keyboardShortcut.keyCombo, keyboardShortcut.callback, keyboardShortcut.options);
        }
    };

    KeyboardShortcuts.prototype.unregisterShortcuts = function unregisterShortcuts(shortcuts) {
        if (!shortcut || !shortcuts) { return; }
        for (var i = 0; i < shortcuts.length; i++) {
            var keyboardShortcut = shortcuts[i];
            shortcut.remove(keyboardShortcut.keyCombo);
        }
    };

    KeyboardShortcuts.prototype.unregisterAllShortcuts = function unregisterAllShortcuts() {
        if (!shortcut) { return; }
        for (var keyCombo in shortcut.all_shortcuts) {
            if (shortcut.all_shortcuts.hasOwnProperty(keyCombo)) {
                shortcut.remove(keyCombo);
            }
        }
    };

    KeyboardShortcuts.singleton = true;
    return new KeyboardShortcuts();
});