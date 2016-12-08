(function () {
    'use strict';
    var scripts = [];

    function platformIsWindows() {
        return window.MSApp;
    }

    function platformIsAndroid() {
        return /Android/i.test(navigator.userAgent);
    }

    //function platformIsIOS() {
    //    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    //}

    if (platformIsWindows()) {
        cordova.platform = 'windows';
        scripts.push('windows/winJS');
        scripts.push('windows/winstore-jscompat');
        scripts.push('windows/windows');
    } else if (platformIsAndroid()) {
        cordova.platform = 'android';
        scripts.push('android/android');
    } else {//ios
        cordova.platform = 'ios';
        scripts.push('ios/ios');
    }

    for (var i = 0; i < scripts.length; i++) {
        document.writeln('<script src="lib/mobile-compat/' + scripts[i] + '.js"></script>');
    }

    //Begin scripts that run for all platforms

    //Meridium universal interface with Cordova file plugin
    //writes the file to the mobile platform's "local" filesystem with the given fileName,
    //then calls the given onSuccess function
    cordova.writeBinaryToLocalFile = function (binaryBlob, fileName, onSuccess){
        fileName = cordova.replaceFileNameSpacesWithUnderscoresToAvoidErrors(fileName);

        var createWriterCallback = function(fileWriter){
            fileWriter.onwriteend = onSuccess;
            fileWriter.write(binaryBlob);
        };
        var getFileCallback = function(file){
            file.createWriter(createWriterCallback);
        };
        var requestFileSystemCallback = function(fileSystem){
            fileSystem.root.getFile(fileName, { create: true }, getFileCallback);
        };
        window.requestFileSystem(window.TEMPORARY, 50 * 1024 * 1024, requestFileSystemCallback);
    };

    cordova.replaceFileNameSpacesWithUnderscoresToAvoidErrors = function(fileName) {
        fileName = fileName.replace(/[^A-Z0-9]/ig, "_");

        return fileName;
    };

    //Test override of window.open for mobile to use window.openInExternalBrowser
    window.open = function(URL){
      window.openInExternalBrowser.bind(this, URL);
  };
})();
