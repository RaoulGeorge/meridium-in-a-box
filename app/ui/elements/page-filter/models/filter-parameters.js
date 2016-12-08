define(function (require, exports, module) {
    'use strict';

    var _ = require('lodash');

    function FilterParameters(parameters) {
        parameters = parameters || {};
        parameters.parmDesigns = parameters.parmDesigns || [];
        this.__private__ = {};
        this.__private__.parameters = parameters;
    }

    FilterParameters.prototype.toQueryString = function () {
        var queryString = '';
        if (hasParameters(this)) {
            queryString += convertParametersToQueryString(this);
        }
        return queryString;
    };

    function hasParameters(self) {
        return !!getParameters(self).parmDesigns.length;
    }

    function getParameters(self) {
        return self.__private__.parameters;
    }

    function convertParametersToQueryString(self) {
        return _.chain(getParameters(self).parmDesigns || [])
            .map(toNameValuePair)
            .map(toNameStringPair)
            .map(toQueryStringSegment)
            .reduce(toQueryString)
            .value();
    }

    function toNameValuePair(parameter) {
        return {
            id: parameter.id,
            value: parameter.parmPrompts || []
        };
    }

    function toNameStringPair(parameter) {
        parameter.value = parameter.value.join(',');
        return parameter;
    }

    function toQueryStringSegment(parameter) {
        if (parameter.value === '%') {
            parameter.value = '%25';
        }

        return '&' + parameter.id + '=' + parameter.value;
    }

    function toQueryString(queryString, segment) {
        return queryString + segment;
    }

    return FilterParameters;
});