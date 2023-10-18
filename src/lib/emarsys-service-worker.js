"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmarsysServiceWorker = void 0;
const logging_1 = __importDefault(require("./logging"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const me_device_event_service_1 = require("./me-device-event-service");
const me_client_service_1 = require("./me-client-service");
const me_v3_api_request_1 = require("./me-v3-api-request");
const FailureResult = { success: false };
/**
 * EmarsysServiceWorker class is responsible for receiving push notifications and shows the notification.
 */
class EmarsysServiceWorker {
    constructor(webPushDb) {
        this.webPushDb = webPushDb;
    }
    onInstall(event) {
        event.waitUntil(this.handleInstall());
    }
    onPush(event) {
        event.waitUntil(this._onPush(event));
    }
    onNotificationClick(event) {
        event.waitUntil(this._onNotificationClick(event));
    }
    onSubscriptionChange(event) {
        event.waitUntil(this._onSubscriptionChange());
    }
    async _onPush(event) {
        await this.setupLogging();
        if (!('showNotification' in self.registration)) {
            logging_1.default.Logger.warn('Showing of notifications is not enabled');
            return;
        }
        // eslint-disable-next-line
        const payloadJson = event.data && event.data.json() ? event.data.json() : {};
        if (!utils_1.isValidPayload(payloadJson)) {
            logging_1.default.Logger.warn('Invalid payload', payloadJson);
            return;
        }
        // @ts-expect-error
        const notificationSettings = payloadJson.messageData.notificationSettings;
        return Promise.all([
            this.getNotificationOption(
            // @ts-expect-error
            payloadJson, constants_1.pushTitleProperty, () => this.webPushDb.getDefaultNotificationTitle('')),
            this.getNotificationOption(notificationSettings, constants_1.pushIconProperty, () => this.webPushDb.getDefaultNotificationIcon(undefined)),
            this.getNotificationOption(notificationSettings, constants_1.pushImageProperty, () => Promise.resolve(undefined)),
            this.getNotificationOption(notificationSettings, constants_1.pushActionsProperty, () => Promise.resolve(undefined))
        ]).then(([notificationTitle, notificationIcon, notificationImage, notificationActions]) => {
            return this.showNotification(
            // @ts-expect-error
            payloadJson.message, payloadJson, notificationTitle, notificationIcon, notificationImage, notificationActions ? this.createActionsFromActionButtons(notificationActions) : notificationActions);
        });
    }
    async _onNotificationClick(event) {
        await this.setupLogging();
        logging_1.default.Logger.debug(`Notification clicked with Action: ${event.action}`);
        event.notification.close();
        const payload = event.notification.data;
        if (!payload.messageData.notificationSettings) {
            return;
        }
        let url = payload.messageData.notificationSettings[constants_1.pushLinkProperty];
        if (payload.messageData.notificationSettings[constants_1.pushActionsProperty]) {
            const buttonClicked = payload.messageData.notificationSettings[constants_1.pushActionsProperty]
                .find((actionButton) => actionButton.id === event.action);
            if (buttonClicked) {
                url = buttonClicked.url;
            }
        }
        // eslint-disable-next-line
        const commands = [];
        if (url) {
            // eslint-disable-next-line
            logging_1.default.Logger.debug(`Opening url: ${url}`);
            commands.push(self.clients.openWindow(url));
        }
        commands.push(this.reportOpen(payload));
        return Promise.all(commands);
    }
    async _onSubscriptionChange() {
        try {
            await this.setupLogging();
            logging_1.default.Logger.debug('Subscription changed');
            const applicationServerKey = await this.getApplicationServerKey();
            logging_1.default.Logger.debug('Got applicationServerKey', JSON.stringify(applicationServerKey));
            if (!applicationServerKey) {
                logging_1.default.Logger.debug('Exiting registerNewSubscription');
                return;
            }
            logging_1.default.Logger.debug('Subscribing for new key');
            const subscription = await self.registration.pushManager
                .subscribe({ userVisibleOnly: true, applicationServerKey });
            logging_1.default.Logger.debug('Registering new subscription', subscription);
            // eslint-disable-next-line
            return this.registerNewSubscription(subscription, false);
        }
        catch (err) {
            logging_1.default.Logger.error('onSubscriptionChange: registerSubscription', err);
        }
    }
    async registerNewSubscription(subscription, isRetry = false) {
        const meClientSvc = await this.getMeClientService();
        if (!meClientSvc) {
            logging_1.default.Logger.error('Unable to get the ME client service!');
            return;
        }
        let success = await meClientSvc.registerPushToken(JSON.stringify(subscription));
        if (success) {
            logging_1.default.Logger.debug('Success register push token with backend');
            return;
        }
        if (isRetry) {
            logging_1.default.Logger.error('Unable to register expired subscription', subscription);
        }
        else {
            success = await this.refreshContactToken(meClientSvc);
            if (success) {
                logging_1.default.Logger.debug('Successful refreshed the contact token');
                await this.registerNewSubscription(subscription, true);
            }
            else {
                logging_1.default.Logger.error('Unable to register expired subscription', subscription);
            }
        }
    }
    async getApplicationServerKey() {
        try {
            const result = await this.webPushDb.getApplicationServerPublicKey();
            if (!result) {
                logging_1.default.Logger.error('application server key not set');
            }
            return result;
        }
        catch (err) {
            logging_1.default.Logger.error('application server error', err);
            return undefined;
        }
    }
    async showNotification(message, payload, notificationTitle, notificationIcon, notificationImage, notificationActions) {
        const notificationOptions = {
            body: message,
            data: payload,
            icon: notificationIcon,
            image: notificationImage,
            actions: notificationActions,
            vibrate: [400, 100, 400]
        };
        return self.registration.showNotification(notificationTitle, notificationOptions);
    }
    /*
     * Get an option for notification.
     * If the given option is in the customData (sent in the push) this value will be used.
     * Otherwise it tries to read a default value from browser's indexDb (saved on serviceworker registration).
     * If value is not present in indexDb it use the defaultValue parameter.
     */
    async getNotificationOption(notificationData, notificationDataPropertyName, dbFallbackFn) {
        // eslint-disable-next-line
        if (notificationData && notificationData[notificationDataPropertyName]) {
            return Promise.resolve(notificationData[notificationDataPropertyName]);
        }
        return dbFallbackFn();
    }
    async handleInstall() {
        try {
            await this.setupLogging();
            logging_1.default.Logger.debug('Install handler');
            logging_1.default.Logger.debug('Storing service worker version', __VERSION__);
            await this.webPushDb.setServiceWorkerVersion(__VERSION__);
            logging_1.default.Logger.debug('Skipping waiting');
            await self.skipWaiting();
            logging_1.default.Logger.debug('Install done');
        }
        catch (err) {
            // this log shall be written if we could not access the webPushDb at all
            logging_1.default.Logger.error(err, 'Install error!');
        }
    }
    async setupLogging() {
        const loggingEnabled = await this.webPushDb.getLoggingEnabled();
        logging_1.default.enableLogger(loggingEnabled, logging_1.default.SwContext);
    }
    /**
     * Calls Emarsys open API endpoint to register the user has opened the notification.
     */
    async reportOpen(notificationData) {
        var _a, _b;
        const des = await this.getDeviceEventService();
        if (!des) {
            logging_1.default.Logger.error('Cannot report open! DES not initialized!', notificationData);
            return;
        }
        try {
            logging_1.default.Logger.debug('Reporting open to DES', notificationData);
            const sid = (_a = notificationData === null || notificationData === void 0 ? void 0 : notificationData.messageData) === null || _a === void 0 ? void 0 : _a.sid;
            const treatments = (_b = notificationData === null || notificationData === void 0 ? void 0 : notificationData.messageData) === null || _b === void 0 ? void 0 : _b.treatments;
            let attributes = sid ? { sid } : undefined;
            attributes = attributes ? treatments ? { ...attributes, treatments: JSON.stringify(treatments) } : attributes : undefined;
            const openData = {
                type: 'internal', name: 'webpush:click', timestamp: new Date().toISOString(), attributes
            };
            const eventsData = { dnd: true, events: [openData], clicks: [], viewedMessages: [] };
            const result = await des.postEvents(eventsData);
            if (!result.success && result.statusCode === 401) {
                await this.retrySendAfterContactTokenRefresh(des, eventsData);
            }
        }
        catch (err) {
            logging_1.default.Logger.error('Fatal error while reporting open!', err.message, err);
        }
    }
    async retrySendAfterContactTokenRefresh(des, eventsData) {
        const meClientSvc = await this.getMeClientService();
        if (!meClientSvc) {
            logging_1.default.Logger.error('Unable to get the ME client service!');
            return FailureResult;
        }
        const success = await this.refreshContactToken(meClientSvc);
        if (!success) {
            return FailureResult;
        }
        return des.postEvents(eventsData);
    }
    async refreshContactToken(meClientSvc) {
        try {
            const success = await meClientSvc.generateAccessToken();
            if (!success) {
                logging_1.default.Logger.error('refresh of access token failed');
            }
            return success;
        }
        catch (err) {
            logging_1.default.Logger.error('unable to refresh contact token', err);
            return false;
        }
    }
    async getDeviceEventService() {
        try {
            if (!this.meDeviceEventService) {
                const baseUrl = await this.webPushDb.getMeDeviceEventServiceApiBaseUrl();
                this.meDeviceEventService = me_device_event_service_1.MEDeviceEventService.create(baseUrl, me_v3_api_request_1.MEV3ApiRequest.create(), this.webPushDb);
            }
            return this.meDeviceEventService;
        }
        catch (err) {
            logging_1.default.Logger.error('Error initializing device event service!', err.message, err);
        }
    }
    async getMeClientService() {
        try {
            if (!this.meClientService) {
                const baseUrl = await this.webPushDb.getMeClientServiceApiBaseUrl();
                this.meClientService = me_client_service_1.MEClientService.create(baseUrl, me_v3_api_request_1.MEV3ApiRequest.create(), this.webPushDb);
            }
            return this.meClientService;
        }
        catch (err) {
            logging_1.default.Logger.error('Error initializing client service!', err.message, err);
        }
    }
    createActionsFromActionButtons(actionButtons) {
        return actionButtons.map(actionButton => ({
            action: actionButton.id,
            title: actionButton.title
        }));
    }
    static create(webPushDb) {
        return new EmarsysServiceWorker(webPushDb);
    }
}
exports.EmarsysServiceWorker = EmarsysServiceWorker;
//# sourceMappingURL=emarsys-service-worker.js.map