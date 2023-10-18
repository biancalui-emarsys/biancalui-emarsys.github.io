"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
const utils_1 = require("./utils");
const logging_1 = __importDefault(require("./logging"));
function decode(token, options) {
    const opts = options !== null && options !== void 0 ? options : {};
    const pos = opts.header === true ? 0 : 1;
    try {
        return JSON.parse(utils_1.urlB64ToString(token.split('.')[pos]));
    }
    catch (err) {
        logging_1.default.Logger.error('Error decoding token', err);
        return null;
    }
}
exports.decode = decode;
//# sourceMappingURL=jwt.js.map