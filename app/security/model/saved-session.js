define(function (require, exports, module) {
    'use strict';

    var LogManager = require('system/diagnostics/log-manager'),
        logger = LogManager.getLogger(module.id),
        R = require('ramda');

    var MERIDIUM_SESSION = 'meridium-session',
        MERIDIUM_CULTURE = 'meridium-culture',
        MERIDIUM_USER_NAME = 'meridium-user-name',
        MERIDIUM_API_SERVER = 'meridium-server-name',
        MERIDIUM_DATA_SOURCE = 'meridium-data-source',
        DS_CLIPBOARD = 'DSClipboard',
        MERIDIUM_LOGGED_IN_USERS = 'meridium-logged-in-users',
        MILISECONDS_IN_SECOND = 1000,
        SECONDS_IN_MINUTE = 60,
        MINUTES_IN_HOUR = 60,
        HOURS_IN_DAY = 24;

    function SavedSession() {
        // do nothing
    }

    SavedSession.prototype.saveSession = function (session) {
        try {
            sessionStorage.setItem(MERIDIUM_SESSION, JSON.stringify(session));
            logUser(session.userId);
        } catch (error) {
            logger.error('Failed to save session to session storage - error:', error);
        }
    };

    SavedSession.prototype.getAllLoggedUsers = function () {
        return R.map(R.prop('userId'), getPreviouslyLoggedUsers());
    };

    function getPreviouslyLoggedUsers () {
        return JSON.parse(localStorage.getItem(MERIDIUM_LOGGED_IN_USERS));
    }

    function setLoggedUsers (users) {
        localStorage.setItem(MERIDIUM_LOGGED_IN_USERS, JSON.stringify(users));
    }

    var findUser = R.propEq('userId');

    function logUser (userId) {
        var users = getPreviouslyLoggedUsers() || [],
            now = Date.now(),
            existingUser = null,
            validUsers = null;

        existingUser = R.find(findUser(userId), users);

        if (!R.isNil(existingUser)) {
            existingUser.signin = now;
        } else {
            users.push({userId: userId, signin: now});
        }

        validUsers = removeExpiredUser(users);

        setLoggedUsers(validUsers);
    }

    function removeExpiredUser (users) {
        return R.filter(userIsValid, users);
    }

    function userIsValid (user) {
        var now = Date.now(),
            waybackwhen = new Date(user.signin),
            difference = now - waybackwhen,
            thirtydays = MILISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * 30;
        if (difference < thirtydays) {
            return true;
        }
        return false;
    }

    SavedSession.prototype.getSession = function () {
        try {
            return sessionStorage.getItem(MERIDIUM_SESSION);
        } catch (error) {
            logger.error('Failed to get session from session storage - error:', error);
            return false;
        }
    };

    SavedSession.prototype.deleteSession = function () {
        try {
            sessionStorage.removeItem(MERIDIUM_SESSION);
            sessionStorage.removeItem(DS_CLIPBOARD);
        } catch (error) {
            logger.error('Failed to remove session from session storage - error:', error);
        }
    };

    SavedSession.prototype.saveUserCulture = function (session) {
        try{
            localStorage.setItem(MERIDIUM_CULTURE, session.licensedCultureId);
        } catch (error) {
            logger.error('Failed to save user culture to local storage - error:', error);
        }
    };

    SavedSession.prototype.getUserCulture = function () {
        try{
            return localStorage.getItem(MERIDIUM_CULTURE);
        } catch (error) {
            logger.error('Failed to get user culture from local storage - error:', error);
            return "";
        }
    };

    SavedSession.prototype.saveUserId = function (userId) {
        try{
            localStorage.setItem(MERIDIUM_USER_NAME, userId);
        } catch (error) {
            logger.error('Failed to save user ID to local storage - error:', error);
        }
    };

    SavedSession.prototype.getUserId = function () {
        try{
            return localStorage.getItem(MERIDIUM_USER_NAME);
        } catch (error) {
            logger.error('Failed to get user ID from local storage - error:', error);
        }
    };

    SavedSession.prototype.saveApiServer = function (apiServer) {
        try{
            localStorage.setItem(MERIDIUM_API_SERVER, apiServer);
        } catch (error) {
            logger.error('Failed to save API server to local storage - error:', error);
        }
    };

    SavedSession.prototype.getApiServer = function () {
        try{
            return localStorage.getItem(MERIDIUM_API_SERVER);
        } catch (error) {
            logger.error('Failed to get API server from local storage - error:', error);
        }
    };

    SavedSession.prototype.saveDatasource = function (datasource) {
        try{
            localStorage.setItem(MERIDIUM_DATA_SOURCE, datasource);
        } catch (error) {
            logger.error('Failed to save datasource to local storage - error:', error);
        }
    };

    SavedSession.prototype.getDatasource = function () {
        try{
            return localStorage.getItem(MERIDIUM_DATA_SOURCE);
        } catch (error) {
            logger.error('Failed to get datasource from local storage - error:', error);
            return "";
        }
    };

    return new SavedSession();
});
