"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEV3ApiRequest = void 0;
const defaultHeaders = {
    'Content-Type': 'application/json'
};
class MEV3ApiRequest {
    constructor() {
        this.requestOrder = 0;
    }
    async post(endpoint, body, headerData) {
        const requestInit = this.createPostRequestInit(body, headerData);
        return fetch(endpoint, requestInit);
    }
    async put(endpoint, body, headerData) {
        const requestInit = this.createPutRequestInit(body, headerData);
        return fetch(endpoint, requestInit);
    }
    async delete(endpoint, body, headerData) {
        const requestInit = this.createDeleteRequestInit(body, headerData);
        return fetch(endpoint, requestInit);
    }
    createPostRequestInit(body, headerData) {
        return this.createRequestInit('POST', body, headerData);
    }
    createPutRequestInit(body, headerData) {
        return this.createRequestInit('PUT', body, headerData);
    }
    createDeleteRequestInit(body, headerData) {
        return this.createRequestInit('DELETE', body, headerData);
    }
    createRequestInit(method, body, headerData) {
        return {
            method,
            headers: this.buildHeaders(headerData),
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(body)
        };
    }
    buildHeaders(headerData) {
        const headers = new Headers();
        Object.keys(defaultHeaders).forEach(k => {
            headers.append(k, defaultHeaders[k]);
        });
        headers.append('x-client-id', headerData.clientId);
        if (headerData.clientState) {
            headers.append('x-client-state', headerData.clientState);
        }
        if (headerData.contactToken) {
            headers.append('x-contact-token', headerData.contactToken);
        }
        headers.append('x-request-order', `${this.requestOrder}`);
        this.requestOrder += 1;
        return headers;
    }
    static create() {
        return new MEV3ApiRequest();
    }
}
exports.MEV3ApiRequest = MEV3ApiRequest;
//# sourceMappingURL=me-v3-api-request.js.map