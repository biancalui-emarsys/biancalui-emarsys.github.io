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
exports.SafariPushService = void 0;
const CONSTANTS = __importStar(require("../constants"));
const logging_1 = __importDefault(require("../logging"));
const Cache = __importStar(require("../local-storage"));
const Utils = __importStar(require("../utils"));
class SafariPushService {
    constructor(webPushDb, config, meClientService) {
        this.webPushDb = webPushDb;
        this.config = config;
        this.meClientService = meClientService;
    }
    getPermission() {
        const { permission } = this.getPermissionInfo();
        return permission;
    }
    isPermissionGranted() {
        return this.getPermission() === CONSTANTS.PERMISSION_GRANTED;
    }
    isPermissionDefault() {
        return this.getPermission() === CONSTANTS.PERMISSION_PROMPT;
    }
    async askPermission() {
        const application = this.config.applicationCode;
        const clientId = this.config.clientId;
        const payload = { application, clientId };
        return new Promise(resolve => {
            safari.pushNotification.requestPermission(this.config.safariPushPackageServiceUrl, this.config.safariWebsitePushID, payload, (obj) => resolve(obj.permission));
        });
    }
    async getPushToken() {
        return this.webPushDb.getPushToken();
    }
    async subscribe(contactInfo) {
        const isPermissionGranted = this.isPermissionGranted();
        if (!isPermissionGranted) {
            logging_1.default.Logger.error('Permission must be granted before subscribing!');
            return;
        }
        const { deviceToken } = this.getPermissionInfo();
        if (deviceToken) {
            logging_1.default.Logger.debug('Got device token:', deviceToken);
            const storedPushToken = await this.getPushToken();
            if (storedPushToken !== deviceToken) {
                logging_1.default.Logger.debug('Registering device, linking and registering push token');
                if (await this.meClientService.storeClientDetails() &&
                    await this.meClientService.linkClientToContact(Utils.toContactInfo(contactInfo)) &&
                    await this.meClientService.registerPushToken(deviceToken)) {
                    // persist in local DB after all actions were successful
                    await this.webPushDb.setPushToken(deviceToken);
                    Cache.setRegistrationStatus(CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED);
                }
            }
        }
        else {
            await this.webPushDb.setPushToken(deviceToken);
            Cache.setRegistrationStatus(CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);
        }
    }
    async unsubscribe() {
        // remove token
        await this.meClientService.removePushToken();
        await this.webPushDb.setPushToken(undefined);
        Cache.setRegistrationStatus(CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);
    }
    async isRegistered() {
        return Utils.isDeviceRegistered(this.webPushDb);
    }
    async isResubscribeNeeded() {
        const savedWebSitePushId = await this.webPushDb.getWebsitePushId();
        const savedWebSitePushIdExists = typeof savedWebSitePushId !== 'undefined';
        const webSitePushIdChanged = savedWebSitePushIdExists && this.config.safariWebsitePushID !== savedWebSitePushId;
        await this.webPushDb.setWebsitePushId(this.config.safariWebsitePushID);
        // check change permission status
        const lastPermission = await this.webPushDb.getLastPermissionStatus();
        const permission = this.getPermission();
        if (lastPermission !== permission) {
            await this.webPushDb.setLastPermissionStatus(permission);
            return true;
        }
        return (webSitePushIdChanged || !savedWebSitePushIdExists);
    }
    getPermissionInfo() {
        return safari.pushNotification.permission(this.config.safariWebsitePushID);
    }
}
exports.SafariPushService = SafariPushService;
//# sourceMappingURL=safari-push-service.js.map