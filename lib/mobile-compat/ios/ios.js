(function () {
    'use strict';
    //attach a method for opening links in an external browser
    window.openInExternalBrowser = function (URL) {
        cordova.InAppBrowser.open(URL, "_system");
    };

    cordova.openLocalFile = function (fileName) {
      fileName = cordova.replaceFileNameSpacesWithUnderscoresToAvoidErrors(fileName);
      //cordova.file.applicationStorageDirectory = file:///var/mobile/Applications/B573905E-2B09-473A-8A93-38C6F9FCCDEA/
      var nativeUrl = (cordova.file.applicationStorageDirectory + "tmp/" + fileName).substring(7),
          fileArray = nativeUrl.split('.'),
          extension = fileArray[fileArray.length - 1],
          mimeType = null;

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
      
      cordova.plugins.fileOpener2.open(nativeUrl, mimeType);
    };
})();
