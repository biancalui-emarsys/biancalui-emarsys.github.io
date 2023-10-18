"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emarsys_service_worker_1 = require("./lib/emarsys-service-worker");
const me_web_push_db_1 = require("./lib/me-web-push-db");
const index_db_1 = require("./lib/index-db");
const webPushDb = me_web_push_db_1.MEWebPushDb.create(index_db_1.IndexDb.create());
const worker = emarsys_service_worker_1.EmarsysServiceWorker.create(webPushDb);
self.addEventListener('push', event => { worker.onPush(event); });
self.addEventListener('notificationclick', event => worker.onNotificationClick(event));
self.addEventListener('install', event => worker.onInstall(event));
self.addEventListener('pushsubscriptionchange', event => worker.onSubscriptionChange(event));
//# sourceMappingURL=web-emarsys-service-worker.js.map