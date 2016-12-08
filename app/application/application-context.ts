import {isNil, prop} from 'ramda';

const hasValue = (getter: Function) => (object: any): boolean => {
    if (!object) { return false; }
    const value = getter(object);
    if (isNil(value)) { return false; }
    return value !== '';
};

const hasSiteKey = hasValue(prop('siteKey'));

const hasDefaultSite = hasValue(prop('defaultSiteKey'));

class ApplicationContext {
    public user: any | null;
    public session: any | null;
    public homeRoute: string;
    public sessionStatus: { isActive: boolean };
    public assetcontext: any | null;
    public licensedModules: any | null;
    public help: {
        helpContext: string | null,
        helpUrl: string | null,
        isAdmin: boolean
    };
    public connectionStatus: {
        connected: boolean,
        lastStatusChange: Date | null,
        connectionCheckerInterval: number | null,
        lastResponse: Date,
        lastUserActivity: Date
    };
    public navigation: { activeRoute: string | null };
    public isSupportedBrowser: boolean;

    constructor() {
        initialize(this);
    }

    public getSiteContext(): string | null {
        if (hasSiteKey(this.assetcontext)) { return this.assetcontext.siteKey; }
        if (hasDefaultSite(this.user)) { return this.user.defaultSiteKey; }
        return null;
    }

    public reset(): void {
        initialize(this);
    }
}

function initialize(applicationContext: ApplicationContext): void {
    applicationContext.user = null;
    applicationContext.session = null;
    applicationContext.homeRoute = 'home';
    applicationContext.sessionStatus = {
        isActive: false
    };
    applicationContext.assetcontext = null;
    applicationContext.licensedModules = null;
    applicationContext.help = {
        helpContext: null,
        helpUrl: null,
        isAdmin: false
    };
    applicationContext.connectionStatus = {
        connected: true,
        lastStatusChange: null,
        connectionCheckerInterval: null,
        lastResponse: new Date(),
        lastUserActivity: new Date()
    };
    applicationContext.navigation = {
        activeRoute: null
    };
    applicationContext.isSupportedBrowser = true;
}

export = new ApplicationContext();
