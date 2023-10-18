"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserVersionParser = void 0;
// eslint-disable-next-line  @typescript-eslint/no-extraneous-class
class BrowserVersionParser {
    static parseBrowserVersion(_navigator) {
        const verOffset = BrowserVersionParser.getVersionOffset(_navigator.userAgent);
        if (verOffset === -1) {
            return _navigator.appVersion;
        }
        const version = _navigator.userAgent.substring(verOffset);
        return BrowserVersionParser.trimVersion(version);
    }
    static getVersionOffset(userAgent) {
        // The order of the supported agents is important!!!
        const supportedAgents = ['SamsungBrowser', 'OPR', 'Edge', 'Edg', 'Chrome', 'Safari', 'Firefox'];
        for (let i = 0; i < supportedAgents.length; i++) {
            const agent = supportedAgents[i];
            const offset = BrowserVersionParser.checkOffset(agent, userAgent);
            if (agent === 'Safari' && offset !== -1) {
                const safariVersionOffset = BrowserVersionParser.checkOffset('Version', userAgent);
                if (safariVersionOffset !== -1) {
                    return safariVersionOffset;
                }
                return offset;
            }
            if (offset !== -1) {
                return offset;
            }
        }
        return -1;
    }
    static checkOffset(name, userAgent) {
        const offset = userAgent.indexOf(name);
        return offset >= 0 ? offset + name.length + 1 : -1;
    }
    static trimVersion(version) {
        const regex = /^(([0-9]|\.)*)[ );]/;
        if (!regex.test(version)) {
            return version;
        }
        return regex.exec(version)[1];
    }
}
exports.BrowserVersionParser = BrowserVersionParser;
//# sourceMappingURL=browser-version-parser.js.map