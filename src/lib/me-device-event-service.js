"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDeviceEventService = void 0;
const logging_1 = __importDefault(require("./logging"));
const storage_with_log_1 = require("./storage-with-log");
const { Logger } = logging_1.default;
const PostEventsOKStates = [200, 204];
class MEDeviceEventService {
    constructor(baseUrl, desRequest, storage) {
        this.storage = storage;
        this.storageWithLog = new storage_with_log_1.StorageWithLog(storage);
        this.baseUrl = `${baseUrl}/apps`;
        this.desRequest = desRequest;
    }
    /**
     * Post the passed data which includes 1 or more events to the device event service
     * @param eventsData The events which shall be forwarded to the DES.
     * @returns A promise which resolves to a PostEventsResult which indicates the success
     *          of the operation and contains the returned status code.
     */
    async postEvents(eventsData) {
        const clientId = await this.storageWithLog.getClientId();
        const contactToken = await this.storageWithLog.getContactToken();
        const clientState = await this.storageWithLog.getClientState();
        if (!clientId || !contactToken || !clientState) {
            return { success: false };
        }
        const apiEndpoint = await this.apiEndpoint('client/events');
        const response = await this.desRequest.post(apiEndpoint, eventsData, { clientId, clientState, contactToken });
        if (PostEventsOKStates.includes(response.status)) {
            return { success: true, statusCode: response.status };
        }
        else {
            const body = await response.json();
            Logger.warn('Error posting events to device event service', response.status, JSON.stringify(body));
            return { success: false, statusCode: response.status };
        }
    }
    async apiEndpoint(path) {
        const appCode = await this.storage.getAppCode();
        return `${this.baseUrl}/${appCode}/${path}`;
    }
    static create(baseUrl, desRequest, storage) {
        return new MEDeviceEventService(baseUrl, desRequest, storage);
    }
}
exports.MEDeviceEventService = MEDeviceEventService;
//# sourceMappingURL=me-device-event-service.js.map