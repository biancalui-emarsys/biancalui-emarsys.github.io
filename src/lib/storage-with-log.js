"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageWithLog = void 0;
const logging_1 = __importDefault(require("./logging"));
const { Logger } = logging_1.default;
class StorageWithLog {
    constructor(storage) {
        this.storage = storage;
    }
    log(value, defaultMessage, params) {
        const { level = 'error', message = defaultMessage } = params !== null && params !== void 0 ? params : {};
        if (!value)
            Logger[level](message);
        return value;
    }
    async getClientId(params) {
        const defaultMessage = 'Error: No client ID set for the browser!';
        const clientId = await this.storage.getClientId();
        return this.log(clientId, defaultMessage, params);
    }
    async getContactToken(params) {
        const defaultMessage = 'Error: No contact token set!';
        const contactToken = await this.storage.getContactToken();
        return this.log(contactToken, defaultMessage, params);
    }
    async getClientState(params) {
        const defaultMessage = 'Error: No client state set!';
        const clientState = await this.storage.getClientState();
        return this.log(clientState, defaultMessage, params);
    }
    async getRefreshToken(params) {
        const defaultMessage = 'Unable to refresh contact token a refresh-token is missing!';
        const refreshToken = await this.storage.getRefreshToken();
        return this.log(refreshToken, defaultMessage, params);
    }
}
exports.StorageWithLog = StorageWithLog;
//# sourceMappingURL=storage-with-log.js.map