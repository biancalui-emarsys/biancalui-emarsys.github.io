"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigatorInfo = void 0;
const browser_version_parser_1 = require("./browser-version-parser");
const browserRules = [
    ['edge', /Edge\/([0-9._]+)/],
    ['edge', /EdgiOS\/([0-9._]+)/],
    ['edge', /EdgA?\/([0-9.]+)/],
    ['samsung', /SamsungBrowser\/([0-9.]+)/],
    ['chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9.]+)(:?\s|$)/],
    ['firefox', /Firefox\/([0-9.]+)(?:\s|$)/],
    ['opera', /Opera Mini.*Version\/([0-9.]+)/],
    ['opera', /Opera\/([0-9.]+)(?:\s|$)/],
    ['opera', /OPR\/([0-9.]+)(:?\s|$)/],
    ['safari', /Version\/([0-9._]+).*Safari/]
];
const browserNameMapping = {
    samsung: 'chrome',
    opera: 'chrome'
};
class NavigatorInfo {
    constructor(navig) {
        this.navigator = navig;
    }
    /**
     * Get environment info like browserVersion language etc.
     */
    getAll() {
        return {
            userAgent: this.getUserAgent(),
            browser: this.getBrowserName(),
            browserVersion: this.getVersion(),
            timezone: this.getTimezone(),
            language: this.getLanguage()
        };
    }
    hasServiceWorker() {
        return ('serviceWorker' in this.navigator);
    }
    getUserAgent() {
        return this.navigator.userAgent;
    }
    getBrowserName() {
        let browserName = 'chrome';
        const nAgt = this.navigator.userAgent;
        for (const rule of browserRules) {
            const [name, regex] = rule;
            const match = regex.exec(nAgt);
            if (match) {
                browserName = name;
                break;
            }
        }
        return this.getMappedBrowserName(browserName);
    }
    getMappedBrowserName(name) {
        const mapped = browserNameMapping[name];
        if (mapped) {
            return mapped;
        }
        else {
            return name;
        }
    }
    getVersion() {
        return browser_version_parser_1.BrowserVersionParser.parseBrowserVersion(this.navigator);
    }
    getTimezone() {
        const offset = new Date().getTimezoneOffset();
        const timezone = ((offset < 0 ? '+' : '-') +
            this.pad(Math.abs(offset / 60), 2) +
            this.pad(Math.abs(offset % 60), 2));
        return timezone;
    }
    getLanguage() {
        return this.navigator.language;
    }
    /**
     * Convert number to string and pad the string with zeros to be the required length
     */
    pad(nr, length) {
        let str = nr.toString();
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }
    static create(navig) {
        return new NavigatorInfo(navig);
    }
}
exports.NavigatorInfo = NavigatorInfo;
//# sourceMappingURL=navigator-info.js.map