"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationSupportInfo = void 0;
class PushNotificationSupportInfo {
    constructor(navigatorInfo, win) {
        this.navigatorInfo = navigatorInfo;
        this.window = win;
    }
    pushNotificationsSupported() {
        return this.canUseSafariPush() || this.canUseServiceWorkers();
    }
    canUseServiceWorkers() {
        return (this.navigatorInfo.hasServiceWorker() &&
            ('PushManager' in this.window));
    }
    canUseSafariPush() {
        return 'safari' in this.window && 'pushNotification' in this.window.safari;
    }
    canUsePromises() {
        return 'Promise' in this.window;
    }
    static create(navigatorInfo, win) {
        return new PushNotificationSupportInfo(navigatorInfo, win);
    }
}
exports.PushNotificationSupportInfo = PushNotificationSupportInfo;
//# sourceMappingURL=push-notification-support-info.js.map