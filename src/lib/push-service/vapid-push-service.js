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
exports.VapidPushService = void 0;
const uuid_1 = require("uuid");
const CONSTANTS = __importStar(require("../constants"));
const logging_1 = __importDefault(require("../logging"));
const Cache = __importStar(require("../local-storage"));
const Utils = __importStar(require("../utils"));
class VapidPushService {
    constructor(webPushDb, meClientService) {
        this.webPushDb = webPushDb;
        this.meClientService = meClientService;
    }
    getPermission() {
        return Notification.permission;
    }
    isPermissionGranted() {
        return this.getPermission() === CONSTANTS.PERMISSION_GRANTED;
    }
    isPermissionDefault() {
        return this.getPermission() === CONSTANTS.PERMISSION_PROMPT;
    }
    async askPermission() {
        return Notification.requestPermission();
    }
    async getPushToken() {
        return this.webPushDb.getPushToken();
    }
    async subscribe(contactInfo) {
        const isPermissionGranted = this.isPermissionGranted();
        if (!isPermissionGranted) {
            logging_1.default.Logger.error('Permission must be granted before subscription!');
            return;
        }
        // get browser subscription
        const subscription = await this.getPushSubscription();
        if (subscription !== null) {
            const pushToken = JSON.stringify(subscription);
            logging_1.default.Logger.debug('Got valid subscription:', pushToken);
            const storedPushToken = await this.getPushToken();
            if (storedPushToken !== pushToken) {
                logging_1.default.Logger.debug('Registering device, linking and registering push token');
                if (await this.meClientService.storeClientDetails() &&
                    await this.meClientService.linkClientToContact(Utils.toContactInfo(contactInfo)) &&
                    await this.meClientService.registerPushToken(pushToken)) {
                    // persist in local DB after all actions were successful
                    await this.webPushDb.setPushToken(pushToken);
                    Cache.setRegistrationStatus(CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED);
                }
            }
        }
        else {
            logging_1.default.Logger.warn('Issue fetching the actual push token (subscription).');
        }
    }
    async unsubscribe() {
        logging_1.default.Logger.log('VAPID: unsubscribe');
        // get service worker registration
        const registration = await this.getServiceWorkerRegistration();
        logging_1.default.Logger.log('VAPID: registration', registration);
        // get current subscription
        const subscription = await registration.pushManager.getSubscription();
        logging_1.default.Logger.log('VAPID: subscription', subscription);
        // remove token
        await this.meClientService.removePushToken();
        await this.webPushDb.setPushToken(undefined);
        if (!subscription) {
            return;
        }
        await subscription.unsubscribe();
        Cache.setRegistrationStatus(CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);
        // TODO: await this.unregisterDevice()
    }
    async isRegistered() {
        return Utils.isDeviceRegistered(this.webPushDb);
    }
    async isResubscribeNeeded() {
        // check change permission status
        const lastPermission = await this.webPushDb.getLastPermissionStatus();
        const permission = this.getPermission();
        if (lastPermission !== permission) {
            await this.webPushDb.setLastPermissionStatus(permission);
        }
        return (lastPermission !== permission);
    }
    async updateServiceWorker() {
        return this.registerServiceWorker();
    }
    async getServiceWorkerRegistration() {
        if (!this.registration) {
            logging_1.default.Logger.debug('No service worker found. Registering service worker...');
            this.registration = await this.registerServiceWorker();
            // eslint-disable-next-line  @typescript-eslint/strict-boolean-expressions
            if (!this.registration) {
                throw new Error('Internal Error: Can\'t register service worker!');
            }
            else {
                logging_1.default.Logger.log('Service worker is registered');
                await this.registration.update();
            }
        }
        return this.registration;
    }
    async registerServiceWorker() {
        const url = await this.webPushDb.getServiceWorkerUrl();
        const scope = await this.webPushDb.getServiceWorkerScope();
        const sdkVersion = await this.webPushDb.getSdkVersion();
        const serviceWorkerVersion = await this.webPushDb.getServiceWorkerVersion();
        // add clean cache get parameter if sdk version and service worker
        // version is not the same to trigger an update of the service worker
        const cleanCache = (sdkVersion !== serviceWorkerVersion) ? `?cache_clean=${uuid_1.v4()}` : '';
        const options = scope ? { scope } : undefined;
        return navigator
            .serviceWorker
            .register(`/${url}${cleanCache}`, options);
    }
    async getPushSubscription(isRetry = false) {
        const registration = await this.getServiceWorkerRegistration();
        const applicationServerKey = await this.getApplicationServerKey();
        const existingSubscription = await registration.pushManager.getSubscription();
        const subscription = existingSubscription !== null
            ? existingSubscription
            : await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
        if (subscription.endpoint.length > 0) {
            return subscription;
        }
        else {
            if (isRetry) {
                logging_1.default.Logger.warn('Retry to get subscription without empty endpoint failed. Giving up.');
                return null;
            }
            else {
                return this.handleSubscriptionWithEmptyEndpoint(subscription);
            }
        }
    }
    async handleSubscriptionWithEmptyEndpoint(subscription) {
        logging_1.default.Logger.warn('Got subscription with empty endpoint', subscription);
        const success = await subscription.unsubscribe();
        if (!success) {
            logging_1.default.Logger.warn('Unable to unsubscribe from subscription with empty endpoint');
            return null;
        }
        logging_1.default.Logger.debug('Retrying to get a subscription without an empty endpoint');
        return this.getPushSubscription(true);
    }
    async getApplicationServerKey() {
        return this.webPushDb.getApplicationServerPublicKey();
    }
}
exports.VapidPushService = VapidPushService;
//# sourceMappingURL=vapid-push-service.js.map