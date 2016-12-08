define(function(require) {
    'use strict';

    var sjcl = require('sjcl');

    function PasswordEncryption() {
        //do nothing
    }

    PasswordEncryption.prototype.getEncryptedPassword = function(userName, password) {
        return hash(password + hash(userName));
    };

    function hash(value) {
        return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(value));
    }

    return PasswordEncryption;
});