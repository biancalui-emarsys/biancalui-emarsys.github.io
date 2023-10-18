"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const me_web_push_1 = __importDefault(require("./lib/me-web-push"));
const utils_1 = require("./lib/utils");
function main() {
    console.log('my sdk B!');
    const global = utils_1.getGlobal();
    let { WebEmarsysSdk } = global;
    let predefinedCommands;
    if (WebEmarsysSdk) {
        predefinedCommands = WebEmarsysSdk;
    }
    WebEmarsysSdk = me_web_push_1.default.create(window, navigator);
    if (Array.isArray(predefinedCommands)) {
        predefinedCommands.forEach(c => WebEmarsysSdk.push(c));
    }
    global.WebEmarsysSdk = WebEmarsysSdk;
}
if (document.readyState === 'complete') {
    main();
}
else {
    window.addEventListener('load', main);
}
//# sourceMappingURL=web-emarsys-sdk.js.map