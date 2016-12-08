import * as $ from 'jquery';
import {dependsOn} from 'system/lang/ioc';

import logManager = require('system/diagnostics/log-manager');
import ApplicationEvents = require('application/application-events');
import Event = require('system/lang/event');
import ErrorMessage = require('system/error/error-message');
import Translator = require('system/globalization/translator');
import Region = require('./region');

const logger = logManager.getLogger('spa/conductor');
const ERROR_CODE = 'FND1';
const ERROR_MESSAGE = 'PAGE_NOT_LOADED';

type RouteArgs = { named?: {}, positional?: any[], url?: string };

interface Screen {
    isLoaded: boolean;
    isOpen: boolean;
    isAttached: boolean;
    isActive: boolean;

    unload(): void;
    canUnload(): boolean;
    close(): void;
    deactivate(): void;
    load(screen: Screen, args: any[]): void;
    open(screen: Screen, args: any[]): void;
    canReuse(screen: Screen, args: any[]): boolean;
    attach(region: Region, url?: string): void;
    reuse(screen: Screen, args: any[]): boolean;
    activate(screen: Screen, args: any[]): boolean;
}

@dependsOn(ApplicationEvents, Translator)
class Conductor {
    public errorOccured: Event;
    public translator: Translator;

    constructor(applicationEvents: ApplicationEvents, translator: Translator) {
        this.errorOccured = applicationEvents.errorOccured;
        this.translator = translator;
    }

    public activateScreen(screen: Nullable<Screen>, args?: RouteArgs): any {
        try {
            return tryActivateScreen(this, screen, args);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public createArgumentArray(routeArgs?: RouteArgs, argArray: any[] = []): any[] {
        if (logger.isTraceEnabled()) { logger.trace('create argument array'); }
        if (!routeArgs) { return argArray; }
        if (routeArgs.named) {
            argArray.push(routeArgs.named);
        }
        Array.prototype.push.apply(argArray, routeArgs.positional);
        return argArray;
    }

    public reuseScreen(screen: Screen, region: Region, args: RouteArgs): Unknown {
        try {
            return tryReuseScreen(this, screen, region, args);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public deactivateScreen(screen: Screen): void {
        try {
            tryDeactivateScreen(screen);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public canUnloadScreen(screen: Screen): boolean {
        try {
            return tryCanUnloadScreen(screen);
        } catch (e) {
            raisePageLoadError(this, e);
            return false;
        }
    }

    public attachScreen(screen: Nullable<Screen>, region: Region, url?: string): void {
        try {
            tryAttachScreen(screen, region, url);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public detachScreen(region: Region): void {
        try {
            tryDetachScreen(region);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public canReuseScreen(previousScreen: Screen, screen: Nullable<Screen>, routeArgs?: RouteArgs): boolean {
        try {
            return tryCanReuseScreen(this, previousScreen, screen, routeArgs);
        } catch (e) {
            raisePageLoadError(this, e);
            return false;
        }
    }

    public openScreen(screen: Nullable<Screen>, args: RouteArgs): void {
        try {
            tryOpenScreen(this, screen, args);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public loadScreen(screen: Nullable<Screen>, args: RouteArgs): void {
        try {
            tryLoadScreen(this, screen, args);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public closeScreen(screen: Screen): void {
        try {
            tryCloseScreen(screen);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public unloadScreen(screen: Screen): void {
        try {
            tryUnloadScreen(screen);
        } catch (e) {
            raisePageLoadError(this, e);
        }
    }

    public changeScreen(screen: Nullable<Screen>, region: Region, args: RouteArgs = {}, options?: {}): void {
        const previousScreen = region.screen;
        const settings = { isClosing: true, checkForReuse: true, checkForUnload: false };

        logManager.pushContext(typeString(screen) + ' from ' + typeString(previousScreen));
        $.extend(settings, options);
        if (settings.checkForReuse && this.canReuseScreen(previousScreen, screen, args)) {
            if (logger.isDebugEnabled()) { logger.debug('Reusing previous screen.'); }
            this.reuseScreen(previousScreen, region, args);
            return;
        }
        this.openScreen(screen, args);
        this.loadScreen(screen, args);
        this.deactivateScreen(previousScreen);
        this.activateScreen(screen, args);
        this.detachScreen(region);
        this.attachScreen(screen, region, args.url);
        if (settings.isClosing && screen !== previousScreen) {
            if (logger.isDebugEnabled()) { logger.debug('closing previous screen.'); }
            this.unloadScreen(previousScreen);
            this.closeScreen(previousScreen);
        }
        logManager.popContext();
    }

    public hideScreen(region: Region): void {
        this.deactivateScreen(region.screen);
        this.detachScreen(region);
    }

    public clearScreen(region: Region): void {
        this.changeScreen(null, region);
        region.screen = null;
    };

    public showScreen(region: Region, url: string): void {
        this.activateScreen(region.screen);
        this.attachScreen(region.screen, region, url);
    };
}

function tryActivateScreen(conductor: Conductor, screen: Nullable<Screen>, args?: RouteArgs): Unknown {
    if (logger.isTraceEnabled()) { logger.trace('activating screen'); }
    if (screen && screen.isActive) {
        return;
    }
    if (screen) {
        screen.isActive = true;
        if (screen.activate) {
            const argArray = conductor.createArgumentArray(args);
            return screen.activate.apply(screen, argArray);
        }
    }
}

function raisePageLoadError(conductor: Conductor, e?: any): void {
    let detail;
    let stack;

    if (e && e.message) {
        detail = e.message;
    } else if (e instanceof Object) {
        detail = JSON.stringify(e);
    } else {
        detail = e;
    }

    if (e.stack) {
        stack = e.stack;
    } else {
        stack = new Error().stack;
    }

    const errorText = conductor.translator.translate(ERROR_MESSAGE);
    const errorMessage = new ErrorMessage(ERROR_CODE, errorText, detail + '\n' + stack);
    conductor.errorOccured.raise(conductor, errorMessage);
}

function tryReuseScreen(conductor: Conductor, screen: Screen, region: Region, args: RouteArgs): Unknown {
    if (logger.isTraceEnabled()) { logger.trace('reuse screen'); }
    if (screen.reuse) {
        const argArray = conductor.createArgumentArray(args, [region, args.url]);
        return screen.reuse.apply(screen, argArray);
    }
}

function tryDeactivateScreen(screen: Screen): void {
    if (logger.isTraceEnabled()) { logger.trace('deactivating screen'); }
    if (screen && !screen.isActive) { return; }
    if (screen) {
        screen.isActive = false;
        if (screen.deactivate) {
            screen.deactivate();
        }
    }
}

function tryCanUnloadScreen(screen: Screen): boolean {
    if (logger.isTraceEnabled()) { logger.trace('can deactivate screen'); }
    if (screen && screen.canUnload) { return screen.canUnload(); }
    return true;
}

function tryAttachScreen(screen: Nullable<Screen>, region: Region, url?: string): void {
    if (screen && screen.isAttached === true) { return; }
    if (logger.isTraceEnabled()) { logger.trace('attaching screen'); }
    if (screen && screen.attach) {
        screen.attach(region, url);
        region.screen = screen;
        screen.isAttached = true;
    }
}

function tryDetachScreen(region: Region): void {
    if (logger.isTraceEnabled()) { logger.trace('detaching screen'); }
    if (!region || !region.screen) { return; }
    if (region && region.screen && !region.screen.isAttached) { return; }
    if (region.screen.detach) {
        region.screen.detach(region);
        region.screen.isAttached = false;
    }
}

function tryCanReuseScreen(conductor: Conductor,
                           previous: Nullable<Screen>,
                           screen: Nullable<Screen>,
                           args?: RouteArgs): boolean {
    let result = true;
    if (logger.isTraceEnabled()) { logger.trace('can reuse screen: ', typeString(screen)); }
    if (!screen || !previous || screen.constructor !== previous.constructor) { return false; }
    if (screen.canReuse) {
        const argArray = conductor.createArgumentArray(args);
        result = screen.canReuse.apply(screen, argArray);
    } else if (!screen.reuse) {
        result = false;
    }
    return result !== false;
}

function tryOpenScreen(conductor: Conductor, screen: Nullable<Screen>, args: RouteArgs): void {
    if (logger.isTraceEnabled()) { logger.trace('opening screen'); }
    if (!screen || screen.isOpen) { return; }
    if (screen.open) {
        const argArray = conductor.createArgumentArray(args);
        argArray[argArray.length] = args.url;
        screen.open.apply(screen, argArray);
    }
    screen.isOpen = true;
}

function tryLoadScreen(conductor: Conductor, screen: Nullable<Screen>, args: RouteArgs): void {
    if (logger.isTraceEnabled()) { logger.trace('load screen'); }
    if (!screen || screen.isLoaded) { return; }
    if (screen.load) {
        const argArray = conductor.createArgumentArray(args);
        screen.load.apply(screen, argArray);
    }
    screen.isLoaded = true;
}

function tryCloseScreen(screen: Screen): void {
    if (logger.isTraceEnabled()) { logger.trace('closing screen'); }
    if (!screen || !screen.isOpen) { return; }
    if (screen.close) {
        screen.close();
    }
    screen.isOpen = false;
}

function tryUnloadScreen(screen: Screen): void {
    if (logger.isTraceEnabled()) { logger.trace('unload screen'); }
    if (!screen || !screen.isLoaded) { return; }
    if (screen.unload) {
        screen.unload();
    }
    screen.isLoaded = false;
}

function typeString(object: any): any {
    if (object) {
        if (object.constructor && object.constructor.name) {
            return object.constructor.name;
        } else if (object.constructor) {
            return object.constructor;
        } else {
            return object.toString();
        }
    } else {
        return object;
    }
}

export = Conductor;
