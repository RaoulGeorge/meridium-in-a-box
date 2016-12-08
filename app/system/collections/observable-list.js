define(["require", "exports", "knockout"], function (require, exports, ko) {
    "use strict";
    var ObservableList = (function () {
        function ObservableList(items) {
            if (items === void 0) { items = []; }
            this.items = ko.observableArray(items);
        }
        ObservableList.prototype.count = function () {
            return this.items().length;
        };
        ObservableList.prototype.item = function (i) {
            return this.items()[i];
        };
        ObservableList.prototype.add = function (item) {
            this.items.push(item);
        };
        ObservableList.prototype.remove = function (item) {
            return this.items.remove(item);
        };
        ObservableList.prototype.clear = function () {
            this.items([]);
        };
        ObservableList.prototype.indexOf = function (item) {
            return this.items.indexOf(item);
        };
        ObservableList.prototype.moveUp = function (item) {
            var selectedIndex = this.items.indexOf(item);
            if (selectedIndex === 0) {
                return;
            }
            this.items()[selectedIndex] = this.items()[selectedIndex - 1];
            this.items()[selectedIndex - 1] = item;
            this.items.valueHasMutated();
        };
        ;
        ObservableList.prototype.moveDown = function (item) {
            var selectedIndex = this.items.indexOf(item);
            if (selectedIndex === this.items().length - 1) {
                return;
            }
            this.items()[selectedIndex] = this.items()[selectedIndex + 1];
            this.items()[selectedIndex + 1] = item;
            this.items.valueHasMutated();
        };
        ;
        ObservableList.prototype.dispose = function () {
            this.items([]);
        };
        return ObservableList;
    }());
    return ObservableList;
});
