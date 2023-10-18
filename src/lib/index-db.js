"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexDb = void 0;
const constants_1 = require("./constants");
const NotFoundMessage = 'not_found';
/**
 * IndexedDb class handles browser's indexdb database operations
 */
class IndexDb {
    constructor() {
        this.name = 'keyValue';
    }
    /**
     * Saves a value to browser's indexDb with a given key
     */
    async setDBValue(key, value) {
        return this.openIndexDB().then((database) => {
            return new Promise((resolve, reject) => {
                const request = database
                    .transaction([this.name], 'readwrite')
                    .objectStore(this.name)
                    .put({ key, value });
                request.onsuccess = () => {
                    this.indexedDBInstance = undefined;
                    database.close();
                    return resolve(key);
                };
                request.onerror = (e) => {
                    this.indexedDBInstance = undefined;
                    database.close();
                    return reject(e);
                };
            });
        });
    }
    /**
     * Saves a value to browser's indexDb with a given key
     */
    async deleteDBKey(key) {
        return this.openIndexDB().then((database) => {
            return new Promise((resolve, reject) => {
                const request = database
                    .transaction([this.name], 'readwrite')
                    .objectStore(this.name)
                    .delete(key);
                request.onsuccess = () => {
                    this.indexedDBInstance = undefined;
                    database.close();
                    return resolve(true);
                };
                request.onerror = (e) => {
                    this.indexedDBInstance = undefined;
                    database.close();
                    return reject(e);
                };
            });
        });
    }
    /**
     * Read a value from browser's indexDb
     */
    async getDBValue(key) {
        const database = await this.openIndexDB();
        return new Promise((resolve, reject) => {
            const request = database
                .transaction(this.name)
                .objectStore(this.name)
                .get(key);
            request.onsuccess = () => {
                const { result } = request;
                if (result) {
                    this.indexedDBInstance = undefined;
                    database.close();
                    return resolve(result.value);
                }
                else {
                    this.indexedDBInstance = undefined;
                    database.close();
                    return reject(new Error(NotFoundMessage));
                }
            };
            request.onerror = (event) => {
                this.indexedDBInstance = undefined;
                database.close();
                return reject(event);
            };
        });
    }
    /**
     * Read a value from browser's indexDb with fallback
     */
    async getDBValueOrDefault(key, defaultVal = undefined) {
        try {
            const result = await this.getDBValue(key);
            return result;
        }
        catch (err) {
            if (err.message === NotFoundMessage) {
                return defaultVal;
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Opens browser's IndexDB database.
     * If the database has opened already it doesn't reopen it but returns with the opened one.
     */
    async openIndexDB() {
        return new Promise((resolve, reject) => {
            if (this.indexedDBInstance) {
                return resolve(this.indexedDBInstance);
            }
            const request = indexedDB.open(constants_1.indexedDbName, constants_1.indexedDbVersion);
            request.onsuccess = (event) => {
                this.indexedDBInstance = event.target.result;
                return resolve(this.indexedDBInstance);
            };
            request.onerror = (event) => {
                return reject(event);
            };
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                database.createObjectStore('keyValue', {
                    keyPath: 'key'
                });
            };
        });
    }
    static create() {
        return new IndexDb();
    }
}
exports.IndexDb = IndexDb;
//# sourceMappingURL=index-db.js.map