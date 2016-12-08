var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "system/lang/event", "system/lang/ioc"], function (require, exports, Event, ioc_1) {
    "use strict";
    /*
     * When adding a new event, please add call to your event's remove method in
     * ApplicationEvents.prototype.removeAll. This is used to reset state during unit tests.
     */
    var ApplicationEvents = (function () {
        function ApplicationEvents() {
            this.windowResized = new Event();
            this.windowUnloaded = new Event();
            this.signout = new Event();
            this.windowClicked = new Event();
            this.errorOccured = new Event();
            this.errorUnhandled = new Event();
            this.errorCleared = new Event();
            this.titleChanged = new Event();
            this.iconChanged = new Event();
            this.navigate = new Event();
            this.assetcontextChanged = new Event();
            this.connectionChanged = new Event();
            this.sessionChanged = new Event();
            this.sessionExpired = new Event();
            this.offlineSessionExpired = new Event();
            this.smallDeviceOptionsMenuClicked = new Event();
        }
        ApplicationEvents.prototype.removeAll = function () {
            this.connectionChanged.remove();
            this.windowResized.remove();
            this.windowUnloaded.remove();
            this.signout.remove();
            this.windowClicked.remove();
            this.errorOccured.remove();
            this.errorUnhandled.remove();
            this.errorCleared.remove();
            this.titleChanged.remove();
            this.iconChanged.remove();
            this.navigate.remove();
            this.assetcontextChanged.remove();
            this.connectionChanged.remove();
            this.sessionExpired.remove();
            this.smallDeviceOptionsMenuClicked.remove();
        };
        ;
        return ApplicationEvents;
    }());
    ApplicationEvents = __decorate([
        ioc_1.singleton
    ], ApplicationEvents);
    return ApplicationEvents;
});
