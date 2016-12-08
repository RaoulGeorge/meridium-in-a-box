define(function (require) {
    'use strict';

    var $ = require('jquery');


    var ko = require('knockout'),
        KnockoutViewModel = require('spa/ko/knockout-view-model'),
        Translator = require('system/globalization/translator'),
        MessageBox = require('system/ui/message-box'),
            view = require('text!../views/image-uploader.html');
    require('system/lang/object');
    require('system/knockout/bindings/hidden');

    function ImageUploader() {
        base.call(this, view);

        this.translator = Object.resolve(Translator);

        this.region = null;
        this.$fileElement = null;
        this.imgSrc = ko.observable();
        this.fileData = null;
        this.selectedFile = ko.observable();
    }

    var base = Object.inherit(KnockoutViewModel, ImageUploader);

    ImageUploader.prototype.attach = function (region) {
        base.prototype.attach.apply(this, arguments);
        this.region = region;
        this.$fileElement = this.region.$element.find('input[type="file"]');
    };

    ImageUploader.prototype.detach = function () {
        base.prototype.detach.apply(this, arguments);
    };

    ImageUploader.prototype.setImage = function (url) {
        var control;
        this.imgSrc(url);
        this.fileData = null;
        if (!url) {
            $("#fileopen").val("");
        }
    };

    ImageUploader.prototype.chooseFile = function (self, event) {
        if (!this.region) {
            return;
        }

        if (!this.imgSrc()) {
            this.$fileElement.click();
            event.preventDefault();
        }
    };

    ImageUploader.prototype.fileChosen = function () {
        handleFiles(this, this.$fileElement.get(0).files);
    };

    ImageUploader.prototype.translate = function (key) {
        return this.translator.translate(key);
    };

    //ImageUploader.prototype.dragenter = function (self, event) {
    //    event.stopPropagation();
    //    event.preventDefault();
    //};
    //
    //ImageUploader.prototype.dragover = function (self, event) {
    //    event.stopPropagation();
    //    event.preventDefault();
    //};
    //
    //ImageUploader.prototype.drop = function (self, event) {
    //    event.stopPropagation();
    //    event.preventDefault();
    //
    //    var dt = event.originalEvent.dataTransfer;
    //    var files = dt.files;
    //
    //    handleFiles(this, files);
    //};

    function handleFiles(self, files) {
        if (files.length < 1) {
            return;
        }

        //limit file size to 5mb
        var maxSize = 4 * 1024 * 1024;
        if (files[0].size > maxSize) {
            MessageBox.showOk(
                self.translator.translate('FILE_TOO_LARGE'),
                self.translator.translate('ERROR'), null);
            return;
        }

        // only supporting one file.
        var file = files[0];
        var imageType = /image.*/;

        if (!file.type.match(imageType)) {
            return;
        }

        var reader = new FileReader();
        reader.onload = onFileLoadedAsDataUrl.bind(null, self);
        reader.readAsDataURL(file);
        self.selectedFile(file);
    }

    function onFileLoadedAsDataUrl(self, e) {
        var dataUrl = e.target.result;

        self.imgSrc(dataUrl);
        self.fileData = dataUrl.substring(dataUrl.indexOf(',') + 1);
    }

    return ImageUploader;
});