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
exports.determineServiceWorkerScope = exports.isEmptyObject = exports.toContactInfo = exports.isValidPayload = exports.payloadMessageDataProperties = exports.checkDevice = exports.isDeviceRegistered = exports.urlB64ToString = exports.urlB64ToUint8Array = exports.getGlobal = exports.getVersion = void 0;
const JWT = __importStar(require("./jwt"));
function getVersion() {
    return __VERSION__;
}
exports.getVersion = getVersion;
function getGlobal() {
    /* eslint-disable */
    return Function('return this')();
}
exports.getGlobal = getGlobal;
function base64ToBinary(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    return atob(base64);
}
function urlB64ToUint8Array(base64String) {
    const rawData = base64ToBinary(base64String);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
exports.urlB64ToUint8Array = urlB64ToUint8Array;
function urlB64ToString(base64String) {
    return base64ToBinary(base64String);
}
exports.urlB64ToString = urlB64ToString;
async function isDeviceRegistered(meWebPushDb) {
    const { exists, pushTokenExists } = await checkDevice(meWebPushDb);
    const hasPushToken = pushTokenExists !== undefined ? pushTokenExists : false;
    return (exists && hasPushToken);
}
exports.isDeviceRegistered = isDeviceRegistered;
/**
 * Returns basic information about registration, push token and identified contact
 * based on the content of the client state
 */
async function checkDevice(meWebPushDb) {
    const clientId = await meWebPushDb.getClientId();
    if (!clientId) {
        return { exists: false };
    }
    const clientState = await meWebPushDb.getClientState();
    if (!clientState) {
        return { exists: false };
    }
    const decodedClientState = JWT.decode(clientState);
    if (!decodedClientState) {
        return { exists: false };
    }
    const pushToken = decodedClientState.pushToken || null;
    const contactField = decodedClientState.contactField || null;
    return {
        exists: true,
        pushTokenExists: pushToken !== null,
        identified: contactField !== null
    };
}
exports.checkDevice = checkDevice;
exports.payloadMessageDataProperties = {
    id: 'string',
    sid: 'string',
    applicationCode: 'string',
    notificationSettings: 'object'
};
/**
 * Check if the WebPush Message payload is produced by Emarsys.
 * @param payload
 * @returns true if it is an Emarsys Payload
 */
function isValidPayload(payload) {
    if (typeof payload !== 'object')
        return false;
    const emarsysPayload = payload.messageData;
    if (!emarsysPayload)
        return false;
    const isValidProperty = (prop) => {
        return emarsysPayload[prop]
            ? (typeof emarsysPayload[prop]) === exports.payloadMessageDataProperties[prop]
            : false;
    };
    const result = Object.keys(exports.payloadMessageDataProperties)
        .map(isValidProperty)
        .reduce((acc, r) => acc && r, true);
    return result;
}
exports.isValidPayload = isValidPayload;
/**
 * Checks the passed data and returns either the ContactInfo or undefined if the data does not fit
 * @param contactInfo The data which shall be converted
 */
function toContactInfo(contactInfo) {
    if (contactInfo === undefined || Object.keys(contactInfo).length !== 3) {
        return undefined;
    }
    return contactInfo;
}
exports.toContactInfo = toContactInfo;
exports.isEmptyObject = (obj) => {
    if (obj === null)
        return true;
    /* eslint-disable */
    if (obj === undefined)
        return true;
    for (const property in obj) {
        return false;
    }
    return true;
};
function determineServiceWorkerScope(params) {
    if (params) {
        return params.scope;
    }
    else {
        return undefined;
    }
}
exports.determineServiceWorkerScope = determineServiceWorkerScope;
//# sourceMappingURL=utils.js.map