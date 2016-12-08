(function () {
    'use strict';


    // Android compatibility shim
    //   1. Allows locking and unlocking of the screen orientation
    //   2. On screen orientation change, recalculates height for the body & html.
    //      This is a fix for Android's keyboard squashing the input instead of focusing on it.
    var masterCopy = {};
    masterCopy.changeOrientation = screen.lockOrientation;
    screen.LockOrientation = function (direction) {
        masterCopy.changeOrientation.bind(this, direction);
        calculateHeight();
    };
    function calculateHeight() {
        var windowInnerHeight = window.innerHeight + 'px';
        document.querySelector('html').style.height = windowInnerHeight;
        document.querySelector('body').style.height = windowInnerHeight;
    }

    calculateHeight();

    //attach a method for opening links in an external browser
    window.openInExternalBrowser = function (URL) {
        cordova.InAppBrowser.open(URL, "_system");
    };
    cordova.openLocalFile = function (fileName) {
        fileName = cordova.replaceFileNameSpacesWithUnderscoresToAvoidErrors(fileName);
          //cordova.file.externalCacheDirectory = file:///storage/emulated/0/Android/data/com.meridium.apmv4/cache/
      var nativeUrl = cordova.file.externalCacheDirectory + fileName,
          fileArray = nativeUrl.split('.'),
          extension = fileArray[fileArray.length - 1],
          mimeType = null,
          pluginCallbackObject = {
              error: onFileOpenError
          };

      switch (extension) {
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'tiff':
          case 'gif':
          case 'bmp':
              mimeType = 'image/*';
              break;
          case 'xlsx':
          case 'xls':
          case 'csv':
          case 'doc':
          case 'docx':
          case 'rtf':
          case 'xml':
              mimeType = 'application/*';
              break;
          case 'pdf':
              mimeType = 'application/pdf';
              break;
          case 'html':
              mimeType = 'text/web';
              break;
          default:
              mimeType = '*/*';
              break;
      }
      cordova.plugins.fileOpener2.open(nativeUrl, mimeType, pluginCallbackObject);
    };

    function onFileOpenError(e) {
        console.log('Unable to open file');

        if (e) {
            console.log(e);
        }
    }

    document.addEventListener('backbutton', function(e) {
        e.preventDefault();
    });
})();
