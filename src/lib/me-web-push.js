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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CONSTANTS = __importStar(require("./constants"));
const logging_1 = __importDefault(require("./logging"));
const me_client_service_1 = require("./me-client-service");
const me_device_event_service_1 = require("./me-device-event-service");
const push_notification_support_info_1 = require("./push-notification-support-info");
const navigator_info_1 = require("./navigator-info");
const me_web_push_db_1 = require("./me-web-push-db");
const index_db_1 = require("./index-db");
const me_v3_api_request_1 = require("./me-v3-api-request");
const push_service_1 = require("./push-service");
const uuid_1 = require("uuid");
const event_emitter_1 = __importDefault(require("./event-emitter"));
const Cache = __importStar(require("./local-storage"));
const JWT = __importStar(require("./jwt"));
const Utils = __importStar(require("./utils"));
const storage_with_log_1 = require("./storage-with-log");
const { Logger, enableLogger } = logging_1.default;
/**
 * EmarsysWebPush class is responsible for subscription for notifications.
 * This is the entry point what have to be called from site's index page.
 */
class MeWebPush {
    constructor(window, navigator) {
        this.ready = false;
        this.navigator = navigator;
        this.window = window;
        this.navigatorInfo = navigator_info_1.NavigatorInfo.create(navigator);
        this.pushNotificationSupportInfo = push_notification_support_info_1.PushNotificationSupportInfo.create(this.navigatorInfo, window);
        this.meWebPushDb = me_web_push_db_1.MEWebPushDb.create(index_db_1.IndexDb.create());
        this.storageWithLog = new storage_with_log_1.StorageWithLog(this.meWebPushDb);
        this.eventEmitter = new event_emitter_1.default();
        this.permissionPromises = {};
        if (this.pushNotificationSupportInfo.canUsePromises()) {
            this.permissionPromises = {
                [CONSTANTS.EVENT_ON_PERMISSION_DENIED]: new Promise(resolve => this.eventEmitter.once(CONSTANTS.EVENT_ON_PERMISSION_DENIED, resolve)),
                [CONSTANTS.EVENT_ON_PERMISSION_PROMPT]: new Promise(resolve => this.eventEmitter.once(CONSTANTS.EVENT_ON_PERMISSION_PROMPT, resolve)),
                [CONSTANTS.EVENT_ON_PERMISSION_GRANTED]: new Promise(resolve => this.eventEmitter.once(CONSTANTS.EVENT_ON_PERMISSION_GRANTED, resolve))
            };
        }
    }
    push(command) {
        if (typeof command === 'function') {
            this.registerOrHandleOnReadyCallback(command);
            return;
        }
        if (!Array.isArray(command)) {
            throw new Error('Invalid command!');
        }
        switch (command[0]) {
            case 'init':
                this
                    .init(command[1])
                    .then(() => Logger.debug('Initialized'))
                    .catch(err => Logger.error(err, 'Init failed!'));
                break;
            case CONSTANTS.EVENT_ON_READY:
                this.registerOrHandleOnReadyCallback(command[1]);
                break;
            case CONSTANTS.EVENT_ON_SUBSCRIBE:
            case CONSTANTS.EVENT_ON_UNSUBSCRIBE:
            case CONSTANTS.EVENT_ON_SW_INIT_ERROR:
                this.registerEventCallback(command[0], command[1]);
                break;
            case CONSTANTS.EVENT_ON_PERMISSION_DENIED:
            case CONSTANTS.EVENT_ON_PERMISSION_PROMPT:
            case CONSTANTS.EVENT_ON_PERMISSION_GRANTED:
                this.registerChangePermissionCallback(command[0], command[1]);
                break;
            default:
                Logger.warn(`WARN: Command "${JSON.stringify(command)}" not yet implemented!`);
        }
    }
    async customEvent(name, attributes) {
        try {
            const eventData = {
                dnd: true,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                events: [{
                        type: 'custom',
                        name,
                        timestamp: new Date().toISOString(),
                        attributes: {
                            ...attributes,
                            'me:origin': 'webpush'
                        }
                    }],
                clicks: [],
                viewedMessages: []
            };
            let result = await this.meDeviceEventService.postEvents(eventData);
            if (!result.success && result.statusCode === 401) {
                Logger.log('Contact token seems outdated, try to refresh and send again...');
                result = await this.retrySendAfterContactTokenRefresh(eventData);
            }
            Logger.debug('Sent custom event', name, JSON.stringify(attributes), JSON.stringify(result));
            return result.success;
        }
        catch (err) {
            Logger.error('Error sending custom event', err.message, err);
            return false;
        }
    }
    async subscribe() {
        const pushService = this.getPushService();
        const isPermissionDefault = pushService.isPermissionDefault();
        let permission;
        if (isPermissionDefault) {
            permission = await pushService.askPermission().catch(err => {
                Logger.error('Safari ask permission error', err);
                return CONSTANTS.PERMISSION_DENIED;
            });
            this.eventEmitter.emit(CONSTANTS.EVENT_ON_PERMISSION_PROMPT);
        }
        else {
            permission = pushService.getPermission();
        }
        const isDeviceRegistered = await this.isFullyRegistered(false);
        if (permission === CONSTANTS.PERMISSION_GRANTED) {
            const contactInfo = await this.getLoggedInContact();
            Logger.debug('User granted permission for push notifications');
            this.eventEmitter.emit(CONSTANTS.EVENT_ON_PERMISSION_GRANTED);
            if (!isDeviceRegistered) {
                Logger.debug('Triggering push service unsubscribe');
                await pushService.unsubscribe();
                Logger.debug('Triggering push service subscribe');
            }
            else {
                Logger.debug('Triggering subscribe for token update');
            }
            await pushService.subscribe(contactInfo);
            await this.meWebPushDb.setLastUsedAt();
            this.eventEmitter.emit(CONSTANTS.EVENT_ON_SUBSCRIBE);
            return;
        }
        if (permission === CONSTANTS.PERMISSION_DENIED) {
            Logger.log('User has declined push permission');
            if (isDeviceRegistered) {
                await pushService.unsubscribe();
            }
            this.eventEmitter.emit(CONSTANTS.EVENT_ON_PERMISSION_DENIED);
        }
    }
    async unsubscribe() {
        try {
            Logger.debug('Unsubscribing...');
            await this.getPushService().unsubscribe();
            Cache.setRegistrationStatus(CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);
            this.eventEmitter.emit(CONSTANTS.EVENT_ON_UNSUBSCRIBE);
        }
        catch (err) {
            Logger.error(err, 'Error occurred during unsubscribe');
        }
    }
    async getParams() {
        const applicationCode = await this.meWebPushDb.getAppCode();
        const clientId = await this.meWebPushDb.getClientIdForAppCode(applicationCode);
        const initParams = await this.meWebPushDb.getInitParams();
        const pushToken = await this.meWebPushDb.getPushToken();
        const serviceWorkerScope = await this.meWebPushDb.getServiceWorkerScope();
        const serviceWorkerVersion = await this.meWebPushDb.getServiceWorkerVersion();
        const sdkVersion = await this.meWebPushDb.getSdkVersion();
        const meClientServiceApiBaseUrl = await this.meWebPushDb.getMeClientServiceApiBaseUrl();
        const meDeviceEventServiceApiBaseUrl = await this.meWebPushDb.getMeDeviceEventServiceApiBaseUrl();
        const clientState = await this.meWebPushDb.getClientState();
        const contactToken = await this.meWebPushDb.getContactToken();
        const refreshToken = await this.meWebPushDb.getRefreshToken();
        return {
            applicationCode,
            clientId,
            pushToken,
            serviceWorkerScope,
            serviceWorkerVersion,
            sdkVersion,
            meClientServiceApiBaseUrl,
            meDeviceEventServiceApiBaseUrl,
            clientState,
            contactToken,
            refreshToken,
            ...initParams
        };
    }
    async getLoggedInContact() {
        const clientState = await this.storageWithLog.getClientState({ level: 'info' });
        if (!clientState) {
            return undefined;
        }
        const decodedClientState = JWT.decode(clientState);
        if (!decodedClientState) {
            Logger.error('Decoding failed', JSON.stringify(clientState));
            return undefined;
        }
        const contactField = decodedClientState.contactField;
        if (contactField === undefined) {
            return undefined;
        }
        if (contactField === null || Object.keys(contactField).length === 0) {
            return {}; // the anonymous contact!
        }
        if ((contactField.contactFieldId !== undefined) && contactField.contactFieldValue) {
            return {
                fieldId: contactField.contactFieldId,
                fieldValue: contactField.contactFieldValue,
                encrypted: (typeof contactField.contactFieldEncryped === 'boolean') ? contactField.contactFieldEncryped : false
            };
        }
        else {
            Logger.error('contactField information incomplete', JSON.stringify(contactField));
            return undefined;
        }
    }
    async isLoggedIn() {
        const contactInfo = await this.getLoggedInContact();
        return !(Utils.isEmptyObject(contactInfo) || contactInfo === undefined);
    }
    async setOpenIdAuthenticatedContact(contactInfo) {
        this.assertOpenIdContactInfo(contactInfo);
        return this.meClientService.linkClientToContact(contactInfo);
    }
    async login(contactInfo) {
        this.assertContactInfo(contactInfo);
        const finalContactInfo = (contactInfo !== undefined) ? { ...contactInfo, encrypted: false } : contactInfo;
        return this.meClientService.linkClientToContact(finalContactInfo);
    }
    async logout() {
        return this.meClientService.linkClientToContact();
    }
    async removeAllDeviceData() {
        await this.cleanupClientOnBackend(this.meClientService);
        await this.meWebPushDb.clearAll();
    }
    async isSubscribed() {
        return this.isFullyRegistered();
    }
    async registerClient(contactInfo) {
        this.assertContactInfo(contactInfo);
        const linkContactInfo = contactInfo ? { ...contactInfo, encrypted: false } : undefined;
        const result = await this.meClientService.storeClientDetails() &&
            await this.meClientService.linkClientToContact(linkContactInfo);
        return result;
    }
    async getClientId() {
        const appCode = await this.meWebPushDb.getAppCode();
        if (appCode === undefined) {
            Logger.log('No APP code found in environment');
            return undefined;
        }
        const clientId = await this.meWebPushDb.getClientIdForAppCode(appCode);
        if (clientId === undefined) {
            Logger.log(`No client ID for APP code "${appCode}" found`);
        }
        return clientId;
    }
    assertContactInfo(contactInfo) {
        // tslint:disable-next-line
        if (contactInfo && ((contactInfo.fieldId === undefined) || !contactInfo.fieldValue)) {
            throw new Error(`Incomplete contact info: ${JSON.stringify(contactInfo)}`);
        }
    }
    assertOpenIdContactInfo(contactInfo) {
        // tslint:disable-next-line
        if ((contactInfo.fieldId === undefined) || !contactInfo.openIdToken) {
            throw new Error(`Incomplete contact info: ${JSON.stringify(contactInfo)}`);
        }
    }
    /**
     * Subscribe for push notifications and registers the subscription.
     * This function have to be called from the site's page.
     */
    async init(params) {
        if (!this.pushNotificationSupportInfo.pushNotificationsSupported()) {
            return Promise.reject(new Error('Web push not supported'));
        }
        this.enableLogging(params.enableLogging);
        await this.setupMeClientService(params.clientServiceApiBaseUrl);
        await this.setupMeDeviceEventService(params.deviceEventServiceApiBaseUrl);
        const appCode = await this.checkApplicationCode(this.meClientService, params.applicationCode);
        await this.checkClientId(appCode);
        await this.persistPlatformInfo(params);
        await this.persistConfig(params);
        // TODO: We could now report an "app open" with a frequency capping of 1h here...
        await this.initPushNotifications(params);
        // initialization is done, so any registered callback may be invoked now
        this.eventEmitter.emit(CONSTANTS.EVENT_ON_READY);
        this.ready = true;
    }
    enableLogging(enable) {
        enableLogger(enable === true);
    }
    async setupMeClientService(baseUrl) {
        const meClientServiceApiBaseUrl = baseUrl !== null && baseUrl !== void 0 ? baseUrl : CONSTANTS.defaultClientServiceApiBaseUrl;
        this.meClientService = me_client_service_1.MEClientService.create(meClientServiceApiBaseUrl, me_v3_api_request_1.MEV3ApiRequest.create(), this.meWebPushDb);
        await this.meWebPushDb.setMeClientServiceApiBaseUrl(meClientServiceApiBaseUrl);
    }
    async setupMeDeviceEventService(baseUrl) {
        const meDeviceEventServiceApiBaseUrl = baseUrl !== null && baseUrl !== void 0 ? baseUrl : CONSTANTS.defaultDeviceEventServiceApiBaseUrl;
        this.meDeviceEventService = me_device_event_service_1.MEDeviceEventService.create(meDeviceEventServiceApiBaseUrl, me_v3_api_request_1.MEV3ApiRequest.create(), this.meWebPushDb);
        await this.meWebPushDb.setMeDeviceEventServiceApiBaseUrl(meDeviceEventServiceApiBaseUrl);
    }
    async checkApplicationCode(meClientService, applicationCode) {
        const appCode = await this.meWebPushDb.getAppCode();
        if (!applicationCode) {
            return Promise.reject(new Error('Can\'t find application code!'));
        }
        const noSavedAppCode = !appCode;
        const appCodeChanged = appCode && appCode !== applicationCode;
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (noSavedAppCode || appCodeChanged) {
            await this.cleanupClientOnBackend(meClientService);
            await this.meWebPushDb.clearAll();
            await this.meWebPushDb.setAppCode(applicationCode);
        }
        return applicationCode;
    }
    async checkClientId(appCode) {
        const clientId = await this.meWebPushDb.getClientIdForAppCode(appCode);
        if (!clientId) {
            Logger.log('No ClientId stored. Creating one...');
            const id = appCode + '_' + uuid_1.v4();
            await this.meWebPushDb.setClientIdForAppCode(id, appCode);
        }
        else {
            Logger.log('ClientId exists:', clientId);
        }
    }
    async persistPlatformInfo(params) {
        var _a;
        const completeNavigatorInfo = this.navigatorInfo.getAll();
        await Promise.all([
            this.meWebPushDb.setPlatform(completeNavigatorInfo.browser),
            this.meWebPushDb.setApplicationVersion((_a = params.applicationVersion) !== null && _a !== void 0 ? _a : CONSTANTS.defaultApplicationVersion),
            this.meWebPushDb.setDeviceModel(completeNavigatorInfo.userAgent),
            this.meWebPushDb.setOsVersion(completeNavigatorInfo.browserVersion),
            this.meWebPushDb.setLanguage(completeNavigatorInfo.language),
            this.meWebPushDb.setTimezone(completeNavigatorInfo.timezone),
            this.meWebPushDb.setSdkVersion(__VERSION__)
        ]);
    }
    async persistConfig(params) {
        var _a, _b;
        const serviceWorkerUrl = params.serviceWorker ? params.serviceWorker.url : undefined;
        const serviceWorkerScope = Utils.determineServiceWorkerScope(params.serviceWorker);
        const serviceWorkerAppPublicKey = params.serviceWorker ? params.serviceWorker.applicationServerPublicKey : undefined;
        await Promise.all([
            this.meWebPushDb.setServiceWorkerUrl(serviceWorkerUrl),
            this.meWebPushDb.setServiceWorkerScope(serviceWorkerScope),
            this.meWebPushDb.setApplicationServerPublicKey(serviceWorkerAppPublicKey),
            this.meWebPushDb.setDefaultNotificationIcon(params.defaultNotificationIcon),
            this.meWebPushDb.setDefaultNotificationTitle(params.defaultNotificationTitle),
            this.meWebPushDb.setWebsitePushId(params.safariWebsitePushID),
            this.meWebPushDb.setPushPackageServiceUrl(params.safariPushPackageServiceUrl),
            this.meWebPushDb.setLoggingEnabled(Boolean(params.enableLogging).valueOf()),
            this.meWebPushDb.setMeClientServiceApiBaseUrl((_a = params.clientServiceApiBaseUrl) !== null && _a !== void 0 ? _a : CONSTANTS.defaultClientServiceApiBaseUrl),
            this.meWebPushDb.setMeDeviceEventServiceApiBaseUrl((_b = params.deviceEventServiceApiBaseUrl) !== null && _b !== void 0 ? _b : CONSTANTS.defaultDeviceEventServiceApiBaseUrl),
            this.meWebPushDb.setLastUsedAt()
        ]);
    }
    async initPushNotifications(params) {
        const initParamsToPersist = {
            ...params,
            enableLogging: Boolean(params.enableLogging).valueOf()
        };
        await this.meWebPushDb.setInitParams(initParamsToPersist);
        await this.setupPushService();
        try {
            await this.initialPushServiceProcessing(initParamsToPersist);
        }
        catch (err) {
            Logger.error(err, 'Internal error');
        }
    }
    async setupPushService() {
        if (!this.meClientService) {
            throw new Error('Me client service connection is not set up!');
        }
        if (this.pushNotificationSupportInfo.canUseSafariPush()) {
            const config = await this.buildApnsApiRegistrationConfig();
            this.pushService = new push_service_1.SafariPushService(this.meWebPushDb, config, this.meClientService);
            return;
        }
        if (this.pushNotificationSupportInfo.canUseServiceWorkers()) {
            const vapidPushService = new push_service_1.VapidPushService(this.meWebPushDb, this.meClientService);
            await vapidPushService.updateServiceWorker();
            this.pushService = vapidPushService;
        }
    }
    async initialPushServiceProcessing(initParams) {
        const pushService = this.getPushService();
        const permission = pushService.getPermission();
        if (permission === CONSTANTS.PERMISSION_GRANTED) {
            await this.meWebPushDb.setLastPermissionStatus(permission);
        }
        const isResubscribeNeeded = await pushService.isResubscribeNeeded();
        if (isResubscribeNeeded) {
            Logger.log('Re-subscribe is needed.');
            await this.unsubscribe();
        }
        const isRegistered = await this.isFullyRegistered(false);
        switch (permission) {
            case CONSTANTS.PERMISSION_PROMPT:
                // device can't be registered if permission is "default" (so "prompt")
                if (isRegistered) {
                    Logger.debug('Unsubscribing in PROMPT state');
                    this.eventEmitter.emit(CONSTANTS.EVENT_ON_PERMISSION_PROMPT);
                    await this.unsubscribe();
                }
                break;
            case CONSTANTS.PERMISSION_DENIED:
                if (isRegistered) {
                    await this.unsubscribe();
                }
                this.eventEmitter.emit(CONSTANTS.EVENT_ON_PERMISSION_DENIED);
                break;
            case CONSTANTS.PERMISSION_GRANTED:
                if (!MeWebPush.isUnregistered()) {
                    await this.subscribe();
                }
                this.eventEmitter.emit(CONSTANTS.EVENT_ON_PERMISSION_GRANTED);
                break;
        }
    }
    async cleanupClientOnBackend(meClientService) {
        Logger.debug('Cleanup of client information on backend side');
        const { exists, pushTokenExists, identified } = await Utils.checkDevice(this.meWebPushDb);
        if (!exists) {
            Logger.debug('The browser is not registered at all.');
            return;
        }
        if (pushTokenExists) {
            const result = await meClientService.removePushToken();
            Logger.log('Removed registered push token:', result);
        }
        if (identified) {
            const result = await meClientService.linkClientToContact();
            Logger.log('Assigned anonymous contact:', result);
        }
    }
    getPushService() {
        if (this.pushService) {
            return this.pushService;
        }
        else {
            throw new Error('Push service is not set up!');
        }
    }
    async buildApnsApiRegistrationConfig() {
        const safariWebsitePushID = await this.meWebPushDb.getWebsitePushId();
        const applicationCode = await this.meWebPushDb.getAppCode();
        const clientId = await this.meWebPushDb.getClientIdForAppCode(applicationCode);
        if (safariWebsitePushID && applicationCode && clientId) {
            const safariPushPackageServiceUrl = await this.meWebPushDb.getPushPackageServiceUrl();
            return {
                clientId,
                applicationCode,
                safariWebsitePushID,
                safariPushPackageServiceUrl: safariPushPackageServiceUrl !== null && safariPushPackageServiceUrl !== void 0 ? safariPushPackageServiceUrl : CONSTANTS.defaultSafariPushPackageServiceUrl
            };
        }
        else {
            throw new Error('safariWebsitePushID must be specified for Safari support!');
        }
    }
    onReadyHandler(cmd) {
        if (this.ready) {
            cmd(undefined); // TODO: Pass the API (me client service & DES)
        }
        else {
            this.eventEmitter.on(CONSTANTS.EVENT_ON_READY, (params) => cmd(undefined, params));
        }
    }
    registerOrHandleOnReadyCallback(callback) {
        this.onReadyHandler(callback);
    }
    registerEventCallback(name, callback) {
        this.eventEmitter.on(name, (params) => {
            return callback(undefined, params); // TODO: Pass API instead of undefined here
        });
    }
    registerChangePermissionCallback(name, callback) {
        const currentPromise = this.permissionPromises[name];
        // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/strict-boolean-expressions
        if (!currentPromise) {
            return;
        }
        const registerCallbackForFurtherEvents = this.registerEventCallback.bind(this);
        currentPromise
            .then(() => {
            // after the first occurrence was handled register the callback in the "normal"
            // way so that subsequent events are forwarded too.
            registerCallbackForFurtherEvents(name, callback);
            return callback(undefined); // TODO: Replace undefined with this.API...
        })
            .catch((err) => Logger.error(err, 'Error while handling permission change callback.'));
    }
    async isFullyRegistered(useCache = true) {
        const status = Cache.getRegistrationStatus();
        Logger.debug('Local status is', status);
        if (status === undefined || !useCache) {
            return this.updateRegistrationStatus();
        }
        else {
            return Promise.resolve(status === CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED);
        }
    }
    static isUnregistered() {
        const status = Cache.getRegistrationStatus();
        return (status === CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);
    }
    async updateRegistrationStatus() {
        Logger.debug('Checking device...');
        const isRegistered = await this.pushService.isRegistered();
        Logger.debug('Device exists & has token', isRegistered);
        const status = isRegistered
            ? CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED
            : CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED;
        Cache.setRegistrationStatus(status);
        return status === CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED;
    }
    async retrySendAfterContactTokenRefresh(eventsData) {
        const success = await this.meClientService.generateAccessToken();
        if (!success) {
            Logger.error('Refresh of access token failed!');
            return { success: false };
        }
        return this.meDeviceEventService.postEvents(eventsData);
    }
    static create(window, navigator) {
        return new MeWebPush(window, navigator);
    }
}
exports.default = MeWebPush;
//# sourceMappingURL=me-web-push.js.map