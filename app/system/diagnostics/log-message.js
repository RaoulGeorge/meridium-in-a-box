define(["require", "exports", "lodash", "system/lang/object", "system/text/formatter"], function (require, exports, _, object_1, Formatter) {
    "use strict";
    var LogMessage = (function () {
        function LogMessage(level, source, text, timestamp, context) {
            if (context === void 0) { context = ''; }
            this.level = level;
            this.source = source;
            this.text = text;
            this.timestamp = timestamp ? new Date(timestamp) : new Date();
            this.context = context;
        }
        LogMessage.fromJson = function (data) {
            return new LogMessage(data.level, data.source, data.text, data.timestamp, data.context);
        };
        LogMessage.fromJsonCollection = function (collection) {
            return _.map(collection, LogMessage.fromJson);
        };
        LogMessage.prototype.fullSource = function () {
            if (this.context) {
                return this.source + ' [' + this.context + ']';
            }
            else {
                return this.source;
            }
        };
        LogMessage.prototype.toJson = function () {
            return {
                timestamp: this.timestamp.toISOString(),
                level: this.level,
                source: this.source,
                text: this.text,
                context: this.context
            };
        };
        LogMessage.prototype.getFormattedTimestamp = function () {
            var formatter = object_1.resolve(Formatter);
            return formatter.format(this.timestamp, 'f');
        };
        LogMessage.prototype.getLevelCaption = function (levels) {
            return translateLevel(levels, this.level);
        };
        return LogMessage;
    }());
    function translateLevel(levels, level) {
        var levelObject = _.find(levels, { value: level });
        if (levelObject) {
            return levelObject.text;
        }
        else {
            return level;
        }
    }
    return LogMessage;
});
