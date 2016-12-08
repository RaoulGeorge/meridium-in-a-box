import Event = require('system/lang/event');
import {singleton} from 'system/lang/ioc';

/*
 * When adding a new event, please add call to your event's remove method in
 * ApplicationEvents.prototype.removeAll. This is used to reset state during unit tests.
 */
@singleton
class ApplicationEvents {
    public windowResized: Event;
    public windowUnloaded: Event;
    public signout: Event;
    public windowClicked: Event;
    public errorOccured: Event;    //  expects error code and a message when raised
    public errorUnhandled: Event;  //  expects error code and a message when raised
    public errorCleared: Event;
    public titleChanged: Event;    //  expects title and source as params when raised.
    public iconChanged: Event;     //  expects icon and source as params when raised.
    /**
     * navigate - expects url and options when raised. options are
     {
         tab: false,
         replace: false,
         background: false,
         navigate: true
     }
     */
    public navigate: Event;
    public assetcontextChanged: Event; // check for the new asset context under the application context.
    public connectionChanged: Event;   // listeners get the current connection status object as a parameter.
    public sessionChanged: Event;
    public sessionExpired: Event;
    public offlineSessionExpired: Event;
    public smallDeviceOptionsMenuClicked: Event;

    constructor() {
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

    public removeAll(): void {
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
}

export = ApplicationEvents;
