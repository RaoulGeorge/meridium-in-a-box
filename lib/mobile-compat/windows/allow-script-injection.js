(function () {
    //THIS IS A PRE-CORDOVA SCRIPT INJECTION, DO NOT ATTEMPT TO LOAD IT THROUGH loader.js
    if (window.MSApp && MSApp.execUnsafeLocalFunction) {
        var masterCopy = {};
        masterCopy.writeCopy = document.write;
        document.write = function (html) {
            MSApp.execUnsafeLocalFunction(masterCopy.writeCopy.bind(document, html));
        }

        masterCopy.writelnCopy = document.writeln;
        document.writeln = function (html) {
            MSApp.execUnsafeLocalFunction(masterCopy.writelnCopy.bind(document, html));
        }

        masterCopy.insertCopy = HTMLElement.prototype.insertAdjacentHTML;
        HTMLElement.prototype.insertAdjacentHTML = function (position, html) {
            MSApp.execUnsafeLocalFunction(masterCopy.insertCopy.bind(this, position, html));
        }
    }
}());