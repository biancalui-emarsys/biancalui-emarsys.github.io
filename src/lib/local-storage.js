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
exports.removeRegistrationStatus = exports.setRegistrationStatus = exports.getRegistrationStatus = void 0;
const CONSTANTS = __importStar(require("./constants"));
function getRegistrationStatus() {
    const status = localStorage.getItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS);
    if (status) {
        return status;
    }
    else {
        return undefined;
    }
}
exports.getRegistrationStatus = getRegistrationStatus;
function setRegistrationStatus(status) {
    localStorage.setItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS, status);
}
exports.setRegistrationStatus = setRegistrationStatus;
function removeRegistrationStatus() {
    localStorage.removeItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS);
}
exports.removeRegistrationStatus = removeRegistrationStatus;
//# sourceMappingURL=local-storage.js.map