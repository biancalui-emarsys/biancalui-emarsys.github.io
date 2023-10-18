"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVICE_REGISTRATION_STATUS_UNREGISTERED = exports.DEVICE_REGISTRATION_STATUS_REGISTERED = exports.KEY_DEVICE_REGISTRATION_STATUS = exports.EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG = exports.EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG = exports.EVENT_ON_UPDATE_INBOX_MESSAGES = exports.EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE = exports.EVENT_ON_PUSH_DELIVERY = exports.EVENT_ON_SW_INIT_ERROR = exports.EVENT_ON_PERMISSION_GRANTED = exports.EVENT_ON_PERMISSION_DENIED = exports.EVENT_ON_PERMISSION_PROMPT = exports.EVENT_ON_UNSUBSCRIBE = exports.EVENT_ON_SUBSCRIBE = exports.EVENT_ON_READY = exports.PERMISSION_PROMPT = exports.PERMISSION_GRANTED = exports.PERMISSION_DENIED = exports.indexedDbVersion = exports.indexedDbName = exports.meCustomEvent = exports.meOpen = exports.meLogout = exports.meLogin = exports.lsKeyLastContactFieldId = exports.lsKeyLastLoginToken = exports.lsKeyLastLoginTime = exports.dbKeyLastUsedAt = exports.dbKeyLoggingEnabled = exports.dbKeyTimezone = exports.dbKeyLanguage = exports.dbKeyOsVersion = exports.dbKeyDeviceModel = exports.dbKeyApplicationVersion = exports.dbKeyPlatform = exports.dbKeyContactFieldValue = exports.dbKeyContactFieldId = exports.dbKeyPushToken = exports.dbKeyServiceWorkerVersion = exports.dbKeySdkVersion = exports.dbKeyRefreshToken = exports.dbKeyContactToken = exports.dbKeyXClientState = exports.dbKeyBrowserIds = exports.dbKeyBrowserId = exports.dbKeyInitParams = exports.dbKeyLastPermissionStatus = exports.dbKeyPushPackageServiceUrl = exports.dbKeyWebsitePushId = exports.dbKeyApplicationServerPublicKey = exports.dbKeyServiceWorkerScope = exports.dbKeyServiceWorkerUrl = exports.dbKeyMeDeviceEventServiceApiBaseUrl = exports.dbKeyMeClientServiceApiBaseUrl = exports.dbKeyApplicationCode = exports.dbKeyDefaultNotificationIcon = exports.dbKeyDefaultNotificationTitle = exports.applicationPassword = exports.pushActionsProperty = exports.pushImageProperty = exports.pushIconProperty = exports.pushLinkProperty = exports.pushTitleProperty = exports.loginOverloadProtectionTime = exports.defaultApplicationVersion = exports.defaultSafariPushPackageServiceUrl = exports.defaultDeviceEventServiceApiBaseUrl = exports.defaultClientServiceApiBaseUrl = void 0;
exports.defaultClientServiceApiBaseUrl = 'https://me-client.eservice.emarsys.net/v3';
exports.defaultDeviceEventServiceApiBaseUrl = 'https://mobile-events.eservice.emarsys.net/v3';
exports.defaultSafariPushPackageServiceUrl = 'https://me-client.eservice.emarsys.net';
exports.defaultApplicationVersion = '0.0.0';
exports.loginOverloadProtectionTime = 3600000;
exports.pushTitleProperty = 'title';
// property names in push notification data
exports.pushLinkProperty = 'link';
exports.pushIconProperty = 'icon';
exports.pushImageProperty = 'image';
exports.pushActionsProperty = 'actions';
// ingester requests password
exports.applicationPassword = 'not-used';
// indexDb keys
exports.dbKeyDefaultNotificationTitle = 'pushDefaultNotificationTitle';
exports.dbKeyDefaultNotificationIcon = 'pushDefaultNotificationIcon';
exports.dbKeyApplicationCode = 'emarsysApplicationCode';
exports.dbKeyMeClientServiceApiBaseUrl = 'meClientServiceApiBaseUrl';
exports.dbKeyMeDeviceEventServiceApiBaseUrl = 'meDeviceEventServiceApiBaseUrl';
exports.dbKeyServiceWorkerUrl = 'serviceWorkerUrl';
exports.dbKeyServiceWorkerScope = 'serviceWorkerScope';
exports.dbKeyApplicationServerPublicKey = 'applicationServerPublicKey';
exports.dbKeyWebsitePushId = 'websitePushId';
exports.dbKeyPushPackageServiceUrl = 'pushPackageServiceUrl';
exports.dbKeyLastPermissionStatus = 'lastPermissionStatus';
exports.dbKeyInitParams = 'initParams';
exports.dbKeyBrowserId = 'browserId';
exports.dbKeyBrowserIds = 'browserIds';
exports.dbKeyXClientState = 'xClientState';
exports.dbKeyContactToken = 'contactToken';
exports.dbKeyRefreshToken = 'refreshToken';
exports.dbKeySdkVersion = 'sdkVersion';
exports.dbKeyServiceWorkerVersion = 'serviceWorkerVersion';
exports.dbKeyPushToken = 'pushToken';
exports.dbKeyContactFieldId = 'contactFieldId';
exports.dbKeyContactFieldValue = 'contactFieldValue';
exports.dbKeyPlatform = 'platform';
exports.dbKeyApplicationVersion = 'applicationVersion';
exports.dbKeyDeviceModel = 'deviceModel';
exports.dbKeyOsVersion = 'osVersion';
exports.dbKeyLanguage = 'language';
exports.dbKeyTimezone = 'timezone';
exports.dbKeyLoggingEnabled = 'loggingEnabled';
exports.dbKeyLastUsedAt = 'lastUsedAt';
// localStorage keys
exports.lsKeyLastLoginTime = 'emarsysWebpushLastLoginTime';
exports.lsKeyLastLoginToken = 'emarsysWebpushLastLoginToken';
exports.lsKeyLastContactFieldId = 'emarsysWebpushLastContactFieldId';
// ME endpoints
exports.meLogin = '/users/login';
exports.meLogout = '/users/logout';
exports.meOpen = '/events/message_open';
exports.meCustomEvent = '/events/';
// Indexed DB
exports.indexedDbName = 'EMARSYS_WEBPUSH_STORE';
exports.indexedDbVersion = 1;
// Permissions
exports.PERMISSION_DENIED = 'denied';
exports.PERMISSION_GRANTED = 'granted';
exports.PERMISSION_PROMPT = 'default';
// Events
exports.EVENT_ON_READY = 'onReady';
exports.EVENT_ON_SUBSCRIBE = 'onSubscribe';
exports.EVENT_ON_UNSUBSCRIBE = 'onUnsubscribe';
exports.EVENT_ON_PERMISSION_PROMPT = 'onPermissionPrompt';
exports.EVENT_ON_PERMISSION_DENIED = 'onPermissionDenied';
exports.EVENT_ON_PERMISSION_GRANTED = 'onPermissionGranted';
exports.EVENT_ON_SW_INIT_ERROR = 'onSWInitError';
exports.EVENT_ON_PUSH_DELIVERY = 'onPushDelivery';
exports.EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE = 'onPutNewMessageToInboxStore';
exports.EVENT_ON_UPDATE_INBOX_MESSAGES = 'onUpdateInboxMessages';
exports.EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG = 'onShowNotificationPermissionDialog';
exports.EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG = 'onHideNotificationPermissionDialog';
// LocalStore
exports.KEY_DEVICE_REGISTRATION_STATUS = 'registrationStatus';
// Device registration status
exports.DEVICE_REGISTRATION_STATUS_REGISTERED = 'registered';
exports.DEVICE_REGISTRATION_STATUS_UNREGISTERED = 'unregistered';
//# sourceMappingURL=constants.js.map