define(function (require) {
    'use strict';

    var _ = require('lodash');
    var ko = require('knockout'),
        PathValidator = require('./path-validator'),
        RefDoc = require('./refdoc-model');

    function RefDocs() {
        this.validator = Object.resolve(PathValidator);
        this.refdocs = [];
    }

    RefDocs.prototype.populate = function (data) {
        var i,
            name,
            desc,
            addedBy,
            addedOn,
            key,
            storedField,
            isStoredDocument,
            docType, isUncPath,
            isURL;

        this.refdocs = [];
        for (i = 0; i < data.length; i++) {
            name = findFieldValue(data[i].fields, 'CTIT_ID');
            desc = findFieldValue(data[i].fields, 'CTIT_DESC_TX');
            addedBy = findFieldValue(data[i].fields, 'MI_REF_DOCUMENTS_STORE_BY_C');
            addedOn = findFieldValue(data[i].fields, 'MI_REF_DOCUMENTS_LAST_UPDAT_DATE_D');
            storedField = findFieldValue(data[i].fields, 'MI_REF_DOCUMENTS_STORE_DOCUM_L');
            docType = findFieldValue(data[i].fields, 'MIRD_DOC_PATH_CHR');

            isURL = !!this.validator.isValidUrl(docType.value);
            isUncPath = !!this.validator.isValidUncPath(docType.value);
            docType = getExtension(docType.value);
            key = data[i].key;

            if (storedField.value === true || storedField.value === "True" || storedField.value === "true") {
                isStoredDocument = true;
            } else {
                isStoredDocument = false;
            }

            this.refdocs.push({
                'key': key, 'name': name.value || '-',
                'desc': desc.value || '-',
                'addedBy': addedBy.value || '-',
                'addedOn': addedOn.displayValue || '-',
                'isStoredDocument': isStoredDocument,
                'docType': docType,
                'isURL': isURL,
                'isUncPath' : isUncPath,
            });
        }
    };

    function findFieldValue(fields, param) {
        return _.find(fields, function (field) {
            return field.id === param;
        });
    }

    function getExtension(docType) {
        var str = docType.split('.');
        return str[str.length - 1];
    }
    return RefDocs;
});