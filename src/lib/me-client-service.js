"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEClientService = void 0;
const logging_1 = __importDefault(require("./logging"));
const storage_with_log_1 = require("./storage-with-log");
const { Logger } = logging_1.default;
class MEClientService {
    constructor(baseUrl, meClientServiceRequest, storage) {
        this.storage = storage;
        this.storageWithLog = new storage_with_log_1.StorageWithLog(storage);
        this.baseUrl = `${baseUrl}/domains`;
        this.meClientServiceRequest = meClientServiceRequest;
    }
    /**
     * Create or update the information which is related to a specific browser
     */
    async storeClientDetails() {
        const clientId = await this.storageWithLog.getClientId();
        if (!clientId) {
            return false;
        }
        const apiEndpoint = await this.apiEndpoint('client');
        const clientState = await this.storage.getClientState();
        const clientDetails = await this.getClientDetails();
        const response = await this.meClientServiceRequest.post(apiEndpoint, clientDetails, { clientId, clientState });
        if (response.status === 204) {
            await this.saveClientState(response);
            return true;
        }
        else {
            const body = await response.json();
            Logger.error('Error storing client info', response.status, JSON.stringify(body));
            return false;
        }
    }
    async linkClientToContact(contactInfo) {
        const clientId = await this.storageWithLog.getClientId();
        const clientState = await this.storageWithLog.getClientState({ level: 'info' });
        if (!clientId || !clientState) {
            return false;
        }
        const { anonymous, body } = this.toContactRequestBodyData(contactInfo);
        const apiEndpoint = `${await this.apiEndpoint('client/contact')}${anonymous ? '?anonymous=true' : ''}`;
        const response = await this.meClientServiceRequest.post(apiEndpoint, body, { clientId, clientState });
        if (response.status === 200) {
            await this.saveClientState(response);
            const responseBody = await response.json();
            if (responseBody.contactToken && responseBody.refreshToken) {
                await Promise.all([
                    this.storage.setContactToken(responseBody.contactToken),
                    this.storage.setRefreshToken(responseBody.refreshToken)
                ]);
                return true;
            }
            else {
                Logger.error('At least one of the expected response parts missing!');
                return false;
            }
        }
        else {
            const body = await response.json();
            Logger.error('Error linking contact to client', response.status, JSON.stringify(body));
            return false;
        }
    }
    async generateAccessToken() {
        const clientId = await this.storageWithLog.getClientId();
        const refreshToken = await this.storageWithLog.getRefreshToken();
        const clientState = await this.storageWithLog.getClientState();
        if (!clientId || !refreshToken || !clientState) {
            return false;
        }
        const apiEndpoint = await this.apiEndpoint('client/contact-token');
        const body = { refreshToken };
        const response = await this.meClientServiceRequest.post(apiEndpoint, body, { clientId, clientState });
        if (response.status === 200) {
            const responseBody = await response.json();
            if (responseBody.contactToken) {
                await this.storage.setContactToken(responseBody.contactToken);
                return true;
            }
            else {
                Logger.error('ContactToken is not part of response body!');
                return false;
            }
        }
        else {
            const body = await response.json();
            Logger.log('Error refreshing the contact token', response.status, JSON.stringify(body));
            return false;
        }
    }
    async registerPushToken(pushToken) {
        const clientId = await this.storageWithLog.getClientId();
        const clientState = await this.storageWithLog.getClientState();
        const contactToken = await this.storageWithLog.getContactToken({ message: 'Unable to register subscription as contactToken is missing!' });
        if (!clientId || !clientState || !contactToken) {
            return false;
        }
        const apiEndpoint = await this.apiEndpoint('client/push-token');
        const body = { pushToken };
        const response = await this.meClientServiceRequest.put(apiEndpoint, body, { clientId, clientState, contactToken });
        if (response.status === 204) {
            await this.saveClientState(response);
            return true;
        }
        else {
            const body = await response.json();
            Logger.error('Error registering the subscription', response.status, JSON.stringify(body));
            return false;
        }
    }
    async removePushToken() {
        Logger.info('Remove push token');
        const clientId = await this.storageWithLog.getClientId();
        const clientState = await this.storageWithLog.getClientState({ level: 'info' });
        const contactToken = await this.storageWithLog.getContactToken({ level: 'info' });
        if (!clientId || !clientState || !contactToken) {
            return false;
        }
        const apiEndpoint = await this.apiEndpoint('client/push-token');
        const response = await this.meClientServiceRequest.delete(apiEndpoint, {}, { clientId, clientState, contactToken });
        if (response.status === 204) {
            await this.saveClientState(response);
            return true;
        }
        else {
            const body = await response.json();
            Logger.error('Error removing a subscription', response.status, JSON.stringify(body));
            return true;
        }
    }
    async apiEndpoint(path) {
        const appCode = await this.storage.getAppCode();
        return `${this.baseUrl}/${appCode}/${path}`;
    }
    async saveClientState(response) {
        const clientState = response.headers.get('x-client-state');
        if (clientState) {
            await this.storage.setClientState(clientState);
        }
        else {
            Logger.error('Error: X-Client-State not found in response header!');
        }
    }
    async getClientDetails() {
        const platform = await this.storage.getPlatform();
        if (platform) {
            const applicationVersion = await this.storage.getApplicationVersion();
            const deviceModel = await this.storage.getDeviceModel();
            const osVersion = await this.storage.getOsVersion();
            const sdkVersion = await this.storage.getSdkVersion();
            const language = await this.storage.getLanguage();
            const timezone = await this.storage.getTimezone();
            return {
                platform,
                applicationVersion,
                deviceModel,
                osVersion,
                sdkVersion,
                language,
                timezone
            };
        }
        else {
            throw new Error('platform not found in storage!');
        }
    }
    toContactRequestBodyData(contactInfo) {
        if (!contactInfo) {
            return {
                body: {},
                anonymous: true
            };
        }
        if ('openIdToken' in contactInfo) {
            return {
                body: {
                    contactFieldId: contactInfo.fieldId,
                    openIdToken: contactInfo.openIdToken
                },
                anonymous: false
            };
        }
        return {
            body: {
                contactFieldId: contactInfo.fieldId,
                contactFieldValue: contactInfo.fieldValue,
                contactFieldEncrypted: contactInfo.encrypted
            },
            anonymous: false
        };
    }
    static create(baseUrl, meClientServiceRequest, storage) {
        return new MEClientService(baseUrl, meClientServiceRequest, storage);
    }
}
exports.MEClientService = MEClientService;
//# sourceMappingURL=me-client-service.js.map