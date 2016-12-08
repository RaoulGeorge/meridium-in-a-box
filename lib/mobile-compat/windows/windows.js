(function() {
    'use strict';
    window.alert = function (text) {
        //Windows.UI.Popups.MessageDialog(text, "Alert").showAsync();
        //USE THIS DIALOG FOR DEBUGGING ONLY, IF YOU TRY TO OPEN ONE WHEN ANOTHER IS ALREADY OPEN IT WILL CRASH THE APP
    };
    //temporary until all confirm calls are moved out of the application
    window.confirm = function (text) {
        return true;
    };
    var app = WinJS.Application;
    app.addEventListener("error", function (err) {
        //Windows.UI.Popups.MessageDialog(err, "Caught App Error").showAsync();
        //USE THIS DIALOG FOR DEBUGGING ONLY, IF YOU TRY TO OPEN ONE WHEN ANOTHER IS ALREADY OPEN IT WILL CRASH THE APP
        return true;
    });
    //attach a method for opening links in an external browser
    window.openInExternalBrowser = function (URL) {
        var URI = Windows.Foundation.Uri(URL);
        Windows.System.Launcher.launchUriAsync(URI);
    };
    //opens the local file (probably put there by writeBinaryToLocalFile) in the native platform.
    //should open a "how do you wish to open this file" dialog on the platform you are using
    cordova.openLocalFile = function (fileName) {
        fileName = cordova.replaceFileNameSpacesWithUnderscoresToAvoidErrors(fileName);
        var folder = Windows.Storage.ApplicationData.current.temporaryFolder;
        cordova.plugins.fileOpener2.open(folder.path + '\\' + fileName, null);
    };
}());
