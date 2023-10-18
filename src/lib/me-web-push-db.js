"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEWebPushDb = void 0;
const CONSTANTS = __importStar(require("./constants"));
/**
 * The ME web push persisted information
 */
class MEWebPushDb {
    constructor(indexDb) {
        this.indexDb = indexDb;
    }
    async getDefaultNotificationTitle(defaultTitle) {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyDefaultNotificationTitle, defaultTitle);
    }
    async getDefaultNotificationIcon(defaultImage) {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyDefaultNotificationIcon, defaultImage);
    }
    async getClientIdForAppCode(appCode) {
        if (appCode !== undefined) {
            const browserIds = await this.getBrowserIdsFromDb();
            return browserIds[appCode.toUpperCase()];
        }
    }
    async getClientIds() {
        return this.getBrowserIdsFromDb();
    }
    async getBrowserIdsFromDb() {
        const browserIdsString = await this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyBrowserIds);
        let browserIds = {};
        if (browserIdsString !== undefined) {
            // tslint:disable-next-line:no-empty
            try {
                browserIds = JSON.parse(browserIdsString);
            }
            catch (err) { }
        }
        browserIds = await this.addLegacyBrowserId(browserIds);
        return browserIds;
    }
    async addLegacyBrowserId(browserIds) {
        const legacyBrowserId = await this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyBrowserId);
        if (legacyBrowserId !== undefined) {
            const parts = legacyBrowserId.split('_');
            browserIds[parts[0].toUpperCase()] = legacyBrowserId;
            await this.indexDb.setDBValue(CONSTANTS.dbKeyBrowserIds, JSON.stringify(browserIds));
            await this.indexDb.setDBValue(CONSTANTS.dbKeyBrowserId, undefined);
        }
        return browserIds;
    }
    async getInitParams() {
        const params = await this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyInitParams);
        return params ? JSON.parse(params) : undefined;
    }
    async getMeClientServiceApiBaseUrl() {
        return this.indexDb.getDBValue(CONSTANTS.dbKeyMeClientServiceApiBaseUrl);
    }
    async getMeDeviceEventServiceApiBaseUrl() {
        return this.indexDb.getDBValue(CONSTANTS.dbKeyMeDeviceEventServiceApiBaseUrl);
    }
    async getClientId() {
        const appCode = await this.getAppCode();
        return this.getClientIdForAppCode(appCode);
    }
    async getClientState() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyXClientState);
    }
    async getRefreshToken() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyRefreshToken);
    }
    async getContactToken() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyContactToken);
    }
    async getAppCode() {
        if (!this.appCode) {
            this.appCode = await this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyApplicationCode);
        }
        return this.appCode;
    }
    async getWebsitePushId() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyWebsitePushId);
    }
    async getLastPermissionStatus() {
        return this.indexDb
            .getDBValueOrDefault(CONSTANTS.dbKeyLastPermissionStatus)
            .then(v => v);
    }
    async getApplicationServerPublicKey() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyApplicationServerPublicKey);
    }
    async getServiceWorkerUrl() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyServiceWorkerUrl);
    }
    async getServiceWorkerScope() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyServiceWorkerScope);
    }
    async getSdkVersion() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeySdkVersion);
    }
    async getServiceWorkerVersion() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyServiceWorkerVersion);
    }
    async getPushToken() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyPushToken);
    }
    async getContactFieldId() {
        const fieldId = await this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyContactFieldId);
        return fieldId ? Number(fieldId) : undefined;
    }
    async getContactFieldValue() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyContactFieldValue);
    }
    async getPushPackageServiceUrl() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyPushPackageServiceUrl);
    }
    async getPlatform() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyPlatform);
    }
    async getApplicationVersion() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyApplicationVersion);
    }
    async getDeviceModel() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyDeviceModel);
    }
    async getOsVersion() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyOsVersion);
    }
    async getLanguage() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyLanguage);
    }
    async getTimezone() {
        return this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyTimezone);
    }
    async getLoggingEnabled() {
        const flag = await this.indexDb.getDBValueOrDefault(CONSTANTS.dbKeyLoggingEnabled);
        return (flag === null || flag === void 0 ? void 0 : flag.toLowerCase()) === 'true';
    }
    async setTimezone(value) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyTimezone, value);
    }
    async setLanguage(value) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyLanguage, value);
    }
    async setOsVersion(value) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyOsVersion, value);
    }
    async setDeviceModel(value) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyDeviceModel, value);
    }
    async setApplicationVersion(value) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyApplicationVersion, value);
    }
    async setPlatform(value) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyPlatform, value);
    }
    async setPushPackageServiceUrl(url) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyPushPackageServiceUrl, url);
    }
    async setContactFieldValue(fieldValue) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyContactFieldValue, fieldValue);
    }
    async setContactFieldId(fieldId) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyContactFieldId, typeof fieldId === 'number' ? fieldId.toString() : undefined);
    }
    async setMeClientServiceApiBaseUrl(url) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyMeClientServiceApiBaseUrl, url);
    }
    async setMeDeviceEventServiceApiBaseUrl(url) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyMeDeviceEventServiceApiBaseUrl, url);
    }
    async setPushToken(pushToken) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyPushToken, pushToken);
    }
    async setServiceWorkerVersion(version) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyServiceWorkerVersion, version);
    }
    async setSdkVersion(sdkVersion) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeySdkVersion, sdkVersion);
    }
    async setLastPermissionStatus(status) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyLastPermissionStatus, status);
    }
    async setAppCode(appCode) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyApplicationCode, appCode);
        this.appCode = appCode;
    }
    async setClientState(clientState) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyXClientState, clientState);
    }
    async setContactToken(contactToken) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyContactToken, contactToken);
    }
    async setRefreshToken(refreshToken) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyRefreshToken, refreshToken);
    }
    async setClientId(clientId) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyBrowserId, clientId);
    }
    async setClientIdForAppCode(clientId, appCode) {
        const browserIds = await this.getBrowserIdsFromDb();
        if (clientId !== undefined) {
            browserIds[appCode.toUpperCase()] = clientId;
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete browserIds[appCode.toUpperCase()];
        }
        await this.indexDb.setDBValue(CONSTANTS.dbKeyBrowserIds, JSON.stringify(browserIds));
    }
    async setClientIds(clientIds) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyBrowserIds, JSON.stringify(clientIds));
    }
    async setDefaultNotificationIcon(icon) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyDefaultNotificationIcon, icon);
    }
    async setDefaultNotificationTitle(icon) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyDefaultNotificationTitle, icon);
    }
    async setServiceWorkerUrl(url) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyServiceWorkerUrl, url);
    }
    async setServiceWorkerScope(scope) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyServiceWorkerScope, scope);
    }
    async setApplicationServerPublicKey(key) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyApplicationServerPublicKey, key);
    }
    async setInitParams(params) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyInitParams, JSON.stringify(params));
    }
    async setWebsitePushId(id) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyWebsitePushId, id);
    }
    async setLoggingEnabled(flag) {
        await this.indexDb.setDBValue(CONSTANTS.dbKeyLoggingEnabled, `${flag}`);
    }
    async setLastUsedAt() {
        const d = new Date().toISOString();
        await this.indexDb.setDBValue(CONSTANTS.dbKeyLastUsedAt, d);
    }
    async deleteLastUsedAt() {
        await this.indexDb.deleteDBKey(CONSTANTS.dbKeyLastUsedAt);
    }
    async clearAll() {
        await Promise.all([
            this.setAppCode(undefined),
            this.setClientState(undefined),
            this.setContactToken(undefined),
            this.setRefreshToken(undefined),
            this.setDefaultNotificationIcon(undefined),
            this.setDefaultNotificationTitle(undefined),
            this.setServiceWorkerUrl(undefined),
            this.setServiceWorkerScope(undefined),
            this.setApplicationServerPublicKey(undefined),
            this.setSdkVersion(undefined),
            this.setServiceWorkerVersion(undefined),
            this.setInitParams(undefined),
            this.setWebsitePushId(undefined),
            this.setPushPackageServiceUrl(undefined),
            this.setLastPermissionStatus(undefined),
            this.setPushToken(undefined),
            this.setContactFieldId(undefined),
            this.setContactFieldValue(undefined),
            this.setPlatform(undefined),
            this.setApplicationVersion(undefined),
            this.setDeviceModel(undefined),
            this.setTimezone(undefined),
            this.setLanguage(undefined),
            this.setOsVersion(undefined),
            this.setMeClientServiceApiBaseUrl(undefined),
            this.setMeDeviceEventServiceApiBaseUrl(undefined),
            this.deleteLastUsedAt()
        ]);
        this.appCode = undefined; // clear the cache
    }
    static create(indexDb) {
        return new MEWebPushDb(indexDb);
    }
}
exports.MEWebPushDb = MEWebPushDb;
//# sourceMappingURL=me-web-push-db.js.map