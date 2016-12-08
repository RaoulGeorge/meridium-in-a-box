define(function (require) {
    'use strict';

    function RefDocViewEvents() {
        this.IsValidPath = false;
        this.IsLink = false;
        this.AddRefSuccess = false;
        this.AddRefFail = false;
    }

    RefDocViewEvents.prototype.IsValidUrl = function IsValidUrl(url) {
        var re_weburl = new RegExp(
                          "^" +
                            // protocol identifier
                            "(?:(?:https?|ftp)://)" +
                            // user:pass authentication
                            "(?:\\S+(?::\\S*)?@)?" +
                            "(?:" +
                              // IP address dotted notation octets
                              // excludes loopback network 0.0.0.0
                              // excludes reserved space >= 224.0.0.0
                              // excludes network & broacast addresses
                              // (first & last IP address of each class)
                              "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                              "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                              "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                            "|" +
                              // host name
                              "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
                              // domain name
                              "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
                              // TLD identifier
                              "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
                            ")" +
                            // port number
                            "(?::\\d{2,5})?" +
                            // resource path
                            "(?:/\\S*)?" +
                          "$", "i"
                        );
        var res = re_weburl.test(url);
        return res;
    };

    //Cannot find a regular expression that compiles for javascript/grunt/jshint and works properly
    RefDocViewEvents.prototype.IsValidUnc = function IsValidUnc(unc) {
        var filter = '^[a-zA-Z]:\\.*|^\\\\.*';
        //var filter = '^((?:[a-zA-Z]:)|(?:\\{2}\w[-\w]*)\$?)\\(?!\.)((?:(?![\\/:*?<>"|])(?![.\x20](?:\\|$))[\x20-\x7E])+\\(?!\.))*((?:(?:(?![\\/:*?<>"|])(?![ .]$)[\x20-\x7E])+)\.((?:(?![\\/:*?<>"|])(?![ .]$)[\x20-\x7E]){2,15}))?';
        //var filter = '^((?:[a-zA-Z]:)|(?:\\{2}\\w[-\\w]*)\\$?)\\(?!\\.)((?:(?![\\/:*?<>"|])(?![.x20](?:\\|$))[x20-x7E])+\\(?!\\.))*((?:(?:(?![\\/:*?<>"|])(?![ .]$)[x20-x7E])+)\\.((?:(?![\\/:*?<>"|])(?![ .]$)[x20-x7E]){2,15}))?$';
        var re_unc = new RegExp(filter);
        var res = re_unc.test(unc);
        return res;
    };

    RefDocViewEvents.prototype.ValidatePath = function ValidatePath(path) {
        this.IsValidPath = this.IsValidUrl(path) || this.IsValidUnc(path);
        return this.IsValidPath;
    };

    RefDocViewEvents.prototype.IsStoredDocChecked = function IsStoredDocChecked(self) {
        var storedDoc = self !== null && self.datasheet.entity.fields._byId.MI_REF_DOCUMENTS_STORE_DOCUM_L.attributes.value;
        return storedDoc;
    };

    RefDocViewEvents.prototype.GetPath = function GetPath(self) {
        var path = "";
        if (self !== null) {
            path = self.datasheet.entity.fields._byId.MIRD_DOC_PATH_CHR.attributes.value;
        }
        return path;
    };

    RefDocViewEvents.prototype.Reset = function Reset() {
        this.IsValidPath = false;
        this.IsLink = false;
        this.AddRefSuccess = false;
        this.AddRefFail = false;
    };

    return RefDocViewEvents;
});