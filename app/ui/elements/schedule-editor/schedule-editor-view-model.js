define(function (require) {
    'use strict';

    var _ = require('lodash');
    var ko = require('knockout'),        
        SecurityService = require('security/services/security-service'),
        AjaxClient = require('system/http/ajax-client'),
        Translator = require('system/globalization/translator'),
        ScheduleModel = require('scheduling/models/schedule-model');
    require('system/lang/object');
    require('ui/elements/date-time/date-time-control');
    require('ui/elements/select/view-model');
    require('ui/elements/radio/radio-view-model');
    var Converter = require('system/lang/converter');
    var translator = Object.resolve(Translator);
    var scheduleTypeList = [{ name: 'Recurring', value: 'Recurring' }, { name: 'One time only', value: 'OneTime' }];
    var allEndOnOptions = [{ name: translator.translate('DATETIME'), value: 'EndTime' }, { name: translator.translate('AFTER'), value: 'Occurrence' }, { name: translator.translate('NEVER'), value: 'NoEnd' }];
    var allExecuteOnOptions = [{ name: translator.translate('FRM_START'), value: 'RegularIntervalsFromStartDate' },
        { name: translator.translate('AFTR_LAST_OCC'), value: 'ExactlyAfterLastOccurrence' },
        { name: translator.translate('ON_DAYS_WEEK'), value: 'SelectedWeekDays' },
        { name: translator.translate('ON_DAYS_MONTH'), value: 'SelectedDaysOfMonth' }];

    var allIntervalUnits = [{ name: translator.translate('MINUTES'), value: 'Minute' },
            { name: translator.translate('HOURS'), value: 'Hour' },
            { name: translator.translate('DAYS'), value: 'Day' },
            { name: translator.translate('WEEKS'), value: 'Week' },
            { name: translator.translate('MONTHS'), value: 'Month' },
            { name: translator.translate('YEARS'), value: 'Year' }];

    var weekdayList = [{ name: translator.translate('MONDAY'), value: 2 },//monday
            { name: translator.translate('TUESDAY'), value: 3 },//tuesday
            { name: translator.translate('WEDNESDAY'), value: 4 },//wednesday
            { name: translator.translate('THURSDAY'), value: 5 },//thursday
            { name: translator.translate('FRIDAY'), value: 6 },//friday
            { name: translator.translate('SATURDAY'), value: 7 },//saturday
            { name: translator.translate('SUNDAY'), value: 1 }];//sunday

    var dayOfMonthList = [{ name: '1', value: 1 }, { name: '2', value: 2 }, { name: '3', value: 3 }, { name: '4', value: 4 }, { name: '5', value: 5 },
                               { name: '6', value: 6 }, { name: '7', value: 7 }, { name: '8', value: 8 }, { name: '9', value: 9 }, { name: '10', value: 10 },
                               { name: '11', value: 11 }, { name: '12', value: 12 }, { name: '13', value: 13 }, { name: '14', value: 14 }, { name: '15', value: 15 },
                               { name: '16', value: 16 }, { name: '17', value: 17 }, { name: '18', value: 18 }, { name: '19', value: 19 }, { name: '20', value: 20 },
                               { name: '21', value: 21 }, { name: '22', value: 22 }, { name: '23', value: 23 }, { name: '24', value: 24 }, { name: '25', value: 25 },
                               { name: '26', value: 26 }, { name: '27', value: 27 }, { name: '28', value: 28 }, { name: '29', value: 29 }, { name: '30', value: 30 },
                               { name: '31', value: 31 }];

    var monthList = [{ name: translator.translate('JANUARY'), value: 1 },
            { name: translator.translate('FEBRUARY'), value: 2 },
            { name: translator.translate('MARCH'), value: 3 },
            { name: translator.translate('APRIL'), value: 4 },
            { name: translator.translate('MAY'), value: 5 },
            { name: translator.translate('JUNE'), value: 6 },
            { name: translator.translate('JULY'), value: 7 },
            { name: translator.translate('AUGUST'), value: 8 },
            { name: translator.translate('SEPTEMBER'), value: 9 },
            { name: translator.translate('OCTOBER'), value: 10 },
            { name: translator.translate('NOVEMBER'), value: 11 },
            { name: translator.translate('DECEMBER'), value: 12 }];

    var weekNumberList = [{ name: translator.translate('FIRST_1'), value: 'First' },
        { name: translator.translate('SECOND_2'), value: 'Second' },
        { name: translator.translate('THIRD_3'), value: 'Third' },
        { name: translator.translate('FOURTH_4'), value: 'Fourth' },
        { name: translator.translate('LAST_N'), value: 'Last' }];


    var defaultOptions = {
        minInterval: 'Minute',
        maxInterval: 'Year',
        hideTimeZone: false,
        hideEndTime: false,
        hideFromLastOccurrence: false
    };

    function ScheduleEditorViewModel(params) {
        var self = this;
        self.subsriptions = [];
        self.translator = translator;
        self.schedule = new ScheduleModel();
        self.scheduleParameter = params.schedule;        
        self.disableParameter = params.disable;
        self.isValidParameter = params.isValid;

        self.options = params.options ? _.defaults(ko.unwrap(params.options), defaultOptions) : _.clone(defaultOptions);
        // Setup all Lists
        self.scheduleTypeList = scheduleTypeList;
        self.executeOnOptionList = ko.observableArray();
        self.endOnOptionList = ko.observableArray();

        var minIntervalIndex = _.findIndex(allIntervalUnits, { value: self.options.minInterval });
        var maxIntervalIndex = _.findIndex(allIntervalUnits, { value: self.options.maxInterval });

        self.intervalUnitList = _.take(allIntervalUnits.slice(minIntervalIndex), maxIntervalIndex + 1);
       
        self.weekdayList = weekdayList;        
        self.dayOfMonthList = dayOfMonthList;        
        self.monthList = monthList;        
        self.weekNumberList = weekNumberList;

        self.timeZoneList = ko.observableArray([]);
        var securityService = Object.resolve(SecurityService);
        securityService.getTimezones().done(function (data) {
            self.timeZoneList(data);
        });

        // Default timezone as user's timezone
        var meridiumToken = AjaxClient.headers().MeridiumToken;
        if (self.schedule.timeZone() === null || self.schedule.timeZone() === undefined || self.schedule.timeZone() === '') {
            self.schedule.timeZone(meridiumToken.split(';')[1]);
        }

        // Initial load from parameter
        self.isParameterString = true;
        var scheduleParameterValue = ko.unwrap(self.scheduleParameter);
        if (_.isString(scheduleParameterValue)) {
            self.isParameterString = true;
            self.schedule.loadFromJSONString(scheduleParameterValue);
        } else if (_.isPlainObject(scheduleParameterValue)) {
            self.isParameterString = false;
            self.schedule.loadFromDTO(scheduleParameterValue);
        }

        setExecuteOnOptions(self, self.schedule.intervalUnit());
        if (!self.options.hideEndTime) {
            setEndOnOptions(self, self.schedule.executeOnOption());
        } else {
            self.schedule.endOnOption('NoEnd');
        }


        // Setup subscriptions       
        self.subsriptions.push(self.schedule.intervalUnit.subscribe(setExecuteOnOptions.bind(null, self)));       

        if (!self.options.hideEndTime) {
            self.subsriptions.push(self.schedule.executeOnOption.subscribe(setEndOnOptions.bind(null, self)));
        }

        if (ko.isObservable(self.scheduleParameter)) {
            self.subsriptions.push(self.scheduleParameter.subscribe(onScheduleParameterChanged.bind(null, self)));            
        }
        self.subsriptions.push(self.schedule.currentValue.subscribe(writeBack.bind(null, self)));
        writeBackIsValid(self);
    }

    ScheduleEditorViewModel.prototype.dispose = function dispose() {
        var self = this;
        _.each(self.subsriptions, function (subscription) {
            subscription.dispose();
        });
    };

    function onScheduleParameterChanged(self, newValue) {
        var existingScheduleAsJSON = self.schedule.toJSONString();

        if (!self.isParameterString) {       
            var model = new ScheduleModel();
            model.loadFromDTO(newValue);
            newValue = model.toJSONString();           
        }

        if (newValue !== existingScheduleAsJSON) {
            self.schedule.loadFromJSONString(newValue);
        }
    }

    function writeBack(self, newValue) {
        writeBackIsValid(self);
        writeBackSchedule(self);        
    }

    function writeBackIsValid(self)
    {
        if (ko.isObservable(self.isValidParameter)) {
            var errors = ko.validation.group(self.schedule);
            if (errors().length > 0) {
                errors.showAllMessages();
                self.isValidParameter(false);
            } else {
                self.isValidParameter(true);
            }
        }
    }

    function writeBackSchedule(self)
    {
        if (ko.isObservable(self.scheduleParameter)) {
            if (self.isParameterString) {
                self.scheduleParameter(self.schedule.toJSONString());
            }
            else {
                self.scheduleParameter(self.schedule.toDTO());
            }
        }
    }

    function setExecuteOnOptions(self, intervalUnit) {
        var options = allExecuteOnOptions.slice(0);
        switch (intervalUnit) {
            case 'Day':
            case 'Hour':
            case 'Minute':
                options = _.filter(options, function (item) {
                    return (item.value === 'RegularIntervalsFromStartDate' || item.value === 'ExactlyAfterLastOccurrence');
                });
                if (self.schedule.executeOnOption() !== 'RegularIntervalsFromStartDate' && self.schedule.executeOnOption() !== 'ExactlyAfterLastOccurrence') {
                    self.schedule.executeOnOption('RegularIntervalsFromStartDate');
                }
                break;
            case 'Week':
                options = _.filter(options, function (item) {
                    return item.value !== 'SelectedDaysOfMonth';
                });
                break;
        }
        if (self.options.hideFromLastOccurrence) {
            options = _.reject(options, {
                value: 'ExactlyAfterLastOccurrence'
            });
        }
        self.executeOnOptionList(options);       
    }

    function setEndOnOptions(self, executeOnOption) {
        var options = allEndOnOptions.slice(0);
        if (executeOnOption  === 'ExactlyAfterLastOccurrence') {
            options = _.filter(options, function (item) { return item.value !== 'Occurrence'; });
            if (self.schedule.endOnOption() === 'Occurrence') {
                self.schedule.endOnOption('NoEnd');
            }
        }
        self.endOnOptionList(options);

    }
   
    return ScheduleEditorViewModel;

});