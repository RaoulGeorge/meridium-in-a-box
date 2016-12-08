import DocumentStorage = require('system/data/document-storage');
import {singleton} from 'system/lang/ioc';

@singleton
class ClientPreferences {
    public documentStorage: DocumentStorage;

    constructor() {
        this.documentStorage = new DocumentStorage('client_preferences');
    }

    public retrievePreferences(preferenceId: string): JQueryPromise<any> {
        return this.documentStorage.getItem(preferenceId);
    }

    public savePreference(preferenceId: string, preferenceObject: any): JQueryPromise<any> {
        return this.documentStorage.setItem(preferenceId, preferenceObject);
    }
}

export = ClientPreferences;
