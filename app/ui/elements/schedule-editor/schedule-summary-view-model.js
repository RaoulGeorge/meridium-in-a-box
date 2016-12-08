define(function (require) {
    'use strict';

    var _ = require('lodash');
    var ko = require('knockout'),
        AjaxClient = require('system/http/ajax-client'),
        Translator = require('system/globalization/translator'),
        Formatter = require('system/text/formatter'),
        ScheduleModel = require('scheduling/models/schedule-model');

    require('system/lang/object');
    var moment = require('moment');
    var formatter = Object.resolve(Formatter);
    var translator = Object.resolve(Translator);
    var weekDaysName = [translator.translate('SUNDAY'), translator.translate('MONDAY'), translator.translate('TUESDAY'),
        translator.translate('WEDNESDAY'), translator.translate('THURSDAY'), translator.translate('FRIDAY'), translator.translate('SATURDAY')];
    var monthsList = [translator.translate('JANUARY'), translator.translate('FEBRUARY'), translator.translate('MARCH'), translator.translate('APRIL'),
        translator.translate('MAY'), translator.translate('JUNE'), translator.translate('JULY'), translator.translate('AUGUST'),
        translator.translate('SEPTEMBER'), translator.translate('OCTOBER'), translator.translate('NOVEMBER'), translator.translate('DECEMBER')];

    function ReadableSheduleViewModel(params) {
        var self = this;
        self.subscriptions = [];        
        self.scheduleParameter = params.schedule;
        self.readableSchedule = ko.observable();
        setReadableSchedule(self, ko.unwrap(self.scheduleParameter));
        self.subscriptions.push(self.scheduleParameter.subscribe(setReadableSchedule.bind(null, self)));
    }

    ReadableSheduleViewModel.prototype.dispose = function dispose() {
        var self = this;
        _.each(self.subsriptions, function (subscription) {
            subscription.dispose();
        });
    };

    function setReadableSchedule(self, scheduleParameterValue) {
        if (!scheduleParameterValue) {
            self.readableSchedule(''); // should we set as 'None' or 'Not Defined' or 'Not scheduled'
            return;
        }
        var schedule = new ScheduleModel();
        if (_.isString(scheduleParameterValue)) {
            schedule.loadFromJSONString(scheduleParameterValue);
        } else if (_.isPlainObject(scheduleParameterValue)) {
            schedule.loadFromDTO(scheduleParameterValue);
        }
        self.readableSchedule(getReadableSchedule(schedule));
    }

    function getReadableSchedule(schedule) {

        var dateFormat = 'MM/DD/YYYY hh:mm a';
        var readableSchedule = '';

        if (schedule.scheduleType() === 'OneTime') {
             readableSchedule = readableSchedule + translator.translate('SCHEDULE_SUMMARY_ONCE_ON').format(formatter.format(schedule.startDate(),'g'), schedule.timeZone());
        } else {
                if (schedule.executeOnOption() !== 'ExactlyAfterLastOccurrence') {
                    readableSchedule = readableSchedule + translator.translate('SCHEDULE_SUMMARY_EVERY').format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()));
                }
                if (schedule.intervalUnit() === 'Week' && schedule.executeOnOption() === 'SelectedWeekDays') {
                    readableSchedule = translator.translate('SCHEDULE_SUMMARY_EVERY_ON').format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()), getWeekDays(schedule.selectedWeekDays()));
                } else if (schedule.intervalUnit() === 'Month' && schedule.executeOnOption() === 'SelectedDaysOfMonth') {
                    readableSchedule = translator.translate('SCHEDULE_SUMMARY_EVERY_ON_DAY').format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()), schedule.selectedDaysOfMonth());
                } else if (schedule.intervalUnit() === 'Month' && schedule.executeOnOption() === 'SelectedWeekDays') {
                    readableSchedule = translator.translate('SCHEDULE_SUMMARY_EVERY_ON_THE').format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()),
                                                            getSelectedWeekNumber(schedule.selectedWeekNumber()), getWeekDays(schedule.selectedWeekDays()));
                } else if (schedule.intervalUnit() === 'Year' && schedule.executeOnOption() === 'SelectedDaysOfMonth') {
                    readableSchedule = translator.translate('SCHEDULE_SUMMARY_EVERY_ON_DAY_OF').format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()), schedule.selectedDaysOfMonth(), getSelectedMonths(schedule.selectedMonths()));
                } else if (schedule.intervalUnit() === 'Year' && schedule.executeOnOption() === 'SelectedWeekDays') {
                    readableSchedule = translator.translate('SCHEDULE_SUMMARY_EVERY_ON_THE_OF')
                                       .format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()), getSelectedWeekNumber(schedule.selectedWeekNumber()),
                                            getWeekDays(schedule.selectedWeekDays()), getSelectedMonths(schedule.selectedMonths()));
                } else if(schedule.executeOnOption()==='ExactlyAfterLastOccurrence') {
                    readableSchedule = translator.translate('SCHEDULE_SUMMARY_EVERY_LAST_OCCURRENCE').format(schedule.interval(), getIntervalUnitName(schedule.intervalUnit()));
            }

            if (schedule.startDate()) {
                if (schedule.endOnOption() === 'EndTime' && schedule.endDate()) {
                    readableSchedule = readableSchedule + translator.translate('SCHEDULE_SUMMARY_EFFECTIVE_BETWEEN_AND_IN').format(formatter.format(schedule.startDate(),'g'), formatter.format(schedule.endDate(),'g'), schedule.timeZone());
                } else if (schedule.endOnOption() === 'NoEnd') {
                    readableSchedule = readableSchedule + translator.translate('SCHEDULE_SUMMARY_EFFECTIVE_FROM_IN').format(formatter.format(schedule.startDate(),'g'), schedule.timeZone());
                }
                else if (schedule.endOnOption() === 'Occurrence') {
                    readableSchedule = readableSchedule + translator.translate('SCHEDULE_SUMMARY_EFFECTIVE_FROM_AND_ENDS_AFTER_OCCURRENCES_IN')
                                       .format(formatter.format(schedule.startDate(),'g'), schedule.endAfterOccurrence(), schedule.timeZone());
                }
            }
        }

        return readableSchedule;
    }

    function getWeekDays(weekDays) {
        var selectedWeekDays = _.map(weekDays, function (day) {
            return weekDaysName[day - 1];
        });
        return selectedWeekDays;
    }

    function getSelectedMonths(months) {
        var selectedMonths = _.map(months, function (day) {
            return monthsList[day - 1];
        });
        return selectedMonths;
    }

    function getIntervalUnitName(intervalUnit) {

        var allIntervalUnits = [{ name: translator.translate('MINUTES'), value: 'Minute' },
            { name: translator.translate('HOURS'), value: 'Hour' },
            { name: translator.translate('DAYS'), value: 'Day' },
            { name: translator.translate('WEEKS'), value: 'Week' },
            { name: translator.translate('MONTHS'), value: 'Month' },
            { name: translator.translate('YEARS'), value: 'Year' }];

        var intervalUnitName = _.find(allIntervalUnits, function (item) {
            return item.value === intervalUnit;
        });
        
        return intervalUnitName.name;
    }

    function getSelectedWeekNumber(weekNumber) {

        var allWeekNumbers = [{ name: translator.translate('FIRST_1'), value: 'First' },
                              { name: translator.translate('SECOND_2'), value: 'Second' },
                              { name: translator.translate('THIRD_3'), value: 'Third' },
                              { name: translator.translate('FOURTH_4'), value: 'Fourth' },
                              { name: translator.translate('LAST_N'), value: 'Last' }];
        var weekNumberName = _.find(allWeekNumbers, function (item) {
            return item.value === weekNumber;
        });

        return weekNumberName.name;
    }


    return ReadableSheduleViewModel;

});